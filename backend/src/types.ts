/**
 * Types for the BAD API (assignments.reaktor.com).
 * @see docs/API_REFERENCE.md
 */

/** One game result from GET /history (and from GET /live SSE). */
export interface BadApiGameResult {
  type: 'GAME_RESULT';
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
