import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import type { LeaderboardPaginatedResponse, MatchesPaginatedResponse } from "@/types/api";
import { ERROR_MESSAGES, SWR_CONFIG } from "@/lib/constants";
import { getAppTimezone } from "@/lib/timezone";
import { useMatchesFiltersSearchParams, useSearchParamsPagination } from "@/hooks";
import { fetchLeaderboardHistorical, fetchMatches } from "@/api/client";
import { PageHeader, PageShell } from "@/components/Page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { leaderboardColumns } from "@/components/LeaderboardTable";
import { PaginationBar } from "@/components/pagination";
import {
  MatchesFiltersBar,
  type MatchesFiltersValue,
  getDefaultPastStandingsFilters,
  hasActiveFilter,
} from "@/components/MatchesFiltersBar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";

/** Resolve from/to for API from filters (single date → same from and to). */
function queryRange(f: MatchesFiltersValue): { from: string; to: string } | null {
  const from = f.from ?? f.date ?? "";
  const to = f.to ?? f.date ?? "";
  if (!from || !to) return null;
  return { from, to };
}

type LeaderboardHistoricalKey = readonly [
  string,
  string,
  string,
  string | undefined,
  string,
  number,
  number,
];
type MatchesHistoricalKey = readonly [string, string, string, string, number, number];

export function PastStandingsPage() {
  const [validationError, setValidationError] = useState<string | null>(null);
  const { filters, setFilters } = useMatchesFiltersSearchParams({
    getDefaultFilters: getDefaultPastStandingsFilters,
  });
  const {
    page: leaderboardPage,
    limit: leaderboardPageSize,
    offset: leaderboardOffset,
    setPage: setLeaderboardPage,
    setLimit: setLeaderboardPageSize,
  } = useSearchParamsPagination();

  const timezone = useMemo(() => getAppTimezone(), []);
  const range = useMemo(() => queryRange(filters), [filters]);
  const active = hasActiveFilter(filters) && range !== null;

  const leaderboardKey = useMemo<LeaderboardHistoricalKey | null>(
    () =>
      active && range
        ? [
            "leaderboard-historical",
            range.from,
            range.to,
            filters.player,
            timezone,
            leaderboardPageSize,
            leaderboardOffset,
          ]
        : null,
    [active, range, filters.player, timezone, leaderboardPageSize, leaderboardOffset]
  );

  const { data, error, isLoading, mutate } = useSWR<
    LeaderboardPaginatedResponse,
    Error,
    LeaderboardHistoricalKey | null
  >(
    leaderboardKey,
    ([, from, to, player, tz, limit, offset]) =>
      fetchLeaderboardHistorical(from, to, tz, limit, offset, player ?? undefined),
    SWR_CONFIG
  );

  const leaderboard = useMemo(() => data?.leaderboard ?? [], [data?.leaderboard]);
  const leaderboardTotal = data?.total ?? 0;
  const leaderboardTotalPages = Math.max(1, Math.ceil(leaderboardTotal / leaderboardPageSize));
  const leaderboardWithRank = useMemo(
    () =>
      leaderboard.map((e, i) => ({
        ...e,
        rank: leaderboardOffset + i + 1,
      })),
    [leaderboard, leaderboardOffset]
  );

  const matchesKey = useMemo<MatchesHistoricalKey | null>(
    () => (active && range ? ["matches-historical", range.from, range.to, timezone, 25, 0] : null),
    [active, range, timezone]
  );

  useSWR<MatchesPaginatedResponse, Error, MatchesHistoricalKey | null>(
    matchesKey,
    ([, from, to, tz, limit, offset]) =>
      fetchMatches({
        from,
        to,
        timezone: tz,
        limit,
        offset,
      }),
    SWR_CONFIG
  );

  const showContent = !isLoading && !error;
  const hasLeaderboardData = leaderboardTotal > 0;

  const handleApply = useCallback(
    (next: MatchesFiltersValue) => {
      const r = queryRange(next);
      if (r && r.from > r.to) {
        setValidationError(ERROR_MESSAGES.VALIDATION_FROM_TO);
        return;
      }
      setValidationError(null);
      setFilters(next);
    },
    [setFilters]
  );

  const handleReset = useCallback(() => {
    setFilters(getDefaultPastStandingsFilters());
    setValidationError(null);
  }, [setFilters]);

  return (
    <PageShell
      header={
        <PageHeader
          title="Past standings"
          subtitle="Leaderboard and matches for a date range. Default: last 7 days."
          isUpdating={isLoading}
        />
      }
    >
      <Card className="flex-1 flex-col min-h-0">
        <CardHeader className="space-y-3">
          <MatchesFiltersBar
            value={filters}
            disabled={isLoading}
            onApply={handleApply}
            onReset={handleReset}
            validationError={validationError}
          />
        </CardHeader>

        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {!active && <EmptyState message="Choose a date range and click Apply filters." />}
          {active && range && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {isLoading && <LoadingSpinner />}
              {error && (
                <ErrorMessage
                  message={error instanceof Error ? error.message : ERROR_MESSAGES.LOAD_LEADERBOARD}
                  onRetry={() => mutate()}
                />
              )}
              {showContent && !hasLeaderboardData && (
                <EmptyState message="No games in this date range." />
              )}
              {showContent && hasLeaderboardData && (
                <div className="flex flex-col flex-1 min-h-0 gap-4">
                  <DataTable
                    columns={leaderboardColumns}
                    data={leaderboardWithRank}
                    getRowKey={(row) => row.player}
                    scrollable
                  />
                  <PaginationBar
                    total={leaderboardTotal}
                    showing={leaderboard.length}
                    page={leaderboardPage}
                    totalPages={leaderboardTotalPages}
                    pageSize={leaderboardPageSize}
                    setPage={setLeaderboardPage}
                    setPageSize={setLeaderboardPageSize}
                    canPrev={leaderboardPage > 1}
                    canNext={leaderboardPage < leaderboardTotalPages}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
