"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { FieldError, Label } from "./input";

type FormFieldContextValue = {
  control: string;
  error?: string;
  description?: string;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const context = React.useContext(FormFieldContext);
  if (!context) throw new Error("FormField parts must be used inside <FormField>");
  return context;
}

export function FormField({
  control,
  error,
  description,
  children,
}: FormFieldContextValue & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({ control, error, description }),
    [control, error, description],
  );
  return <FormFieldContext.Provider value={value}>{children}</FormFieldContext.Provider>;
}

export function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { control } = useFormField();
  return <Label htmlFor={control} className={className} {...props} />;
}

export function FormControl({
  children,
}: {
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const { control, error, description } = useFormField();
  return (
    <>
      {children({
        id: control,
        "aria-invalid": Boolean(error),
        "aria-describedby": error
          ? `${control}-error`
          : description
            ? `${control}-description`
            : undefined,
      })}
      {description ? (
        <p id={`${control}-description`} className="mt-1 text-xs text-muted">
          {description}
        </p>
      ) : null}
      <FieldError id={`${control}-error`} message={error} />
    </>
  );
}

/** Convenience wrapper that renders label + control + error for one field. */
export function FormRow({
  name,
  label,
  error,
  description,
  hint,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  description?: string;
  hint?: React.ReactNode;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  return (
    <FormField control={name} error={error} description={description}>
      <div className={cn("min-w-0")}>
        <FormLabel>{label}</FormLabel>
        <FormControl>{children}</FormControl>
        {hint}
      </div>
    </FormField>
  );
}
