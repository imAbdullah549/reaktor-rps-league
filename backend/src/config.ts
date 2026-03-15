/**
 * Server and app config from env with defaults.
 * Load .env first so config is correct even when imported by modules that load before index.
 */
import "./loadEnv";

export const isProduction = process.env.NODE_ENV === "production";

/** CORS origin: in production use FRONTEND_ORIGIN (comma-separated); else allow all. */
export function getCorsOrigin(): string | string[] | true {
  if (!isProduction) return true;
  const o = process.env.FRONTEND_ORIGIN?.trim();
  if (!o) return true;
  const origins = o
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return origins.length > 0 ? origins : true;
}

export const PORT = ((): number => {
  const p = process.env.PORT;
  if (p == null || p === "") return 3001;
  const n = parseInt(p, 10);
  return Number.isFinite(n) && n > 0 ? n : 3001;
})();

/** 0 = fetch all pages until no cursor; 1–100 = limit pages. */
export const CACHE_MAX_PAGES = ((): number => {
  const n = parseInt(process.env.CACHE_MAX_PAGES ?? "30", 10);
  if (!Number.isFinite(n) || n < 0) return 30;
  if (n === 0) return 0; // load all pages
  return Math.min(100, n);
})();

/** Delay in ms between history page requests (throttle to avoid 429). Default 600. */
export const HISTORY_FETCH_DELAY_MS = ((): number => {
  const n = parseInt(process.env.HISTORY_FETCH_DELAY_MS ?? "600", 10);
  return Number.isFinite(n) && n >= 0 ? n : 600;
})();

/** Max retries when API returns 429. Default 3, cap 5. */
export const HISTORY_429_MAX_RETRIES = ((): number => {
  const n = parseInt(process.env.HISTORY_429_MAX_RETRIES ?? "3", 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(5, n) : 3;
})();

export const DEFAULT_LATEST_LIMIT = 100;
export const MAX_LATEST_LIMIT = 500;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 500;

/** Grace period in ms for graceful shutdown (SIGTERM/SIGINT). Default 10s. */
export const SHUTDOWN_GRACE_MS = ((): number => {
  const n = parseInt(process.env.SHUTDOWN_GRACE_MS ?? "10000", 10);
  return Number.isFinite(n) && n >= 1000 ? Math.min(60000, n) : 10000;
})();

/** Delay in ms before reconnecting to BAD API live stream after disconnect/error. Default 5s. */
export const LIVE_RECONNECT_MS = ((): number => {
  const n = parseInt(process.env.LIVE_RECONNECT_MS ?? "5000", 10);
  return Number.isFinite(n) && n >= 1000 ? Math.min(60000, n) : 5000;
})();
