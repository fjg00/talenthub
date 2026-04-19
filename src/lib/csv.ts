/**
 * Minimal CSV builder. RFC 4180-ish:
 *   - Fields containing "," | "\"" | "\n" | "\r" are wrapped in double quotes.
 *   - Embedded double quotes are doubled.
 *   - null/undefined become empty strings.
 *   - Arrays are joined with "; ".
 *   - Dates are ISO-serialized.
 *
 * We also prepend a UTF-8 BOM so Excel opens non-ASCII (Arabic, accents) correctly.
 */

export type CsvValue = string | number | boolean | null | undefined | Date | string[];

function escapeField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let str: string;
  if (value instanceof Date) {
    str = value.toISOString();
  } else if (Array.isArray(value)) {
    str = value.join("; ");
  } else {
    str = String(value);
  }

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv<T extends Record<string, CsvValue>>(
  headers: readonly { key: keyof T; label: string }[],
  rows: readonly T[]
): string {
  const BOM = "\uFEFF";
  const lines: string[] = [];
  lines.push(headers.map((h) => escapeField(h.label)).join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeField(row[h.key])).join(","));
  }
  return BOM + lines.join("\r\n");
}

/**
 * Produce a filename-safe slug. Keeps letters/numbers/dash/underscore.
 */
export function slugifyForFilename(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "export"
  );
}

/**
 * Standard headers for a CSV download response.
 */
export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
