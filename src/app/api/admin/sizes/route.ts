import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapSize } from "@/src/lib/admin/mappers";
import {
  adminHandler,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { sizeInput } from "@/src/lib/admin/validators";

/** GET /api/admin/sizes?search&sort=sortOrder|label&dir */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "sortOrder");
  const where: Prisma.SizeWhereInput = query.search ? { label: insensitive(query.search) } : {};
  const sort = pickSort(query.sort, ["sortOrder", "label"] as const, "sortOrder");

  const result = await paginate(
    query,
    () => prisma.size.count({ where }),
    (skip, take) =>
      prisma.size.findMany({
        where,
        orderBy: [{ [sort]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapSize) };
});

export const POST = adminHandler(async (request) => {
  const input = await readJson(request, sizeInput);
  const row = await prisma.size.create({ data: input });
  return mapSize(row);
});
