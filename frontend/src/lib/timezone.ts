/**
 * Timezone sent to the API for "today" and date-range queries.
 * Set VITE_USE_UTC=true (e.g. in .env or Vercel) to use UTC for assignment submission; otherwise uses browser timezone.
 */
export function getAppTimezone(): string {
  const useUtc = import.meta.env.VITE_USE_UTC === "true" || import.meta.env.VITE_USE_UTC === "1";
  return useUtc ? "UTC" : Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Today's date (YYYY-MM-DD) in the app timezone. When UTC mode, returns UTC date; otherwise local date. */
export function getAppToday(): string {
  const tz = getAppTimezone();
  if (tz === "UTC") {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Date N days ago (YYYY-MM-DD) in the app timezone. Use for default "from" in date ranges (e.g. last 7 days). */
export function getAppDaysAgo(days: number): string {
  const tz = getAppTimezone();
  const d = new Date();
  if (tz === "UTC") {
    d.setUTCDate(d.getUTCDate() - days);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
