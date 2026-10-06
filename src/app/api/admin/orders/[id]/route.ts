import { prisma } from "@/src/lib/db";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler, notFound } from "@/src/lib/admin/server";

type Params = { id: string };

/** GET /api/admin/orders/:id — orders are read-only apart from their status. */
export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!row) throw notFound("Order not found");
  return mapOrder(row);
});
