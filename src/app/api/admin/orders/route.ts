import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapOrder, orderInclude } from "@/src/lib/admin/mappers";
import { adminHandler, insensitive, paginate, parseListQuery, pickSort } from "@/src/lib/admin/server";
import { isOrderStatus } from "@/src/lib/utils/order";

const SORT_FIELDS = {
  createdAt: "createdAt",
  orderCode: "orderCode",
  recipientName: "recipientName",
  total: "totalAmount",
  status: "status",
} as const;

/**
 * GET /api/admin/orders
 *   ?search (orderCode, recipient name/phone, customer name/email)
 *   &status&userId&hasCoupon=true|false
 *   &sort=createdAt|orderCode|recipientName|total|status&dir
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "createdAt");
  const { status, userId, hasCoupon } = query.filters;

  const where: Prisma.OrderWhereInput = {
    ...(query.search
      ? {
          OR: [
            { orderCode: insensitive(query.search) },
            { recipientName: insensitive(query.search) },
            { recipientPhone: insensitive(query.search) },
            { user: { fullName: insensitive(query.search) } },
            { user: { email: insensitive(query.search) } },
          ],
        }
      : {}),
    ...(status && isOrderStatus(status) ? { status } : {}),
    ...(userId ? { userId } : {}),
    ...(hasCoupon === "true" ? { couponId: { not: null } } : {}),
    ...(hasCoupon === "false" ? { couponId: null } : {}),
  };
  const sort = pickSort(query.sort, Object.keys(SORT_FIELDS) as (keyof typeof SORT_FIELDS)[], "createdAt");

  const result = await paginate(
    query,
    () => prisma.order.count({ where }),
    (skip, take) =>
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: [{ [SORT_FIELDS[sort]]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapOrder) };
});
