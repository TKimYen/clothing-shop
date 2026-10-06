import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapColor } from "@/src/lib/admin/mappers";
import {
  adminHandler,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { colorInput } from "@/src/lib/admin/validators";

/** GET /api/admin/colors?search&sort=name|hexCode&dir */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "name");
  const where: Prisma.ColorWhereInput = query.search
    ? { OR: [{ name: insensitive(query.search) }, { hexCode: insensitive(query.search) }] }
    : {};
  const sort = pickSort(query.sort, ["name", "hexCode"] as const, "name");

  const result = await paginate(
    query,
    () => prisma.color.count({ where }),
    (skip, take) =>
      prisma.color.findMany({
        where,
        orderBy: [{ [sort]: query.direction }, { id: "asc" }],
        skip,
        take,
      }),
  );
  return { ...result, items: result.items.map(mapColor) };
});

export const POST = adminHandler(async (request) => {
  const input = await readJson(request, colorInput);
  const row = await prisma.color.create({ data: input });
  return mapColor(row);
});
