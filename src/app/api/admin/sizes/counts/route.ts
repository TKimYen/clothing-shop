import { prisma } from "@/src/lib/db";
import { adminHandler } from "@/src/lib/admin/server";

/** GET /api/admin/sizes/counts -> { [sizeId]: number of products using the size } */
export const GET = adminHandler(async () => {
  const rows = await prisma.productVariant.groupBy({ by: ["sizeId", "productId"] });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.sizeId] = (counts[row.sizeId] ?? 0) + 1;
  return counts;
});
