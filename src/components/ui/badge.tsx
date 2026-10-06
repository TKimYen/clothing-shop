"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn, formatOrderStatus, formatRole } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-canvas-line text-muted",
        success: "bg-moss/10 text-moss",
        warning: "bg-gold/15 text-gold",
        danger: "bg-danger/10 text-danger",
        info: "bg-azure/10 text-azure",
        plum: "bg-plum/10 text-plum",
        ink: "bg-ink/10 text-ink",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

const TONE_BY_ORDER_STATUS = {
  PENDING: "warning",
  CONFIRMED: "info",
  SHIPPING: "plum",
  DELIVERED: "success",
  CANCELLED: "danger",
} as const satisfies Record<string, BadgeTone>;

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={TONE_BY_ORDER_STATUS[status as keyof typeof TONE_BY_ORDER_STATUS] ?? "neutral"}>
      {formatOrderStatus(status)}
    </Badge>
  );
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Draft"}</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  return <Badge tone={role === "ADMIN" ? "ink" : "neutral"}>{formatRole(role)}</Badge>;
}

export { badgeVariants };
