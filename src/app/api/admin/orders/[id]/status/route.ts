import { prisma } from "@/src/lib/db";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler, badRequest, notFound, readJson } from "@/src/lib/admin/server";
import { orderStatusInput } from "@/src/lib/admin/validators";
import { cancelOrderAndRestock } from "@/src/lib/order-cancel";
import { isValidStatusTransition } from "@/src/lib/utils/order";

type Params = { id: string };

/**
 * PATCH /api/admin/orders/:id/status  body: { status }
 *
 * Only along PENDING -> CONFIRMED -> SHIPPING -> DELIVERED, or -> CANCELLED
 * from any non-final state. A COD order is marked paid when it is delivered.
 */
export const PATCH = adminHandler<Params>(async (request, { id }) => {
  const { status } = await readJson(request, orderStatusInput);
  const row = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({
      where: { id },
      select: {
        status: true,
        payment: { select: { method: true, status: true } },
      },
    });
    if (!current) throw notFound("Order not found");
    if (current.status === status) throw badRequest(`Order is already ${status}`);
    if (!isValidStatusTransition(current.status, status)) {
      throw badRequest(`Cannot move an order from ${current.status} to ${status}`, {
        status: "Transition not allowed",
      });
    }

    if (status === "CANCELLED") {
      // Same conditional UPDATE as the customer cancel, so stock is returned only once
      const cancelled = await cancelOrderAndRestock(tx, id, [current.status]);
      if (!cancelled) throw badRequest("Order status changed meanwhile, please reload");
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
    }

    const markCodPaid =
      status === "DELIVERED" &&
      current.payment?.method === "COD" &&
      current.payment.status === "UNPAID";

    const updatedOrder = await tx.order.update({
      where: { id },
      data: {
        status,
        ...(markCodPaid
          ? { payment: { update: { status: "PAID", paidAt: new Date() } } }
          : {}),
      },
      include: orderInclude,
    });

    return updatedOrder;
  });
  return mapOrder(row);
});
