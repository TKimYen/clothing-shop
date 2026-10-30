import type { OrderStatus, Prisma } from "@/src/generated/prisma/client";

/**
 * Cancel an order and put its items back in stock, at most once.
 *
 * The status check and the update are a single conditional UPDATE, so when two
 * requests cancel the same order at the same time only one of them gets
 * count = 1 and restocks; the other gets false. Server-only (uses Prisma).
 */
export async function cancelOrderAndRestock(
  tx: Prisma.TransactionClient,
  orderId: string,
  fromStatuses: OrderStatus[],
): Promise<boolean> {
  const cancelled = await tx.order.updateMany({
    where: { id: orderId, status: { in: fromStatuses } },
    data: { status: "CANCELLED" },
  });
  if (cancelled.count === 0) return false;

  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true },
  });
  for (const item of items) {
    await tx.productVariant.update({
      where: { id: item.variantId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }
  return true;
}
