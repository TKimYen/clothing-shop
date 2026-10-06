"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Renders the storefront header/footer everywhere except the admin area,
 * which has its own sidebar + header shell.
 */
export default function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      <main className="flex-grow">{children}</main>
      {footer}
    </>
  );
}
