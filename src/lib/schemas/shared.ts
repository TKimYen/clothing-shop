import { z } from "zod";

/** Trimmed, non-empty string. */
export function requiredText(label: string, max = 200) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

/**
 * Free text that may be empty.
 *
 * Deliberately *not* `.default("")`: a default makes the field optional in the
 * schema's input type, which then disagrees with the string the form controls
 * always supply. Forms normalise "" at the default-values boundary instead.
 */
export function optionalText(max = 2000) {
  return z.string().trim().max(max, `Must be at most ${max} characters`);
}

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120, "Slug must be at most 120 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug may only contain lowercase letters, numbers and single hyphens",
  );

/**
 * Money is stored as a plain `number`, but arrives as a `string` from
 * `<input type="number">`. We validate the *string* first and only then coerce
 * — never `parseFloat` an unvalidated value.
 */
export function moneyString(label: string, min = 0) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a number with at most 2 decimal places`)
    .transform(Number)
    .refine((value) => Number.isFinite(value) && value >= min, {
      message: `${label} must be at least ${min}`,
    });
}

/** Same as {@link moneyString} but an empty string becomes `null`. */
export function optionalMoneyString(label: string) {
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(
      z
        .string()
        .regex(/^\d+(\.\d{1,2})?$/, `${label} must be a number with at most 2 decimal places`)
        .transform(Number)
        .nullable(),
    );
}

export function integerString(label: string, min = 0, max = 1_000_000) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must be a whole number`)
    .transform(Number)
    .refine((value) => value >= min && value <= max, {
      message: `${label} must be between ${min} and ${max}`,
    });
}

/** Same as {@link integerString} but an empty string becomes `null`. */
export function optionalIntegerString(label: string, min = 0, max = 1_000_000) {
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(
      z
        .string()
        .regex(/^\d+$/, `${label} must be a whole number`)
        .transform(Number)
        .refine((value) => value >= min && value <= max, {
          message: `${label} must be between ${min} and ${max}`,
        })
        .nullable(),
    );
}

/**
 * `datetime-local` inputs produce `YYYY-MM-DDTHH:mm` in the browser's wall
 * clock. We pin the read to UTC so the parsed value is identical on server and
 * client (otherwise the browser timezone silently shifts every timestamp).
 */
function parseDateTimeLocal(value: string): Date | null {
  const parsed = new Date(`${value}:00Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

const dateTimeLocalSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .refine((value) => parseDateTimeLocal(value) !== null, {
      message: "Enter a valid date and time",
    })
    .transform((value) => (parseDateTimeLocal(value) as Date).toISOString());

/** Optional datetime: an empty string becomes `null`. */
export function optionalDateTime(label: string) {
  return z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.union([z.null(), dateTimeLocalSchema(label)]));
}

export function requiredDateTime(label: string) {
  return dateTimeLocalSchema(label);
}

export const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Enter a hex colour such as #18212B");

export function urlString(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(2048, "URL is too long")
    // Absolute URLs, or site-relative paths such as `/images/products/a.jpg`.
    .refine((value) => /^\/(?!\/)\S*$/.test(value) || z.url().safeParse(value).success, {
      message: "Enter a valid URL or a path starting with /",
    });
}

/** `[{ message, path }]` -> `{ fieldName: message }` for react-hook-form. */
export function fieldErrorsFromIssues(
  issues: readonly { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
