"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormReturn,
  type DefaultValues,
  type Resolver,
} from "react-hook-form";
import * as React from "react";
import type { z } from "zod";
import { isServiceError } from "@/src/lib/services";
import { slugify } from "@/src/lib/utils";

/**
 * The form's value shape: react-hook-form keys off the schema's *input* (what
 * the controls hold — strings for numbers, "" for absent dates) while
 * `handleSubmit` yields the *output* (the coerced domain input).
 *
 * Both are inferred from the schema itself, so a `.transform()` in the schema
 * is reflected in the type of the values the submit handler receives.
 */
export type FormInput<S extends z.ZodType> = z.input<S> extends infer I extends FieldValues
  ? I
  : FieldValues;

export type FormOutput<S extends z.ZodType> = z.output<S>;

/**
 * `useForm` wired to a zod schema, with the input/output types kept distinct so
 * a transformed (coerced) schema still typechecks at the call site.
 */
export function useZodForm<S extends z.ZodType>(
  schema: S,
  defaultValues: FormInput<S>,
): UseFormReturn<FormInput<S>, unknown, FormOutput<S>> {
  // zod v4 + RHF generics cannot be reconciled here; the resolver is built from
  // the very schema that fixes FormInput/FormOutput, so the cast is sound.
  const resolver = React.useMemo(
    () => zodResolver(schema as never) as Resolver<FormInput<S>, unknown, FormOutput<S>>,
    [schema],
  );

  const form = useForm<FormInput<S>, unknown, FormOutput<S>>({
    resolver,
    // `FormInput<S>` is already the concrete shape; `DefaultValues` only widens
    // it to allow partials, which we never rely on here.
    defaultValues: defaultValues as DefaultValues<FormInput<S>>,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  return form;
}

/**
 * Surfaces a rejected service call as field-level errors.
 *
 * The service returns `{ fieldName: message }`; react-hook-form needs
 * `Path<T>`, and field names are validated against the schema, so the cast is
 * a compile-time no-op guarded by `isServiceError`.
 */
export function applyServiceErrors<T extends FieldValues>(
  form: UseFormReturn<T, unknown, unknown>,
  error: unknown,
): boolean {
  if (!isServiceError(error)) return false;
  const entries = Object.entries(error.fields);
  if (entries.length === 0) return false;
  for (const [field, message] of entries) {
    form.setError(field as Path<T>, { type: "server", message });
  }
  return true;
}

/**
 * Resets the form when the modal opens or the edited entity changes, keyed by a
 * stable serialisation so a new object identity on every render cannot cause a
 * loop (and so the user's typing is never wiped mid-edit).
 */
export function useResetOnOpen<T extends FieldValues>(
  form: UseFormReturn<T, unknown, unknown>,
  open: boolean,
  defaultValues: T,
): void {
  const valuesKey = JSON.stringify(defaultValues);
  React.useEffect(() => {
    if (!open) return;
    form.reset(JSON.parse(valuesKey) as T);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, valuesKey]);
}

/**
 * Slug auto-fill that stops as soon as the user edits the slug themselves.
 *
 * `T` stays generic, so `Path<T>` cannot be narrowed to the literal `"slug"` by
 * the compiler even though the constraint guarantees it exists; that single cast
 * is the whole cost of keeping this generic.
 */
export function useSlugSync<T extends FieldValues & { slug: string }>(
  form: UseFormReturn<T, unknown, unknown>,
  sourceValue: string,
  enabled: boolean,
): void {
  const lastSource = React.useRef(sourceValue);
  React.useEffect(() => {
    if (!enabled) return;
    if (sourceValue === lastSource.current) return;
    lastSource.current = sourceValue;
    if (form.getValues().slug) return;
    void form.setValue(
      "slug" as Path<T>,
      slugify(sourceValue) as PathValue<T, Path<T>>,
      { shouldValidate: false },
    );
  }, [sourceValue, enabled, form]);
}

/**
 * react-hook-form models nested array errors as a union that includes strings
 * and `FieldError` objects depending on the depth. This reads the message out of
 * either shape without casting through `any`.
 */
export function messageOf(error: unknown): string | undefined {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}
