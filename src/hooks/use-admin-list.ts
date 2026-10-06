"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import type { ListResult, SortDirection } from "@/src/types";
import {
  areStatesEqual,
  clampPage,
  parseListState,
  serializeListState,
  withResetPage,
  type AdminListState,
  type ListStateDefaults,
} from "@/src/lib/utils";

export const SEARCH_DEBOUNCE_MS = 300;

export type AdminListParams = {
  page: number;
  pageSize: number;
  search: string;
  sort: string;
  direction: SortDirection;
  filters: Record<string, string>;
};

type UseAdminListOptions<T> = {
  /** Stable string used as the first query-key segment. */
  queryKeyPrefix: string;
  defaults?: ListStateDefaults;
  fetchPage: (params: AdminListParams) => Promise<ListResult<T>>;
  enabled?: boolean;
};

/**
 * Owns list state end to end:
 *
 * - state lives in the URL, so links are shareable and a reload restores it.
 *   Navigation uses `router.replace`, so the browser Back button leaves the list
 *   rather than stepping back through every filter tweak; only explicit filter
 *   links and detail pages add history entries.
 * - search is debounced by 300ms
 * - changing search / sort / filters resets to page 1
 * - the page is clamped when the result set shrinks
 * - the query key contains every filter, so TanStack Query discards responses
 *   for keys that are no longer current (no stale render after a fast filter)
 */
export function useAdminList<T>({
  queryKeyPrefix,
  defaults: rawDefaults,
  fetchPage,
  enabled = true,
}: UseAdminListOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // `defaults` is usually an inline object; key it by value so the memoised
  // state below is not recomputed on every render.
  const defaultsKey = JSON.stringify({
    sort: rawDefaults?.sort ?? null,
    direction: rawDefaults?.direction ?? null,
    pageSize: rawDefaults?.pageSize ?? null,
    filterKeys: rawDefaults?.filterKeys ?? null,
  });
  const defaults = React.useMemo(
    () => (rawDefaults === undefined ? {} : (JSON.parse(defaultsKey) as ListStateDefaults)),
    [defaultsKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const state = React.useMemo(
    () => parseListState(searchParams, defaults),
    [searchParams, defaults],
  );

  const defaultsRef = React.useRef(defaults);
  defaultsRef.current = defaults;

  const commit = React.useCallback(
    (next: AdminListState) => {
      if (areStatesEqual(next, state)) return;
      const query = serializeListState(next, defaultsRef.current);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, state],
  );

  /* ---------------------------------------------------------------- search */

  // Local mirror so typing stays responsive while the URL updates at most
  // once per debounce window.
  const [searchInput, setSearchInput] = React.useState(state.search);

  // Adopt external search changes (e.g. the Back button) without fighting the
  // user's in-progress typing.
  React.useEffect(() => {
    setSearchInput((current) => (current === state.search ? current : state.search));
  }, [state.search]);

  React.useEffect(() => {
    if (searchInput === state.search) return;
    const timer = setTimeout(() => {
      commit(withResetPage({ ...state, search: searchInput }));
    }, SEARCH_DEBOUNCE_MS);
    // Clearing on every change cancels the pending write, so only the last
    // keystroke of a burst reaches the URL.
    return () => clearTimeout(timer);
  }, [searchInput, state, commit]);

  /* ----------------------------------------------------------------- query */

  const params = React.useMemo<AdminListParams>(
    () => ({
      page: state.page,
      pageSize: state.pageSize,
      search: state.search,
      sort: state.sort || (defaultsRef.current.sort ?? ""),
      direction: state.direction,
      filters: state.filters,
    }),
    [state],
  );

  const query = useQuery({
    queryKey: [queryKeyPrefix, params],
    queryFn: () => fetchPage(params),
    enabled,
    placeholderData: keepPreviousData,
  });

  /* ----------------------------------------------------------------- clamp */

  // The service clamps too; this pushes the corrected page back into the URL so
  // a shared `?page=99` link does not stay wrong after it self-corrects.
  const resolvedPage = query.data?.page;
  React.useEffect(() => {
    if (resolvedPage === undefined) return;
    // `keepPreviousData` keeps the previous page on screen while the next one
    // loads, and `isPlaceholderData` marks exactly that borrowed result.
    // Clamping it would undo the navigation the user just made.
    if (query.isPlaceholderData) return;
    const target = clampPage(resolvedPage, query.data?.total ?? 0, params.pageSize);
    if (target !== state.page) commit({ ...state, page: target });
  }, [
    resolvedPage,
    query.isPlaceholderData,
    params.pageSize,
    query.data?.total,
    state,
    commit,
  ]);

  /* --------------------------------------------------------------- actions */

  const actions = React.useMemo(
    () => ({
      setSearch(value: string) {
        setSearchInput(value);
      },
      clearSearch() {
        setSearchInput("");
      },
      setSort(sort: string) {
        // Clicking the active column flips the direction; a new column resets it.
        const direction: SortDirection =
          state.sort === sort && state.direction === "asc" ? "desc" : "asc";
        commit(withResetPage({ ...state, sort, direction }));
      },
      setFilter(key: string, value: string) {
        if (!value) {
          const { [key]: _removed, ...rest } = state.filters;
          void _removed;
          commit(withResetPage({ ...state, filters: rest }));
          return;
        }
        commit(withResetPage({ ...state, filters: { ...state.filters, [key]: value } }));
      },
      setFilters(filters: Record<string, string>) {
        commit(withResetPage({ ...state, filters }));
      },
      clearFilters() {
        commit(withResetPage({ ...state, filters: {} }));
      },
      goToPage(page: number) {
        const target = clampPage(page, query.data?.total ?? 0, params.pageSize);
        if (target !== state.page) commit({ ...state, page: target });
      },
      setPageSize(pageSize: number) {
        // Keep the first visible row in view after the page size changes.
        const firstVisibleRow = (state.page - 1) * state.pageSize;
        const nextPage = Math.floor(firstVisibleRow / pageSize) + 1;
        commit({ ...state, pageSize, page: nextPage });
      },
      resetAll() {
        setSearchInput("");
        commit({
          ...state,
          page: 1,
          search: "",
          filters: {},
          sort: defaultsRef.current.sort ?? "",
          direction: defaultsRef.current.direction ?? "asc",
        });
      },
    }),
    [commit, params.pageSize, query.data?.total, state],
  );

  return {
    ...query,
    state,
    params,
    ...actions,
    /** True while a debounced search is still pending. */
    isSearchPending: searchInput !== state.search,
    searchInput,
    hasActiveFilters: Object.keys(state.filters).length > 0,
  };
}
