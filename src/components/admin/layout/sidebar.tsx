"use client";

import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackagePlus,
  Palette,
  Ruler,
  ShoppingBag,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { cn } from "@/src/lib/utils";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra paths that should also highlight this item. */
  match?: string[];
};

export type NavGroup = { label: string; items: NavItem[] };

/**
 * One entry per route in the requirement. Sizes and Colors are deliberately
 * separate entries rather than one combined page.
 */
export const ADMIN_NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Package },
      { label: "Stock imports", href: "/admin/stock-imports", icon: PackagePlus },
      { label: "Categories", href: "/admin/categories", icon: Boxes },
      { label: "Collections", href: "/admin/collections", icon: ShoppingBag },
      { label: "Sizes", href: "/admin/sizes", icon: Ruler },
      { label: "Colors", href: "/admin/colors", icon: Palette },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Coupons", href: "/admin/coupons", icon: Tag },
      { label: "Orders", href: "/admin/orders", icon: ClipboardList },
      { label: "Users", href: "/admin/users", icon: Users },
    ],
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/admin") return pathname === "/admin";
  if (pathname === item.href) return true;
  if (pathname.startsWith(`${item.href}/`)) return true;
  return (item.match ?? []).some((path) => pathname.startsWith(path));
}

export function AdminSidebar({
  onNavigate,
  className,
}: {
  onNavigate: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className={cn(
        "flex w-60 shrink-0 flex-col bg-ink text-white/70",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-7">
        <span className="grid size-7 place-items-center rounded-lg bg-blue-400 text-sm font-bold text-white">
          B
        </span>
        <span className="font-display text-lg font-semibold text-white">
          Bluewear
        </span>
      </div>

      <nav aria-label="Admin sections" className="flex-1 overflow-y-auto px-3">
        {ADMIN_NAV.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2.5 pb-2 text-[10px] font-bold tracking-[0.14em] text-white/35 uppercase">
              {group.label}
            </p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors",
                        active
                          ? "bg-ink-soft font-semibold text-white shadow-[inset_3px_0_0_var(--color-brand)]"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <p className="border-t border-white/10 px-5 py-4 text-[11px] text-white/35">
        Workspace settings
      </p>
    </aside>
  );
}
