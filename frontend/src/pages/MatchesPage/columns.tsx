import type { NormalizedMatch, Winner } from "@/types/api";
import { formatMatchTime, formatOutcome } from "@/lib/format";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@/components/DataTable";

function MovePill({ move }: { move: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase",
        move === "ROCK" && "bg-zinc-200 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-200",
        move === "PAPER" && "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
        move === "SCISSORS" && "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
        !["ROCK", "PAPER", "SCISSORS"].includes(move) &&
          "bg-red-100 text-red-700 dark:bg-red-900/40"
      )}
    >
      {move}
    </span>
  );
}

function outcomeClass(winner: Winner): string {
  if (winner === "A" || winner === "B") return "text-emerald-600 dark:text-emerald-400";
  if (winner === "draw") return "text-muted-foreground";
  return "text-red-600 dark:text-red-400";
}

/** Column definitions for the matches table on this page. */
export const matchesColumns: ColumnDef<NormalizedMatch>[] = [
  {
    id: "time",
    header: "Date / Time",
    width: "14%",
    cell: (row) => <TypographySmall>{formatMatchTime(row.time)}</TypographySmall>,
  },
  {
    id: "playerA",
    header: "Player A",
    width: "18%",
    cell: (row) => (
      <span className={cn("font-medium", row.winner === "A" && outcomeClass(row.winner))}>
        {row.playerA}
      </span>
    ),
  },
  {
    id: "moveA",
    header: "Move",
    width: "10%",
    cell: (row) => <MovePill move={row.moveA} />,
  },
  {
    id: "_vs",
    header: "",
    width: "5%",
    cell: () => <TypographyMuted className="text-xs font-semibold">vs</TypographyMuted>,
  },
  {
    id: "playerB",
    header: "Player B",
    width: "18%",
    cell: (row) => (
      <span className={cn("font-medium", row.winner === "B" && outcomeClass(row.winner))}>
        {row.playerB}
      </span>
    ),
  },
  {
    id: "moveB",
    header: "Move",
    width: "10%",
    cell: (row) => <MovePill move={row.moveB} />,
  },
  {
    id: "outcome",
    header: "Outcome",
    width: "25%",
    cell: (row) => (
      <span className={cn("text-xs font-medium", outcomeClass(row.winner))}>
        {formatOutcome(row.winner, row.playerA, row.playerB, row.invalidMove)}
      </span>
    ),
  },
];
