import { prisma } from "@/src/lib/db";
import { mapCollection } from "@/src/lib/admin/mappers";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { collectionInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.collection.findUnique({ where: { id } });
  if (!row) throw notFound("Collection not found");
  return mapCollection(row);
});

export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, collectionInput);
  const row = await prisma.collection.update({ where: { id }, data: input });
  return mapCollection(row);
});

export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const usedBy = await prisma.product.count({ where: { collectionId: id } });
  if (usedBy > 0) {
    throw conflict(`Cannot delete: ${usedBy} product${usedBy === 1 ? "" : "s"} still use this collection`);
  }
  await prisma.collection.delete({ where: { id } });
  return { id };
});
