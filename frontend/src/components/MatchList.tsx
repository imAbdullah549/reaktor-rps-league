import type { NormalizedMatch, Winner } from "@/types/api";
import { formatMatchTime, formatOutcome } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MatchListProps {
  matches: NormalizedMatch[];
}

function MovePill({ move }: { move: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        move === "ROCK" && "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
        move === "PAPER" && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        move === "SCISSORS" && "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
        !["ROCK", "PAPER", "SCISSORS"].includes(move) &&
          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      )}
    >
      {move}
    </span>
  );
}

function OutcomeBadge({
  winner,
  playerA,
  playerB,
  invalidMove,
}: {
  winner: Winner;
  playerA: string;
  playerB: string;
  invalidMove?: "A" | "B" | "both";
}) {
  const label = formatOutcome(winner, playerA, playerB, invalidMove);
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-bold",
        (winner === "A" || winner === "B") &&
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        winner === "draw" && "bg-zinc-200 text-zinc-600 dark:bg-zinc-600 dark:text-zinc-300",
        winner === "invalid" && "bg-red-500/15 text-red-600 dark:text-red-400"
      )}
    >
      {label}
    </span>
  );
}

export function MatchList({ matches }: MatchListProps) {
  return (
    <ul className="space-y-4" role="list">
      {matches.map((m) => (
        <li
          key={m.gameId}
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-card shadow-sm",
            "transition-all duration-200 hover:border-primary/30 hover:shadow-md"
          )}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 p-5 items-center">
            {/* Player A */}
            <div className="min-w-0 text-center sm:text-right">
              <p
                className={cn(
                  "truncate text-base font-bold text-foreground",
                  m.winner === "A" && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {m.playerA}
              </p>
              <div className="mt-1.5 flex justify-center sm:justify-end">
                <MovePill move={m.moveA} />
              </div>
            </div>

            {/* VS + outcome */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                vs
              </span>
              <OutcomeBadge
                winner={m.winner}
                playerA={m.playerA}
                playerB={m.playerB}
                invalidMove={m.invalidMove}
              />
            </div>

            {/* Player B */}
            <div className="min-w-0 text-center sm:text-left">
              <p
                className={cn(
                  "truncate text-base font-bold text-foreground",
                  m.winner === "B" && "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {m.playerB}
              </p>
              <div className="mt-1.5 flex justify-center sm:justify-start">
                <MovePill move={m.moveB} />
              </div>
            </div>
          </div>

          <div className="border-t border-border bg-muted/30 px-5 py-2 text-center">
            <p className="text-xs text-muted-foreground">{formatMatchTime(m.time)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
