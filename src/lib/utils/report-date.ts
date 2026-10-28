/**
 * Reporting calendar helpers.
 *
 * Orders are timestamped in UTC, but the shop reports by Vietnamese calendar
 * day. Vietnam has used a fixed UTC+7 offset since 1975 (no DST), so reporting
 * boundaries can be converted without pulling in a timezone database.
 */
export const REPORT_TIME_ZONE = "Asia/Ho_Chi_Minh";

const REPORT_UTC_OFFSET = "+07:00";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const dateKeyFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? "";
}

/** `Date -> YYYY-MM-DD` in the report timezone. */
export function reportDateKey(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date");
  }
  const parts = dateKeyFormatter.formatToParts(date);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

/** Today's date in the report timezone. */
export function todayReportDate(): string {
  return reportDateKey(new Date());
}

/**
 * Validates a `YYYY-MM-DD` calendar date. Returns the normalized key or `null`
 * when the input is malformed or impossible (e.g. `2026-02-30`).
 */
export function parseReportDate(value: string | null | undefined): string | null {
  if (!value || !DATE_KEY_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00${REPORT_UTC_OFFSET}`);
  if (Number.isNaN(date.getTime()) || reportDateKey(date) !== value) return null;
  return value;
}

/** First instant of a report day, as a UTC `Date` for database filters. */
export function reportDayStart(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00${REPORT_UTC_OFFSET}`);
}

export function addReportDays(dateKey: string, days: number): string {
  return reportDateKey(new Date(reportDayStart(dateKey).getTime() + days * MS_PER_DAY));
}

/** Inclusive number of calendar days between two report dates. */
export function reportDayCount(from: string, to: string): number {
  return Math.round((reportDayStart(to).getTime() - reportDayStart(from).getTime()) / MS_PER_DAY) + 1;
}

/** `YYYY-MM-DD -> DD/MM` without applying another timezone. */
export function reportDayLabel(dateKey: string): string {
  return `${dateKey.slice(8, 10)}/${dateKey.slice(5, 7)}`;
}
