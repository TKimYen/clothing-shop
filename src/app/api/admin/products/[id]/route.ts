import { prisma } from "@/src/lib/db";
import { mapProduct, productInclude } from "@/src/lib/admin/mappers";
import { updateProduct } from "@/src/lib/admin/products";
import { adminHandler, conflict, notFound, readJson } from "@/src/lib/admin/server";
import { productInput } from "@/src/lib/admin/validators";

type Params = { id: string };

export const GET = adminHandler<Params>(async (_request, { id }) => {
  const row = await prisma.product.findUnique({ where: { id }, include: productInclude });
  if (!row) throw notFound("Product not found");
  return mapProduct(row);
});

export const PUT = adminHandler<Params>(async (request, { id }) => {
  const input = await readJson(request, productInput);
  await updateProduct(id, input);
  const row = await prisma.product.findUniqueOrThrow({ where: { id }, include: productInclude });
  return mapProduct(row);
});

/** Variants and images cascade; a product that was already ordered is refused. */
export const DELETE = adminHandler<Params>(async (_request, { id }) => {
  const ordered = await prisma.orderItem.count({ where: { variant: { productId: id } } });
  if (ordered > 0) {
    throw conflict("This product already appears in orders. Deactivate it instead of deleting.");
  }
  await prisma.product.delete({ where: { id } });
  return { id };
});
