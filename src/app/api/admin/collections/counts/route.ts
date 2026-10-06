import { prisma } from "@/src/lib/db";
import { adminHandler } from "@/src/lib/admin/server";

/** GET /api/admin/collections/counts -> { [collectionId]: productCount } */
export const GET = adminHandler(async () => {
  const rows = await prisma.collection.findMany({
    select: { id: true, _count: { select: { products: true } } },
  });
  return Object.fromEntries(rows.map((row) => [row.id, row._count.products]));
});
