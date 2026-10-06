"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorState } from "@/src/components/ui";

/**
 * Route-level error boundary. Covers the case where a page component itself
 * throws, complementing the per-list `error` state in `DataTable`.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card>
      <ErrorState
        title="This page could not be rendered"
        description={error.message || "An unexpected error occurred."}
        // `ErrorState` renders its own retry button, so no second one here.
        onRetry={reset}
      />
      <div className="flex justify-center gap-3 border-t border-line px-4 py-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
          Back to dashboard
        </Button>
      </div>
    </Card>
  );
}