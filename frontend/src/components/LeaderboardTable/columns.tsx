import type { LeaderboardEntry } from "@/types/api";
import type { ColumnDef } from "@/components/DataTable";

/** Row shape for leaderboard table: entry + 1-based rank. */
export type LeaderboardRow = LeaderboardEntry & { rank: number };

/** Column definitions for the leaderboard table. Use with DataTable + data from API with rank added. */
export const leaderboardColumns: ColumnDef<LeaderboardRow>[] = [
  {
    id: "rank",
    header: "#",
    cell: (row) => <span className="text-muted-foreground">{row.rank}</span>,
  },
  {
    id: "player",
    header: "Player",
    cell: (row) => <span className="font-medium">{row.player}</span>,
  },
  {
    id: "wins",
    header: "Wins",
    cell: (row) => <span>{row.wins}</span>,
  },
];
