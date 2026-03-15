import type {
  ApiError,
  LeaderboardPaginatedResponse,
  MatchesPaginatedResponse,
  MatchesQueryParams,
  MatchesResponse,
} from "@/types/api";

/** In dev we use /api (Vite proxy). On Vercel set VITE_API_URL to your Railway backend URL + /api (e.g. https://reaktor-rps-league.up.railway.app/api). */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api";

async function request<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof (data as ApiError).error === "string"
        ? (data as ApiError).error
        : `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/** GET /api/matches/latest?limit=N */
export async function fetchLatestMatches(limit = 100): Promise<MatchesResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  return request<MatchesResponse>(`${API_BASE}/matches/latest?${params}`);
}

/** GET /api/matches: date OR from+to, optional player, timezone (IANA), limit, offset. Returns { matches, total }. */
export async function fetchMatches(q: MatchesQueryParams): Promise<MatchesPaginatedResponse> {
  const params = new URLSearchParams();
  if (q.date) params.set("date", q.date);
  if (q.from) params.set("from", q.from);
  if (q.to) params.set("to", q.to);
  if (q.player) params.set("player", q.player.trim());
  if (q.timezone) params.set("timezone", q.timezone);
  if (q.limit !== undefined) params.set("limit", String(q.limit));
  if (q.offset !== undefined) params.set("offset", String(q.offset));
  return request<MatchesPaginatedResponse>(`${API_BASE}/matches?${params}`);
}

/** GET /api/leaderboard/today. Optional date, timezone (IANA), limit, offset. Returns { leaderboard, total }. */
export async function fetchLeaderboardToday(
  date?: string,
  timezone?: string,
  limit?: number,
  offset?: number
): Promise<LeaderboardPaginatedResponse> {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (timezone) params.set("timezone", timezone);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  const qs = params.toString();
  const url = qs ? `${API_BASE}/leaderboard/today?${qs}` : `${API_BASE}/leaderboard/today`;
  return request<LeaderboardPaginatedResponse>(url);
}

/** GET /api/leaderboard?from=&to=. Optional timezone (IANA), player, limit, offset. Returns { leaderboard, total }. */
export async function fetchLeaderboardHistorical(
  from: string,
  to: string,
  timezone?: string,
  limit?: number,
  offset?: number,
  player?: string
): Promise<LeaderboardPaginatedResponse> {
  const params = new URLSearchParams({ from, to });
  if (timezone) params.set("timezone", timezone);
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  if (player?.trim()) params.set("player", player.trim());
  return request<LeaderboardPaginatedResponse>(`${API_BASE}/leaderboard?${params}`);
}
