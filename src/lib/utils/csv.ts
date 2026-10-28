/** Escapes a cell for spreadsheet apps, including formula-injection prefixes. */
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (typeof value === "string" && /^\s*[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n\t]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
