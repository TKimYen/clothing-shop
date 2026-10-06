import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapCategory } from "@/src/lib/admin/mappers";
import {
  adminHandler,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { categoryInput } from "@/src/lib/admin/validators";

/** GET /api/admin/categories?page&pageSize&search&sort=name|slug&dir */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "name");
  const where: Prisma.CategoryWhereInput = query.search
    ? { OR: [{ name: insensitive(query.search) }, { slug: insensitive(query.search) }] }
    : {};
  const sort = pickSort(query.sort, ["name", "slug"] as const, "name");

  const result = await paginate(
    query,
    () => prisma.category.count({ where }),
    (skip, take) =>
      prisma.category.findMany({
        where,
        orderBy: [{ [sort]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapCategory) };
});

/** POST /api/admin/categories  body: { name, slug } */
export const POST = adminHandler(async (request) => {
  const input = await readJson(request, categoryInput);
  const row = await prisma.category.create({ data: input });
  return mapCategory(row);
});
