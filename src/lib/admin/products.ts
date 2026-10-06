import { prisma } from "@/src/lib/db";
import type { z } from "zod";
import { badRequest, conflict, notFound } from "./server";
import type { productInput, stockImportInput } from "./validators";

type ProductInput = z.output<typeof productInput>;
type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Clear error messages for references the client may have gone stale on. */
export async function assertProductReferences(input: ProductInput) {
  const sizeIds = [...new Set(input.variants.map((variant) => variant.sizeId))];
  const colorIds = [
    ...new Set([
      ...input.variants.map((variant) => variant.colorId),
      ...input.images.flatMap((image) => (image.colorId ? [image.colorId] : [])),
    ]),
  ];

  const [category, collection, sizes, colors] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    input.collectionId
      ? prisma.collection.findUnique({ where: { id: input.collectionId }, select: { id: true } })
      : Promise.resolve({ id: null }),
    prisma.size.count({ where: { id: { in: sizeIds } } }),
    prisma.color.count({ where: { id: { in: colorIds } } }),
  ]);

  if (!category) throw badRequest("Unknown category", { categoryId: "Select a category" });
  if (!collection) throw badRequest("Unknown collection", { collectionId: "Select a collection" });
  if (sizes !== sizeIds.length) throw badRequest("Unknown size", { variants: "Unknown size selected" });
  if (colors !== colorIds.length) {
    throw badRequest("Unknown colour", { variants: "Unknown colour selected" });
  }
}

function productData(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    salePrice: input.salePrice,
    saleStartsAt: input.saleStartsAt,
    saleEndsAt: input.saleEndsAt,
    categoryId: input.categoryId,
    collectionId: input.collectionId,
    isActive: input.isActive,
  };
}

function imageRows(productId: string, input: ProductInput) {
  return input.images.map((image, index) => ({
    productId,
    colorId: image.colorId,
    url: image.url,
    altText: image.altText,
    sortOrder: image.sortOrder || index + 1,
  }));
}

export async function createProduct(input: ProductInput) {
  await assertProductReferences(input);
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: productData(input) });
    await tx.productVariant.createMany({
      data: input.variants.map((variant) => ({
        productId: product.id,
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        sku: variant.sku,
        // A new variant always starts empty; stock only comes from a stock import.
        stockQuantity: 0,
      })),
    });
    if (input.images.length > 0) {
      await tx.productImage.createMany({ data: imageRows(product.id, input) });
    }
    return product.id;
  });
}

/**
 * Variants are diffed rather than replaced. A variant with history — it was
 * sold (OrderItem) or received (StockImportItem) — can neither be removed nor
 * change its size/colour, otherwise past orders and stock imports would point
 * at a different item. Stock is never touched here.
 * Images have no inbound references and are simply replaced.
 */
export async function updateProduct(id: string, input: ProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: {
      variants: {
        select: {
          id: true,
          sku: true,
          sizeId: true,
          colorId: true,
          _count: { select: { orderItems: true, stockImportItems: true } },
        },
      },
    },
  });
  if (!existing) throw notFound("Product not found");
  await assertProductReferences(input);

  const existingIds = new Set(existing.variants.map((variant) => variant.id));
  const keptIds = new Set(
    input.variants.flatMap((variant) => (variant.id && existingIds.has(variant.id) ? [variant.id] : [])),
  );
  const removed = existing.variants.filter((variant) => !keptIds.has(variant.id));

  const hasHistory = (variant: (typeof existing.variants)[number]) =>
    variant._count.orderItems > 0 || variant._count.stockImportItems > 0;

  const lockedRemoval = removed.find(hasHistory);
  if (lockedRemoval) {
    throw conflict(
      `Variant ${lockedRemoval.sku} has orders or stock imports and cannot be removed.`,
      { variants: "A removed variant has order or stock-import history" },
    );
  }

  const byId = new Map(existing.variants.map((variant) => [variant.id, variant]));
  for (const variant of input.variants) {
    const before = variant.id ? byId.get(variant.id) : undefined;
    if (
      before &&
      hasHistory(before) &&
      (before.sizeId !== variant.sizeId || before.colorId !== variant.colorId)
    ) {
      throw conflict(
        `Variant ${before.sku} has orders or stock imports, so its size and colour cannot change. Add a new variant instead.`,
        { variants: "Size/colour of a variant with history cannot change" },
      );
    }
  }

  await prisma.$transaction(async (tx: Tx) => {
    await tx.product.update({ where: { id }, data: productData(input) });

    if (removed.length > 0) {
      await tx.productVariant.deleteMany({ where: { id: { in: removed.map((variant) => variant.id) } } });
    }

    // Park kept rows on temporary SKUs first so swapping SKUs or size/colour
    // combinations between two rows cannot trip the unique constraints mid-way.
    const kept = input.variants.filter((variant) => variant.id && keptIds.has(variant.id));
    for (const variant of kept) {
      await tx.productVariant.update({
        where: { id: variant.id },
        data: { sku: `__tmp__${variant.id}` },
      });
    }
    // Updates before creates, so a new row can take over a combination a kept
    // row just gave up.
    const added = input.variants.filter((variant) => !(variant.id && keptIds.has(variant.id)));
    for (const variant of [...kept, ...added]) {
      const data = {
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        sku: variant.sku,
      };
      if (variant.id && keptIds.has(variant.id)) {
        await tx.productVariant.update({ where: { id: variant.id }, data });
      } else {
        await tx.productVariant.create({ data: { ...data, productId: id } });
      }
    }

    await tx.productImage.deleteMany({ where: { productId: id } });
    if (input.images.length > 0) {
      await tx.productImage.createMany({ data: imageRows(id, input) });
    }
  });
  return id;
}

/* -------------------------------------------------------------------------- */
/* Stock import (nhập hàng)                                                    */
/* -------------------------------------------------------------------------- */

type StockImportInput = z.output<typeof stockImportInput>;

function importCode(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const suffix = crypto.randomUUID().slice(0, 4).toUpperCase();
  return `NH${day}-${suffix}`;
}

/**
 * Creates a stock import and adds each line's quantity to its variant, in one
 * transaction. This is the only code path that increases `stockQuantity`.
 */
export async function createStockImport(input: StockImportInput, createdById: string | null) {
  const variantIds = input.items.map((item) => item.variantId);
  const found = await prisma.productVariant.count({ where: { id: { in: variantIds } } });
  if (found !== variantIds.length) {
    throw badRequest("Unknown variant", { items: "One of the variants no longer exists" });
  }

  return prisma.$transaction(async (tx: Tx) => {
    const created = await tx.stockImport.create({
      data: {
        code: importCode(new Date()),
        note: input.note,
        createdById,
        items: {
          create: input.items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
    });
    for (const item of input.items) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
    }
    return created.id;
  });
}
