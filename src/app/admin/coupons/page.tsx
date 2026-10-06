"use client";

import { Plus } from "lucide-react";
import * as React from "react";
import { ActiveBadge, Badge, Button } from "@/src/components/ui";
import { DataTable, type Column } from "@/src/components/admin/data-table";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { PageHeader } from "@/src/components/admin/layout";
import { CouponFormDialog } from "@/src/components/admin/forms/coupon-form";
import { FilterChip, FilterSelect } from "@/src/components/admin/primitives";
import {
  useCreateMutation,
  useDeleteMutation,
  useUpdateMutation,
} from "@/src/hooks/use-admin-mutation";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { couponService } from "@/src/lib/services";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import type { Coupon, CouponInput } from "@/src/types";

const DEFAULTS = {
  sort: "code",
  direction: "asc" as const,
  filterKeys: ["discountType", "isActive"] as const,
};

export default function CouponsPage() {
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Coupon | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Coupon | null>(null);

  const list = useAdminList<Coupon>({
    queryKeyPrefix: "coupons",
    defaults: DEFAULTS,
    fetchPage: couponService.list,
  });

  const createCoupon = useCreateMutation<CouponInput, Coupon>({
    queryKey: "coupons",
    entityLabel: "Coupon",
    successMessage: (coupon) => `${coupon.code} created`,
    mutationFn: couponService.create,
    onSuccess: () => setFormOpen(false),
  });

  const updateCoupon = useUpdateMutation<CouponInput & { id: string }, Coupon>({
    queryKey: "coupons",
    entityLabel: "Coupon",
    successMessage: (coupon) => `${coupon.code} updated`,
    mutationFn: ({ id, ...input }) => couponService.update(id, input),
    onSuccess: () => {
      setFormOpen(false);
      setEditing(null);
    },
  });

  const deleteCoupon = useDeleteMutation<Coupon>({
    queryKey: "coupons",
    entityLabel: "Coupon",
    mutationFn: couponService.remove,
  });

  const columns = React.useMemo<Column<Coupon>[]>(
    () => [
      {
        key: "code",
        header: "Code",
        sortable: true,
        render: (coupon) => (
          <div className="min-w-0">
            <span className="block font-mono text-sm font-bold text-ink">{coupon.code}</span>
            {coupon.description ? (
              <span className="mt-0.5 block truncate text-[11px] text-muted">
                {coupon.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "discountType",
        header: "Discount",
        sortable: true,
        render: (coupon) => (
          <span className="text-sm font-semibold text-ink">
            {coupon.discountType === "PERCENT"
              ? `${coupon.discountValue}%`
              : formatCurrency(coupon.discountValue)}
            {coupon.maxDiscountAmount !== null ? (
              <span className="mt-0.5 block text-[11px] font-normal text-muted">
                max {formatCurrency(coupon.maxDiscountAmount)}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        key: "minOrderAmount",
        header: "Min order",
        sortable: true,
        render: (coupon) => (
          <span className="text-sm text-muted">{formatCurrency(coupon.minOrderAmount)}</span>
        ),
      },
      {
        key: "usedCount",
        header: "Used",
        sortable: true,
        render: (coupon) => {
          const exhausted = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses;
          return (
            <span className="flex items-center gap-1.5">
              <span className="text-sm">
                {coupon.usedCount} / {coupon.maxUses ?? "∞"}
              </span>
              {exhausted ? <Badge tone="danger">exhausted</Badge> : null}
            </span>
          );
        },
      },
      {
        key: "startsAt",
        header: "Window",
        sortable: true,
        render: (coupon) => (
          <span className="text-xs whitespace-nowrap text-muted">
            {formatDate(coupon.startsAt)} → {formatDate(coupon.endsAt)}
          </span>
        ),
      },
      {
        key: "isActive",
        header: "Status",
        render: (coupon) => <ActiveBadge isActive={coupon.isActive} />,
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        render: (coupon) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit ${coupon.code}`}
              onClick={() => {
                setEditing(coupon);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete ${coupon.code}`}
              onClick={() => setPendingDelete(coupon)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const submit = async (input: CouponInput) => {
    if (editing) await updateCoupon.mutateAsync({ id: editing.id, ...input });
    else await createCoupon.mutateAsync(input);
  };

  const { filters } = list.state;

  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Coupons"
        description="Discount codes. Usage counts are tracked by checkout and are read-only here."
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-3.5" />
            New coupon
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={list.data?.items ?? []}
        getRowId={(coupon) => coupon.id}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={list.data?.total ?? 0}
        page={list.data?.page ?? 1}
        pageSize={list.data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel="coupons"
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchPlaceholder="Search by code or description"
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        emptyTitle="No coupons match"
        emptyAction={
          list.hasActiveFilters || list.searchInput ? (
            <Button variant="secondary" size="sm" onClick={list.resetAll}>
              Clear filters
            </Button>
          ) : null
        }
        toolbar={
          <>
            <FilterSelect
              id="filter-discount-type"
              label="Discount type"
              value={filters.discountType ?? ""}
              placeholder="Any type"
              options={[
                { value: "PERCENT", label: "Percentage" },
                { value: "FIXED", label: "Fixed amount" },
              ]}
              onChange={(value) => list.setFilter("discountType", value)}
            />
            <FilterSelect
              id="filter-coupon-active"
              label="Status"
              value={filters.isActive ?? ""}
              placeholder="Any status"
              options={[
                { value: "true", label: "Active" },
                { value: "false", label: "Inactive" },
              ]}
              onChange={(value) => list.setFilter("isActive", value)}
            />
          </>
        }
        meta={
          list.hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Filters:</span>
              {filters.discountType ? (
                <FilterChip
                  label={filters.discountType === "PERCENT" ? "Percentage" : "Fixed"}
                  onClear={() => list.setFilter("discountType", "")}
                />
              ) : null}
              {filters.isActive ? (
                <FilterChip
                  label={filters.isActive === "true" ? "Active" : "Inactive"}
                  onClear={() => list.setFilter("isActive", "")}
                />
              ) : null}
              <Button variant="link" size="sm" onClick={list.clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null
        }
      />

      <CouponFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        coupon={editing}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${pendingDelete?.code ?? "coupon"}?`}
        description="Customers will no longer be able to redeem this code. This cannot be undone."
        loading={deleteCoupon.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteCoupon.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
      />
    </>
  );
}
