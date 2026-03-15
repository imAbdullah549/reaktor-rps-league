import { useMemo } from "react";
import useSWR from "swr";
import type { LeaderboardPaginatedResponse } from "@/types/api";
import { ERROR_MESSAGES, SWR_CONFIG_WITH_REFRESH } from "@/lib/constants";
import { getAppTimezone, getAppToday } from "@/lib/timezone";
import { useSearchParamsPagination } from "@/hooks";
import { fetchLeaderboardToday } from "@/api/client";
import { DataTable } from "@/components/DataTable";
import { leaderboardColumns } from "@/components/LeaderboardTable";
import { PaginationBar } from "@/components/pagination";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader, PageShell } from "@/components/Page";

type TodayLeaderboardKey = readonly [string, string, string, number, number];

export function TodayStandingsPage() {
  const today = useMemo(() => getAppToday(), []);
  const timezone = useMemo(() => getAppTimezone(), []);
  const { page, limit, offset, setPage, setLimit } = useSearchParamsPagination();

  const swrKey = useMemo<TodayLeaderboardKey>(
    () => ["leaderboard-today", today, timezone, limit, offset],
    [today, timezone, limit, offset]
  );
  const { data, error, isLoading, mutate } = useSWR<
    LeaderboardPaginatedResponse,
    Error,
    TodayLeaderboardKey
  >(
    swrKey,
    ([, date, tz, lim, off]) => fetchLeaderboardToday(date, tz, lim, off),
    SWR_CONFIG_WITH_REFRESH
  );

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data?.leaderboard]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showContent = !isLoading && !error;
  const hasData = leaderboard.length > 0 || total > 0;
  const leaderboardWithRank = useMemo(
    () => leaderboard.map((e, i) => ({ ...e, rank: offset + i + 1 })),
    [leaderboard, offset]
  );

  return (
    <PageShell
      header={
        <PageHeader
          title="Today's standings"
          subtitle="Leaderboard for today's games."
          isUpdating={isLoading}
        />
      }
    >
      <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-hidden">
        {isLoading && <LoadingSpinner />}
        {error && (
          <ErrorMessage
            message={error instanceof Error ? error.message : ERROR_MESSAGES.LOAD_LEADERBOARD}
            onRetry={() => mutate()}
          />
        )}
        {showContent && !hasData && <EmptyState message="No games played today yet." />}
        {showContent && hasData && (
          <>
            <DataTable
              columns={leaderboardColumns}
              data={leaderboardWithRank}
              getRowKey={(row) => row.player}
              scrollable
            />
            <PaginationBar
              total={total}
              showing={leaderboard.length}
              page={page}
              totalPages={totalPages}
              pageSize={limit}
              setPage={setPage}
              setPageSize={setLimit}
              canPrev={page > 1}
              canNext={page < totalPages}
            />
          </>
        )}
      </div>
    </PageShell>
  );
}
