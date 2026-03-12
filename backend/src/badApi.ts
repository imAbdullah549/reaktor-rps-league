/**
 * Client for the BAD API (assignments.reaktor.com).
 * Fetches history pages; no cache. Token from env BEARER_TOKEN.
 */

import type { BadApiHistoryResponse } from './types';

const BAD_API_BASE = 'https://assignments.reaktor.com';

function getAuthHeader(): string {
  const token = process.env.BEARER_TOKEN;
  if (!token || token.trim() === '') {
    throw new Error('BEARER_TOKEN is not set or empty. Add it to .env');
  }
  return `Bearer ${token.trim()}`;
}

/**
 * Fetches one page of history from the BAD API.
 * @param cursor - Optional cursor from previous response (e.g. "/history?cursor=XXX"). Omit for first page.
 * @returns Typed history response (data + optional cursor for next page).
 */
export async function fetchHistoryPage(
  cursor?: string
): Promise<BadApiHistoryResponse> {
  const path = cursor && cursor.startsWith('/') ? cursor : '/history';
  const url = `${BAD_API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: getAuthHeader() },
  });

  if (!res.ok) {
    throw new Error(`BAD API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as BadApiHistoryResponse;
  return json;
}

/**
 * Fetches up to maxPages pages of history, starting from the first page.
 * Stops when a page has no cursor or maxPages is reached.
 * @param maxPages - Maximum number of pages to fetch.
 * @returns Array of all game results from those pages (in order: page1, then page2, ...).
 */
export async function fetchHistoryPages(
  maxPages: number
): Promise<BadApiHistoryResponse['data']> {
  const all: BadApiHistoryResponse['data'] = [];
  let cursor: string | undefined;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const response = await fetchHistoryPage(cursor);
    all.push(...response.data);
    pagesFetched += 1;
    if (!response.cursor?.trim()) break;
    cursor = response.cursor;
  }

  return all;
}
