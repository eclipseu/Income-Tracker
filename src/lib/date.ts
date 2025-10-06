// Local date utilities to avoid UTC off-by-one issues

/**
 * Format a Date object as a local YYYY-MM-DD string (no timezone conversion).
 */
export function formatLocalYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Compare a Date to a YYYY-MM-DD date string using local time.
 */
export function isSameLocalDay(date: Date, ymd: string): boolean {
  return formatLocalYMD(date) === ymd;
}
