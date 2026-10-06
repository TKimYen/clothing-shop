import { prisma } from "@/src/lib/db";
import { adminHandler } from "@/src/lib/admin/server";

/** GET /api/admin/colors/counts -> { [colorId]: number of products using the colour } */
export const GET = adminHandler(async () => {
  const rows = await prisma.productVariant.groupBy({ by: ["colorId", "productId"] });
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.colorId] = (counts[row.colorId] ?? 0) + 1;
  return counts;
});
