/** Game outcome. "invalid" when at least one move is not ROCK/PAPER/SCISSORS. */
export type Winner = "A" | "B" | "draw" | "invalid";

/** Normalized match from API (used by cache and API responses). */
export interface NormalizedMatch {
  gameId: string;
  time: number;
  playerA: string;
  playerB: string;
  moveA: string;
  moveB: string;
  winner: Winner;
  invalidMove?: "A" | "B" | "both";
  date: string;
}

export interface LeaderboardEntry {
  player: string;
  wins: number;
}

export interface MatchesResponse {
  matches: NormalizedMatch[];
}

/** Response from GET /api/matches when using limit/offset (unified API). */
export interface MatchesPaginatedResponse {
  matches: NormalizedMatch[];
  total: number;
}

export interface MatchesQueryParams {
  date?: string;
  from?: string;
  to?: string;
  player?: string;
  /** IANA timezone (e.g. "Europe/Helsinki") for local date/range. */
  timezone?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

/** Response from GET /api/leaderboard/today when using limit/offset (paginated). */
export interface LeaderboardPaginatedResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
}

export interface ApiError {
  error: string;
}
