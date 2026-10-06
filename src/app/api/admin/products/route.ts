import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapProduct, productInclude } from "@/src/lib/admin/mappers";
import { createProduct } from "@/src/lib/admin/products";
import {
  adminHandler,
  boolFilter,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { productInput } from "@/src/lib/admin/validators";

/**
 * GET /api/admin/products
 *   ?search (name)&categoryId&collectionId&isActive=true|false
 *   &sort=createdAt|name|price|stock&dir
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "createdAt");
  const { categoryId, collectionId, isActive } = query.filters;

  const where: Prisma.ProductWhereInput = {
    ...(query.search ? { name: insensitive(query.search) } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(collectionId ? { collectionId } : {}),
    ...(boolFilter(isActive) !== undefined ? { isActive: boolFilter(isActive) } : {}),
  };
  const sort = pickSort(query.sort, ["createdAt", "name", "price", "stock"] as const, "createdAt");

  const result = await paginate(
    query,
    () => prisma.product.count({ where }),
    async (skip, take) => {
      if (sort !== "stock") {
        return prisma.product.findMany({
          where,
          include: productInclude,
          orderBy: [{ [sort]: query.direction }, { id: "asc" }],
          skip,
          take,
        });
      }
      // Prisma cannot order by a SUM over a relation, so rank ids in memory.
      const stock = await prisma.productVariant.groupBy({
        by: ["productId"],
        where: { product: where },
        _sum: { stockQuantity: true },
      });
      const stockById = new Map(stock.map((row) => [row.productId, row._sum.stockQuantity ?? 0]));
      const ids = await prisma.product.findMany({ where, select: { id: true } });
      const factor = query.direction === "desc" ? -1 : 1;
      const pageIds = ids
        .map((row) => row.id)
        .sort((a, b) => factor * ((stockById.get(a) ?? 0) - (stockById.get(b) ?? 0)) || a.localeCompare(b))
        .slice(skip, skip + take);
      const rows = await prisma.product.findMany({
        where: { id: { in: pageIds } },
        include: productInclude,
      });
      return pageIds.flatMap((id) => rows.filter((row) => row.id === id));
    },
  );
  return { ...result, items: result.items.map(mapProduct) };
});

/** POST /api/admin/products  body: ProductInput (with variants + images) */
export const POST = adminHandler(async (request) => {
  const input = await readJson(request, productInput);
  const id = await createProduct(input);
  const row = await prisma.product.findUniqueOrThrow({ where: { id }, include: productInclude });
  return mapProduct(row);
});
