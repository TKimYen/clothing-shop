"use client";

import * as React from "react";
import type { FieldErrors, FieldValues, UseFormReturn } from "react-hook-form";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui";
import { cn } from "@/src/lib/utils";
import { applyServiceErrors, useResetOnOpen } from "./use-zod-form";

/**
 * Modal form shell: focus trap, scroll lock and `Escape` come from Radix;
 * this adds reset-on-open, a disabled-while-submitting button, and mapping
 * rejected service calls back onto the offending fields.
 */
export function FormDialog<T extends FieldValues, TOutput = T>({
  open,
  onOpenChange,
  title,
  description,
  form,
  defaultValues,
  onSubmit,
  onInvalid,
  submitLabel = "Save",
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  // The third generic mirrors what `useZodForm` returns (input type, then the
  // resolver's output type, which is opaque here).
  form: UseFormReturn<T, unknown, TOutput>;
  /** The form's *input* shape, as produced by the schema's `toXFormDefaultValues`. */
  defaultValues: T;
  /** Receives the schema's *output*, i.e. the coerced domain input. */
  onSubmit: (values: TOutput) => void | Promise<void>;
  /** Called when client-side validation fails, e.g. to reveal the bad tab. */
  onInvalid?: (errors: FieldErrors<T>) => void;
  submitLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useResetOnOpen(form, open, defaultValues);

  // Not annotated: contextual typing from `form.handleSubmit` is what ties
  // `values` to the schema's *output* type.
  const handleSubmit = async (values: TOutput) => {
    try {
      await onSubmit(values);
    } catch (error) {
      // A rejected service call already carries per-field messages; anything
      // else is a genuine bug and is rethrown for the error boundary.
      if (!applyServiceErrors(form, error)) throw error;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !form.formState.isSubmitting && onOpenChange(next)}>
      <DialogContent className={cn("max-h-[88dvh] max-w-2xl overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(handleSubmit, onInvalid)}>
          {children}

          <DialogFooter>
            {footer}
            <Button
              type="button"
              variant="secondary"
              disabled={form.formState.isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
