import { prisma } from "@/src/lib/db";
import { mapCategory } from "@/src/lib/admin/mappers";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { categoryInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.category.findUnique({ where: { id } });
  if (!row) throw notFound("Category not found");
  return mapCategory(row);
});

export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, categoryInput);
  const row = await prisma.category.update({ where: { id }, data: input });
  return mapCategory(row);
});

/** Refused while any product still belongs to the category. */
export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const usedBy = await prisma.product.count({ where: { categoryId: id } });
  if (usedBy > 0) {
    throw conflict(`Cannot delete: ${usedBy} product${usedBy === 1 ? "" : "s"} still use this category`);
  }
  await prisma.category.delete({ where: { id } });
  return { id };
});
