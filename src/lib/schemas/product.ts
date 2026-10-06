import { z } from "zod";
import type { Product, ProductInput } from "@/src/types";
import { requiredText, optionalText, slugSchema, moneyString, optionalMoneyString, integerString, optionalDateTime, urlString } from "./shared";
import { findDuplicateVariantIndex } from "@/src/lib/utils/variant";

export const variantFormSchema = z.object({
  id: z.string().optional(),
  sizeId: requiredText("Size", 60),
  colorId: requiredText("Colour", 60),
  sku: requiredText("SKU", 80),
  /**
   * Display only: stock is read-only in the product form and is never sent.
   * It only increases through a stock import (nhập hàng).
   */
  stockQuantity: z.string(),
});

export const productImageFormSchema = z.object({
  id: z.string().optional(),
  /** Empty string means "shared across every colour" -> `null`. */
  colorId: z.string().trim(),
  url: urlString("Image URL"),
  altText: requiredText("Alt text", 160),
  sortOrder: integerString("Sort order", 0, 999),
});

/** Transforms the raw form shape into the domain `ProductInput`. */
export const productFormSchema = z
  .object({
    name: requiredText("Name", 160),
    slug: slugSchema,
    description: optionalText(4000),
    price: moneyString("Price", 0),
    salePrice: optionalMoneyString("Sale price"),
    saleStartsAt: optionalDateTime("Sale start"),
    saleEndsAt: optionalDateTime("Sale end"),
    categoryId: requiredText("Category", 60),
    collectionId: requiredText("Collection", 60),
    isActive: z.boolean(),
    variants: z.array(variantFormSchema).min(1, "Add at least one variant"),
    images: z.array(productImageFormSchema).default([]),
  })
  .superRefine((values, ctx) => {
    // (productId + sizeId + colorId) must stay unique inside a product.
    const seen: Array<{ sizeId: string; colorId: string }> = [];
    values.variants.forEach((variant, index) => {
      const duplicateIndex = findDuplicateVariantIndex(seen, {
        sizeId: variant.sizeId,
        colorId: variant.colorId,
      });
      if (duplicateIndex !== -1) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "colorId"],
          message: `Duplicate size and colour combination (same as row ${duplicateIndex + 1})`,
        });
      }
      seen.push({ sizeId: variant.sizeId, colorId: variant.colorId });
    });

    const skus = new Set<string>();
    values.variants.forEach((variant, index) => {
      const sku = variant.sku.trim().toLowerCase();
      if (skus.has(sku)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "sku"],
          message: "SKU must be unique within the product",
        });
      }
      skus.add(sku);
    });

    if (values.salePrice !== null && values.salePrice >= values.price) {
      ctx.addIssue({
        code: "custom",
        path: ["salePrice"],
        message: "Sale price must be lower than the price",
      });
    }

    // A sale window needs both ends, and the end must come after the start.
    const hasStart = values.saleStartsAt !== null;
    const hasEnd = values.saleEndsAt !== null;
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: "custom",
        path: [hasStart ? "saleEndsAt" : "saleStartsAt"],
        message: "Set both a sale start and a sale end, or neither",
      });
    }
    if (
      hasStart &&
      hasEnd &&
      new Date(values.saleEndsAt as string) <= new Date(values.saleStartsAt as string)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["saleEndsAt"],
        message: "Sale end must be after the sale start",
      });
    }

    values.images.forEach((image, index) => {
      if (!image.colorId) return;
      const colorUsed = values.variants.some((variant) => variant.colorId === image.colorId);
      if (!colorUsed) {
        ctx.addIssue({
          code: "custom",
          path: ["images", index, "colorId"],
          message: "Images must be attached to a colour used by a variant",
        });
      }
    });
  });

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormOutput = z.output<typeof productFormSchema>;

export function toProductInput(values: ProductFormOutput): ProductInput {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description,
    price: values.price,
    salePrice: values.salePrice,
    saleStartsAt: values.saleStartsAt,
    saleEndsAt: values.saleEndsAt,
    categoryId: values.categoryId,
    collectionId: values.collectionId,
    isActive: values.isActive,
    variants: values.variants.map((variant) => ({
      id: variant.id,
      sizeId: variant.sizeId,
      colorId: variant.colorId,
      sku: variant.sku,
    })),
    images: values.images.map((image) => ({
      id: image.id,
      colorId: image.colorId === "" ? null : image.colorId,
      url: image.url,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
  };
}

/** Flattened row shape used by the editable variants / images tables. */
export type VariantRow = z.input<typeof variantFormSchema> & { rowKey: string };
export type ProductImageRow = z.input<typeof productImageFormSchema> & { rowKey: string };

export function toProductFormDefaultValues(product: Product | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    salePrice: product?.salePrice === null || product?.salePrice === undefined ? "" : String(product.salePrice),
    saleStartsAt: product?.saleStartsAt ? toLocalInput(product.saleStartsAt) : "",
    saleEndsAt: product?.saleEndsAt ? toLocalInput(product.saleEndsAt) : "",
    categoryId: product?.categoryId ?? "",
    collectionId: product?.collectionId ?? "",
    isActive: product?.isActive ?? true,
    variants:
      product?.variants.map((variant) => ({
        id: variant.id,
        sizeId: variant.sizeId,
        colorId: variant.colorId,
        sku: variant.sku,
        stockQuantity: String(variant.stockQuantity),
      })) ?? [{ sizeId: "", colorId: "", sku: "", stockQuantity: "0" }],
    images:
      product?.images.map((image) => ({
        id: image.id,
        colorId: image.colorId ?? "",
        url: image.url,
        altText: image.altText,
        sortOrder: String(image.sortOrder),
      })) ?? [],
  };
}

function toLocalInput(iso: string): string {
  return iso.slice(0, 16);
}
