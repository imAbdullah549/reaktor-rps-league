import type { Request, Response } from "express";
import { isCacheLoaded, getCacheSize } from "../cache";
import { sendError } from "../utils/sendError";

/** GET /health — liveness: process is up. Always 200. */
export function health(_req: Request, res: Response): void {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
}

/** GET /ready — readiness: cache loaded, ready for traffic. 200 when ready, 503 when not. */
export function ready(_req: Request, res: Response): void {
  if (!isCacheLoaded()) {
    sendError(res, 503, "Cache not loaded yet", "CACHE_NOT_READY");
    return;
  }
  res.json({
    status: "ready",
    cacheLoaded: true,
    totalMatches: getCacheSize(),
    timestamp: new Date().toISOString(),
  });
}

/** GET /api/status — cache status (always 200). Use in production to see cache without 503. */
export function cacheStatus(_req: Request, res: Response): void {
  res.json({
    cacheLoaded: isCacheLoaded(),
    totalMatches: getCacheSize(),
    timestamp: new Date().toISOString(),
  });
}
