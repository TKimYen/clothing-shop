/**
 * Server-side validation of the JSON bodies the admin UI sends. These mirror
 * the `*Input` types in `src/types`; the form schemas in `src/lib/schemas`
 * validate the raw form strings, these validate the already-coerced payload
 * so the API stays safe when called directly.
 */
import { z } from "zod";

/** Absolute URL, or a site-relative path such as `/images/products/a.jpg`. */
const urlOrPath = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => /^\/(?!\/)\S*$/.test(value) || z.url().safeParse(value).success, {
    message: "Enter a valid URL or a path starting with /",
  });

const text = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

const optionalText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .nullish()
    .transform((value) => (value ? value : null));

const slug = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and single hyphens");

const money = (label: string) =>
  z.number({ error: `${label} must be a number` }).finite().min(0, `${label} must be at least 0`);

const date = (label: string) =>
  z.iso.datetime({ offset: true, error: `${label} must be a valid date` }).transform((value) => new Date(value));

const optionalDate = (label: string) =>
  z
    .union([date(label), z.null(), z.literal("")])
    .optional()
    .transform((value) => (value instanceof Date ? value : null));

export const categoryInput = z.object({
  name: text("Name", 120),
  slug,
});

export const collectionInput = z.object({
  name: text("Name", 120),
  slug,
  season: z.enum(["SPRING_SUMMER", "FALL_WINTER"], { error: "Season is required" }),
  year: z.number().int().min(2000).max(2100),
  description: optionalText(1000),
  bannerUrl: z
    .union([urlOrPath, z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  startsAt: optionalDate("Start date"),
  isActive: z.boolean(),
});

export const sizeInput = z.object({
  label: text("Label", 20),
  sortOrder: z.number().int().min(0).max(999),
});

export const colorInput = z.object({
  name: text("Name", 60),
  hexCode: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a hex colour such as #18212B"),
});

export const couponInput = z
  .object({
    code: text("Code", 40).transform((value) => value.toUpperCase()),
    description: optionalText(500),
    discountType: z.enum(["PERCENT", "FIXED"]),
    discountValue: money("Discount value"),
    minOrderAmount: money("Minimum order amount"),
    maxDiscountAmount: money("Maximum discount amount").nullable(),
    maxUses: z.number().int().min(1).nullable(),
    startsAt: date("Start date"),
    endsAt: date("End date"),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "PERCENT" && value.discountValue > 100) {
      ctx.addIssue({ code: "custom", path: ["discountValue"], message: "Must be between 0 and 100" });
    }
    if (
      value.discountType === "FIXED" &&
      value.maxDiscountAmount !== null &&
      value.maxDiscountAmount < value.discountValue
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscountAmount"],
        message: "Cannot be lower than the discount value",
      });
    }
    if (value.endsAt <= value.startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "End date must be after the start date" });
    }
  });

const variantInput = z.object({
  id: z.string().optional(),
  sizeId: text("Size", 60),
  colorId: text("Colour", 60),
  sku: text("SKU", 80),
  // No stockQuantity: stock is never set from the product form (see stockImportInput).
});

const imageInput = z.object({
  id: z.string().optional(),
  colorId: z
    .string()
    .nullish()
    .transform((value) => (value ? value : null)),
  url: urlOrPath.refine((value) => value.length > 0, "Image URL is required"),
  altText: optionalText(160),
  sortOrder: z.number().int().min(0).max(999),
});

export const productInput = z
  .object({
    name: text("Name", 160),
    slug,
    description: optionalText(4000),
    price: money("Price"),
    salePrice: money("Sale price").nullable(),
    saleStartsAt: optionalDate("Sale start"),
    saleEndsAt: optionalDate("Sale end"),
    categoryId: text("Category", 60),
    collectionId: z
      .string()
      .nullish()
      .transform((value) => (value ? value : null)),
    isActive: z.boolean(),
    variants: z.array(variantInput).min(1, "Add at least one variant"),
    images: z.array(imageInput).default([]),
  })
  .superRefine((value, ctx) => {
    const combos = new Set<string>();
    const skus = new Set<string>();
    value.variants.forEach((variant, index) => {
      const combo = `${variant.sizeId}:${variant.colorId}`;
      if (combos.has(combo)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "colorId"],
          message: "Duplicate size and colour combination",
        });
      }
      combos.add(combo);
      const sku = variant.sku.toLowerCase();
      if (skus.has(sku)) {
        ctx.addIssue({ code: "custom", path: ["variants", index, "sku"], message: "SKU must be unique" });
      }
      skus.add(sku);
    });
    if (value.salePrice !== null && value.salePrice >= value.price) {
      ctx.addIssue({ code: "custom", path: ["salePrice"], message: "Sale price must be lower than the price" });
    }
    const hasStart = value.saleStartsAt !== null;
    const hasEnd = value.saleEndsAt !== null;
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: "custom",
        path: ["saleEndsAt"],
        message: "Set both a sale start and a sale end, or neither",
      });
    }
    if (value.saleStartsAt && value.saleEndsAt && value.saleEndsAt <= value.saleStartsAt) {
      ctx.addIssue({ code: "custom", path: ["saleEndsAt"], message: "Sale end must be after the sale start" });
    }
  });

export const orderStatusInput = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "SHIPPING", "DELIVERED", "CANCELLED"]),
});

export const roleInput = z.object({
  role: z.enum(["ADMIN", "CUSTOMER"]),
});

/** Phiếu nhập hàng: the only way to increase a variant's stock. */
export const stockImportInput = z
  .object({
    note: optionalText(500),
    items: z
      .array(
        z.object({
          variantId: text("Variant", 60),
          quantity: z
            .number({ error: "Quantity must be a number" })
            .int("Quantity must be a whole number")
            .min(1, "Quantity must be at least 1")
            .max(100_000, "Quantity is too large"),
          unitCost: money("Unit cost").nullable().default(null),
        }),
      )
      .min(1, "Add at least one line with a quantity"),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.variantId)) {
        ctx.addIssue({ code: "custom", path: ["items", index, "variantId"], message: "Variant listed twice" });
      }
      seen.add(item.variantId);
    });
  });
