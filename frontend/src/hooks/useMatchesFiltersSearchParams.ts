import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { URL_PARAMS } from "@/lib/constants";
import type { MatchesFiltersValue } from "@/components/MatchesFiltersBar";

export interface UseMatchesFiltersSearchParamsOptions {
  /** Returned when URL has no filter params. */
  getDefaultFilters: () => MatchesFiltersValue;
}

/**
 * Matches filter state (date, from, to, player) synced to URL search params.
 * URL is the source of truth; filters are derived from search params.
 */
export function useMatchesFiltersSearchParams({
  getDefaultFilters,
}: UseMatchesFiltersSearchParamsOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo((): MatchesFiltersValue => {
    const date = searchParams.get(URL_PARAMS.DATE) ?? undefined;
    const from = searchParams.get(URL_PARAMS.FROM) ?? undefined;
    const to = searchParams.get(URL_PARAMS.TO) ?? undefined;
    const player = searchParams.get(URL_PARAMS.PLAYER) ?? undefined;
    const hasAny =
      (date && date.trim() !== "") ||
      (from && from.trim() !== "") ||
      (to && to.trim() !== "") ||
      (player != null && player.trim() !== "");
    if (!hasAny) return getDefaultFilters();
    return {
      ...(date?.trim() && { date: date.trim() }),
      ...(from?.trim() && { from: from.trim() }),
      ...(to?.trim() && { to: to.trim() }),
      ...(player != null && { player: player.trim() || undefined }),
    };
  }, [searchParams, getDefaultFilters]);

  const setFilters = useCallback(
    (next: MatchesFiltersValue) => {
      setSearchParams(
        (prev) => {
          const nextParams = new URLSearchParams(prev);
          if (next.date) nextParams.set(URL_PARAMS.DATE, next.date);
          else nextParams.delete(URL_PARAMS.DATE);
          if (next.from) nextParams.set(URL_PARAMS.FROM, next.from);
          else nextParams.delete(URL_PARAMS.FROM);
          if (next.to) nextParams.set(URL_PARAMS.TO, next.to);
          else nextParams.delete(URL_PARAMS.TO);
          if (next.player?.trim()) nextParams.set(URL_PARAMS.PLAYER, next.player.trim());
          else nextParams.delete(URL_PARAMS.PLAYER);
          nextParams.delete(URL_PARAMS.PAGE); // reset pagination when filters change
          return nextParams;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return { filters, setFilters };
}
