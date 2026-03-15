import dayjs from "dayjs";

/** Format Unix ms timestamp to local date + time (e.g. "Mar 12, 2025, 3:45 PM"). */
export function formatMatchTime(time: number): string {
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
