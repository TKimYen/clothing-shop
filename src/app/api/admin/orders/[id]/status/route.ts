import { prisma } from "@/src/lib/db";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler, badRequest, notFound, readJson } from "@/src/lib/admin/server";
import { orderStatusInput } from "@/src/lib/admin/validators";
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
  const current = await prisma.order.findUnique({
    where: { id },
    select: { status: true, payment: { select: { method: true, status: true } } },
  });
  if (!current) throw notFound("Order not found");
  if (current.status === status) throw badRequest(`Order is already ${status}`);
  if (!isValidStatusTransition(current.status, status)) {
    throw badRequest(`Cannot move an order from ${current.status} to ${status}`, {
      status: "Transition not allowed",
    });
  }

  const markCodPaid =
    status === "DELIVERED" && current.payment?.method === "COD" && current.payment.status === "UNPAID";

  const row = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(markCodPaid
        ? { payment: { update: { status: "PAID", paidAt: new Date() } } }
        : {}),
    },
    include: orderInclude,
  });
  return mapOrder(row);
});
