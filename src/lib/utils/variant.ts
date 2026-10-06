import type { Variant } from "@/src/types";

/**
 * `ignoreId` is optional, and a row that has not been persisted yet has no `id`.
 * Comparing the two directly would make `undefined !== undefined` false and
 * silently disable the whole duplicate check, so absence is handled explicitly.
 */
function isIgnored(id: string | undefined, ignoreId: string | undefined): boolean {
  if (ignoreId === undefined) return false;
  return id === ignoreId;
}

/**
 * The only fields the uniqueness check needs. Callers pass freshly-typed form
 * rows whose `id` is optional, so it is optional here too.
 */
type VariantIdentity = {
  id?: string;
  sizeId: string;
  colorId: string;
};

/**
 * A product may not contain two variants with the same
 * (sizeId + colorId) combination.
 *
 * `ignoreId` excludes the variant currently being edited so saving an
 * unchanged row does not collide with itself.
 */
export function isDuplicateVariant(
  variants: readonly VariantIdentity[],
  candidate: { sizeId: string; colorId: string },
  ignoreId?: string,
): boolean {
  return variants.some(
    (variant) =>
      !isIgnored(variant.id, ignoreId) &&
      variant.sizeId === candidate.sizeId &&
      variant.colorId === candidate.colorId,
  );
}

/**
 * Index of the first row that duplicates `candidate`, or -1.
 * Used by the variants editor to point at the offending row.
 */
export function findDuplicateVariantIndex(
  variants: readonly VariantIdentity[],
  candidate: { sizeId: string; colorId: string },
  ignoreId?: string,
): number {
  return variants.findIndex(
    (variant) =>
      !isIgnored(variant.id, ignoreId) &&
      variant.sizeId === candidate.sizeId &&
      variant.colorId === candidate.colorId,
  );
}

/** Total sellable units across a product's variants. */
export function totalStock(variants: readonly Pick<Variant, "stockQuantity">[]): number {
  return variants.reduce((total, variant) => total + variant.stockQuantity, 0);
}

/** Lowest stock level across a product's variants (0 when there are none). */
export function lowestStock(variants: readonly Pick<Variant, "stockQuantity">[]): number {
  if (variants.length === 0) return 0;
  return variants.reduce(
    (lowest, variant) => Math.min(lowest, variant.stockQuantity),
    Number.POSITIVE_INFINITY,
  );
}
