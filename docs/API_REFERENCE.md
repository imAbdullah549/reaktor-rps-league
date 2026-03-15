# BAD API Reference (from live call)

**Base URL:** `https://assignments.reaktor.com`  
**Auth:** `Authorization: Bearer <your-token>`

---

## Filtering: not supported by the BAD API

The BAD API **does not support** filtering by date, player, or any other parameter.

- **GET /history** accepts only optional **cursor-based pagination** (see below). Query params such as `?date=YYYY-MM-DD` or `?player=Name` are **not** supported; if sent, they are ignored and you get the same paginated history.
- **GET /live** is a single stream; there are no query params to filter by date or player.

**Implication:** Filtering (e.g. by date or player) must be implemented **in your application**. Your backend fetches data from the BAD API, then filters/aggregates in memory (or a DB). The `date` field in the `NormalizedMatch` type below is something **your app** derives from `time` (e.g. `YYYY-MM-DD`) for use in your own filtering and leaderboard logic—it is not a feature of the BAD API.

---

## GET /history

Returns one page of game results and a cursor to the next page.

**Request:** No body. Optional: use the `cursor` from the previous response to get the next page (e.g. `GET https://assignments.reaktor.com/history?cursor=XXX`). No other query parameters (e.g. date, player) are supported.

**Response (200):**
```json
{
  "data": [
    {
      "type": "GAME_RESULT",
      "gameId": "2c353f89c7ca60a17d5ea",
      "time": 1773259897000,
      "playerA": { "name": "Carmen Patel", "played": "ROCK" },
      "playerB": { "name": "Layla Tanaka", "played": "SCISSORS" }
    }
  ],
  "cursor": "/history?cursor=DXJ7UGVl1ijQ"
}
```

- **time**: Unix timestamp in **milliseconds**.
- **played**: One of `"ROCK"`, `"PAPER"`, `"SCISSORS"`. Handle unexpected values (e.g. invalid move) in your game logic.
- **cursor**: Omit or use empty when no next page. Next page: `GET https://assignments.reaktor.com{cursor}`.

**Order:** The first page of `/history` (no cursor) returns the **newest** games first. Page 2 is older, and so on. So “latest” = first page.

**How up to date is /history?** In two checks (same day), the first page’s newest game was **about 90–95 minutes behind** the current time; the “head” of history did not change between the two calls. So `/history` likely has a delay or is updated in batches—we can’t be sure it’s always exactly 90 minutes. For **real-time or near-real-time** “latest” results, use **GET /live** and append events to your cache; use `/history` for loading past data and historical leaderboards.

---

## GET /live

Streams live game results as **Server-Sent Events (SSE)**. The connection stays open; the server sends events as new games complete.

**Request:** No body. No query parameters (no filtering by date or player).

**Response:** `Content-Type: text/event-stream`. Each event is a single game result in the same shape as one element of `/history`’s `data` array.

**SSE format (each event):**
```
data: <JSON string of one game result>

```

**Example event payload (one line of `data:`):**
```json
{"type":"GAME_RESULT","gameId":"abc123","time":1773259897000,"playerA":{"name":"Carmen Patel","played":"ROCK"},"playerB":{"name":"Layla Tanaka","played":"SCISSORS"}}
```

So each `data:` line is a single **`BadApiGameResult`** (same as in `/history`). Your app can parse each line as JSON and normalize it (compute winner, derive `date`) the same way as for history. There is no cursor; the stream is continuous.

---

## TypeScript types (for your app)

```ts
// Raw API response
export interface BadApiHistoryResponse {
  data: BadApiGameResult[];
  cursor?: string;  // e.g. "/history?cursor=XXX"
}

export interface BadApiGameResult {
  type: "GAME_RESULT";
  gameId: string;
  time: number;  // ms
  playerA: { name: string; played: string };
  playerB: { name: string; played: string };
}

// After you compute winner and date in your backend (BAD API does not provide these)
/** Game outcome. Use "invalid" when at least one move is not ROCK/PAPER/SCISSORS so draw stats stay clean. */
export type Winner = "A" | "B" | "draw" | "invalid";

export interface NormalizedMatch {
  gameId: string;
  time: number;
  playerA: string;
  playerB: string;
  moveA: string;
  moveB: string;
  winner: Winner;
  /** Only set when winner is "invalid": who had the invalid move (or "both"). Use for warnings and invalid-move stats. */
  invalidMove?: "A" | "B" | "both";
  date: string;  // "YYYY-MM-DD" — derived from time in your app for filtering; BAD API does not support filtering
}
```

**Game result design:** We use four outcomes so stats stay clear: **"draw"** = both valid and same move; **"invalid"** = at least one move not ROCK/PAPER/SCISSORS (do not count as draw). Leaderboard wins count only **"A"** or **"B"**. Use `invalidMove` to show warnings or aggregate "invalid moves per player" later.
