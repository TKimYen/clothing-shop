"use client";

import * as React from "react";
import { Button } from "@/src/components/ui";
import { DataTable, type Column } from "@/src/components/admin/data-table";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { PageHeader } from "@/src/components/admin/layout";
import type { useAdminList } from "@/src/hooks/use-admin-list";
import type { useDeleteMutation } from "@/src/hooks/use-admin-mutation";

type AdminListResult<T> = ReturnType<typeof useAdminList<T>>;

/**
 * Shared shell for the catalog CRUD pages (categories, collections, sizes,
 * colors). Each page supplies its own columns, header action and dialog;
 * pagination, search, sort, filters and the four list states live here.
 */
export function CrudListPage<T extends { id: string }>({
  eyebrow,
  title,
  description,
  itemLabel,
  buildColumns,
  list,
  getRowId,
  deleteMutation,
  formDialog,
  addAction,
  toolbar,
  meta,
  searchPlaceholder,
  deleteTitle,
  emptyTitle,
  emptyDescription,
}: {
  eyebrow: string;
  title: string;
  description: string;
  itemLabel: string;
  /**
   * Built from a callback so the action column can request deletion, which this
   * component owns (it holds the confirm dialog state).
   */
  buildColumns: (requestDelete: (item: T) => void) => Column<T>[];
  list: AdminListResult<T>;
  getRowId: (item: T) => string;
  deleteMutation: ReturnType<typeof useDeleteMutation<T>>;
  formDialog: React.ReactNode;
  addAction: React.ReactNode;
  toolbar?: React.ReactNode;
  meta?: React.ReactNode;
  searchPlaceholder?: string;
  deleteTitle: (item: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [pendingDelete, setPendingDelete] = React.useState<T | null>(null);
  const { data } = list;

  const requestDelete = React.useCallback((item: T) => setPendingDelete(item), []);
  const columns = React.useMemo(
    () => buildColumns(requestDelete),
    [buildColumns, requestDelete],
  );

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={addAction}
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowId={getRowId}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={data?.total ?? 0}
        page={data?.page ?? 1}
        pageSize={data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel={itemLabel}
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchPlaceholder={searchPlaceholder ?? `Search ${itemLabel}`}
        searchLabel={`Search ${itemLabel}`}
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        toolbar={toolbar}
        meta={meta}
        emptyTitle={emptyTitle ?? `No ${itemLabel} yet`}
        emptyDescription={emptyDescription}
        emptyAction={
          list.hasActiveFilters || list.searchInput ? (
            <Button variant="secondary" size="sm" onClick={list.resetAll}>
              Clear filters
            </Button>
          ) : null
        }
      />

      {formDialog}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={pendingDelete ? deleteTitle(pendingDelete) : "Delete?"}
        description="This cannot be undone. If products or variants still reference this record, the delete is refused."
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}

/** Text action pair used in the last column of every catalog list. */
export function RowActions({
  onEdit,
  onDelete,
  label,
}: {
  onEdit: () => void;
  onDelete: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="sm" aria-label={`Edit ${label}`} onClick={onEdit}>
        Edit
      </Button>
      <Button variant="ghost" size="sm" aria-label={`Delete ${label}`} onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
}
