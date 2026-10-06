import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapStockImport, stockImportInclude } from "@/src/lib/admin/mappers";
import { createStockImport } from "@/src/lib/admin/products";
import { adminHandler, insensitive, paginate, parseListQuery, readJson } from "@/src/lib/admin/server";
import { stockImportInput } from "@/src/lib/admin/validators";

/**
 * GET /api/admin/stock-imports?productId&search (code, note)&page&pageSize&dir
 *
 * With `productId`, only imports touching that product are returned and each
 * import's lines are narrowed to that product's variants.
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "createdAt");
  const { productId } = query.filters;

  const where: Prisma.StockImportWhereInput = {
    ...(query.search
      ? { OR: [{ code: insensitive(query.search) }, { note: insensitive(query.search) }] }
      : {}),
    ...(productId ? { items: { some: { variant: { productId } } } } : {}),
  };
  const include = productId
    ? { ...stockImportInclude, items: { ...stockImportInclude.items, where: { variant: { productId } } } }
    : stockImportInclude;

  const result = await paginate(
    query,
    () => prisma.stockImport.count({ where }),
    (skip, take) =>
      prisma.stockImport.findMany({
        where,
        include,
        orderBy: [{ createdAt: query.direction === "asc" ? "asc" : "desc" }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapStockImport) };
});

/**
 * POST /api/admin/stock-imports  body: { note, items: [{ variantId, quantity, unitCost }] }
 *
 * The only way to increase stock: records the import and adds each quantity
 * to its variant in a single transaction. Imports are immutable once created.
 */
export const POST = adminHandler(async (request, _params, admin) => {
  const input = await readJson(request, stockImportInput);
  const id = await createStockImport(input, admin?.id ?? null);
  const row = await prisma.stockImport.findUniqueOrThrow({ where: { id }, include: stockImportInclude });
  return mapStockImport(row);
});
