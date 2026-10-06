"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

export function Card({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-card border border-line bg-paper", className)}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  description,
  action,
  ...props
}: React.ComponentProps<"div"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn("flex items-start justify-between gap-4 border-b border-line px-5 py-4", className)}
      {...props}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

/** Label/value list used across the detail pages. */
export function DescriptionList({
  className,
  items,
  columns = 2,
}: {
  className?: string;
  columns?: 1 | 2;
  items: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-6 gap-y-4",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-[10px] font-bold tracking-wider text-muted uppercase">
            {item.label}
          </dt>
          <dd className="mt-1 text-sm font-medium break-words text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
