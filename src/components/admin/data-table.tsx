"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import * as React from "react";
import {
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Pagination,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/src/components/ui";
import { cn } from "@/src/lib/utils";
import type { SortDirection } from "@/src/types";

export type Column<T> = {
  /** Stable key. Also the default sort key when `sortable` is true. */
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  getRowId: (item: T) => string;

  isLoading?: boolean;
  /** Receives the error to render, so the caller controls retry + messaging. */
  error?: unknown;
  onRetry?: () => void;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  /** Server-style pagination. Omit to hide the pager entirely. */
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  /** True while a debounced search is still in flight. */
  isSearchPending?: boolean;

  sort?: string;
  direction?: SortDirection;
  onSortChange?: (key: string) => void;

  /** Filter controls rendered between the toolbar and the table. */
  toolbar?: React.ReactNode;

  /** Secondary line under the toolbar, e.g. "3 filters applied". */
  meta?: React.ReactNode;

  className?: string;
};

/**
 * The single shared table for every list page.
 *
 * It is fully controlled: search, sort and pagination are *requests* to the
 * service, never local slicing. Callers wire them through `useAdminList`.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  total = 0,
  page = 1,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  itemLabel = "records",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  searchLabel = "Search",
  isSearchPending = false,
  sort,
  direction = "asc",
  onSortChange,
  toolbar,
  meta,
  className,
}: DataTableProps<T>) {
  const hasSearch = typeof onSearchChange === "function";
  const hasPager = typeof onPageChange === "function";
  const showEmpty = !isLoading && !error && data.length === 0;

  const ariaSortFor = (column: Column<T>): React.AriaAttributes["aria-sort"] => {
    if (!column.sortable) return undefined;
    if (sort !== column.key) return "none";
    return direction === "asc" ? "ascending" : "descending";
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-line bg-paper",
        className,
      )}
    >
      {/* Toolbar */}
      {hasSearch || toolbar ? (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          {hasSearch ? (
            <div className="w-full lg:max-w-xs">
              <Label htmlFor="data-table-search" className="sr-only">
                {searchLabel}
              </Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <Input
                  id="data-table-search"
                  type="search"
                  value={searchValue ?? ""}
                  placeholder={searchPlaceholder}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="h-8 pl-8 text-xs"
                  aria-busy={isSearchPending || undefined}
                />
              </div>
            </div>
          ) : null}
          {toolbar ? (
            <div className="flex flex-wrap items-center gap-2">{toolbar}</div>
          ) : null}
        </div>
      ) : null}

      {meta ? (
        <div className="border-b border-line px-4 py-2 text-xs text-muted">{meta}</div>
      ) : null}

      {/* States */}
      {error ? (
        <ErrorState
          title="Could not load these records"
          description={
            error instanceof Error ? error.message : "An unexpected error occurred."
          }
          onRetry={onRetry}
        />
      ) : isLoading ? (
        <LoadingState label="Loading records" />
      ) : showEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <tr>
                {columns.map((column) => (
                  <TH
                    key={column.key}
                    scope="col"
                    aria-sort={ariaSortFor(column)}
                    className={column.headerClassName}
                  >
                    {column.sortable && onSortChange ? (
                      <button
                        type="button"
                        onClick={() => onSortChange(column.key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-ink"
                      >
                        {column.header}
                        {sort === column.key ? (
                          direction === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </TH>
                ))}
              </tr>
            </THead>
            <TBody>
              {data.map((item) => (
                <TR key={getRowId(item)}>
                  {columns.map((column) => (
                    <TD key={column.key} className={column.className}>
                      {column.render(item)}
                    </TD>
                  ))}
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}

      {/* Pagination */}
      {hasPager && !error ? (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          itemLabel={itemLabel}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </div>
  );
}
