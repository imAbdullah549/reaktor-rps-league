import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { MatchesPaginatedResponse, MatchesQueryParams } from "@/types/api";
import { ERROR_MESSAGES, SWR_CONFIG } from "@/lib/constants";
import { getAppTimezone } from "@/lib/timezone";
import { useMatchesFiltersSearchParams, useSearchParamsPagination } from "@/hooks";
import { fetchMatches } from "@/api/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader, PageShell } from "@/components/Page";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { matchesColumns } from "./columns";
import { PaginationBar } from "@/components/pagination";
import {
  MatchesFiltersBar,
  type MatchesFiltersValue,
  getDefaultMatchesFilters,
  hasActiveFilter,
  filtersToSummary,
} from "@/components/MatchesFiltersBar";

type MatchesQueryArgs = MatchesFiltersValue & {
  limit: number;
  offset: number;
  timezone: string;
};

function toMatchesQueryParams(args: MatchesQueryArgs): MatchesQueryParams {
  return {
    ...(args.date && { date: args.date }),
    ...(args.from && args.to && { from: args.from, to: args.to }),
    ...((args.player ?? "").trim() && { player: args.player!.trim() }),
    timezone: args.timezone,
    limit: args.limit,
    offset: args.offset,
  };
}

function getEmptyMessage(summary: string | null): string {
  return summary ? `No matches for ${summary}.` : "No matches.";
}

export function MatchesPage() {
  const { filters, setFilters } = useMatchesFiltersSearchParams({
    getDefaultFilters: getDefaultMatchesFilters,
  });
  const { page, limit, offset, setPage, setLimit } = useSearchParamsPagination();

  const timezone = useMemo(() => getAppTimezone(), []);

  const queryArgs = useMemo<MatchesQueryArgs>(
    () => ({
      ...filters,
      limit,
      offset,
      timezone,
    }),
    [filters, limit, offset, timezone]
  );

  const active = hasActiveFilter(filters);
  const summary = filtersToSummary(filters);

  const swrKey = active ? (["matches", queryArgs] as const) : null;
  const { data, error, isLoading, mutate } = useSWR<
    MatchesPaginatedResponse,
    Error,
    readonly [string, MatchesQueryArgs] | null
  >(swrKey, ([, args]) => fetchMatches(toMatchesQueryParams(args)), SWR_CONFIG);

  const matches = data?.matches ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const showContent = !isLoading && !error;
  const hasMatches = matches.length > 0;

  const handleApply = useCallback(
    (next: MatchesFiltersValue) => {
      setFilters(next);
    },
    [setFilters]
  );

  const handleReset = useCallback(() => {
    setFilters(getDefaultMatchesFilters());
  }, [setFilters]);

  return (
    <PageShell
      header={
        <PageHeader
          title="Matches"
          subtitle="Search by date range and/or player name. Use at least one filter."
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
          />
        </CardHeader>

        <CardContent className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {active && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {isLoading && <LoadingSpinner />}
              {error && (
                <ErrorMessage
                  message={error instanceof Error ? error.message : ERROR_MESSAGES.LOAD_MATCHES}
                  onRetry={() => mutate()}
                />
              )}
              {showContent && !hasMatches && <EmptyState message={getEmptyMessage(summary)} />}
              {showContent && hasMatches && (
                <div className="flex flex-col flex-1 min-h-0 gap-4">
                  <DataTable
                    columns={matchesColumns}
                    data={matches}
                    getRowKey={(row) => row.gameId}
                    caption={summary || undefined}
                    scrollable
                  />
                  <PaginationBar
                    total={total}
                    showing={matches.length}
                    page={page}
                    totalPages={totalPages}
                    pageSize={limit}
                    setPage={setPage}
                    setPageSize={setLimit}
                    canPrev={page > 1}
                    canNext={page < totalPages}
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
