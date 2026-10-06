"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

/**
 * Plain semantic table wrappers. Horizontal scroll on small screens is handled
 * once, here, rather than in every list page.
 */
export function TableWrap({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("w-full overflow-x-auto", className)} {...props} />
  );
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full min-w-3xl border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-canvas-soft", className)} {...props} />;
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-canvas-line", className)} {...props} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-canvas-soft/70", className)} {...props} />;
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-[10px] font-bold tracking-wider text-muted uppercase whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("px-4 py-3 align-middle text-sm text-ink/80", className)} {...props} />
  );
}
