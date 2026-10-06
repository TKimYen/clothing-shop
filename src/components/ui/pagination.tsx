"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "./button";
import { PAGE_SIZE_OPTIONS } from "@/src/lib/utils";
import { Select } from "./input";

/**
 * Server-style pagination: it renders `page`/`pageSize`/`total` received from
 * the service and only ever *requests* a page. It never slices a local array.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  className,
  itemLabel = "records",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  itemLabel?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  // Window of at most 5 page buttons around the current page.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const visible = Array.from({ length: Math.min(5, pages) }, (_, index) => start + index);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted" aria-live="polite">
        {total === 0
          ? `No ${itemLabel}`
          : `Showing ${first}–${last} of ${total} ${itemLabel}`}
      </p>

      <div className="flex items-center gap-3">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <Select
              aria-label="Rows per page"
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 w-auto text-xs"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
        ) : null}

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            Prev
          </Button>

          {visible.map((pageNumber) => (
            <Button
              key={pageNumber}
              variant={pageNumber === page ? "primary" : "secondary"}
              size="icon"
              className="text-xs"
              onClick={() => onPageChange(pageNumber)}
              aria-current={pageNumber === page ? "page" : undefined}
              aria-label={`Page ${pageNumber}`}
            >
              {pageNumber}
            </Button>
          ))}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
          >
            Next
          </Button>
        </nav>
      </div>
    </div>
  );
}
