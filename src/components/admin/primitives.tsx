"use client";

import * as React from "react";
import { Badge, Input, Label, Select } from "@/src/components/ui";
import { cn } from "@/src/lib/utils";

/** Colour swatch. Falls back to the hex value when the colour is unreadable. */
export function ColorSwatch({
  hexCode,
  name,
  size = "md",
}: {
  hexCode: string;
  name?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          "inline-block shrink-0 rounded-full ring-1 ring-ink/10 ring-inset",
          size === "sm" ? "size-4" : "size-5",
        )}
        style={{ backgroundColor: hexCode }}
        aria-hidden
      />
      <span className="sr-only">{name ?? "Colour"}: </span>
      <span aria-hidden className="font-mono text-xs text-muted">
        {name ? `${name} ` : ""}
        {hexCode.toUpperCase()}
      </span>
    </span>
  );
}

export function ProductThumb({
  src,
  alt,
  size = "md",
}: {
  src?: string | null;
  alt: string;
  size?: "sm" | "md";
}) {
  const [failed, setFailed] = React.useState(false);
  const dimension = size === "sm" ? "size-9" : "size-11";

  if (!src || failed) {
    return (
      <span
        className={cn(
          dimension,
          "grid shrink-0 place-items-center rounded-md bg-canvas-line text-[9px] font-bold text-muted",
        )}
        aria-hidden
      >
        {alt.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    // Remote placeholder images: plain <img> avoids next/image remote config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(dimension, "shrink-0 rounded-md bg-canvas-line object-cover")}
    />
  );
}

/** A labelled filter dropdown wired to URL-backed state. */
export function FilterSelect({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("min-w-36", className)}>
      <Label htmlFor={id} className="sr-only">
        {label}
      </Label>
      <Select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 text-xs"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <Badge tone="info" className="gap-1.5 py-1 pr-1 pl-2.5">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear filter ${label}`}
        className="rounded-full px-1 hover:bg-azure/20"
      >
        ×
      </button>
    </Badge>
  );
}

/** Native checkbox group used for multi-select filters. */
export function CheckboxFilter({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted select-none"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3.5 accent-ink"
      />
      {label}
    </label>
  );
}

export { Input };
