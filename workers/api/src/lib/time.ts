// spec 005 Data model: RFC 3339 UTC with exactly three fractional digits and
// Z, as Date.prototype.toISOString() writes them. Strings in this one form
// sort in time order, so SQL compares them as text.
export const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function iso(ms: number): string {
  return new Date(ms).toISOString();
}

// The time a client sent, or null when it is not exactly the server's form
// (so 2026-02-30 and a missing fraction are both refused).
export function parseTimestamp(text: string): number | null {
  if (!TIMESTAMP.test(text)) return null;
  const ms = Date.parse(text);
  return iso(ms) === text ? ms : null;
}
