import { prisma } from "@/src/lib/db";
import type { Prisma } from "@/src/generated/prisma/client";
import { mapCollection } from "@/src/lib/admin/mappers";
import {
  adminHandler,
  boolFilter,
  insensitive,
  paginate,
  parseListQuery,
  pickSort,
  readJson,
} from "@/src/lib/admin/server";
import { collectionInput } from "@/src/lib/admin/validators";

const SEASONS = ["SPRING_SUMMER", "FALL_WINTER"] as const;

/**
 * GET /api/admin/collections
 *   ?search&season=SPRING_SUMMER|FALL_WINTER&year&isActive=true|false
 *   &sort=name|season|year|startsAt|products&dir
 */
export const GET = adminHandler(async (request) => {
  const query = parseListQuery(request, "name");
  const { season, year, isActive } = query.filters;
  const yearNumber = Number.parseInt(year ?? "", 10);

  const where: Prisma.CollectionWhereInput = {
    ...(query.search
      ? { OR: [{ name: insensitive(query.search) }, { slug: insensitive(query.search) }] }
      : {}),
    ...(SEASONS.includes(season as (typeof SEASONS)[number])
      ? { season: season as (typeof SEASONS)[number] }
      : {}),
    ...(Number.isFinite(yearNumber) ? { year: yearNumber } : {}),
    ...(boolFilter(isActive) !== undefined ? { isActive: boolFilter(isActive) } : {}),
  };

  const sort = pickSort(
    query.sort,
    ["name", "slug", "season", "year", "startsAt", "products"] as const,
    "name",
  );
  const orderBy: Prisma.CollectionOrderByWithRelationInput[] =
    sort === "products"
      ? [{ products: { _count: query.direction } }, { id: "asc" }]
      : [{ [sort]: query.direction }, { id: "asc" }];

  const result = await paginate(
    query,
    () => prisma.collection.count({ where }),
    (skip, take) => prisma.collection.findMany({ where, orderBy, skip, take }),
  );
  return { ...result, items: result.items.map(mapCollection) };
});

export const POST = adminHandler(async (request) => {
  const input = await readJson(request, collectionInput);
  const row = await prisma.collection.create({ data: input });
  return mapCollection(row);
});
