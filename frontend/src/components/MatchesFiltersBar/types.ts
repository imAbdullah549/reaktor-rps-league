import { getAppToday, getAppDaysAgo } from "@/lib/timezone";

export type MatchesFiltersValue = {
  date?: string;
  from?: string;
  to?: string;
  player?: string;
};

/** Default filters: today's date (no player). Use for Matches page. Respects UTC when VITE_USE_UTC is set. */
export function getDefaultMatchesFilters(): MatchesFiltersValue {
  return { date: getAppToday() };
}

/** Default filters: last 7 days range (no player). Use for Past standings page. Respects UTC when VITE_USE_UTC is set. */
export function getDefaultPastStandingsFilters(): MatchesFiltersValue {
  return {
    from: getAppDaysAgo(6),
    to: getAppToday(),
  };
}

export function hasActiveFilter(f: MatchesFiltersValue): boolean {
  if (f.date) return true;
  if (f.from && f.to) return true;
  if ((f.player ?? "").trim()) return true;
  return false;
}

export function filtersToSummary(f: MatchesFiltersValue): string {
  const parts: string[] = [];
  if (f.date) parts.push(f.date);
  if (f.from && f.to) parts.push(`${f.from} – ${f.to}`);
  if (f.player?.trim()) parts.push(`"${f.player.trim()}"`);
  return parts.join(" · ");
}
