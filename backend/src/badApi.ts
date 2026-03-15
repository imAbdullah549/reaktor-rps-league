/**
 * Client for the BAD API (assignments.reaktor.com).
 * Fetches history pages and streams GET /live (SSE). Token from env BEARER_TOKEN.
 * Throttles page requests and retries on 429 using Retry-After and exponential backoff.
 */

import type { BadApiGameResult, BadApiHistoryResponse } from "./types";
import { HISTORY_429_MAX_RETRIES, LIVE_RECONNECT_MS } from "./config";

const BAD_API_BASE = "https://assignments.reaktor.com";

function getAuthHeader(): string {
  const token = process.env.BEARER_TOKEN;
  if (!token || token.trim() === "") {
    throw new Error("BEARER_TOKEN is not set or empty. Add it to .env");
  }
  return `Bearer ${token.trim()}`;
}

/** Exported for use by cache when throttling incremental loads. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetches one page of history from the BAD API.
 * On 429, respects Retry-After and retries. On 500/503, retries with exponential backoff.
 * @param cursor - Optional cursor from previous response (e.g. "/history?cursor=XXX"). Omit for first page.
 * @returns Typed history response (data + optional cursor for next page).
 */
export async function fetchHistoryPage(cursor?: string): Promise<BadApiHistoryResponse> {
  const path = cursor && cursor.startsWith("/") ? cursor : "/history";
  const url = `${BAD_API_BASE}${path}`;
  const maxRetries = HISTORY_429_MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, {
      headers: { Authorization: getAuthHeader() },
    });

    if (res.ok) {
      const json = (await res.json()) as BadApiHistoryResponse;
      return json;
    }

    if (res.status === 429) {
      const retryAfter = res.headers.get("Retry-After");
      let waitMs = 5000;
      if (retryAfter) {
        const sec = parseInt(retryAfter, 10);
        if (Number.isFinite(sec)) waitMs = sec * 1000;
      }
      waitMs = Math.min(waitMs * Math.pow(2, attempt), 60000);
      lastError = new Error("BAD API error: 429 Too Many Requests");

      if (attempt < maxRetries) {
        console.warn(
          `BAD API 429 Too Many Requests. Waiting ${waitMs}ms before retry (${attempt + 1}/${maxRetries}).`
        );
        await sleep(waitMs);
        continue;
      }
      break;
    }

    // 500 / 503: retry with exponential backoff (transient server errors)
    if (res.status === 500 || res.status === 503) {
      const waitMs = Math.min(2000 * Math.pow(2, attempt), 30000); // 2s, 4s, 8s… cap 30s
      lastError = new Error(`BAD API error: ${res.status} ${res.statusText}`);

      if (attempt < maxRetries) {
        console.warn(
          `BAD API ${res.status} ${res.statusText}. Waiting ${waitMs}ms before retry (${attempt + 1}/${maxRetries}).`
        );
        await sleep(waitMs);
        continue;
      }
      break;
    }

    throw new Error(`BAD API error: ${res.status} ${res.statusText}`);
  }

  throw lastError ?? new Error("BAD API error: unknown");
}

/**
 * Connects to GET /live (SSE) and calls onGame for each game result.
 * Runs until process exit. Reconnects after disconnect or error.
 * Does not throw; logs errors and reconnects after LIVE_RECONNECT_MS.
 */
export async function streamLive(onGame: (game: BadApiGameResult) => void): Promise<never> {
  const url = `${BAD_API_BASE}/live`;
  for (;;) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: getAuthHeader(), Accept: "text/event-stream" },
      });
      if (!res.ok) {
        console.error(
          `Live stream error: ${res.status} ${res.statusText}. Reconnecting in ${LIVE_RECONNECT_MS}ms.`
        );
        await new Promise((r) => setTimeout(r, LIVE_RECONNECT_MS));
        continue;
      }
      const reader = res.body?.getReader();
      if (!reader) {
        console.error("Live stream: no body. Reconnecting.");
        await new Promise((r) => setTimeout(r, LIVE_RECONNECT_MS));
        continue;
      }
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const dataPrefix = "data: ";
          if (line.startsWith(dataPrefix)) {
            try {
              const json = line.slice(dataPrefix.length).trim();
              if (!json) continue;
              const data = JSON.parse(json) as BadApiGameResult;
              if (data?.type === "GAME_RESULT" && data.gameId) {
                onGame(data);
              }
            } catch {
              // ignore parse errors for single event
            }
          }
        }
      }
      console.error("Live stream closed. Reconnecting.");
    } catch (err) {
      console.error(
        "Live stream error:",
        err instanceof Error ? err.message : err,
        "- Reconnecting in",
        LIVE_RECONNECT_MS,
        "ms."
      );
    }
    await new Promise((r) => setTimeout(r, LIVE_RECONNECT_MS));
  }
}
