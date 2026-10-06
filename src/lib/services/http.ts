import type { ListParams, ListResult } from "@/src/types";
import { ConflictError, NotFoundError, ServiceError } from "./errors";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; fields?: Record<string, string> } };

/**
 * Calls an admin API route and unwraps `{ success, data | error }`.
 * Failures are rethrown as `ServiceError` so the existing UI (toasts, form
 * field errors) keeps working exactly as it did with the mock services.
 */
export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      // FormData sets its own multipart boundary header.
      headers:
        init.body instanceof FormData
          ? init.headers
          : { "Content-Type": "application/json", ...init.headers },
      cache: "no-store",
    });
  } catch (cause) {
    throw new ServiceError("Network error — could not reach the server", { status: 0, cause });
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON response (e.g. an HTML error page); handled below.
  }

  if (response.ok && body?.success) return body.data;

  const message =
    body && !body.success ? body.error.message : `Request failed (${response.status})`;
  const fields = body && !body.success ? body.error.fields : undefined;
  if (response.status === 404) throw new NotFoundError(message);
  if (response.status === 409) throw new ConflictError(message, fields);
  throw new ServiceError(message, { status: response.status, fields });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** `ListParams` -> `?page&pageSize&search&sort&dir&<filters>` (same keys the routes read). */
export function listQuery(params: ListParams = {}): string {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.sort) query.set("sort", params.sort);
  if (params.direction) query.set("dir", params.direction);
  for (const [key, value] of Object.entries(params.filters ?? {})) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

/** A tiny CRUD client shared by the catalog entities. */
export function crudClient<TEntity, TInput>(base: string) {
  return {
    list: (params: ListParams = {}) => api.get<ListResult<TEntity>>(`${base}${listQuery(params)}`),
    async get(id: string): Promise<TEntity | null> {
      try {
        return await api.get<TEntity>(`${base}/${encodeURIComponent(id)}`);
      } catch (error) {
        if (error instanceof NotFoundError) return null;
        throw error;
      }
    },
    create: (input: TInput) => api.post<TEntity>(base, input),
    update: (id: string, input: TInput) => api.put<TEntity>(`${base}/${encodeURIComponent(id)}`, input),
    async remove(id: string): Promise<void> {
      await api.delete(`${base}/${encodeURIComponent(id)}`);
    },
  };
}
