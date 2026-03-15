import useSWR from "swr";
import type { MatchesResponse } from "@/types/api";
import { ERROR_MESSAGES, PAGE_SIZE_OPTIONS, SWR_CONFIG_WITH_REFRESH } from "@/lib/constants";
import { useSearchParamsPagination } from "@/hooks";
import { fetchLatestMatches } from "@/api/client";
import { MatchList } from "@/components/MatchList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell, PageHeader } from "@/components/Page";

function getSubtitle(isLoading: boolean, matchCount: number | undefined): string {
  if (isLoading) return "Latest matches. Loading…";
  if (matchCount != null && matchCount > 0) {
    return `Latest matches. Currently showing ${matchCount}.`;
  }
  return "Latest matches. Choose how many to show.";
}

export function RecentMatchesPage() {
  const { limit, setLimit } = useSearchParamsPagination();
  const { data, error, isLoading, mutate } = useSWR<MatchesResponse, Error>(
    ["matches-latest", limit],
    ([, lim]) => fetchLatestMatches(lim as number),
    SWR_CONFIG_WITH_REFRESH
  );

  const matches = data?.matches;
  const matchCount = matches?.length;
  const subtitle = getSubtitle(isLoading, matchCount);
  const showContent = !isLoading && !error;
  const hasMatches = (matchCount ?? 0) > 0;

  return (
    <PageShell
      header={
        <PageHeader
          title="Recent matches"
          subtitle={subtitle}
          isUpdating={isLoading}
          actions={
            <div className="shrink-0 mb-4 flex flex-wrap items-center gap-3">
              <label htmlFor="recent-limit" className="text-sm text-muted-foreground">
                Show
              </label>
              <select
                id="recent-limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                aria-label="Number of matches to show"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">matches</span>
            </div>
          }
        />
      }
    >
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {isLoading && <LoadingSpinner />}
        {error && (
          <ErrorMessage
            message={error instanceof Error ? error.message : ERROR_MESSAGES.LOAD_MATCHES}
            onRetry={() => mutate()}
          />
        )}
        {showContent && !hasMatches && <EmptyState message="No matches found." />}
        {showContent && hasMatches && matches && (
          <ScrollArea className="flex-1 min-h-0">
            <MatchList matches={matches} />
          </ScrollArea>
        )}
      </div>
    </PageShell>
  );
}
