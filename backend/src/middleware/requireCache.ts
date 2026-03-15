import type { Request, Response, NextFunction } from "express";
import { isCacheLoaded } from "../cache";
import { sendError } from "../utils/sendError";

/**
 * Middleware that returns 503 if the in-memory cache is not yet loaded.
 * Use on routes that depend on cache (matches, leaderboard).
 */
export function requireCache(_req: Request, res: Response, next: NextFunction): void {
  if (!isCacheLoaded()) {
    sendError(res, 503, "Cache not loaded yet", "CACHE_NOT_READY");
    return;
  }
  next();
}
