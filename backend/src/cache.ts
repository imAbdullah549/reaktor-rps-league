/**
 * In-memory cache of normalized matches. Load from BAD API on startup; expose getters and leaderboard.
 * Maintains a date index for fast by-date and date-range queries.
 * Supports incremental load: server can be up while history is fetched page-by-page.
 *
 * Ordering: We sort at read time (in getMatchesFiltered and getMatchesByDateRange) so results are
 * always newest-first. We do not maintain date order in the cache on every write (e.g. addMatch),
 * so order stays correct regardless of bulk load, incremental load, or live stream adds.
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { BadApiGameResult, NormalizedMatch } from "./types";
import { fetchHistoryPage, sleep } from "./badApi";
import { HISTORY_FETCH_DELAY_MS } from "./config";
import { normalizeGameResult } from "./gameLogic";

dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns UTC ms range [startMs, endMs] for one local calendar day in the given IANA timezone.
 * Returns null if date invalid or timezone missing/invalid.
 */
function localDayToUtcRange(
  dateStr: string,
  timezone: string
): { startMs: number; endMs: number } | null {
  const s = dateStr.trim();
  const tz = timezone?.trim();
  if (!DATE_ONLY_REGEX.test(s) || !dayjs(s, "YYYY-MM-DD", true).isValid() || !tz) return null;
  try {
    const start = dayjs.tz(`${s} 00:00:00`, tz);
    const end = dayjs.tz(`${s} 23:59:59.999`, tz);
    if (start.isValid() && end.isValid()) return { startMs: start.valueOf(), endMs: end.valueOf() };
  } catch {
    return null;
  }
  return null;
}

/**
 * Returns UTC ms range for a local date range [fromStr, toStr] (inclusive) in the given IANA timezone.
 */
function localDateRangeToUtc(
  fromStr: string,
  toStr: string,
  timezone: string
): { startMs: number; endMs: number } | null {
  const from = fromStr.trim();
  const to = toStr.trim();
  const tz = timezone?.trim();
  if (!DATE_ONLY_REGEX.test(from) || !dayjs(from, "YYYY-MM-DD", true).isValid()) return null;
  if (!DATE_ONLY_REGEX.test(to) || !dayjs(to, "YYYY-MM-DD", true).isValid()) return null;
  if (from > to || !tz) return null;
  try {
    const start = dayjs.tz(`${from} 00:00:00`, tz);
    const end = dayjs.tz(`${to} 23:59:59.999`, tz);
    if (start.isValid() && end.isValid()) return { startMs: start.valueOf(), endMs: end.valueOf() };
  } catch {
    return null;
  }
  return null;
}

const matches: NormalizedMatch[] = [];
/** Set of gameIds already in cache — ensures no duplicates from history or live. */
const gameIds = new Set<string>();
/** Index by date (YYYY-MM-DD) for fast getByDate and getMatchesByDateRange. */
const byDateIndex = new Map<string, NormalizedMatch[]>();
let loaded = false;

export interface LeaderboardEntry {
  player: string;
  wins: number;
}

function clearCache(): void {
  matches.length = 0;
  gameIds.clear();
  byDateIndex.clear();
}

/**
 * Merge raw games into cache (normalize, dedupe by gameId, re-sort, rebuild date index).
 * Does not clear first; use for append (incremental load).
 */
function mergeRawIntoCache(raw: BadApiGameResult[]): void {
  for (const game of raw) {
    const m = normalizeGameResult(game);
    if (gameIds.has(m.gameId)) continue;
    gameIds.add(m.gameId);
    matches.push(m);
  }
  matches.sort((a, b) => b.time - a.time);
  byDateIndex.clear();
  for (const m of matches) {
    const list = byDateIndex.get(m.date) ?? [];
    list.push(m);
    byDateIndex.set(m.date, list);
  }
}

/**
 * Appends a batch of raw games to the cache (normalize, dedupe, re-sort, rebuild date index).
 * Sets loaded = true so API can serve data immediately. Used by incremental load.
 */
function appendRawGames(raw: BadApiGameResult[]): void {
  mergeRawIntoCache(raw);
  loaded = true;
}

/**
 * Loads all history pages in the background, one page at a time. Cache is usable after the first page.
 * Call this without awaiting so the server can serve partial data while loading.
 */
