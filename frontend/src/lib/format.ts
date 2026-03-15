import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** Format Unix ms timestamp. Uses UTC when VITE_USE_UTC is set (e.g. "Mar 12, 2025, 3:45 PM UTC"); otherwise local time. */
export function formatMatchTime(time: number): string {
  const useUtc = import.meta.env.VITE_USE_UTC === "true" || import.meta.env.VITE_USE_UTC === "1";
  if (useUtc) return dayjs.utc(time).format("MMM D, YYYY, h:mm A [UTC]");
  return dayjs(time).format("MMM D, YYYY, h:mm A");
}

/** Human-readable outcome for a match (winner or draw/invalid). */
export function formatOutcome(
  winner: string,
  playerA: string,
  playerB: string,
  invalidMove?: string
): string {
  if (winner === "draw") return "Draw";
  if (winner === "invalid") {
    if (invalidMove === "A") return `Invalid move: ${playerA}`;
    if (invalidMove === "B") return `Invalid move: ${playerB}`;
    return "Invalid moves";
  }
  if (winner === "A") return `${playerA} wins`;
  if (winner === "B") return `${playerB} wins`;
  return "—";
}
