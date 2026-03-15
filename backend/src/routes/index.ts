import type { Express } from "express";
import { isProduction } from "../config";
import { health, ready, cacheStatus } from "./health";
import * as dev from "./dev";
import * as api from "./api";

export function registerRoutes(app: Express): void {
  app.get("/health", health);
  app.get("/ready", ready);
  app.get("/api/status", cacheStatus);

  if (!isProduction) {
    app.get("/dev/fetch-history", dev.fetchHistory);
    app.get("/dev/fetch-history-page", dev.fetchHistoryPageByCursor);
    app.get("/dev/normalize-first", dev.normalizeFirst);
    app.get("/dev/cache-verify", dev.cacheVerify);
  }

  app.get("/api/matches/latest", ...api.withCache(api.matchesLatest));
  app.get("/api/matches", ...api.withCache(api.matches));
  app.get("/api/leaderboard/today", ...api.withCache(api.leaderboardToday));
  app.get("/api/leaderboard", ...api.withCache(api.leaderboard));
}
