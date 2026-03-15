import { format, subDays } from "date-fns";

export type MatchesFiltersValue = {
  date?: string;
  from?: string;
  to?: string;
  player?: string;
};

/** Default filters: today's date (no player). Use for Matches page. */
export function getDefaultMatchesFilters(): MatchesFiltersValue {
  return { date: format(new Date(), "yyyy-MM-dd") };
}

/** Default filters: last 7 days range (no player). Use for Past standings page. */
export function getDefaultPastStandingsFilters(): MatchesFiltersValue {
  const today = new Date();
  return {
    from: format(subDays(today, 6), "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
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