export async function loadAllHistoryIncremental(): Promise<void> {
  clearCache();
  loaded = false;

  console.log("BAD API: fetching all history pages (incremental)...");
  let cursor: string | undefined;
  let pageNum = 0;

  for (;;) {
    const response = await fetchHistoryPage(cursor);
    appendRawGames(response.data);
    pageNum += 1;
    const nextCursor = response.cursor?.trim();
    console.log(
      `BAD API:   page ${pageNum} — ${response.data.length} games (${matches.length} total in cache)${nextCursor ? ", more pages" : ", last page"}. next cursor: ${nextCursor ?? "(none)"}`
    );
    if (!nextCursor) break;
    if (HISTORY_FETCH_DELAY_MS > 0) await sleep(HISTORY_FETCH_DELAY_MS);
    cursor = response.cursor;
  }
  console.log(`BAD API: done. ${pageNum} page(s), ${matches.length} games.`);
  console.log(`Cache: ready. ${matches.length} matches, ${byDateIndex.size} date(s).`);
}

/**
 * Loads up to maxPages of history in the background, one page at a time. Cache is usable after the first page.
 * Call this without awaiting so the server can serve partial data while loading.
 */
export async function loadHistoryIncremental(maxPages: number): Promise<void> {
  clearCache();
  loaded = false;

  console.log(`BAD API: fetching up to ${maxPages} history page(s) (incremental)...`);
  let cursor: string | undefined;
  let pageNum = 0;

  while (pageNum < maxPages) {
    const response = await fetchHistoryPage(cursor);
    appendRawGames(response.data);
    pageNum += 1;
    const nextCursor = response.cursor?.trim();
    console.log(
      `BAD API:   page ${pageNum} — ${response.data.length} games (${matches.length} total in cache)${nextCursor ? ", more pages" : ", last page"}. next cursor: ${nextCursor ?? "(none)"}`
    );
    if (!nextCursor) break;
    if (HISTORY_FETCH_DELAY_MS > 0) await sleep(HISTORY_FETCH_DELAY_MS);
    cursor = response.cursor;
  }
  console.log(`BAD API: done. ${pageNum} page(s), ${matches.length} games.`);
  console.log(`Cache: ready. ${matches.length} matches, ${byDateIndex.size} date(s).`);
}

/**
 * Appends one match from the live stream. No-op if gameId already in cache (no duplicates).
 * Keeps matches sorted by time descending and updates the date index.
 * @returns true if the match was added, false if it was a duplicate.
 */
export function addMatch(m: NormalizedMatch): boolean {
  if (gameIds.has(m.gameId)) return false;
  gameIds.add(m.gameId);
  const idx = matches.findIndex((x) => x.time < m.time);
  if (idx === -1) {
    matches.push(m);
  } else {
    matches.splice(idx, 0, m);
  }
  const list = byDateIndex.get(m.date) ?? [];
  list.unshift(m);
  byDateIndex.set(m.date, list);
  return true;
}

export function isCacheLoaded(): boolean {
  return loaded;
}

export function getByDate(date: string): NormalizedMatch[] {
  return [...(byDateIndex.get(date) ?? [])];
}

export function getByPlayer(nameSubstring: string): NormalizedMatch[] {
  const q = nameSubstring.trim().toLowerCase();
  if (!q) return [];
  return matches.filter(
    (m) => m.playerA.toLowerCase().includes(q) || m.playerB.toLowerCase().includes(q)
  );
}

export function getLatest(limit: number): NormalizedMatch[] {
  return matches.slice(0, Math.max(0, limit));
}

/**
 * Returns matches with date in [from, to] (inclusive). Dates are YYYY-MM-DD. Uses date index.
 * Returns newest first: dates iterated descending, each date's list is already newest-first.
 */
export function getMatchesByDateRange(from: string, to: string): NormalizedMatch[] {
  const result: NormalizedMatch[] = [];
  const datesInRange: string[] = [];
  for (const [date] of byDateIndex) {
    if (date >= from && date <= to) datesInRange.push(date);
  }
  datesInRange.sort((a, b) => b.localeCompare(a)); // newest date first
  for (const date of datesInRange) {
    result.push(...(byDateIndex.get(date) ?? []));
  }
  return result;
}

/**
 * Returns matches that fall on one calendar day in the given IANA timezone (e.g. "March 13" = midnight–midnight local).
 * @param dateStr - "YYYY-MM-DD" (the date the user picked).
 * @param timezone - IANA timezone (e.g. "Europe/Helsinki"). If missing/invalid, falls back to UTC date.
 */
export function getMatchesForLocalDay(dateStr: string, timezone: string): NormalizedMatch[] {
  const range = localDayToUtcRange(dateStr, timezone);
  if (!range) return getByDate(dateStr);
  return matches.filter((m) => m.time >= range.startMs && m.time <= range.endMs);
}

/**
 * Returns matches that fall in a date range in the given IANA timezone (from/to = local calendar days).
 */
