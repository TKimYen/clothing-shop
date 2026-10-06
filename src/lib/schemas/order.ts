import { z } from "zod";
import type { OrderStatus } from "@/src/types";
import { ORDER_STATUSES } from "@/src/types";
import { isOrderStatus, isValidStatusTransition } from "@/src/lib/utils/order";

export const orderStatusSchema = z.enum(ORDER_STATUSES);

/**
 * Guarded by the same rule the UI enforces with disabled options, so a stale
 * tab or a direct service call still cannot skip a step in the flow.
 */
export function orderStatusUpdateSchema(currentStatus: string) {
  return z.object({ status: orderStatusSchema }).superRefine((values, ctx) => {
    if (!isOrderStatus(currentStatus)) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Unknown current status" });
      return;
    }
    if (values.status === currentStatus) {
      ctx.addIssue({ code: "custom", path: ["status"], message: "Status is unchanged" });
      return;
    }
    if (!isValidStatusTransition(currentStatus as OrderStatus, values.status)) {
      ctx.addIssue({
        code: "custom",
        path: ["status"],
        message: `Cannot move an order from ${currentStatus} to ${values.status}`,
      });
    }
  });
}

export type OrderStatusFormValues = z.infer<typeof orderStatusSchema>;
