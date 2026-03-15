/** Default page size for paginated tables and lists. */
export const DEFAULT_PAGE_SIZE = 25;

/** Allowed page size options for dropdowns. */
export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, 500] as const;

/** Polling interval for "latest" and "today" data (ms). */
export const REFRESH_INTERVAL_MS = 15_000;

/** URL search param keys (consistent across pages). */
export const URL_PARAMS = {
  PAGE: "page",
  LIMIT: "limit",
  DATE: "date",
  FROM: "from",
  TO: "to",
  PLAYER: "player",
} as const;

/** User-facing error messages. */
export const ERROR_MESSAGES = {
  LOAD_MATCHES: "Failed to load matches",
  LOAD_LEADERBOARD: "Failed to load leaderboard",
  VALIDATION_FROM_TO: "From date must be before or equal to To date.",
} as const;

/** Default SWR options for data fetching. */
export const SWR_CONFIG = {
  revalidateOnFocus: true,
  revalidateIfStale: true,
} as const;

/** SWR options for pages that poll (e.g. latest matches, today standings). */
export const SWR_CONFIG_WITH_REFRESH = {
  ...SWR_CONFIG,
  refreshInterval: REFRESH_INTERVAL_MS,
} as const;
