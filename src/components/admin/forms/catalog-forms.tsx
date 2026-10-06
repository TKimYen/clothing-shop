"use client";

import * as React from "react";
import { SEASONS, type Season } from "@/src/types";
import {
  Input,
  Select,
  Switch,
  Textarea,
  FormRow,
} from "@/src/components/ui";
import {
  categoryFormSchema,
  collectionFormSchema,
  colorFormSchema,
  sizeFormSchema,
  toCategoryFormDefaultValues,
  toCategoryInput,
  toCollectionFormDefaultValues,
  toCollectionInput,
  toColorFormDefaultValues,
  toColorInput,
  toSizeFormDefaultValues,
  toSizeInput,
} from "@/src/lib/schemas";
import { slugify } from "@/src/lib/utils";
import type { Category, CategoryInput, Collection, CollectionInput, Color, ColorInput, Size, SizeInput } from "@/src/types";
import { FormDialog } from "./form-dialog";
import { useSlugSync, useZodForm } from "./use-zod-form";

/* -------------------------------------------------------------------------- */
/* Category                                                                    */
/* -------------------------------------------------------------------------- */

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSubmit: (input: CategoryInput) => Promise<void>;
}) {
  const defaults = React.useMemo(
    () => toCategoryFormDefaultValues(category),
    [category],
  );
  const form = useZodForm(categoryFormSchema, defaults);
  useSlugSync(form, form.watch("name"), !category);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? `Edit ${category.name}` : "New category"}
      description="Categories group products. A category cannot be deleted while products still reference it."
      form={form}
      defaultValues={defaults}
      submitLabel={category ? "Save changes" : "Create category"}
      onSubmit={async (values) => {
        await onSubmit(toCategoryInput(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow name="name" label="Name" error={form.formState.errors.name?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("name")}
              onChange={(event) => form.setValue("name", event.target.value, { shouldDirty: true })}
              placeholder="Outerwear"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="slug" label="Slug" error={form.formState.errors.slug?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("slug")}
              onChange={(event) => form.setValue("slug", slugify(event.target.value), { shouldDirty: true })}
              placeholder="outerwear"
              autoComplete="off"
            />
          )}
        </FormRow>
      </div>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Collection                                                                  */
/* -------------------------------------------------------------------------- */


export function CollectionFormDialog({
  open,
  onOpenChange,
  collection,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection | null;
  onSubmit: (input: CollectionInput) => Promise<void>;
}) {
  const defaults = React.useMemo(
    () => toCollectionFormDefaultValues(collection),
    [collection],
  );
  const form = useZodForm(collectionFormSchema, defaults);
  useSlugSync(form, form.watch("name"), !collection);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={collection ? `Edit ${collection.name}` : "New collection"}
      form={form}
      defaultValues={defaults}
      submitLabel={collection ? "Save changes" : "Create collection"}
      onSubmit={async (values) => {
        await onSubmit(toCollectionInput(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow name="name" label="Name" error={form.formState.errors.name?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("name")}
              onChange={(event) => form.setValue("name", event.target.value, { shouldDirty: true })}
              placeholder="Autumn Signal"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="slug" label="Slug" error={form.formState.errors.slug?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("slug")}
              onChange={(event) => form.setValue("slug", slugify(event.target.value), { shouldDirty: true })}
              placeholder="autumn-signal"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="season" label="Season" error={form.formState.errors.season?.message}>
          {(props) => (
            <Select
              {...props}
              value={form.watch("season")}
              onChange={(event) => form.setValue("season", event.target.value as Season, { shouldDirty: true })}
            >
              <option value="">Select a season</option>
              {SEASONS.map((season) => (
                <option key={season.value} value={season.value}>
                  {season.label}
                </option>
              ))}
            </Select>
          )}
        </FormRow>

        <FormRow name="year" label="Year" error={form.formState.errors.year?.message}>
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              value={form.watch("year")}
              onChange={(event) => form.setValue("year", event.target.value, { shouldDirty: true })}
              placeholder="2025"
            />
          )}
        </FormRow>

        <FormRow name="startsAt" label="Starts at" error={form.formState.errors.startsAt?.message}>
          {(props) => (
            <Input
              {...props}
              type="datetime-local"
              value={form.watch("startsAt")}
              onChange={(event) => form.setValue("startsAt", event.target.value, { shouldDirty: true })}
            />
          )}
        </FormRow>

        <FormRow
          name="bannerUrl"
          label="Banner URL"
          error={form.formState.errors.bannerUrl?.message}
          hint={<p className="mt-1 text-xs text-muted">Optional. Paste an image URL.</p>}
        >
          {(props) => (
            <Input
              {...props}
              value={form.watch("bannerUrl")}
              onChange={(event) => form.setValue("bannerUrl", event.target.value, { shouldDirty: true })}
              placeholder="https://…"
              autoComplete="off"
            />
          )}
        </FormRow>

        <div className="sm:col-span-2">
          <FormRow
            name="description"
            label="Description"
            error={form.formState.errors.description?.message}
          >
            {(props) => (
              <Textarea
                {...props}
                value={form.watch("description")}
                onChange={(event) => form.setValue("description", event.target.value, { shouldDirty: true })}
                placeholder="What belongs in this collection?"
              />
            )}
          </FormRow>
        </div>

        <div className="sm:col-span-2">
          <FormFieldSwitch
            checked={form.watch("isActive")}
            onChange={(checked) => form.setValue("isActive", checked, { shouldDirty: true })}
          />
        </div>
      </div>
    </FormDialog>
  );
}

function FormFieldSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      label="Active"
      description="Inactive collections are hidden from the storefront."
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Size                                                                        */
/* -------------------------------------------------------------------------- */

export function SizeFormDialog({
  open,
  onOpenChange,
  size,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size: Size | null;
  onSubmit: (input: SizeInput) => Promise<void>;
}) {
  const defaults = React.useMemo(() => toSizeFormDefaultValues(size), [size]);
  const form = useZodForm(sizeFormSchema, defaults);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={size ? `Edit size ${size.label}` : "New size"}
      form={form}
      defaultValues={defaults}
      submitLabel={size ? "Save changes" : "Create size"}
      onSubmit={async (values) => {
        await onSubmit(toSizeInput(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow name="label" label="Label" error={form.formState.errors.label?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("label")}
              onChange={(event) => form.setValue("label", event.target.value, { shouldDirty: true })}
              placeholder="XL"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="sortOrder" label="Sort order" error={form.formState.errors.sortOrder?.message}>
          {(props) => (
            <Input
              {...props}
              inputMode="numeric"
              value={form.watch("sortOrder")}
              onChange={(event) => form.setValue("sortOrder", event.target.value, { shouldDirty: true })}
              placeholder="1"
            />
          )}
        </FormRow>
      </div>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Color                                                                       */
/* -------------------------------------------------------------------------- */

export function ColorFormDialog({
  open,
  onOpenChange,
  color,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color: Color | null;
  onSubmit: (input: ColorInput) => Promise<void>;
}) {
  const defaults = React.useMemo(() => toColorFormDefaultValues(color), [color]);
  const form = useZodForm(colorFormSchema, defaults);
  const hex = form.watch("hexCode");

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={color ? `Edit ${color.name}` : "New color"}
      form={form}
      defaultValues={defaults}
      submitLabel={color ? "Save changes" : "Create color"}
      onSubmit={async (values) => {
        await onSubmit(toColorInput(values));
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow name="name" label="Name" error={form.formState.errors.name?.message}>
          {(props) => (
            <Input
              {...props}
              value={form.watch("name")}
              onChange={(event) => form.setValue("name", event.target.value, { shouldDirty: true })}
              placeholder="Clay"
              autoComplete="off"
            />
          )}
        </FormRow>

        <FormRow name="hexCode" label="Hex code" error={form.formState.errors.hexCode?.message}>
          {(props) => (
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Pick a colour"
                value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#18212b"}
                onChange={(event) =>
                  form.setValue("hexCode", event.target.value, { shouldDirty: true })
                }
                className="size-9 shrink-0 cursor-pointer rounded-md border border-line bg-paper p-1"
              />
              <Input
                {...props}
                value={hex}
                onChange={(event) => form.setValue("hexCode", event.target.value, { shouldDirty: true })}
                placeholder="#B86B4B"
                className="font-mono"
                autoComplete="off"
              />
            </div>
          )}
        </FormRow>
      </div>
    </FormDialog>
  );
}
