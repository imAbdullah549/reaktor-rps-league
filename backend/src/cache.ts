/**
 * In-memory cache of normalized matches. Load from BAD API on startup; expose getters and leaderboard.
 * Maintains a date index for fast by-date and date-range queries.
 */

import type { NormalizedMatch } from './types';
import { fetchHistoryPages } from './badApi';
import { normalizeGameResult } from './gameLogic';

const matches: NormalizedMatch[] = [];
/** Index by date (YYYY-MM-DD) for fast getByDate and getMatchesByDateRange. */
const byDateIndex = new Map<string, NormalizedMatch[]>();
let loaded = false;

export interface LeaderboardEntry {
  player: string;
  wins: number;
}

/**
 * Loads up to maxPages of history from BAD API, normalizes each game, stores in memory.
 * Idempotent: replaces cache content (does not append). Builds date index for fast by-date queries.
 */
export async function loadHistory(maxPages: number): Promise<void> {
  const raw = await fetchHistoryPages(maxPages);
  matches.length = 0;
  byDateIndex.clear();
  for (const game of raw) {
    const m = normalizeGameResult(game);
    matches.push(m);
    const list = byDateIndex.get(m.date) ?? [];
    list.push(m);
    byDateIndex.set(m.date, list);
  }
  loaded = true;
}

export function isCacheLoaded(): boolean {
  return loaded;
}

export function getAllMatches(): NormalizedMatch[] {
  return [...matches];
}

export function getByDate(date: string): NormalizedMatch[] {
  return [...(byDateIndex.get(date) ?? [])];
}

export function getByPlayer(nameSubstring: string): NormalizedMatch[] {
  const q = nameSubstring.trim().toLowerCase();
  if (!q) return [];
  return matches.filter(
    (m) =>
      m.playerA.toLowerCase().includes(q) || m.playerB.toLowerCase().includes(q)
  );
}

export function getLatest(limit: number): NormalizedMatch[] {
  return matches.slice(0, Math.max(0, limit));
}

/**
 * Returns matches with date in [from, to] (inclusive). Dates are YYYY-MM-DD. Uses date index.
 */
export function getMatchesByDateRange(
  from: string,
  to: string
): NormalizedMatch[] {
  const result: NormalizedMatch[] = [];
  for (const [date, list] of byDateIndex) {
    if (date >= from && date <= to) result.push(...list);
  }
  return result;
}

/**
 * Computes leaderboard from given matches: rank by wins (only winner A or B counts as a win for that player).
 */
export function computeLeaderboard(
  matchList: NormalizedMatch[]
): LeaderboardEntry[] {
  const wins = new Map<string, number>();
  for (const m of matchList) {
    if (m.winner === 'A') {
      wins.set(m.playerA, (wins.get(m.playerA) ?? 0) + 1);
    } else if (m.winner === 'B') {
      wins.set(m.playerB, (wins.get(m.playerB) ?? 0) + 1);
    }
  }
  return Array.from(wins.entries())
    .map(([player, winsCount]) => ({ player, wins: winsCount }))
    .sort((a, b) => b.wins - a.wins);
}

/**
 * Leaderboard for a date range (e.g. today: from = to = today YYYY-MM-DD).
 */
export function getLeaderboardForDateRange(
  from: string,
  to: string
): LeaderboardEntry[] {
  return computeLeaderboard(getMatchesByDateRange(from, to));
}

export function getCacheSize(): number {
  return matches.length;
}
