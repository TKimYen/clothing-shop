import { DM_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { redirect } from "next/navigation";
import * as React from "react";
import { AdminShell } from "@/src/components/admin/layout";
import { Providers } from "@/src/components/admin/query-provider";
import { LoadingState } from "@/src/components/ui";
import { HttpError, requireAdmin } from "@/src/lib/admin/server";

// Self-hosted by next/font, so there is no render-blocking request to Google.
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: { default: "Bluewear Admin", template: "%s · Bluewear Admin" },
  description: "Operations workspace for the catalogue, orders and customers.",
};

/**
 * Only users with `role = ADMIN` may open the admin area. The API routes
 * enforce the same rule, so this is a convenience, not the only guard.
 */
async function checkAccess(): Promise<"ok" | "forbidden"> {
  try {
    await requireAdmin();
    return "ok";
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      redirect("/sign-in?redirect_url=/admin");
    }
    if (error instanceof HttpError && error.status === 403) return "forbidden";
    throw error;
  }
}

/**
 * Every list page reads its state from the URL via `useSearchParams`, which
 * Next.js requires to sit inside a Suspense boundary. Providing it once here
 * keeps each page free of boilerplate.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await checkAccess();

  return (
    <div className={`${sans.variable} ${display.variable} admin-root`}>
      {access === "forbidden" ? (
        <div className="grid min-h-dvh place-items-center px-4">
          <div className="max-w-sm rounded-card border border-line bg-paper p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">Admin access required</h1>
            <p className="mt-2 text-sm text-muted">
              Your account does not have the ADMIN role. Ask an administrator to grant it.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-xs font-semibold text-paper"
            >
              Back to store
            </Link>
          </div>
        </div>
      ) : (
        <Providers>
          <AdminShell>
            <React.Suspense fallback={<LoadingState label="Loading page" />}>{children}</React.Suspense>
          </AdminShell>
        </Providers>
      )}
    </div>
  );
}
