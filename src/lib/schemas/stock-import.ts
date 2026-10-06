import { z } from "zod";
import type { Product, StockImportInput } from "@/src/types";
import { optionalMoneyString, optionalText } from "./shared";

/**
 * One row per variant. An empty quantity means "not received in this import",
 * so the admin only fills in the variants that actually arrived.
 */
export const stockImportFormSchema = z
  .object({
    note: optionalText(500),
    items: z.array(
      z.object({
        variantId: z.string(),
        quantity: z
          .string()
          .trim()
          .regex(/^\d*$/, "Whole number only")
          .transform((value) => (value === "" ? 0 : Number(value)))
          .refine((value) => value <= 100_000, { message: "Quantity is too large" }),
        unitCost: optionalMoneyString("Unit cost"),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    if (!values.items.some((item) => item.quantity > 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Enter a quantity for at least one variant",
      });
    }
  });

export type StockImportFormValues = z.input<typeof stockImportFormSchema>;
export type StockImportFormOutput = z.output<typeof stockImportFormSchema>;

/** Drops the rows left empty: only received variants become import lines. */
export function toStockImportInput(values: StockImportFormOutput): StockImportInput {
  return {
    note: values.note,
    items: values.items
      .filter((item) => item.quantity > 0)
      .map((item) => ({ variantId: item.variantId, quantity: item.quantity, unitCost: item.unitCost })),
  };
}

export function toStockImportFormDefaultValues(product: Product | null): StockImportFormValues {
  return {
    note: "",
    items: (product?.variants ?? []).map((variant) => ({
      variantId: variant.id,
      quantity: "",
      unitCost: "",
    })),
  };
}
