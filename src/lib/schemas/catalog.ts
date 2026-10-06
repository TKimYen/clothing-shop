import { z } from "zod";
import type {
  Category,
  CategoryInput,
  Collection,
  CollectionInput,
  Color,
  ColorInput,
  Size,
  SizeInput,
} from "@/src/types";
import {
  requiredText,
  optionalText,
  slugSchema,
  integerString,
  requiredDateTime,
  hexColorSchema,
  urlString,
} from "./shared";

/* -------------------------------------------------------------------------- */
/* Category                                                                    */
/* -------------------------------------------------------------------------- */

export const categoryFormSchema = z.object({
  name: requiredText("Name", 120),
  slug: slugSchema,
});
export type CategoryFormValues = z.input<typeof categoryFormSchema>;

export function toCategoryInput(values: z.output<typeof categoryFormSchema>): CategoryInput {
  return { name: values.name, slug: values.slug };
}

export function toCategoryFormDefaultValues(category: Category | null): CategoryFormValues {
  return { name: category?.name ?? "", slug: category?.slug ?? "" };
}

/* -------------------------------------------------------------------------- */
/* Collection                                                                  */
/* -------------------------------------------------------------------------- */

export const collectionFormSchema = z.object({
  name: requiredText("Name", 120),
  slug: slugSchema,
  season: z.enum(["SPRING_SUMMER", "FALL_WINTER"], { error: "Season is required" }),
  year: integerString("Year", 2000, 2100),
  description: optionalText(1000),
  bannerUrl: z.union([urlString("Banner URL"), z.literal("")]),
  startsAt: requiredDateTime("Start date"),
  isActive: z.boolean(),
});
export type CollectionFormValues = z.input<typeof collectionFormSchema>;

export function toCollectionInput(
  values: z.output<typeof collectionFormSchema>,
): CollectionInput {
  return {
    name: values.name,
    slug: values.slug,
    season: values.season,
    year: values.year,
    description: values.description,
    bannerUrl: values.bannerUrl,
    startsAt: values.startsAt,
    isActive: values.isActive,
  };
}

export function toCollectionFormDefaultValues(
  collection: Collection | null,
): CollectionFormValues {
  return {
    name: collection?.name ?? "",
    slug: collection?.slug ?? "",
    season: collection?.season ?? ("" as Collection["season"]),
    year: collection ? String(collection.year) : "",
    description: collection?.description ?? "",
    bannerUrl: collection?.bannerUrl ?? "",
    startsAt: collection ? collection.startsAt.slice(0, 16) : "",
    isActive: collection?.isActive ?? true,
  };
}

/* -------------------------------------------------------------------------- */
/* Size                                                                        */
/* -------------------------------------------------------------------------- */

export const sizeFormSchema = z.object({
  label: requiredText("Label", 20),
  sortOrder: integerString("Sort order", 0, 999),
});
export type SizeFormValues = z.input<typeof sizeFormSchema>;

export function toSizeInput(values: z.output<typeof sizeFormSchema>): SizeInput {
  return { label: values.label, sortOrder: values.sortOrder };
}

export function toSizeFormDefaultValues(size: Size | null): SizeFormValues {
  return { label: size?.label ?? "", sortOrder: size ? String(size.sortOrder) : "" };
}

/* -------------------------------------------------------------------------- */
/* Color                                                                       */
/* -------------------------------------------------------------------------- */

export const colorFormSchema = z.object({
  name: requiredText("Name", 60),
  hexCode: hexColorSchema,
});
export type ColorFormValues = z.input<typeof colorFormSchema>;

export function toColorInput(values: z.output<typeof colorFormSchema>): ColorInput {
  return { name: values.name, hexCode: values.hexCode };
}

export function toColorFormDefaultValues(color: Color | null): ColorFormValues {
  return { name: color?.name ?? "", hexCode: color?.hexCode ?? "#18212B" };
}
