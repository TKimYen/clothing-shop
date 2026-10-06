"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  OrderStatusBadge,
  RoleBadge,
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { RoleSelect } from "@/src/components/admin/role-select";
import { orderService, userService } from "@/src/lib/services";
import { formatCurrency, formatDateTime } from "@/src/lib/utils";
import type { Order, User } from "@/src/types";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => userService.get(userId),
  });

  const { data: stats } = useQuery({
    queryKey: ["users", userId, "stats"],
    queryFn: () => userService.stats(userId),
    enabled: Boolean(user),
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", "by-user", userId],
    queryFn: () => orderService.listByUser(userId, { pageSize: 50, sort: "createdAt", direction: "desc" }),
    enabled: Boolean(user),
  });

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="h-64 animate-pulse rounded bg-canvas-line" />
        </CardBody>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-danger">
            {error instanceof Error ? error.message : "Could not load this customer."}
          </p>
          <Button className="mt-3" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!user) return <UserNotFound />;

  return (
    <UserDetail user={user} orders={orders?.items ?? []} stats={stats} />
  );
}

function UserNotFound() {
  return (
    <Card>
      <CardBody className="py-16 text-center">
        <p className="text-sm font-semibold text-ink">Customer not found</p>
        <p className="mt-1 text-xs text-muted">
          It may have been removed, or the link is out of date.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <Link href="/admin/users">Back to users</Link>
        </Button>
      </CardBody>
    </Card>
  );
}

function UserDetail({
  user,
  orders,
  stats,
}: {
  user: User;
  orders: Order[];
  stats?: { orderCount: number; lifetimeSpend: number; pendingCount: number };
}) {
  return (
    <>
      <PageHeader
        eyebrow="Users"
        title={user.fullName}
        back={{ label: "All users", href: "/admin/users" }}
        description={user.email}
        actions={<RoleBadge role={user.role} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Profile" description="Contact details are read-only in admin." />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Full name", value: user.fullName },
                { label: "Email", value: <span className="font-mono text-xs">{user.email}</span> },
                { label: "Phone", value: user.phone },
                {
                  label: "Role",
                  value: (
                    <RoleSelect userId={user.id} currentRole={user.role} />
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Lifetime" />
          <CardBody>
            <dl className="grid gap-3">
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">
                  Orders
                </dt>
                <dd className="font-display text-2xl font-bold text-ink">
                  {stats?.orderCount ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">
                  Spend (excl. cancelled)
                </dt>
                <dd className="font-display text-2xl font-bold text-ink">
                  {stats ? formatCurrency(stats.lifetimeSpend) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">
                  Awaiting confirmation
                </dt>
                <dd className="font-display text-2xl font-bold text-ink">
                  {stats?.pendingCount ?? "—"}
                </dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      {/* Addresses are read-only */}
      <Card className="mt-4">
        <CardHeader
          title="Addresses"
          description="Managed by the customer. Admins cannot edit or set a default here."
          action={
            <Badge tone="neutral">
              {user.addresses.length} saved
            </Badge>
          }
        />
        {user.addresses.length === 0 ? (
          <CardBody>
            <p className="text-sm text-muted">This customer has no saved addresses.</p>
          </CardBody>
        ) : (
          <TableWrap>
            <Table className="min-w-2xl">
              <THead>
                <tr>
                  <TH scope="col">Recipient</TH>
                  <TH scope="col">Address</TH>
                  <TH scope="col">Default</TH>
                </tr>
              </THead>
              <TBody>
                {user.addresses.map((address) => (
                  <TR key={address.id}>
                    <TD>
                      <span className="text-sm font-semibold text-ink">
                        {address.recipientName}
                      </span>
                      <span className="block text-xs text-muted">{address.phone}</span>
                    </TD>
                    <TD>
                      <span className="text-sm text-muted">{address.fullAddress}</span>
                    </TD>
                    <TD>
                      {address.isDefault ? <Badge tone="info">default</Badge> : "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {/* Order history */}
      <Card className="mt-4">
        <CardHeader
          title="Order history"
          description="Most recent orders for this customer."
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href={`/admin/orders?search=${encodeURIComponent(user.fullName)}`}>
                Filter all orders
              </Link>
            </Button>
          }
        />
        {orders.length === 0 ? (
          <CardBody>
            <p className="text-sm text-muted">This customer has not placed any orders.</p>
          </CardBody>
        ) : (
          <TableWrap>
            <Table className="min-w-2xl">
              <THead>
                <tr>
                  <TH scope="col">Order</TH>
                  <TH scope="col">Placed</TH>
                  <TH scope="col">Items</TH>
                  <TH scope="col" className="text-right">
                    Total
                  </TH>
                  <TH scope="col">Status</TH>
                </tr>
              </THead>
              <TBody>
                {orders.map((order) => (
                  <TR key={order.id}>
                    <TD>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-bold text-brand hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </TD>
                    <TD>
                      <span className="text-xs whitespace-nowrap text-muted">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </TD>
                    <TD>
                      <span className="text-sm text-muted">
                        {order.items.reduce((sum, item) => sum + item.qty, 0)} units
                      </span>
                    </TD>
                    <TD className="text-right text-sm font-semibold text-ink">
                      {formatCurrency(order.total)}
                    </TD>
                    <TD>
                      <OrderStatusBadge status={order.status} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </Card>
    </>
  );
}