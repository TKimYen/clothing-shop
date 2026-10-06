"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-line bg-paper px-3 text-sm text-ink",
        "placeholder:text-muted/70",
        "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
        "disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink",
        "placeholder:text-muted/70",
        "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
        "disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Native `<select>`: keyboard and mobile behaviour are correct for free, and
 * the admin forms never need rich option rendering.
 */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full appearance-none rounded-md border border-line bg-paper",
        "bg-[length:14px] bg-[right_0.6rem_center] bg-no-repeat px-3 pr-8 text-sm text-ink",
        "focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10",
        "disabled:cursor-not-allowed disabled:bg-canvas-soft disabled:text-muted",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/20",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2378818b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("field-label", className)} {...props} />;
}

/** Checkbox styled as a switch row, used for `isActive` toggles. */
export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  label: string;
  description?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {/*
        The label wraps the control as well as pointing at it, so the whole row
        is one tap target. The box itself is only 16px, which is below the 24px
        minimum target size, so relying on the checkbox alone would be unusable
        on a touch screen.
      */}
      <label htmlFor={id} className="flex min-h-6 cursor-pointer items-start gap-3 py-0.5">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 cursor-pointer accent-ink"
          {...props}
        />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-ink">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted">{description}</span>
          ) : null}
        </span>
      </label>
    </div>
  );
}

/** Inline validation message, wired to `aria-describedby` by the form fields. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-danger">
      {message}
    </p>
  );
}
