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
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/src/components/ui";
import { PageHeader } from "@/src/components/admin/layout";
import { OrderStatusSelect } from "@/src/components/admin/order-status-select";
import { orderService } from "@/src/lib/services";
import { humanizeEnum } from "@/src/lib/utils";
import { computeOrderTotal, formatCurrency, formatDateTime } from "@/src/lib/utils";
import type { Order } from "@/src/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => orderService.get(orderId),
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
            {error instanceof Error ? error.message : "Could not load this order."}
          </p>
          <Button className="mt-3" size="sm" onClick={() => void refetch()}>
            Try again
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!order) return <OrderNotFound />;

  return <OrderDetail order={order} />;
}

function OrderNotFound() {
  return (
    <Card>
      <CardBody className="py-16 text-center">
        <p className="text-sm font-semibold text-ink">Order not found</p>
        <p className="mt-1 text-xs text-muted">
          It may have been deleted, or the link is out of date.
        </p>
        <Button asChild variant="secondary" size="sm" className="mt-4">
          <Link href="/admin/orders">Back to orders</Link>
        </Button>
      </CardBody>
    </Card>
  );
}

function OrderDetail({ order }: { order: Order }) {
  // Recomputed with the same helper the service used, so the displayed total can
  // never silently disagree with the stored one.
  const computedTotal = computeOrderTotal(order.subtotal, order.discount, order.shippingFee);
  const totalMismatch = computedTotal !== order.total;

  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title={<span className="font-mono">{order.orderCode}</span>}
        back={{ label: "All orders", href: "/admin/orders" }}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Customer + shipping snapshot */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Customer & shipping"
            description="Snapshot taken at checkout — not linked to the customer's current address."
          />
          <CardBody>
            <DescriptionList
              items={[
                { label: "Recipient", value: order.recipientName },
                { label: "Phone", value: order.recipientPhone },
                {
                  label: "Shipping address",
                  value: <span className="font-normal">{order.shippingAddress}</span>,
                },
                {
                  label: "Coupon used",
                  value: order.couponCode ? (
                    <span className="font-mono text-xs">{order.couponCode}</span>
                  ) : (
                    <span className="font-normal text-muted">No coupon</span>
                  ),
                },
                {
                  label: "Customer account",
                  value: (
                    <Link
                      href={`/admin/users/${order.userId}`}
                      className="inline-block py-1 text-brand hover:underline"
                    >
                      View customer
                    </Link>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>

        {/* Status control */}
        <Card>
          <CardHeader title="Fulfilment" description="Only valid next steps are selectable." />
          <CardBody>
            <OrderStatusSelect
              orderId={order.id}
              currentStatus={order.status}
              className="min-w-0"
            />

            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-[10px] font-bold tracking-wider text-muted uppercase">
                Payment
              </h3>
              <DescriptionList
                className="mt-3"
                columns={1}
                items={[
                  { label: "Method", value: humanizeEnum(order.payment.method) },
                  { label: "Status", value: humanizeEnum(order.payment.status) },
                  {
                    label: "Transaction",
                    value: (
                      <span className="font-mono text-xs">{order.payment.transactionId}</span>
                    ),
                  },
                  {
                    label: "Paid at",
                    value:
                      order.payment.paidAt === null ? (
                        <span className="font-normal text-muted">Not paid</span>
                      ) : (
                        formatDateTime(order.payment.paidAt)
                      ),
                  },
                ]}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Items */}
      <Card className="mt-4">
        <CardHeader
          title="Items"
          description="Line items are snapshots; renaming a product later does not rewrite this order."
          action={
            <Badge tone="neutral">
              {order.items.reduce((sum, item) => sum + item.qty, 0)} units
            </Badge>
          }
        />
        <TableWrap>
          <Table className="min-w-2xl">
            <THead>
              <tr>
                <TH scope="col">Product</TH>
                <TH scope="col">Size</TH>
                <TH scope="col">Color</TH>
                <TH scope="col" className="text-right">
                  Unit price
                </TH>
                <TH scope="col" className="text-right">
                  Qty
                </TH>
                <TH scope="col" className="text-right">
                  Line total
                </TH>
              </tr>
            </THead>
            <TBody>
              {order.items.map((item) => (
                <TR key={item.id}>
                  <TD>
                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="text-sm font-semibold text-ink hover:text-brand"
                    >
                      {item.productName}
                    </Link>
                  </TD>
                  <TD>
                    <span className="text-sm">{item.sizeLabel}</span>
                  </TD>
                  <TD>
                    <span className="text-sm">{item.colorName}</span>
                  </TD>
                  <TD className="text-right text-sm">{formatCurrency(item.unitPrice)}</TD>
                  <TD className="text-right text-sm">{item.qty}</TD>
                  <TD className="text-right text-sm font-semibold text-ink">
                    {formatCurrency(item.unitPrice * item.qty)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      </Card>

      {/* Totals */}
      <Card className="mt-4">
        <CardHeader title="Totals" />
        <CardBody>
          <dl className="ml-auto grid max-w-xs gap-2.5 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium text-ink">{formatCurrency(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Discount</dt>
              <dd className="font-medium text-brand">
                {order.discount > 0 ? `-${formatCurrency(order.discount)}` : formatCurrency(0)}
              </dd>
            </div>
            <div className="flex justify-between gap-6">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-medium text-ink">
                {order.shippingFee === 0 ? "Free" : formatCurrency(order.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between gap-6 border-t border-line pt-2.5">
              <dt className="font-display font-semibold text-ink">Total</dt>
              <dd className="font-display text-lg font-bold text-ink">
                {formatCurrency(order.total)}
              </dd>
            </div>
          </dl>

          {totalMismatch ? (
            <p role="alert" className="mt-4 rounded-md bg-gold/15 px-3 py-2 text-xs text-gold">
              Stored total ({formatCurrency(order.total)}) does not match subtotal − discount +
              shipping ({formatCurrency(computedTotal)}).
            </p>
          ) : null}
        </CardBody>
      </Card>
    </>
  );
}
