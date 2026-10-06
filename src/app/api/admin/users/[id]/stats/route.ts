import { prisma } from "@/src/lib/db";
import { adminHandler, notFound } from "@/src/lib/admin/server";

type Params = { id: string };

/** GET /api/admin/users/:id/stats — cancelled orders are excluded from spend. */
export const GET = adminHandler<Params>(async (_request, { id }) => {
  const exists = await prisma.user.count({ where: { id } });
  if (!exists) throw notFound("User not found");

  const [orderCount, pendingCount, spend] = await Promise.all([
    prisma.order.count({ where: { userId: id } }),
    prisma.order.count({ where: { userId: id, status: "PENDING" } }),
    prisma.order.aggregate({
      where: { userId: id, status: { not: "CANCELLED" } },
      _sum: { totalAmount: true },
    }),
  ]);
  return {
    orderCount,
    pendingCount,
    lifetimeSpend: Number(spend._sum.totalAmount ?? 0),
  };
});
