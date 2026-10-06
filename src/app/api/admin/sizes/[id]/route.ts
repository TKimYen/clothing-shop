import { prisma } from "@/src/lib/db";
import { mapSize } from "@/src/lib/admin/mappers";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { sizeInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.size.findUnique({ where: { id } });
  if (!row) throw notFound("Size not found");
  return mapSize(row);
});

export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, sizeInput);
  const row = await prisma.size.update({ where: { id }, data: input });
  return mapSize(row);
});

export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const usedBy = await prisma.product.count({ where: { variants: { some: { sizeId: id } } } });
  if (usedBy > 0) {
    throw conflict(`Cannot delete: ${usedBy} product${usedBy === 1 ? "" : "s"} still use this size`);
  }
  await prisma.size.delete({ where: { id } });
  return { id };
});
