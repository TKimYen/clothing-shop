"use client";

import { ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/src/lib/utils";

export type Crumb = { label: string; href?: string };

/** Route label lookup, keyed by the path segment. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Products",
  categories: "Categories",
  collections: "Collections",
  sizes: "Sizes",
  colors: "Colors",
  "stock-imports": "Stock imports",
  coupons: "Coupons",
  orders: "Orders",
  users: "Users",
  new: "New",
  edit: "Edit",
};

function labelFor(segment: string, isLast: boolean): string {
  const known = SEGMENT_LABELS[segment];
  if (known) return known;
  // Dynamic segment holding a database id (UUID).
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
    return "Detail";
  }
  return isLast ? "Detail" : segment;
}

/** Derives breadcrumbs from the pathname so they never drift from the route. */
export function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const crumbs: Crumb[] = [];
    let path = "";
    segments.forEach((segment, index) => {
      path += `/${segment}`;
      const isLast = index === segments.length - 1;
      crumbs.push({
        label: labelFor(segment, isLast),
        href: isLast ? undefined : path,
      });
    });
    return crumbs;
  }, [pathname]);
}

export function AdminHeader({
  breadcrumbs,
  onOpenSidebar,
}: {
  breadcrumbs: Crumb[];
  onOpenSidebar: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper px-4 sm:px-7">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        aria-controls="admin-sidebar"
        className="grid size-8 shrink-0 place-items-center rounded-md border border-line text-ink transition-colors hover:bg-canvas-soft md:hidden"
      >
        <Menu className="size-4" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-[13px]">
          {breadcrumbs.map((crumb, index) => {
            const last = index === breadcrumbs.length - 1;
            return (
              <li
                key={`${crumb.href ?? crumb.label}`}
                className="flex min-w-0 items-center gap-1.5"
              >
                {index > 0 ? (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted/60"
                    aria-hidden
                  />
                ) : null}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="truncate py-1 text-muted [-webkit-tap-highlight-color:transparent] hover:text-ink"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className={cn(
                      "truncate",
                      last ? "font-semibold text-ink" : "text-muted",
                    )}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="hidden items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-xs text-muted lg:flex">
        <Search className="size-3.5" aria-hidden />
        <span>Quick find</span>
        <kbd className="rounded border border-line px-1 py-0.5 text-[10px]">
          ⌘K
        </kbd>
      </div>

      <AdminIdentity />
    </header>
  );
}

/** Signed-in Clerk user; falls back to a generic label when auth is disabled. */
function AdminIdentity() {
  const { user } = useUser();
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Admin";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "A";

  return (
    <div className="flex items-center gap-2.5">
      <span className="hidden text-right text-xs leading-tight sm:block">
        <span className="block font-semibold text-ink">{name}</span>
        <span className="block text-muted">Administrator</span>
      </span>
      <span
        className="grid size-8 place-items-center rounded-full bg-blue-400/15 text-[11px] font-bold text-blue-500"
        aria-hidden
      >
        {initials}
      </span>
    </div>
  );
}
