import type { OrderStatus } from "@/src/types";
import { ORDER_STATUS_FLOW } from "@/src/types";

/** `subtotal - discount + shippingFee`. Kept in one place so the UI never re-derives it. */
export function computeOrderTotal(
  subtotal: number,
  discount: number,
  shippingFee: number,
): number {
  return round2(subtotal - discount + shippingFee);
}

/**
 * `PENDING -> CONFIRMED -> SHIPPING -> DELIVERED`, plus
 * "any non-terminal status -> CANCELLED".
 */
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  if (to === "CANCELLED") return from !== "DELIVERED";
  const fromIndex = ORDER_STATUS_FLOW.indexOf(from);
  const toIndex = ORDER_STATUS_FLOW.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  return toIndex === fromIndex + 1;
}

/** Every status the admin is allowed to move this order to right now. */
export function allowedStatusTransitions(from: OrderStatus): OrderStatus[] {
  return (["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"] as const).filter(
    (candidate) => isValidStatusTransition(from, candidate),
  );
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === "PENDING" ||
    value === "CONFIRMED" ||
    value === "SHIPPING" ||
    value === "DELIVERED" ||
    value === "CANCELLED"
  );
}

/** Cancelled orders must not count toward revenue. */
export function isRevenueBearingStatus(status: OrderStatus): boolean {
  return status !== "CANCELLED";
}

export function sumOrderItems(
  items: ReadonlyArray<{ unitPrice: number; qty: number }>,
): number {
  return round2(
    items.reduce((total, item) => total + item.unitPrice * item.qty, 0),
  );
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
