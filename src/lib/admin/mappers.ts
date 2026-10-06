/**
 * Prisma row -> admin UI DTO. The shapes match `src/types`, so the client
 * services can return API data to the pages unchanged.
 */
import { Prisma } from "@/src/generated/prisma/client";
import type {
  Category,
  Collection,
  Color,
  Coupon,
  Order,
  Product,
  Size,
  StockImport,
  User,
} from "@/src/types";
import { toIso, toNumber } from "./server";

export const mapCategory = (row: { id: string; name: string; slug: string }): Category => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
});

export const mapCollection = (row: Prisma.CollectionModel): Collection => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  season: row.season,
  year: row.year,
  description: row.description ?? "",
  bannerUrl: row.bannerUrl ?? "",
  startsAt: toIso(row.startsAt) ?? "",
  isActive: row.isActive,
});

export const mapSize = (row: Prisma.SizeModel): Size => ({
  id: row.id,
  label: row.label,
  sortOrder: row.sortOrder,
});

export const mapColor = (row: Prisma.ColorModel): Color => ({
  id: row.id,
  name: row.name,
  hexCode: row.hexCode,
});

export const mapCoupon = (row: Prisma.CouponModel): Coupon => ({
  id: row.id,
  code: row.code,
  description: row.description ?? "",
  discountType: row.discountType,
  discountValue: Number(row.discountValue),
  minOrderAmount: Number(row.minOrderAmount),
  maxDiscountAmount: toNumber(row.maxDiscountAmount),
  maxUses: row.maxUses,
  usedCount: row.usedCount,
  startsAt: row.startsAt.toISOString(),
  endsAt: row.endsAt.toISOString(),
  isActive: row.isActive,
});

/* --------------------------------- Product -------------------------------- */

export const productInclude = {
  variants: { orderBy: [{ size: { sortOrder: "asc" } }, { sku: "asc" }] },
  images: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export const mapProduct = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description ?? "",
  price: Number(row.price),
  salePrice: toNumber(row.salePrice),
  saleStartsAt: toIso(row.saleStartsAt),
  saleEndsAt: toIso(row.saleEndsAt),
  categoryId: row.categoryId,
  collectionId: row.collectionId ?? "",
  isActive: row.isActive,
  createdAt: row.createdAt.toISOString(),
  variants: row.variants.map((variant) => ({
    id: variant.id,
    productId: variant.productId,
    sizeId: variant.sizeId,
    colorId: variant.colorId,
    sku: variant.sku,
    stockQuantity: variant.stockQuantity,
  })),
  images: row.images.map((image) => ({
    id: image.id,
    productId: image.productId,
    colorId: image.colorId,
    url: image.url,
    altText: image.altText ?? "",
    sortOrder: image.sortOrder,
  })),
});

/* ---------------------------------- Order --------------------------------- */

export const orderInclude = {
  coupon: { select: { code: true } },
  items: { include: { variant: { select: { productId: true } } } },
  payment: true,
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export const mapOrder = (row: OrderRow): Order => ({
  id: row.id,
  orderCode: row.orderCode,
  createdAt: row.createdAt.toISOString(),
  status: row.status,
  userId: row.userId,
  recipientName: row.recipientName,
  recipientPhone: row.recipientPhone,
  shippingAddress: row.shippingAddress,
  note: row.note ?? "",
  couponCode: row.coupon?.code ?? null,
  items: row.items.map((item) => ({
    id: item.id,
    productId: item.variant.productId,
    productName: item.productName,
    sizeLabel: item.sizeLabel,
    colorName: item.colorName,
    unitPrice: Number(item.unitPrice),
    qty: item.quantity,
  })),
  subtotal: Number(row.subtotal),
  discount: Number(row.discountAmount),
  shippingFee: Number(row.shippingFee),
  total: Number(row.totalAmount),
  payment: {
    method: row.payment?.method ?? "—",
    status: row.payment?.status ?? "UNPAID",
    transactionId: row.payment?.transactionId ?? "",
    paidAt: toIso(row.payment?.paidAt),
  },
});

/* ---------------------------------- User ---------------------------------- */

export const userInclude = {
  addresses: { orderBy: [{ isDefault: "desc" }, { id: "asc" }] },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export const mapUser = (row: UserRow): User => ({
  id: row.id,
  email: row.email,
  fullName: row.fullName,
  phone: row.phone ?? "",
  role: row.role,
  createdAt: row.createdAt.toISOString(),
  addresses: row.addresses.map((address) => ({
    id: address.id,
    recipientName: address.recipientName,
    phone: address.phone,
    fullAddress: address.fullAddress,
    isDefault: address.isDefault,
  })),
});

/* ------------------------------ Stock import ------------------------------ */

export const stockImportInclude = {
  createdBy: { select: { fullName: true } },
  items: {
    orderBy: { variant: { sku: "asc" } },
    include: {
      variant: {
        select: {
          sku: true,
          productId: true,
          product: { select: { name: true } },
          size: { select: { label: true } },
          color: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.StockImportInclude;

type StockImportRow = Prisma.StockImportGetPayload<{ include: typeof stockImportInclude }>;

export const mapStockImport = (row: StockImportRow): StockImport => ({
  id: row.id,
  code: row.code,
  note: row.note ?? "",
  createdAt: row.createdAt.toISOString(),
  createdByName: row.createdBy?.fullName ?? null,
  items: row.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    sku: item.variant.sku,
    productId: item.variant.productId,
    productName: item.variant.product.name,
    sizeLabel: item.variant.size.label,
    colorName: item.variant.color.name,
    quantity: item.quantity,
    unitCost: toNumber(item.unitCost),
  })),
});
