import type { Request, Response } from "express";
import { fetchHistoryPage } from "../badApi";
import { normalizeGameResult } from "../gameLogic";
import {
  isCacheLoaded,
  getCacheSize,
  getLatest,
  getByDate,
  getByPlayer,
  getLeaderboardForDateRange,
} from "../cache";
import { sendError } from "../utils/sendError";

/** GET /dev/fetch-history — first page from BAD API. */
export async function fetchHistory(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const page = await fetchHistoryPage();
    res.json({
      message: "First page from BAD API /history",
      dataLength: page.data.length,
      hasNextCursor: Boolean(page.cursor),
      data: page.data,
      cursor: page.cursor,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(res, 500, message, "BAD_API_ERROR");
  }
}

/**
 * GET /dev/fetch-history-page?cursor=XXX — fetch one history page by cursor (test a specific page).
 * cursor: full path (e.g. /history?cursor=w8xWxhoa_ai0) or just the value (e.g. w8xWxhoa_ai0).
 * Omit cursor for first page.
 */
export async function fetchHistoryPageByCursor(req: Request, res: Response): Promise<void> {
  try {
    const raw = (req.query.cursor as string) ?? "";
    const cursor = raw.startsWith("/") ? raw : raw ? `/history?cursor=${raw}` : undefined;
    const page = await fetchHistoryPage(cursor);
    res.json({
      message: cursor ? "Page from BAD API (by cursor)" : "First page from BAD API /history",
      requestedCursor: raw || "(none)",
      dataLength: page.data.length,
      hasNextCursor: Boolean(page.cursor?.trim()),
      nextCursor: page.cursor ?? null,
      data: page.data,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(res, 500, message, "BAD_API_ERROR");
  }
}

/** GET /dev/normalize-first — first game normalized. */
export async function normalizeFirst(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const page = await fetchHistoryPage();
    const first = page.data[0];
    if (!first) {
      res.json({ message: "No games in first page", normalized: null });
      return;
    }
    const normalized = normalizeGameResult(first);
    res.json({
      message: "First game normalized (Step 3)",
      raw: first,
      normalized,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendError(res, 500, message, "BAD_API_ERROR");
  }
}

/** GET /dev/cache-verify — cache stats, first/last match, and one invalid-move match. */
export function cacheVerify(_req: Request, res: Response): void {
  if (!isCacheLoaded()) {
    sendError(res, 503, "Cache not loaded yet", "CACHE_NOT_READY");
    return;
  }
  const total = getCacheSize();
  const all = getLatest(total);
  const firstMatch = all.length > 0 ? all[all.length - 1] : null; // chronologically first (oldest)
  const lastMatch = all.length > 0 ? all[0] : null; // chronologically last (newest)
  const oneInvalidMoveMatch = all.find((m) => m.winner === "invalid") ?? null;

  const today = new Date().toISOString().slice(0, 10);
  res.json({
    message: "Cache verification (Step 4)",
    totalMatches: total,
    firstMatch,
    lastMatch,
    oneInvalidMoveMatch,
    latest5: getLatest(5),
    byDateSample: getByDate(today).length,
    byPlayerSample: getByPlayer("Kim").length,
    leaderboardToday: getLeaderboardForDateRange(today, today).slice(0, 10),
  });
}
