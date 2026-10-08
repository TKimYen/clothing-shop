import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { apiError, apiSuccess } from "@/src/lib/api-response";
import { prisma } from "@/src/lib/db";
import { Prisma } from "@/src/generated/prisma/client";

/* -------------------------------------------------------------------------- */
/* Errors                                                                      */
/* -------------------------------------------------------------------------- */

/** Thrown by admin handlers; turned into `{ success: false, error }` by `adminHandler`. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new HttpError(400, message, fields);
export const notFound = (message = "Record not found") => new HttpError(404, message);
export const conflict = (message: string, fields?: Record<string, string>) =>
  new HttpError(409, message, fields);

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Every admin endpoint requires a signed-in Clerk user whose row in `users`
 * has `role = ADMIN`. Set `ADMIN_AUTH_DISABLED=true` in `.env` to skip the
 * check during local development only.
 */
export async function requireAdmin() {
  if (process.env.ADMIN_AUTH_DISABLED === "true" && process.env.NODE_ENV !== "production") {
    return null;
  }

  const { userId: clerkId } = await auth();
  if (!clerkId) throw new HttpError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, role: true, fullName: true, email: true },
  });
  if (!user || user.role !== "ADMIN") {
    throw new HttpError(403, "Admin access required");
  }
  return user;
}

/* -------------------------------------------------------------------------- */
/* Handler wrapper                                                             */
/* -------------------------------------------------------------------------- */

type RouteContext<P> = { params: Promise<P> };
type AdminUser = Awaited<ReturnType<typeof requireAdmin>>;

/**
 * Wraps a route handler with the admin guard and uniform error mapping, so
 * each route only contains its own query logic.
 */
export function adminHandler<P = Record<string, never>>(
  handler: (request: Request, params: P, admin: AdminUser | null) => Promise<unknown>,
) {
  return async (request: Request, context: RouteContext<P>) => {
    try {
      const admin = await requireAdmin();
      const params = context?.params ? await context.params : ({} as P);
      const data = await handler(request, params, admin);
      return apiSuccess(data ?? null);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/**
 * Field behind a P2002 unique violation. The classic engine reports it in
 * `meta.target`; driver adapters (`@prisma/adapter-pg`) nest it under
 * `meta.driverAdapterError.cause.constraint.fields` instead.
 */
function uniqueField(meta: Record<string, unknown> | undefined): string | undefined {
  const target = meta?.target;
  if (Array.isArray(target) && typeof target[0] === "string") return target[0];
  if (typeof target === "string") return target;
  const adapter = meta?.driverAdapterError as
    | { cause?: { table?: string; constraint?: { fields?: unknown; index?: string } } }
    | undefined;
  const cause = adapter?.cause;
  const toCamel = (column: string) =>
    column.replace(/"/g, "").replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

  const fields = cause?.constraint?.fields;
  if (Array.isArray(fields) && typeof fields[0] === "string") return toCamel(fields[0]);

  // Postgres index name: `<table>_<column>_key`, e.g. `categories_slug_key`.
  const index = cause?.constraint?.index;
  if (index && cause?.table && index.startsWith(`${cause.table}_`) && index.endsWith("_key")) {
    return toCamel(index.slice(cause.table.length + 1, -"_key".length));
  }
  return undefined;
}

function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return apiError(error.message, error.status, error.fields);
  }
  if (error instanceof z.ZodError) {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.map(String).join(".");
      if (key && !fields[key]) fields[key] = issue.message;
    }
    return apiError(error.issues[0]?.message ?? "Invalid input", 400, fields);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const field = uniqueField(error.meta);
      return apiError(
        field ? `${field} already exists` : "A record with this value already exists",
        409,
        field ? { [field]: "Already taken" } : undefined,
      );
    }
    if (error.code === "P2003") {
      return apiError("This record is still referenced by other records", 409);
    }
    if (error.code === "P2025") {
      return apiError("Record not found", 404);
    }
  }
  if (error instanceof SyntaxError) {
    return apiError("Request body must be valid JSON", 400);
  }
  console.error("[admin api]", error);
  return apiError("Internal server error", 500);
}

/* -------------------------------------------------------------------------- */
/* Request parsing                                                             */
/* -------------------------------------------------------------------------- */

export async function readJson<S extends z.ZodType>(request: Request, schema: S): Promise<z.output<S>> {
  const body = await request.json();
  return schema.parse(body);
}

export type ListQuery = {
  page: number;
  pageSize: number;
  skip: number;
  search: string;
  sort: string;
  direction: "asc" | "desc";
  filters: Record<string, string>;
};

const MAX_PAGE_SIZE = 200;
const RESERVED = new Set(["page", "pageSize", "search", "sort", "dir"]);

/** Reads `?page&pageSize&search&sort&dir&<filter>=...` into a list query. */
export function parseListQuery(request: Request, defaultSort: string): ListQuery {
  const params = new URL(request.url).searchParams;
  const toInt = (raw: string | null, fallback: number) => {
    const parsed = Number.parseInt(raw ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  const pageSize = Math.min(toInt(params.get("pageSize"), 10), MAX_PAGE_SIZE);
  const page = toInt(params.get("page"), 1);
  const filters: Record<string, string> = {};
  params.forEach((value, key) => {
    if (!RESERVED.has(key) && value !== "") filters[key] = value;
  });
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    search: params.get("search")?.trim() ?? "",
    sort: params.get("sort") || defaultSort,
    direction: params.get("dir") === "desc" ? "desc" : "asc",
    filters,
  };
}

/**
 * Runs a count + page query, clamping the page so a stale `?page=99` returns
 * the last page instead of an empty table (same contract as the UI expects).
 */
export async function paginate<T>(
  query: ListQuery,
  count: () => Promise<number>,
  fetch: (skip: number, take: number) => Promise<T[]>,
) {
  const total = await count();
  const lastPage = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, lastPage);
  const items = await fetch((page - 1) * query.pageSize, query.pageSize);
  return { items, total, page, pageSize: query.pageSize };
}

/** Restricts a requested sort key to an allow-list, falling back to the default. */
export function pickSort<K extends string>(sort: string, allowed: readonly K[], fallback: K): K {
  return (allowed as readonly string[]).includes(sort) ? (sort as K) : fallback;
}

export const insensitive = (value: string) => ({ contains: value, mode: "insensitive" as const });

export const toNumber = (value: Prisma.Decimal | number | null | undefined) =>
  value === null || value === undefined ? null : Number(value);

export const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

export function boolFilter(value: string | undefined) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}
