import type { Request, Response } from "express";
import {
  DEFAULT_LATEST_LIMIT,
  MAX_LATEST_LIMIT,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../config";
import {
  getLatest,
  getMatchesFiltered,
  getLeaderboardForDateRange,
  getLeaderboardForLocalDay,
  getLeaderboardForLocalDateRange,
} from "../cache";
import { requireCache } from "../middleware/requireCache";
import { sendError } from "../utils/sendError";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(s: string): boolean {
  return DATE_REGEX.test(s.trim());
}

function parseLimitOffset(req: Request): { limit: number; offset: number } {
  const limitRaw = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : NaN;
  const offsetRaw = typeof req.query.offset === "string" ? parseInt(req.query.offset, 10) : NaN;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, limitRaw))
    : DEFAULT_PAGE_SIZE;
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  return { limit, offset };
}

/** GET /api/matches/latest — latest N matches. */
export function matchesLatest(req: Request, res: Response): void {
  const raw = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : NaN;
  const limit = Number.isFinite(raw)
    ? Math.min(MAX_LATEST_LIMIT, Math.max(1, raw))
    : DEFAULT_LATEST_LIMIT;
  res.json({ matches: getLatest(limit) });
}

/** GET /api/matches — unified matches with filters and pagination. */
export function matches(req: Request, res: Response): void {
  const date = typeof req.query.date === "string" ? req.query.date.trim() : "";
  const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
  const to = typeof req.query.to === "string" ? req.query.to.trim() : "";
  const player = typeof req.query.player === "string" ? req.query.player.trim() : "";
  const timezone = typeof req.query.timezone === "string" ? req.query.timezone.trim() : undefined;
  const { limit, offset } = parseLimitOffset(req);

  if (date && !isValidDateString(date)) {
    sendError(res, 400, "date must be YYYY-MM-DD", "BAD_REQUEST");
    return;
  }
  if ((from || to) && (!isValidDateString(from) || !isValidDateString(to))) {
    sendError(res, 400, "from and to must be YYYY-MM-DD", "BAD_REQUEST");
    return;
  }
  if (from && to && from > to) {
    sendError(res, 400, "from must be <= to", "BAD_REQUEST");
    return;
  }

  const list = getMatchesFiltered({
    ...(date && { date }),
    ...(from && to && { from, to }),
    ...(player && { player }),
    ...(timezone && { timezone }),
  });
  const total = list.length;
  const matches = list.slice(offset, offset + limit);
  res.json({ matches, total });
}

/** GET /api/leaderboard/today — today's leaderboard. */
export function leaderboardToday(req: Request, res: Response): void {
  const dateParam = typeof req.query.date === "string" ? req.query.date.trim() : "";
  const today = /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().slice(0, 10);
  const timezone = typeof req.query.timezone === "string" ? req.query.timezone.trim() : undefined;
  const player = typeof req.query.player === "string" ? req.query.player.trim().toLowerCase() : "";
  const { limit, offset } = parseLimitOffset(req);

  let full = timezone
    ? getLeaderboardForLocalDay(today, timezone)
    : getLeaderboardForDateRange(today, today);
  if (player) {
    full = full.filter((e) => e.player.toLowerCase().includes(player));
  }
  const total = full.length;
  const leaderboard = full.slice(offset, offset + limit);
  res.json({ leaderboard, total });
}

/** GET /api/leaderboard — historical leaderboard (from & to required). */
export function leaderboard(req: Request, res: Response): void {
  const from = typeof req.query.from === "string" ? req.query.from.trim() : "";
  const to = typeof req.query.to === "string" ? req.query.to.trim() : "";
  if (!from || !to) {
    sendError(res, 400, "Provide query: from=YYYY-MM-DD&to=YYYY-MM-DD", "BAD_REQUEST");
    return;
  }
  if (!isValidDateString(from) || !isValidDateString(to)) {
    sendError(res, 400, "from and to must be YYYY-MM-DD", "BAD_REQUEST");
    return;
  }
  if (from > to) {
    sendError(res, 400, "from must be <= to", "BAD_REQUEST");
    return;
  }
  const timezone = typeof req.query.timezone === "string" ? req.query.timezone.trim() : undefined;
  const player = typeof req.query.player === "string" ? req.query.player.trim().toLowerCase() : "";
  const { limit, offset } = parseLimitOffset(req);

  let full = timezone
    ? getLeaderboardForLocalDateRange(from, to, timezone)
    : getLeaderboardForDateRange(from, to);
  if (player) {
    full = full.filter((e) => e.player.toLowerCase().includes(player));
  }
  const total = full.length;
  const leaderboard = full.slice(offset, offset + limit);
  res.json({ leaderboard, total });
}

/** Returns middleware array for cache-dependent API routes. */
export function withCache(
  handler: (req: Request, res: Response) => void
): Array<typeof requireCache | typeof handler> {
  return [requireCache, handler];
}