export function getMatchesInLocalDateRange(
  fromStr: string,
  toStr: string,
  timezone: string
): NormalizedMatch[] {
  const range = localDateRangeToUtc(fromStr, toStr, timezone);
  if (!range) return getMatchesByDateRange(fromStr, toStr);
  return matches.filter((m) => m.time >= range.startMs && m.time <= range.endMs);
}

export interface MatchesFilter {
  date?: string;
  from?: string;
  to?: string;
  player?: string;
  /** IANA timezone (e.g. "Europe/Helsinki") for local date/range interpretation. */
  timezone?: string;
}

/**
 * Returns matches matching all given filters (date or from+to, optionally player). Combined filters supported.
 * Result is sorted newest first (by time descending). Use with limit/offset for pagination.
 */
export function getMatchesFiltered(filter: MatchesFilter): NormalizedMatch[] {
  let list: NormalizedMatch[];
  const tz = filter.timezone?.trim();

  if (filter.date) {
    list = tz ? getMatchesForLocalDay(filter.date, tz) : getByDate(filter.date);
  } else if (filter.from && filter.to) {
    list = tz
      ? getMatchesInLocalDateRange(filter.from, filter.to, tz)
      : getMatchesByDateRange(filter.from, filter.to);
  } else {
    list = [...matches];
  }

  if (filter.player && filter.player.trim()) {
    const q = filter.player.trim().toLowerCase();
    list = list.filter(
      (m) => m.playerA.toLowerCase().includes(q) || m.playerB.toLowerCase().includes(q)
    );
  }
  // Sort at read time: guarantee newest-first (UTC time) regardless of cache build or live-add order
  list.sort((a, b) => b.time - a.time);
  return list;
}

/** Normalize player name for grouping: trim and collapse internal spaces so "Sofia  Garcia" and "Sofia Garcia" count together. */
function normalizePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Computes leaderboard from given matches: rank by wins (only winner A or B counts as a win for that player).
 * Player names are normalized (trim + collapse spaces) so slight API variations group under one entry.
 */
function computeLeaderboard(matchList: NormalizedMatch[]): LeaderboardEntry[] {
  const byKey = new Map<string, { wins: number; displayName: string }>();
  for (const m of matchList) {
    if (m.winner === "A") {
      const key = normalizePlayerName(m.playerA);
      const cur = byKey.get(key);
      if (cur) {
        cur.wins += 1;
      } else {
        byKey.set(key, { wins: 1, displayName: m.playerA.trim() });
      }
    } else if (m.winner === "B") {
      const key = normalizePlayerName(m.playerB);
      const cur = byKey.get(key);
      if (cur) {
        cur.wins += 1;
      } else {
        byKey.set(key, { wins: 1, displayName: m.playerB.trim() });
      }
    }
  }
  return Array.from(byKey.values())
    .map(({ displayName, wins }) => ({ player: displayName, wins }))
    .sort((a, b) => b.wins - a.wins);
}

/**
 * Leaderboard for a date range (e.g. today: from = to = today YYYY-MM-DD).
 * Uses stored UTC date on matches.
 */
export function getLeaderboardForDateRange(from: string, to: string): LeaderboardEntry[] {
  return computeLeaderboard(getMatchesByDateRange(from, to));
}

/**
 * Leaderboard for one calendar day in the given IANA timezone.
 * @param dateStr - "YYYY-MM-DD" (the local date, e.g. user's "today").
 * @param timezone - IANA timezone (e.g. "Europe/Helsinki").
 */
export function getLeaderboardForLocalDay(dateStr: string, timezone: string): LeaderboardEntry[] {
  const range = localDayToUtcRange(dateStr, timezone);
  if (!range) return getLeaderboardForDateRange(dateStr, dateStr);
  const inRange = matches.filter((m) => m.time >= range.startMs && m.time <= range.endMs);
  return computeLeaderboard(inRange);
}

/**
 * Leaderboard for a date range in the given IANA timezone (from/to = local calendar days).
 * @param fromStr - "YYYY-MM-DD" (start day, inclusive).
 * @param toStr - "YYYY-MM-DD" (end day, inclusive).
 * @param timezone - IANA timezone (e.g. "Europe/Helsinki").
 */
export function getLeaderboardForLocalDateRange(
  fromStr: string,
  toStr: string,
  timezone: string
): LeaderboardEntry[] {
  const range = localDateRangeToUtc(fromStr, toStr, timezone);
  if (!range) return getLeaderboardForDateRange(fromStr, toStr);
  const inRange = matches.filter((m) => m.time >= range.startMs && m.time <= range.endMs);
  return computeLeaderboard(inRange);
}

export function getCacheSize(): number {
  return matches.length;
}
