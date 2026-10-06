"use client";

import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Toaster } from "@/src/components/ui";
import { AdminHeader, useBreadcrumbs } from "./header";
import { AdminSidebar } from "./sidebar";

/**
 * Admin chrome: a fixed sidebar on `md+` and an overlay drawer below it.
 * `md:hidden` on the trigger plus a focus trap-free drawer is fine here because
 * the drawer closes on Escape, on navigation, and on backdrop click.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const breadcrumbs = useBreadcrumbs();

  /**
   * Close the drawer whenever the route changes. Adjusted during render rather
   * than in an effect: this is the documented way to react to a prop change, and
   * it avoids the extra render pass an effect would cost.
   */
  const [lastPathname, setLastPathname] = React.useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* Persistent sidebar */}
      <AdminSidebar
        onNavigate={() => setOpen(false)}
        className="sticky top-0 hidden h-dvh md:flex"
      />

      {/* Drawer sidebar */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <AdminSidebar
            onNavigate={() => setOpen(false)}
            className="animate-slide-up absolute inset-y-0 left-0 shadow-2xl"
          />
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader breadcrumbs={breadcrumbs} onOpenSidebar={() => setOpen(true)} />
        <main className={cn("flex-1 px-4 py-6 sm:px-7 sm:py-8 lg:px-10")}>{children}</main>
      </div>

      <Toaster />
    </div>
  );
}
