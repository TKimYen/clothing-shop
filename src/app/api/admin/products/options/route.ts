import { prisma } from "@/src/lib/db";
import { adminHandler } from "@/src/lib/admin/server";

/** GET /api/admin/products/options -> reference data for the product form selects. */
export const GET = adminHandler(async () => {
  const [categories, collections, sizes, colors] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.size.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, label: true } }),
    prisma.color.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, hexCode: true } }),
  ]);
  return { categories, collections, sizes, colors };
});
