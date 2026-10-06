import { prisma } from "@/src/lib/db";
import { mapColor } from "@/src/lib/admin/mappers";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { colorInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.color.findUnique({ where: { id } });
  if (!row) throw notFound("Colour not found");
  return mapColor(row);
});

export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, colorInput);
  const row = await prisma.color.update({ where: { id }, data: input });
  return mapColor(row);
});

/** Refused while variants or images still reference the colour. */
export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const usedBy = await prisma.product.count({
    where: { OR: [{ variants: { some: { colorId: id } } }, { images: { some: { colorId: id } } }] },
  });
  if (usedBy > 0) {
    throw conflict(`Cannot delete: ${usedBy} product${usedBy === 1 ? "" : "s"} still use this colour`);
  }
  await prisma.color.delete({ where: { id } });
  return { id };
});
