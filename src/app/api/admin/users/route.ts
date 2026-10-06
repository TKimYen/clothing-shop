import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapUser, userInclude } from "@/src/lib/admin/mappers";
import { adminHandler, insensitive, paginate, parseListQuery, pickSort } from "@/src/lib/admin/server";

/**
 * GET /api/admin/users
 *   ?search (email, full name, phone)&role=ADMIN|CUSTOMER
 *   &sort=fullName|email|phone|role|createdAt&dir
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "fullName");
  const { role } = query.filters;

  const where: Prisma.UserWhereInput = {
    ...(query.search
      ? {
          OR: [
            { email: insensitive(query.search) },
            { fullName: insensitive(query.search) },
            { phone: insensitive(query.search) },
          ],
        }
      : {}),
    ...(role === "ADMIN" || role === "CUSTOMER" ? { role } : {}),
  };
  const sort = pickSort(
    query.sort,
    ["fullName", "email", "phone", "role", "createdAt"] as const,
    "fullName",
  );

  const result = await paginate(
    query,
    () => prisma.user.count({ where }),
    (skip, take) =>
      prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: [{ [sort]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapUser) };
});
