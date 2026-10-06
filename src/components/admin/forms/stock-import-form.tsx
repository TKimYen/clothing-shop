"use client";

import * as React from "react";
import { Button, FormRow, Input, Label, Select, Textarea } from "@/src/components/ui";
import { ColorSwatch } from "@/src/components/admin/primitives";
import {
  stockImportFormSchema,
  toStockImportFormDefaultValues,
  toStockImportInput,
} from "@/src/lib/schemas";
import { formatNumber } from "@/src/lib/utils";
import type { Product, ProductOptions, StockImportInput } from "@/src/types";
import { FormDialog } from "./form-dialog";
import { messageOf, useZodForm } from "./use-zod-form";

/**
 * Stock import (phiếu nhập hàng): pick a product, then enter the units received
 * either for every variant at once or per variant. Submitting adds each
 * quantity to the variant's stock — the only way stock goes up.
 *
 * Pass `product` to lock the dialog to one product (product detail page), or
 * `products` to let the admin choose (Stock imports page).
 */
export function StockImportFormDialog({
  open,
  onOpenChange,
  product: fixedProduct,
  products = [],
  options,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  products?: Product[];
  options: ProductOptions;
  onSubmit: (input: StockImportInput) => Promise<void>;
}) {
  const [productId, setProductId] = React.useState("");
  const [bulkQuantity, setBulkQuantity] = React.useState("");

  // Start every opening from a clean slate.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setProductId("");
      setBulkQuantity("");
    }
  }

  const product = fixedProduct ?? products.find((row) => row.id === productId) ?? null;

  // Changing the product changes the defaults, which resets the rows.
  const defaults = React.useMemo(() => toStockImportFormDefaultValues(product), [product]);
  const form = useZodForm(stockImportFormSchema, defaults);
  const errors = form.formState.errors;

  const watched = form.watch("items");
  const totalUnits = watched.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const applyToAll = () => {
    if (!bulkQuantity) return;
    watched.forEach((_, index) => {
      form.setValue(`items.${index}.quantity`, bulkQuantity, { shouldDirty: true });
    });
    form.clearErrors("items");
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={fixedProduct ? `Receive stock · ${fixedProduct.name}` : "New stock import"}
      description="Enter the units received. Stock only ever increases through a stock import, and an import cannot be edited afterwards."
      form={form}
      defaultValues={defaults}
      onSubmit={(values) => onSubmit(toStockImportInput(values))}
      submitLabel="Receive stock"
      className="max-w-3xl"
      footer={
        <span className="mr-auto self-center text-xs text-muted">
          {formatNumber(totalUnits)} units in this import
        </span>
      }
    >
      {fixedProduct ? null : (
        <div className="mb-4">
          <Label htmlFor="stock-import-product">Product</Label>
          <Select
            id="stock-import-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">Select a product</option>
            {products.map((row) => (
              <option key={row.id} value={row.id} disabled={row.variants.length === 0}>
                {row.name}
                {row.variants.length === 0 ? " — no variants" : ` (${row.variants.length} variants)`}
              </option>
            ))}
          </Select>
        </div>
      )}

      {product === null ? (
        <p
          role={messageOf(errors.items) ? "alert" : undefined}
          className={
            messageOf(errors.items)
              ? "rounded-card border border-dashed border-danger px-4 py-10 text-center text-sm text-danger"
              : "rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-muted"
          }
        >
          {messageOf(errors.items) ? "Select a product first." : "Select a product to list its variants."}
        </p>
      ) : (
        <>
          {/* Same quantity for every variant of the product */}
          <div className="mb-3 flex flex-wrap items-end gap-2 rounded-card border border-line bg-canvas-soft p-3">
            <div className="w-40">
              <Label htmlFor="stock-import-bulk">Quantity for all variants</Label>
              <Input
                id="stock-import-bulk"
                inputMode="numeric"
                placeholder="0"
                value={bulkQuantity}
                onChange={(event) => setBulkQuantity(event.target.value.replace(/[^0-9]/g, ""))}
                className="h-8 text-xs"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" disabled={!bulkQuantity} onClick={applyToAll}>
              Apply to all {product.variants.length} variants
            </Button>
            <p className="w-full text-[11px] text-muted">
              Fills every row below; you can still adjust each variant afterwards.
            </p>
          </div>

          {messageOf(errors.items) ? (
            <p role="alert" className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {messageOf(errors.items)}
            </p>
          ) : null}

          <ul className="divide-y divide-canvas-line rounded-card border border-line">
            {product.variants.map((variant, index) => {
              const size = options.sizes.find((row) => row.id === variant.sizeId);
              const color = options.colors.find((row) => row.id === variant.colorId);
              const rowError = errors.items?.[index];
              return (
                <li key={variant.id} className="grid gap-3 p-3 sm:grid-cols-12 sm:items-start">
                  <div className="min-w-0 sm:col-span-5">
                    <p className="truncate font-mono text-xs font-semibold text-ink">{variant.sku}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span>{size?.label ?? "—"}</span>
                      {color ? <ColorSwatch hexCode={color.hexCode} name={color.name} size="sm" /> : null}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      In stock:{" "}
                      <span className="font-semibold text-ink">{formatNumber(variant.stockQuantity)}</span>
                    </p>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor={`import-${variant.id}-qty`} className="field-label">
                      Quantity
                    </label>
                    <Input
                      id={`import-${variant.id}-qty`}
                      inputMode="numeric"
                      placeholder="0"
                      aria-invalid={Boolean(messageOf(rowError?.quantity))}
                      value={form.watch(`items.${index}.quantity`)}
                      onChange={(event) =>
                        form.setValue(`items.${index}.quantity`, event.target.value.replace(/[^0-9]/g, ""), {
                          shouldDirty: true,
                        })
                      }
                      className="h-8 text-xs"
                    />
                    {messageOf(rowError?.quantity) ? (
                      <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
                        {messageOf(rowError?.quantity)}
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-4">
                    <label htmlFor={`import-${variant.id}-cost`} className="field-label">
                      Unit cost (optional)
                    </label>
                    <Input
                      id={`import-${variant.id}-cost`}
                      inputMode="decimal"
                      placeholder="120000"
                      aria-invalid={Boolean(messageOf(rowError?.unitCost))}
                      value={form.watch(`items.${index}.unitCost`)}
                      onChange={(event) =>
                        form.setValue(`items.${index}.unitCost`, event.target.value, { shouldDirty: true })
                      }
                      className="h-8 text-xs"
                    />
                    {messageOf(rowError?.unitCost) ? (
                      <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
                        {messageOf(rowError?.unitCost)}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <FormRow name="note" label="Note" error={errors.note?.message}>
              {(props) => (
                <Textarea
                  {...props}
                  value={form.watch("note")}
                  onChange={(event) => form.setValue("note", event.target.value, { shouldDirty: true })}
                  placeholder="Supplier, delivery note number…"
                  className="min-h-16"
                />
              )}
            </FormRow>
          </div>
        </>
      )}
    </FormDialog>
  );
}
