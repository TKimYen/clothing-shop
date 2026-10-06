"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Label, OrderStatusBadge, Select } from "@/src/components/ui";
import { ConfirmDialog } from "@/src/components/admin/confirm-dialog";
import { orderService, errorMessage } from "@/src/lib/services";
import { ORDER_STATUSES } from "@/src/types";
import type { OrderStatus } from "@/src/types";
import {
  allowedStatusTransitions,
  formatList,
  formatOrderStatus,
  isValidStatusTransition,
} from "@/src/lib/utils";

/**
 * Status control for the order detail page.
 *
 * Invalid targets are rendered as *disabled* options rather than hidden, so the
 * operator can see the whole flow and understand why an option is unavailable.
 * The select holds a draft value that only becomes real once the confirm dialog
 * is accepted, so the control never shows a status the order is not in. The
 * service re-validates the same rule, so a stale tab cannot skip a step.
 */
export function OrderStatusSelect({
  orderId,
  currentStatus,
  className,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const allowed = allowedStatusTransitions(currentStatus);

  const [draft, setDraft] = React.useState<OrderStatus>(currentStatus);
  const [confirming, setConfirming] = React.useState(false);
  const [lastStatus, setLastStatus] = React.useState<OrderStatus>(currentStatus);

  if (currentStatus !== lastStatus) {
    setLastStatus(currentStatus);
    setDraft(currentStatus);
    setConfirming(false);
  }

  const mutation = useMutation({
    mutationFn: (status: OrderStatus) => orderService.updateStatus(orderId, status),
    onSuccess: (order) => {
      toast.success(`${order.orderCode} is now ${order.status.toLowerCase()}`);
      queryClient.setQueryData(["orders", "detail", orderId], order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setConfirming(false);
    },
    onError: (error) => {
      toast.error(errorMessage(error));
      setConfirming(false);
      setDraft(currentStatus);
    },
  });

  if (allowed.length === 0) {
    return (
      <div className={className}>
        <span className="field-label">Update status</span>
        <div className="flex h-9 items-center gap-2">
          <OrderStatusBadge status={currentStatus} />
          <span className="text-xs text-muted">This order is in a final state.</span>
        </div>
      </div>
    );
  }

  const isDirty = draft !== currentStatus;

  return (
    <div className={className}>
      <Label htmlFor={`status-${orderId}`} className="inline-flex min-h-6 items-center">
        Update status
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          id={`status-${orderId}`}
          value={draft}
          disabled={mutation.isPending || confirming}
          onChange={(event) => setDraft(event.target.value as OrderStatus)}
          className="h-9 w-auto min-w-40 text-xs"
        >
          {ORDER_STATUSES.map((status) => (
            <option
              key={status}
              value={status}
              // Disabled, not hidden: the flow stays legible.
              disabled={
                status === currentStatus || !isValidStatusTransition(currentStatus, status)
              }
            >
              {formatOrderStatus(status)}
              {status === currentStatus ? " (current)" : ""}
              {status !== currentStatus && !isValidStatusTransition(currentStatus, status)
                ? " — unavailable"
                : ""}
            </option>
          ))}
        </Select>

        <Button
          size="sm"
          loading={mutation.isPending}
          disabled={!isDirty || confirming}
          onClick={() => setConfirming(true)}
        >
          Update
        </Button>
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {`Allowed next: ${formatList(allowed.map(formatOrderStatus))}.`}
      </p>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Change order status?"
        description={
          <>
            <span className="text-ink">{formatOrderStatus(draft)}</span> will replace{" "}
            <span className="font-semibold text-ink">{formatOrderStatus(currentStatus)}</span> for
            this order.
          </>
        }
        confirmLabel="Change status"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate(draft)}
      />
    </div>
  );
}