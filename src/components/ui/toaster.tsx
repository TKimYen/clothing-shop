"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global toast host. Every mutation reports through `sonner`:
 * `toast.success` on 2xx, `toast.error` when a service rejects.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      closeButton
      richColors={false}
      toastOptions={{
        classNames: {
          toast:
            "rounded-card border border-line bg-paper text-ink shadow-lg text-sm font-medium",
          description: "text-muted",
          success: "[&_[data-icon]]:text-moss",
          error: "[&_[data-icon]]:text-danger",
        },
      }}
    />
  );
}
