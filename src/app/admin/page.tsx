"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Package,
  Users,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  OrderStatusBadge,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { ProductThumb } from "@/src/components/admin/primitives";
import { dashboardService } from "@/src/lib/services";
import { LOW_STOCK_THRESHOLD } from "@/src/lib/services";
import { formatCurrency, formatDateTime, formatNumber } from "@/src/lib/utils";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardService.getSummary,
  });

  const stats = [
    {
      label: "Customers",
      value: data ? formatNumber(data.totals.users) : null,
      icon: Users,
      tone: "bg-brand/10 text-brand",
      href: "/admin/users",
    },
    {
      label: "Products",
      value: data ? formatNumber(data.totals.products) : null,
      icon: Package,
      tone: "bg-azure/10 text-azure",
      href: "/admin/products",
    },
    {
      label: "Categories",
      value: data ? formatNumber(data.totals.categories) : null,
      icon: Boxes,
      tone: "bg-moss/10 text-moss",
      href: "/admin/categories",
    },
    {
      label: "Orders",
      value: data ? formatNumber(data.totals.orders) : null,
      icon: ClipboardList,
      tone: "bg-plum/10 text-plum",
      href: "/admin/orders",
    },
    {
      label: "Revenue",
      value: data ? formatCurrency(data.totals.revenue) : null,
      icon: CircleDollarSign,
      tone: "bg-gold/15 text-gold",
      href: "/admin/orders",
    },
  ] as const;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Storefront pulse at a glance. Revenue excludes cancelled orders."
        actions={
          <Button variant="secondary" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
        }
      />

      {isError ? (
        <Card>
          <CardBody>
            <p className="text-sm text-danger">
              {error instanceof Error ? error.message : "Could not load the dashboard."}
            </p>
            <Button className="mt-3" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardBody className="p-4">
                <span className={`grid size-8 place-items-center rounded-lg ${stat.tone}`}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="mt-3 text-xs text-muted">{stat.label}</p>
                {isLoading ? (
                  <div className="mt-1.5 h-7 w-20 animate-pulse rounded bg-canvas-line" />
                ) : (
                  <p className="mt-0.5 font-display text-xl font-bold text-ink">
                    {stat.value ?? "—"}
                  </p>
                )}
                <Link
                  href={stat.href}
                  className="mt-1 inline-block py-1 text-[11px] font-semibold text-brand hover:underline"
                >
                  View all
                </Link>
              </CardBody>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Orders by status */}
        <Card>
          <CardHeader
            title="Orders by status"
            description="Current distribution across the fulfilment flow"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/orders">All orders</Link>
              </Button>
            }
          />
          <CardBody>
            {isLoading ? (
              <div className="grid gap-4">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="h-6 animate-pulse rounded bg-canvas-line" />
                ))}
              </div>
            ) : (
              <ul className="grid gap-3.5">
                {(data?.ordersByStatus ?? []).map((row) => {
                  const max = Math.max(
                    1,
                    ...(data?.ordersByStatus ?? []).map((entry) => entry.count),
                  );
                  return (
                    <li key={row.status} className="grid grid-cols-[104px_1fr_36px] items-center gap-3">
                      <Link href={`/admin/orders?status=${row.status}`} className="hover:underline">
                        <OrderStatusBadge status={row.status} />
                      </Link>
                      <div className="h-1.5 overflow-hidden rounded-full bg-canvas-line">
                        <div
                          className="h-full rounded-full bg-ink"
                          style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }}
                        />
                      </div>
                      <span className="text-right text-xs font-semibold text-ink">
                        {row.count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Low stock */}
        <Card>
          <CardHeader
            title="Low stock"
            description={`Variants below ${LOW_STOCK_THRESHOLD} units`}
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/products">Inventory</Link>
              </Button>
            }
          />
          <CardBody className="p-0">
            {isLoading ? (
              <div className="grid gap-3 p-5">
                {[0, 1, 2, 3].map((row) => (
                  <div key={row} className="h-11 animate-pulse rounded bg-canvas-line" />
                ))}
              </div>
            ) : (data?.lowStock.length ?? 0) === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-muted">
                Every variant is at or above {LOW_STOCK_THRESHOLD} units.
              </p>
            ) : (
              <ul className="divide-y divide-canvas-line">
                {data?.lowStock.map((row) => (
                  <li key={row.sku} className="flex items-center gap-3 px-5 py-3">
                    <ProductThumb src={row.thumbnail} alt={row.productName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/products/${row.productId}`}
                        className="block truncate py-1 text-sm font-semibold text-ink hover:text-brand"
                      >
                        {row.productName}
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                        {row.sizeLabel} · {row.colorName} · {row.sku}
                      </p>
                    </div>
                    <Badge tone={row.stockQuantity === 0 ? "danger" : "warning"}>
                      {row.stockQuantity}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="mt-4">
        <CardHeader
          title="Recent orders"
          description="Six most recent orders"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">All orders</Link>
            </Button>
          }
        />
        {isLoading ? (
          <CardBody>
            <div className="h-32 animate-pulse rounded bg-canvas-line" />
          </CardBody>
        ) : (data?.recentOrders.length ?? 0) === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No orders yet.</p>
        ) : (
          <TableWrap>
            <Table className="min-w-2xl">
              <THead>
                <tr>
                  <TH scope="col">Order</TH>
                  <TH scope="col">Customer</TH>
                  <TH scope="col">Placed</TH>
                  <TH scope="col">Status</TH>
                  <TH scope="col" className="text-right">
                    Total
                  </TH>
                </tr>
              </THead>
              <TBody>
                {data?.recentOrders.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="py-1 font-mono text-xs font-semibold text-brand hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </TD>
                    <TD className="text-sm">{order.recipientName}</TD>
                    <TD className="text-xs text-muted">{formatDateTime(order.createdAt)}</TD>
                    <TD>
                      <OrderStatusBadge status={order.status} />
                    </TD>
                    <TD className="text-right font-semibold text-ink">
                      {formatCurrency(order.total)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {data ? (
        <p className="mt-4 text-xs text-muted">
          {formatNumber(data.totalUnits)} units on hand · {data.activeCoupons} active coupons
        </p>
      ) : null}
    </>
  );
}
