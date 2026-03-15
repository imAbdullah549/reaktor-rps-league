import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, URL_PARAMS } from "@/lib/constants";

export interface UseSearchParamsPaginationOptions {
  /** Default limit when not in URL or invalid. */
  defaultLimit?: number;
  /** Param key for page (default: "page"). */
  pageKey?: string;
  /** Param key for limit (default: "limit"). */
  limitKey?: string;
}

/**
 * Pagination state synced to URL search params.
 * Use for shareable, bookmarkable page/limit. Validates limit against PAGE_SIZE_OPTIONS.
 */
export function useSearchParamsPagination(options: UseSearchParamsPaginationOptions = {}) {
  const {
    defaultLimit = DEFAULT_PAGE_SIZE,
    pageKey = URL_PARAMS.PAGE,
    limitKey = URL_PARAMS.LIMIT,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const page = useMemo(() => {
    const raw = searchParams.get(pageKey);
    if (raw == null) return 1;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 ? n : 1;
  }, [searchParams, pageKey]);

  const limit = useMemo(() => {
    const raw = searchParams.get(limitKey);
    if (raw == null) return defaultLimit;
    const n = Number(raw);
    return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]) ? n : defaultLimit;
  }, [searchParams, limitKey, defaultLimit]);

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (nextPage <= 1) next.delete(pageKey);
          else next.set(pageKey, String(nextPage));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, pageKey]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (newLimit === defaultLimit) next.delete(limitKey);
          else next.set(limitKey, String(newLimit));
          next.delete(pageKey); // reset to first page when changing size
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams, limitKey, pageKey, defaultLimit]
  );

  const offset = (page - 1) * limit;

  return { page, limit, offset, setPage, setLimit };
}
