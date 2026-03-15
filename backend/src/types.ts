/**
 * Types for the BAD API (assignments.reaktor.com).
 * @see docs/API_REFERENCE.md
 */

/** One game result from GET /history (and from GET /live SSE). */
export interface BadApiGameResult {
  type: "GAME_RESULT";
  gameId: string;
  time: number; // Unix timestamp, milliseconds
  playerA: { name: string; played: string };
  playerB: { name: string; played: string };
}

/** Response shape of GET /history (one page). */
export interface BadApiHistoryResponse {
  data: BadApiGameResult[];
  cursor?: string; // e.g. "/history?cursor=XXX"; absent or empty when no next page
}

/** Game outcome. "invalid" when at least one move is not ROCK/PAPER/SCISSORS so draw stats stay clean. */
export type Winner = "A" | "B" | "draw" | "invalid";

/** Who had the invalid move; only set when winner is "invalid". */
export type InvalidMove = "A" | "B" | "both";

/** Normalized match after computing winner and date (used by cache and API). */
export interface NormalizedMatch {
  gameId: string;
  time: number;
  playerA: string;
  playerB: string;
  moveA: string;
  moveB: string;
  winner: Winner;
  invalidMove?: InvalidMove;
  date: string; // YYYY-MM-DD
}
