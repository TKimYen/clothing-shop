"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/src/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  back,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-brand"
          >
            <span aria-hidden>←</span>
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? (
          <p className="text-[10px] font-bold tracking-[0.14em] text-muted uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-[30px]">
          {title}
        </h1>
        {description ? <p className="mt-1.5 text-sm text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
