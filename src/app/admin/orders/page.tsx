"use client";

import Link from "next/link";
import * as React from "react";
import { Button, OrderStatusBadge } from "@/src/components/ui";
import { DataTable, type Column } from "@/src/components/admin/data-table";
import { PageHeader } from "@/src/components/admin/layout";
import { FilterChip, FilterSelect } from "@/src/components/admin/primitives";
import { useAdminList } from "@/src/hooks/use-admin-list";
import { orderService } from "@/src/lib/services";
import { formatCurrency, formatDateTime, formatOrderStatus } from "@/src/lib/utils";
import type { Order, OrderStatus } from "@/src/types";
import { ORDER_STATUSES } from "@/src/types";

const DEFAULTS = {
  sort: "createdAt",
  direction: "desc" as const,
  filterKeys: ["status", "hasCoupon"] as const,
};

export default function OrdersPage() {
  const list = useAdminList<Order>({
    queryKeyPrefix: "orders",
    defaults: DEFAULTS,
    fetchPage: orderService.list,
  });

  const columns = React.useMemo<Column<Order>[]>(
    () => [
      {
        key: "orderCode",
        header: "Order",
        sortable: true,
        render: (order) => (
          <Link
            href={`/admin/orders/${order.id}`}
            className="font-mono text-xs font-bold text-brand hover:underline"
          >
            {order.orderCode}
          </Link>
        ),
      },
      {
        key: "recipientName",
        header: "Customer",
        sortable: true,
        render: (order) => (
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">
              {order.recipientName}
            </span>
            <span className="mt-0.5 block truncate text-[11px] text-muted">
              {order.recipientPhone}
            </span>
          </div>
        ),
      },
      {
        key: "items",
        header: "Items",
        className: "text-right",
        render: (order) => (
          <span className="text-sm text-muted">
            {order.items.length} · {order.items.reduce((sum, item) => sum + item.qty, 0)} units
          </span>
        ),
      },
      {
        key: "couponCode",
        header: "Coupon",
        render: (order) =>
          order.couponCode ? (
            <span className="font-mono text-[11px] text-ink">{order.couponCode}</span>
          ) : (
            <span className="text-xs text-muted">—</span>
          ),
      },
      {
        key: "total",
        header: "Total",
        sortable: true,
        className: "text-right",
        render: (order) => (
          <span className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (order) => <OrderStatusBadge status={order.status} />,
      },
      {
        key: "createdAt",
        header: "Placed",
        sortable: true,
        render: (order) => (
          <span className="text-xs whitespace-nowrap text-muted">
            {formatDateTime(order.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  const { filters } = list.state;

  return (
    <>
      <PageHeader
        eyebrow="Commerce"
        title="Orders"
        description="Search by order code or customer. Status follows Pending → Confirmed → Shipping → Delivered."
      />

      <DataTable
        columns={columns}
        data={list.data?.items ?? []}
        getRowId={(order) => order.id}
        isLoading={list.isLoading}
        error={list.isError ? list.error : undefined}
        onRetry={() => void list.refetch()}
        total={list.data?.total ?? 0}
        page={list.data?.page ?? 1}
        pageSize={list.data?.pageSize ?? list.state.pageSize}
        onPageChange={list.goToPage}
        onPageSizeChange={list.setPageSize}
        itemLabel="orders"
        searchValue={list.searchInput}
        onSearchChange={list.setSearch}
        isSearchPending={list.isSearchPending}
        searchPlaceholder="Search order code or customer"
        sort={list.state.sort}
        direction={list.state.direction}
        onSortChange={list.setSort}
        emptyTitle="No orders match"
        emptyDescription="Try a different order code, customer name or status."
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
              id="filter-status"
              label="Status"
              value={filters.status ?? ""}
              placeholder="Any status"
              options={ORDER_STATUSES.map((status) => ({ value: status, label: formatOrderStatus(status) }))}
              onChange={(value) => list.setFilter("status", value as OrderStatus)}
            />
            <FilterSelect
              id="filter-coupon"
              label="Coupon usage"
              value={filters.hasCoupon ?? ""}
              placeholder="Any coupon"
              options={[
                { value: "true", label: "Used a coupon" },
                { value: "false", label: "No coupon" },
              ]}
              onChange={(value) => list.setFilter("hasCoupon", value)}
            />
          </>
        }
        meta={
          list.hasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-2">
              <span>Filters:</span>
              {filters.status ? (
                <FilterChip
                  label={formatOrderStatus(filters.status)}
                  onClear={() => list.setFilter("status", "")}
                />
              ) : null}
              {filters.hasCoupon ? (
                <FilterChip
                  label={filters.hasCoupon === "true" ? "Coupon used" : "No coupon"}
                  onClear={() => list.setFilter("hasCoupon", "")}
                />
              ) : null}
              <Button variant="link" size="sm" onClick={list.clearFilters}>
                Clear all
              </Button>
            </div>
          ) : null
        }
      />
    </>
  );
}
