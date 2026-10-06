import { prisma } from "@/src/lib/db";
import { mapCoupon } from "@/src/lib/admin/mappers";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { couponInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.coupon.findUnique({ where: { id } });
  if (!row) throw notFound("Coupon not found");
  return mapCoupon(row);
});

/** `usedCount` is not part of the input, so it is preserved. */
export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, couponInput);
  const row = await prisma.coupon.update({ where: { id }, data: input });
  return mapCoupon(row);
});

/** Orders keep a reference to the coupon they used, so used coupons cannot be deleted. */
export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const usedBy = await prisma.order.count({ where: { couponId: id } });
  if (usedBy > 0) {
    throw conflict(
      `Cannot delete: ${usedBy} order${usedBy === 1 ? "" : "s"} used this coupon. Deactivate it instead.`,
    );
  }
  await prisma.coupon.delete({ where: { id } });
  return { id };
});
