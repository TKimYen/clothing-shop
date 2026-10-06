import type { SortDirection } from "@/src/types";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export type AdminListState = {
  /** 1-based. */
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  direction: SortDirection;
  filters: Record<string, string>;
};

export type ListStateDefaults = {
  sort?: string;
  direction?: SortDirection;
  pageSize?: number;
  /** Filter keys to recognise even when their value is empty. */
  filterKeys?: readonly string[];
};

type ParamReader = { get(name: string): string | null };

export const DEFAULT_LIST_STATE: AdminListState = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  search: "",
  sort: "",
  direction: "asc",
  filters: {},
};

function toPositiveInt(raw: string | null, fallback: number): number {
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

function toDirection(raw: string | null, fallback: SortDirection): SortDirection {
  return raw === "asc" || raw === "desc" ? raw : fallback;
}

/**
 * Rebuilds list state from the URL so links are shareable and a reload restores
 * the exact view. Unknown/missing values fall back to the supplied defaults
 * rather than producing `NaN` or a 0-based page.
 */
export function parseListState(
  searchParams: ParamReader,
  defaults: ListStateDefaults = {},
): AdminListState {
  const filterKeys = defaults.filterKeys ?? [];
  const filters: Record<string, string> = {};
  for (const key of filterKeys) {
    const value = searchParams.get(key);
    if (value !== null && value !== "") filters[key] = value;
  }

  const pageSizeRaw = toPositiveInt(
    searchParams.get("pageSize"),
    defaults.pageSize ?? DEFAULT_PAGE_SIZE,
  );
  const pageSize = PAGE_SIZE_OPTIONS.includes(pageSizeRaw as (typeof PAGE_SIZE_OPTIONS)[number])
    ? pageSizeRaw
    : (defaults.pageSize ?? DEFAULT_PAGE_SIZE);

  return {
    page: toPositiveInt(searchParams.get("page"), 1),
    pageSize,
    search: searchParams.get("search")?.trim() ?? "",
    sort: searchParams.get("sort") ?? defaults.sort ?? "",
    direction: toDirection(searchParams.get("dir"), defaults.direction ?? "asc"),
    filters,
  };
}

/**
 * Serialises state back to a query string, omitting anything that equals the
 * default. Output key order is fixed so callers can cheaply compare strings
 * before calling `router.replace` (which would otherwise loop).
 */
export function serializeListState(
  state: AdminListState,
  defaults: ListStateDefaults = {},
): string {
  const params = new URLSearchParams();
  const filterKeys = defaults.filterKeys ?? [];

  if (state.search) params.set("search", state.search);
  if (state.sort && state.sort !== defaults.sort) params.set("sort", state.sort);
  if (state.direction !== (defaults.direction ?? "asc")) params.set("dir", state.direction);
  if (state.pageSize !== (defaults.pageSize ?? DEFAULT_PAGE_SIZE)) {
    params.set("pageSize", String(state.pageSize));
  }
  if (state.page > 1) params.set("page", String(state.page));
  for (const key of filterKeys) {
    const value = state.filters[key];
    if (value) params.set(key, value);
  }

  return params.toString();
}

/** Total number of pages, at least 1 so the UI never renders "page 1 of 0". */
export function totalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(total / pageSize));
}

/**
 * Keeps `page` inside `[1, totalPages]`. Called whenever `total` changes so a
 * filter that shrinks the result set cannot strand the user on page 9 of 2.
 */
export function clampPage(
  page: number,
  total: number,
  pageSize: number,
): number {
  return Math.min(Math.max(1, page), totalPages(total, pageSize));
}

/** Changing search / sort / filters always returns to the first page. */
export function withResetPage(state: AdminListState): AdminListState {
  return state.page === 1 ? state : { ...state, page: 1 };
}

export function areStatesEqual(a: AdminListState, b: AdminListState): boolean {
  return serializeListState(a) === serializeListState(b);
}
