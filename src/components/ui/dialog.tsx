"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/src/lib/utils";

/**
 * Radix handles the accessibility requirements for us: focus trap on open,
 * focus restore on close, `Escape` to dismiss, and `aria-modal`.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  // Portal into the admin root (not <body>) so the admin fonts and tokens apply.
  const container =
    typeof document === "undefined"
      ? undefined
      : (document.querySelector<HTMLElement>(".admin-root") ?? undefined);

  return (
    <DialogPrimitive.Portal container={container}>
      <DialogPrimitive.Overlay
        className={cn(
          "fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]",
          "data-[state=open]:animate-overlay-in data-[state=closed]:opacity-0",
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          "rounded-card border border-line bg-paper p-5 shadow-xl",
          "data-[state=open]:animate-content-in",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute top-4 right-4 grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-canvas-soft hover:text-ink"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-4 pr-8", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn("font-display text-lg font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description className={cn("mt-1 text-sm text-muted", className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}
