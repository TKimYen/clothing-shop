"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Input, Label } from "@/src/components/ui";
import { errorMessage, orderService } from "@/src/lib/services";
import type { Order } from "@/src/types";

export function PaymentStatusControl({
  order,
}: {
  order: Order;
}) {
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = React.useState("");
  const mutation = useMutation({
    mutationFn: (status: "PAID" | "UNPAID") =>
      orderService.updatePaymentStatus(order.id, status, transactionId),
    onSuccess: (updatedOrder, status) => {
      queryClient.setQueryData(["orders", "detail", order.id], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        status === "PAID" ? "Payment marked as paid" : "Payment marked as unpaid",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <div className="mt-4 border-t border-line pt-4">
      <Label htmlFor={`transaction-${order.id}`}>Payment status</Label>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={order.payment.status === "PAID" ? "primary" : "secondary"}
          loading={mutation.isPending}
          disabled={order.payment.status === "PAID"}
          onClick={() => mutation.mutate("PAID")}
        >
          Mark as paid
        </Button>
        <Button
          size="sm"
          variant={order.payment.status === "UNPAID" ? "primary" : "secondary"}
          loading={mutation.isPending}
          disabled={order.payment.status === "UNPAID"}
          onClick={() => mutation.mutate("UNPAID")}
        >
          Mark as unpaid
        </Button>
      </div>
      {order.payment.status === "UNPAID" && (
        <>
          <Label htmlFor={`transaction-${order.id}`} className="mt-3">
            Transaction ID (optional)
          </Label>
          <div className="mt-1 flex flex-wrap gap-2">
            <Input
              id={`transaction-${order.id}`}
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Bank reference"
              className="min-w-48 flex-1"
              disabled={mutation.isPending}
            />
          </div>
        </>
      )}
      <p className="mt-1.5 text-xs text-muted">
        This updates payment only; the delivery status stays unchanged. Marking
        as unpaid clears the paid time and transaction ID.
      </p>
    </div>
  );
}
