import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapCoupon } from "@/src/lib/admin/mappers";
import {
  adminHandler,
  boolFilter,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { couponInput } from "@/src/lib/admin/validators";

const SORTS = [
  "code",
  "discountType",
  "discountValue",
  "minOrderAmount",
  "usedCount",
  "startsAt",
  "endsAt",
] as const;

/**
 * GET /api/admin/coupons
 *   ?search (code, description)&discountType=PERCENT|FIXED&isActive=true|false
 *   &sort=code|discountType|minOrderAmount|usedCount|startsAt|...&dir
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "code");
  const { discountType, isActive } = query.filters;

  const where: Prisma.CouponWhereInput = {
    ...(query.search
      ? { OR: [{ code: insensitive(query.search) }, { description: insensitive(query.search) }] }
      : {}),
    ...(discountType === "PERCENT" || discountType === "FIXED" ? { discountType } : {}),
    ...(boolFilter(isActive) !== undefined ? { isActive: boolFilter(isActive) } : {}),
  };
  const sort = pickSort(query.sort, SORTS, "code");

  const result = await paginate(
    query,
    () => prisma.coupon.count({ where }),
    (skip, take) =>
      prisma.coupon.findMany({
        where,
        orderBy: [{ [sort]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapCoupon) };
});

/** `usedCount` always starts at 0 and is never accepted from the client. */
export const POST = adminHandler(async (request) => {
  const input = await readJson(request, couponInput);
  const row = await prisma.coupon.create({ data: { ...input, usedCount: 0 } });
  return mapCoupon(row);
});
