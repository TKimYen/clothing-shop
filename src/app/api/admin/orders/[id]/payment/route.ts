import { prisma } from "@/src/lib/db";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler, badRequest, notFound, readJson } from "@/src/lib/admin/server";
import { paymentStatusInput } from "@/src/lib/admin/validators";

type Params = { id: string };

/** Confirm a payment independently from the fulfilment status. */
export const PATCH = adminHandler<Params>(async (request, { id }) => {
  const { status, transactionId } = await readJson(request, paymentStatusInput);
  const current = await prisma.order.findUnique({
    where: { id },
    select: { payment: { select: { id: true, status: true } } },
  });

  if (!current) throw notFound("Order not found");
  if (!current.payment) throw badRequest("This order has no payment record");
  const row = await prisma.order.update({
    where: { id },
    data: {
      payment: {
        update: {
          status,
          paidAt: status === "PAID" ? new Date() : null,
          transactionId: status === "PAID" ? transactionId : null,
        },
      },
    },
    include: orderInclude,
  });

  return mapOrder(row);
});
