"use client";

import { ImagePlus, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as React from "react";
import { useFieldArray, type FieldErrors } from "react-hook-form";
import { Button, FormRow, Input, Select, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Card, CardBody } from "@/src/components/ui";
import {
  productFormSchema,
  toProductFormDefaultValues,
  toProductInput,
  type ProductFormOutput,
  type ProductFormValues,
} from "@/src/lib/schemas";
import { lowestStock, slugify, totalStock } from "@/src/lib/utils";
import { productService } from "@/src/lib/services";
import type { Product, ProductInput, ProductOptions } from "@/src/types";
import { applyServiceErrors, messageOf, useSlugSync, useZodForm } from "./use-zod-form";

/**
 * Add / edit product.
 *
 * Rendered inline on a page rather than inside a dialog: `/products/new` and
 * `/products/[id]/edit` are already full pages, so a modal on top of them made
 * the layout flash a skeleton and then pop a dialog over an empty page.
 *
 * Price lives here on the product; variants only carry size, colour and sku.
 * Stock is shown read-only: it only increases through a stock import. Images attach to product + colour (`colorId: null` = shared).
 */
export function ProductForm({
  product,
  options,
  onSubmit,
  onCancel,
}: {
  product: Product | null;
  options: ProductOptions;
  onSubmit: (input: ProductInput) => Promise<void>;
  onCancel: () => void;
}) {
  const defaults = React.useMemo(
    () => toProductFormDefaultValues(product),
    [product],
  );
  const form = useZodForm(productFormSchema, defaults);
  useSlugSync(form, form.watch("name"), !product);

  const variants = useFieldArray({ control: form.control, name: "variants" });
  const images = useFieldArray({ control: form.control, name: "images" });
  const fileInput = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(0);
  const [replacingIndex, setReplacingIndex] = React.useState<number | null>(null);

  /** Uploads files picked from the computer; adds a row each, or replaces one row's image. */
  async function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    const target = replacingIndex;
    setReplacingIndex(null);
    if (fileInput.current) fileInput.current.value = "";
    if (files.length === 0) return;

    setUploading((count) => count + files.length);
    for (const file of files) {
      try {
        const { url } = await productService.uploadImage(file);
        if (target !== null) {
          form.setValue(`images.${target}.url`, url, { shouldDirty: true, shouldValidate: true });
        } else {
          images.append({
            colorId: "",
            url,
            altText: "",
            sortOrder: String((form.getValues("images")?.length ?? 0) + 1),
          });
        }
      } catch (error) {
        toast.error(`${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`);
      } finally {
        setUploading((count) => count - 1);
      }
    }
  }

  function pickFiles(index: number | null) {
    setReplacingIndex(index);
    if (fileInput.current) {
      fileInput.current.multiple = index === null;
      fileInput.current.click();
    }
  }

  const [tab, setTab] = React.useState("info");
  const errors = form.formState.errors;
  const variantErrors = errors.variants;
  const imageErrors = errors.images;

  const watchedVariants = form.watch("variants");
  const stockTotal = React.useMemo(
    () => totalStock(watchedVariants.map((row) => ({ stockQuantity: Number(row.stockQuantity) || 0 }))),
    [watchedVariants],
  );
  const lowest = React.useMemo(
    () =>
      lowestStock(watchedVariants.map((row) => ({ stockQuantity: Number(row.stockQuantity) || 0 }))),
    [watchedVariants],
  );

  /**
   * Jump to the tab that owns the first error instead of silently failing.
   *
   * The errors come from the `onInvalid` argument, not from `formState`: at
   * submit time the render closure still holds the *previous* (empty) error
   * state, so reading it here would never fire the jump and the user would be
   * left staring at a tab with no visible error.
   */
  const handleInvalid = React.useCallback((invalid: FieldErrors<ProductFormValues>) => {
    if (invalid.variants) {
      setTab("variants");
      return;
    }
    if (invalid.images) setTab("images");
  }, []);

  const handleSubmit = async (values: ProductFormOutput) => {
    try {
      await onSubmit(toProductInput(values));
    } catch (error) {
      // A rejected service call already carries per-field messages; anything
      // else is a genuine bug and is rethrown for the error boundary.
      if (!applyServiceErrors(form, error)) throw error;
    }
  };

  const optionsMissing = options.categories.length === 0 || options.collections.length === 0;

  return (
    <Card>
      <CardBody>
        <form noValidate onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}>
          {optionsMissing ? (
            <p className="mb-4 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
              Create at least one category and one collection before adding a product.
            </p>
          ) : null}
          <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="variants">
            Variants
            {variants.fields.length > 0 ? (
              <span className="ml-1.5 text-muted">({variants.fields.length})</span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="images">
            Images
            {images.fields.length > 0 ? (
              <span className="ml-1.5 text-muted">({images.fields.length})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------ info */}
        <TabsContent value="info" className="pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow name="name" label="Name" error={messageOf(errors.name)}>
              {(props) => (
                <Input
                  {...props}
                  value={form.watch("name")}
                  onChange={(event) => form.setValue("name", event.target.value, { shouldDirty: true })}
                  placeholder="Field Jacket"
                  autoComplete="off"
                />
              )}
            </FormRow>

            <FormRow name="slug" label="Slug" error={messageOf(errors.slug)}>
              {(props) => (
                <Input
                  {...props}
                  value={form.watch("slug")}
                  onChange={(event) =>
                    form.setValue("slug", slugify(event.target.value), { shouldDirty: true })
                  }
                  placeholder="field-jacket"
                  autoComplete="off"
                />
              )}
            </FormRow>

            <FormRow
              name="price"
              label="Price ($)"
              error={messageOf(errors.price)}
              hint={<p className="mt-1 text-xs text-muted">The only price on this record.</p>}
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={form.watch("price")}
                  onChange={(event) => form.setValue("price", event.target.value, { shouldDirty: true })}
                  placeholder="120"
                />
              )}
            </FormRow>

            <FormRow
              name="salePrice"
              label="Sale price ($)"
              error={messageOf(errors.salePrice)}
              hint={<p className="mt-1 text-xs text-muted">Leave blank when not on sale.</p>}
            >
              {(props) => (
                <Input
                  {...props}
                  inputMode="decimal"
                  value={form.watch("salePrice")}
                  onChange={(event) => form.setValue("salePrice", event.target.value, { shouldDirty: true })}
                  placeholder="96"
                />
              )}
            </FormRow>

            <FormRow
              name="saleStartsAt"
              label="Sale starts"
              error={messageOf(errors.saleStartsAt)}
              hint={<p className="mt-1 text-xs text-muted">Set both sale dates or neither.</p>}
            >
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  value={form.watch("saleStartsAt")}
                  onChange={(event) =>
                    form.setValue("saleStartsAt", event.target.value, { shouldDirty: true })
                  }
                />
              )}
            </FormRow>

            <FormRow name="saleEndsAt" label="Sale ends" error={messageOf(errors.saleEndsAt)}>
              {(props) => (
                <Input
                  {...props}
                  type="datetime-local"
                  value={form.watch("saleEndsAt")}
                  onChange={(event) =>
                    form.setValue("saleEndsAt", event.target.value, { shouldDirty: true })
                  }
                />
              )}
            </FormRow>

            <FormRow name="categoryId" label="Category" error={messageOf(errors.categoryId)}>
              {(props) => (
                <Select
                  {...props}
                  value={form.watch("categoryId")}
                  onChange={(event) =>
                    form.setValue("categoryId", event.target.value, { shouldDirty: true })
                  }
                >
                  <option value="">Select a category</option>
                  {options.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormRow>

            <FormRow name="collectionId" label="Collection" error={messageOf(errors.collectionId)}>
              {(props) => (
                <Select
                  {...props}
                  value={form.watch("collectionId")}
                  onChange={(event) =>
                    form.setValue("collectionId", event.target.value, { shouldDirty: true })
                  }
                >
                  <option value="">Select a collection</option>
                  {options.collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormRow>

            <div className="sm:col-span-2">
              <FormRow
                name="description"
                label="Description"
                error={messageOf(errors.description)}
              >
                {(props) => (
                  <Textarea
                    {...props}
                    value={form.watch("description")}
                    onChange={(event) =>
                      form.setValue("description", event.target.value, { shouldDirty: true })
                    }
                    placeholder="What is it made of, and who is it for?"
                  />
                )}
              </FormRow>
            </div>

            <div className="sm:col-span-2">
              <Switch
                label="Active"
                description="Inactive products are hidden from the storefront."
                checked={form.watch("isActive")}
                onChange={(event) => form.setValue("isActive", event.target.checked, { shouldDirty: true })}
              />
            </div>
          </div>
        </TabsContent>

        {/* -------------------------------------------------------- variants */}
        <TabsContent value="variants" className="pt-4">
          {messageOf(errors.variants) ? (
            <p role="alert" className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {messageOf(errors.variants)}
            </p>
          ) : null}

          <p className="mb-3 text-xs text-muted">
            New variants are created with 0 in stock. Add stock afterwards from{" "}
            <span className="font-semibold text-ink">Stock imports</span> or{" "}
            <span className="font-semibold text-ink">Receive stock</span> on the product page.
          </p>

          <Card>
            <CardBody className="p-0">
              <ul className="divide-y divide-canvas-line">
                {variants.fields.map((field, index) => {
                  const rowError = variantErrors?.[index];
                  return (
                    <li key={field.id} className="grid gap-3 p-4 sm:grid-cols-12 sm:items-start">
                      <div className="sm:col-span-3">
                        <label htmlFor={`${field.id}-size`} className="field-label">
                          Size
                        </label>
                        <Select
                          id={`${field.id}-size`}
                          aria-label={`Size for variant ${index + 1}`}
                          aria-invalid={Boolean(messageOf(rowError?.sizeId))}
                          aria-describedby={messageOf(rowError?.sizeId) ? `${field.id}-size-error` : undefined}
                          value={form.watch(`variants.${index}.sizeId`)}
                          onChange={(event) =>
                            form.setValue(`variants.${index}.sizeId`, event.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="h-8 text-xs"
                        >
                          <option value="">Select</option>
                          {options.sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.label}
                            </option>
                          ))}
                        </Select>
                        {messageOf(rowError?.sizeId) ? (
                          <p
                            id={`${field.id}-size-error`}
                            role="alert"
                            className="mt-1 text-[11px] font-medium text-danger"
                          >
                            {messageOf(rowError?.sizeId)}
                          </p>
                        ) : null}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`${field.id}-color`} className="field-label">
                          Color
                        </label>
                        <Select
                          id={`${field.id}-color`}
                          aria-label={`Color for variant ${index + 1}`}
                          aria-invalid={Boolean(messageOf(rowError?.colorId))}
                          aria-describedby={messageOf(rowError?.colorId) ? `${field.id}-color-error` : undefined}
                          value={form.watch(`variants.${index}.colorId`)}
                          onChange={(event) =>
                            form.setValue(`variants.${index}.colorId`, event.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          className="h-8 text-xs"
                        >
                          <option value="">Select</option>
                          {options.colors.map((color) => (
                            <option key={color.id} value={color.id}>
                              {color.name}
                            </option>
                          ))}
                        </Select>
                        {messageOf(rowError?.colorId) ? (
                          <p
                            id={`${field.id}-color-error`}
                            role="alert"
                            className="mt-1 text-[11px] font-medium text-danger"
                          >
                            {messageOf(rowError?.colorId)}
                          </p>
                        ) : null}
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`${field.id}-sku`} className="field-label">
                          SKU
                        </label>
                        <Input
                          id={`${field.id}-sku`}
                          aria-label={`SKU for variant ${index + 1}`}
                          aria-invalid={Boolean(messageOf(rowError?.sku))}
                          aria-describedby={messageOf(rowError?.sku) ? `${field.id}-sku-error` : undefined}
                          value={form.watch(`variants.${index}.sku`)}
                          onChange={(event) =>
                            form.setValue(`variants.${index}.sku`, event.target.value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                          placeholder="FIE-001-M"
                          className="h-8 font-mono text-xs"
                          autoComplete="off"
                        />
                        {messageOf(rowError?.sku) ? (
                          <p
                            id={`${field.id}-sku-error`}
                            role="alert"
                            className="mt-1 text-[11px] font-medium text-danger"
                          >
                            {messageOf(rowError?.sku)}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-end justify-end gap-2 sm:col-span-3">
                        {/*
                          No stock input: a new variant is always saved with 0
                          and stock only increases through a stock import. Saved
                          variants show their current stock read-only.
                        */}
                        {form.watch(`variants.${index}.id`) ? (
                          <div className="min-w-0 flex-1">
                            <span className="field-label">Stock</span>
                            <div
                              className="flex h-8 items-center rounded-md border border-line bg-canvas-soft px-3"
                              aria-label={`Stock for variant ${index + 1}`}
                            >
                              <span className="text-xs font-semibold text-ink">
                                {form.watch(`variants.${index}.stockQuantity`) || "0"}
                              </span>
                            </div>
                          </div>
                        ) : null}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove variant ${index + 1}`}
                          disabled={variants.fields.length === 1}
                          onClick={() => variants.remove(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardBody>
          </Card>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() =>
              variants.append({ sizeId: "", colorId: "", sku: "", stockQuantity: "0" })
            }
          >
            <Plus className="size-3.5" />
            Add variant
          </Button>
        </TabsContent>

        {/* ---------------------------------------------------------- images */}
        <TabsContent value="images" className="pt-4">
          <p className="mb-3 text-xs text-muted">
            Images attach to the product and, optionally, to one colour. Leave the colour
            blank to share the image across every colour.
          </p>

          {variants.fields.length === 0 ? (
            <p className="mb-3 rounded-md bg-gold/10 px-3 py-2 text-xs font-medium text-gold">
              Add at least one variant before attaching colour-specific images.
            </p>
          ) : null}

          {messageOf(errors.images) ? (
            <p role="alert" className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {messageOf(errors.images)}
            </p>
          ) : null}

          <Card>
            <CardBody className="p-0">
              {images.fields.length === 0 ? (
                <p className="px-4 py-10 text-center text-xs text-muted">
                  No images yet. Upload images from your computer to add one.
                </p>
              ) : (
                <ul className="divide-y divide-canvas-line">
                  {images.fields.map((field, index) => {
                    const rowError = imageErrors?.[index];
                    const url = form.watch(`images.${index}.url`);
                    return (
                      <li key={field.id} className="grid gap-3 p-4 sm:grid-cols-12 sm:items-start">
                        <div className="flex items-center gap-3 sm:col-span-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="size-12 shrink-0 rounded-md bg-canvas-line object-cover"
                            onError={(event) => {
                              event.currentTarget.style.visibility = "hidden";
                            }}
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <span className="field-label">Image file</span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              aria-label={`Change image ${index + 1}`}
                              disabled={uploading > 0}
                              onClick={() => pickFiles(index)}
                            >
                              <Upload className="size-3.5" />
                              {url ? "Change" : "Choose file"}
                            </Button>
                            <span className="min-w-0 truncate text-[11px] text-muted" title={url}>
                              {url ? url.split("/").pop() : "No file chosen"}
                            </span>
                          </div>
                          {messageOf(rowError?.url) ? (
                            <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
                              {messageOf(rowError?.url)}
                            </p>
                          ) : null}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor={`${field.id}-alt`} className="field-label">
                            Alt text
                          </label>
                          <Input
                            id={`${field.id}-alt`}
                            aria-label={`Alt text ${index + 1}`}
                            aria-invalid={Boolean(messageOf(rowError?.altText))}
                          aria-describedby={messageOf(rowError?.altText) ? `${field.id}-altText-error` : undefined}
                            value={form.watch(`images.${index}.altText`)}
                            onChange={(event) =>
                              form.setValue(`images.${index}.altText`, event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            placeholder="Front view"
                            className="h-8 text-xs"
                            autoComplete="off"
                          />
                          {messageOf(rowError?.altText) ? (
                            <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
                              {messageOf(rowError?.altText)}
                            </p>
                          ) : null}
                        </div>

                        <div className="sm:col-span-2">
                          <label htmlFor={`${field.id}-image-color`} className="field-label">
                            Color
                          </label>
                          <Select
                            id={`${field.id}-image-color`}
                            aria-label={`Color for image ${index + 1}`}
                            aria-invalid={Boolean(messageOf(rowError?.colorId))}
                          aria-describedby={messageOf(rowError?.colorId) ? `${field.id}-color-error` : undefined}
                            value={form.watch(`images.${index}.colorId`)}
                            onChange={(event) =>
                              form.setValue(`images.${index}.colorId`, event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            className="h-8 text-xs"
                          >
                            <option value="">Shared (all colors)</option>
                            {options.colors.map((color) => (
                              <option key={color.id} value={color.id}>
                                {color.name}
                              </option>
                            ))}
                          </Select>
                          {messageOf(rowError?.colorId) ? (
                            <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
                              {messageOf(rowError?.colorId)}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex items-end gap-2 sm:col-span-2">
                          <div className="min-w-0 flex-1">
                            <label htmlFor={`${field.id}-sort`} className="field-label">
                              Sort
                            </label>
                            <Input
                              id={`${field.id}-sort`}
                              aria-label={`Sort order for image ${index + 1}`}
                              inputMode="numeric"
                              value={form.watch(`images.${index}.sortOrder`)}
                              onChange={(event) =>
                                form.setValue(
                                  `images.${index}.sortOrder`,
                                  event.target.value.replace(/[^0-9]/g, ""),
                                  { shouldDirty: true },
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove image ${index + 1}`}
                            onClick={() => images.remove(index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={uploading > 0}
            onClick={() => pickFiles(null)}
          >
            {uploading > 0 ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImagePlus className="size-3.5" />
            )}
            {uploading > 0 ? `Uploading ${uploading}…` : "Upload images"}
          </Button>
          <span className="ml-3 text-[11px] text-muted">JPG, PNG, WEBP, GIF or AVIF · up to 5 MB each</span>
        </TabsContent>
      </Tabs>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            <span className="mr-auto text-xs text-muted">
              {variants.fields.length} variant{variants.fields.length === 1 ? "" : "s"}
              {product ? ` · ${stockTotal} units · lowest ${lowest}` : ""}
            </span>
            <Button
              type="button"
              variant="secondary"
              disabled={form.formState.isSubmitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {product ? "Save changes" : "Create product"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
