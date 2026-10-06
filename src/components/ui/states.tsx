"use client";

import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "./button";

/**
 * The four list states every page must handle: loading, empty, error, success.
 * `children` is only rendered for the success state.
 */
export function StateMessage({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: "neutral" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      <span
        className={cn(
          "grid size-11 place-items-center rounded-full",
          tone === "danger" ? "bg-danger/10 text-danger" : "bg-canvas-line text-muted",
        )}
      >
        <Icon className="size-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center gap-2.5 px-6 py-16 text-sm text-muted", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return <StateMessage icon={Inbox} title={title} description={description} action={action} />;
}

export function ErrorState({
  title = "Could not load this data",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <StateMessage
      icon={AlertTriangle}
      tone="danger"
      title={title}
      description={description}
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        ) : null
      }
    />
  );
}
