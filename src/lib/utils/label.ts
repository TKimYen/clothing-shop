/**
 * Human-readable labels for the SCREAMING_SNAKE enum values the domain uses.
 *
 * The API contract stores statuses and roles as constants (`PENDING`,
 * `ADMIN`), but those are identifiers, not copy. Rendering them verbatim makes
 * the admin read like a database dump, so every user-facing surface routes its
 * labels through here instead of interpolating the raw value.
 */

/** `PENDING` -> `Pending`, `IN_PROGRESS` -> `In progress`. */
export function humanizeEnum(value: string): string {
  const spaced = value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .toLowerCase();
  if (!spaced) return value;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Order statuses get wording that matches how the team talks about them, rather
 * than a mechanical transform of the constant.
 */
const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPING: "Shipping",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export function formatOrderStatus(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? humanizeEnum(status);
}

/** `ADMIN` -> `Admin`, `CUSTOMER` -> `Customer`. */
export function formatRole(role: string): string {
  return humanizeEnum(role);
}

/**
 * Joins already-humanised labels into a sentence: `A`, `A and B`, then
 * `A, B and C`. Used where a variable number of options is listed in copy.
 */
export function formatList(values: readonly string[]): string {
  if (values.length === 0) return "none";
  if (values.length === 1) return values[0]!;
  return `${values.slice(0, -1).join(", ")} and ${values[values.length - 1]!}`;
}