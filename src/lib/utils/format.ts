/**
 * All formatting is pinned to a fixed locale and timezone.
 *
 * Never call `toLocaleString()` / `toLocaleDateString()` directly in JSX:
 * the server and the client can disagree, which produces a hydration mismatch.
 */

export const LOCALE = "en-US";
export const TIME_ZONE = "UTC";

// Prices in the database are Vietnamese dong, which has no minor unit.
const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

const numberFormatter = new Intl.NumberFormat(LOCALE);

const EM_DASH = "—";

/** `199000 -> "199.000 ₫"`, `null -> "—"`. */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EM_DASH;
  }
  return currencyFormatter.format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return dateTimeFormatter.format(date);
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return EM_DASH;
  }
  return numberFormatter.format(value);
}

/**
 * `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in the *local* wall clock.
 * We format from the UTC parts so the value round-trips identically regardless
 * of where the browser runs.
 */
export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  );
}

/** Inverse of {@link toDateTimeLocalValue}. */
export function fromDateTimeLocalValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

/** Turns a title/slug/label into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
