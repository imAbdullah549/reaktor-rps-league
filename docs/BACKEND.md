# RPS League — Backend documentation

This document describes the backend implementation: setup, structure, and what we do at each step.

---

## Overview

| Item | Choice |
|------|--------|
| **Runtime** | Node.js (≥18) |
| **Framework** | Express.js |
| **Language** | TypeScript |
| **Data** | In-memory (no database for now) |

The backend will consume the BAD API (Reaktor assignment API), normalize match data, cache it in memory, and expose REST endpoints for the frontend (matches, leaderboards).

---

## Step 1 — Project setup

**Goal:** Backend runs locally with no API logic yet.

### What we did

1. **Created `backend/`** with:
   - **`package.json`** — Express, CORS, dotenv, TypeScript, ts-node-dev (and type definitions).
   - **`tsconfig.json`** — Strict TypeScript, output to `dist/`, source in `src/`.
   - **`src/index.ts`** — Express app that:
     - Loads env via `dotenv`.
     - Uses CORS and JSON middleware.
     - Listens on `PORT` (default 3001).
     - Exposes **`GET /health`** returning `{ status: 'ok', timestamp }`.
   - **`.env.example`** — Template with `BEARER_TOKEN` and `PORT`; user copies to `.env` and sets the token.
   - **`.gitignore`** — Ignores `node_modules/`, `dist/`, `.env`, and common noise files.

2. **Scripts**
   - `npm run dev` — Run with ts-node-dev (watch + transpile).
   - `npm run build` — Compile to `dist/`.
   - `npm run start` — Run compiled `dist/index.js`.

### How to run

```bash
cd backend
cp .env.example .env
# Edit .env and set BEARER_TOKEN (and optionally PORT)
npm install
npm run dev
```

Then open or curl: `http://localhost:3001/health` — you should get JSON with `status: 'ok'`.

### Deliverable

- Backend runs locally.
- Health check works.
- Ready for Step 2 (BAD API client and types).

---

## Step 2 — BAD API client and types

**Goal:** Backend can fetch history from the BAD API; all responses are typed. No cache or game logic yet.

### What we did

1. **`src/types.ts`** — TypeScript types for the BAD API:
   - `BadApiGameResult`: one game (gameId, time, playerA, playerB with name and played).
   - `BadApiHistoryResponse`: `{ data: BadApiGameResult[], cursor?: string }`.
   - Matches the real API shape (see `docs/API_REFERENCE.md`).

2. **`src/badApi.ts`** — BAD API client:
   - `fetchHistoryPage(cursor?)`: calls `GET https://assignments.reaktor.com/history` (or with cursor for next page). Uses `BEARER_TOKEN` from env. Returns typed `BadApiHistoryResponse`.
   - `fetchHistoryPages(maxPages)`: fetches up to N pages in a loop; returns a single array of all games (for use in Step 4 cache loading).
   - Throws if `BEARER_TOKEN` is missing or if the API returns a non-2xx status.

3. **`src/index.ts`** — Temporary verification route:
   - **`GET /dev/fetch-history`** — calls `fetchHistoryPage()`, returns first page plus `dataLength`, `hasNextCursor`. Use this to confirm the client works and the response shape matches our types. Remove or replace in a later step.

### How to verify

1. Ensure `backend/.env` has a valid `BEARER_TOKEN`.
2. Run `npm run dev` in `backend/`.
3. Open or curl: `http://localhost:3001/dev/fetch-history`.
4. You should get JSON with `data` (array of games), `cursor` (if there is a next page), and no type errors.

### Deliverable

- Backend can fetch at least one page from the BAD API.
- All BAD API data is used through TypeScript types (no raw `any`).
- Verified via `GET /dev/fetch-history`. Ready for Step 3 (game logic + normalized match).

---

## Step 3 — Game logic and normalized match

**Goal:** Pure functions that convert one BAD API game into one normalized match with four outcomes (A, B, draw, invalid) and optional invalidMove. No cache or API routes yet.

### What we did

1. **`src/types.ts`** — Added:
   - `Winner`: `'A' | 'B' | 'draw' | 'invalid'`.
   - `InvalidMove`: `'A' | 'B' | 'both'`.
   - `NormalizedMatch`: gameId, time, playerA, playerB, moveA, moveB, winner, invalidMove (optional), date (YYYY-MM-DD).

2. **`src/gameLogic.ts`** — New module (pure functions):
   - `isValidMove(m)`: true if m is ROCK/PAPER/SCISSORS (case-insensitive).
   - `getInvalidMove(moveA, moveB)`: returns who had the invalid move when at least one is invalid.
   - `getWinner(moveA, moveB)`: returns A, B, draw, or invalid (invalid when at least one move is not valid).
   - `normalizeGameResult(raw)`: maps `BadApiGameResult` → `NormalizedMatch` (winner, invalidMove when invalid, date from time).

3. **`src/index.ts`** — Verification route:
   - **`GET /dev/normalize-first`** — fetches first history page, normalizes the first game, returns `{ raw, normalized }`. Use to confirm game logic and four outcomes.

### How to verify

1. Run `npm run dev` in `backend/`.
2. Open or curl: `http://localhost:3001/dev/normalize-first`.
3. Check `normalized`: winner (A/B/draw/invalid), date (YYYY-MM-DD), and invalidMove when winner is invalid.

### Deliverable

- RPS winner logic correct; invalid moves → winner `"invalid"` (not draw); invalidMove set when applicable.
- One BAD API game → one `NormalizedMatch`. Ready for Step 4 (in-memory cache).

---

## Step 4 — In-memory cache and load on startup

**Goal:** Load BAD API history into memory (bounded pages), normalize, and answer by date, by player, latest N, and leaderboard for a date range. No public API routes yet.

### What we did

1. **`src/cache.ts`** — In-memory cache module:
   - **`loadHistory(maxPages)`**: fetches up to `maxPages` via `fetchHistoryPages`, normalizes each game with `normalizeGameResult`, stores in memory. Idempotent (replaces cache). Builds a **date index** (`Map<date, Match[]>`) so `getByDate` and `getMatchesByDateRange` are fast (no full-array scan).
   - **Getters:** `getAllMatches()`, `getByDate(date)`, `getByPlayer(nameSubstring)`, `getLatest(limit)`, `getMatchesByDateRange(from, to)`.
   - **Leaderboard:** `computeLeaderboard(matchList)` — counts wins per player (only `winner === "A"` or `"B"`), returns `{ player, wins }[]` sorted by wins desc. `getLeaderboardForDateRange(from, to)` filters by date then computes leaderboard.
   - **`LeaderboardEntry`**: `{ player: string, wins: number }`. Exported for use in Step 5 routes.

2. **`src/index.ts`** — Startup and verification:
   - **Cache size** is configurable via **`CACHE_MAX_PAGES`** in `.env` (default 30, clamped 1–100). Tune without code change.
   - On startup: **`await loadHistory(CACHE_MAX_PAGES)`** before `app.listen()`. If load fails, server does not start; error log suggests checking BEARER_TOKEN and network.
   - **`GET /dev/cache-verify`** — returns `totalMatches`, `latest5`, `byDateSample` (count for today), `byPlayerSample` (count for "Kim"), `leaderboardToday` (top 10). Use to confirm cache and getters work.

### How to verify

1. Ensure `backend/.env` has valid `BEARER_TOKEN`.
2. Run `npm run dev` in `backend/`. Console should show "Cache loaded: N matches (M pages)" then "RPS League backend running...". Set `CACHE_MAX_PAGES` in `.env` to change load size (e.g. 10 for quicker local start).
3. Open or curl: `http://localhost:3001/dev/cache-verify`. You should get JSON with cache stats and samples. No 503 if cache loaded.

### Deliverable

- Backend loads history into memory (up to 30 pages) on startup.
- Getters work: by date, by player, latest N, leaderboard for date range (and today). Ready for Step 5 (REST API routes).

---

## Step 5 — REST API routes

**Goal:** Expose the cache via public API under `/api` so the frontend (and Postman/curl) can call it. CORS already enabled.

### What we did

1. **`src/index.ts`** — API routes and middleware:
   - **`requireCache`** middleware: returns 503 with `{ error: "Cache not loaded yet" }` if cache is not loaded; used by all `/api` routes.
   - **GET /api/matches/latest?limit=100** — returns `{ matches }` (latest N matches). Default limit 100, max 500.
   - **GET /api/matches** — unified matches with filters and pagination (see **Current API** below).
   - **GET /api/leaderboard/today** — today’s leaderboard; optional `timezone` and `date` (see below).
   - **GET /api/leaderboard?from=...&to=...** — historical leaderboard; optional `timezone` (see below).

### Response shapes

- **Matches:** `{ matches: NormalizedMatch[], total: number }` when using limit/offset.
- **Leaderboard:** `{ leaderboard: { player: string, wins: number }[], total: number }` when using limit/offset.

### Deliverable

- Backend API is ready for the frontend; all endpoints return JSON.

---

## Game result design (Step 3 and beyond)

We use **four outcomes** for `winner` so stats stay clear:

| Outcome | Meaning |
|--------|--------|
| **A** | Player A wins (both moves valid). |
| **B** | Player B wins (both moves valid). |
| **draw** | Both moves valid and the same (e.g. ROCK vs ROCK). |
| **invalid** | At least one move is not ROCK/PAPER/SCISSORS — do not count as draw. |

When `winner === "invalid"`, we set **invalidMove** to `"A"` | `"B"` | `"both"` so we can show warnings and later aggregate "invalid moves per player". Leaderboard wins count only **A** or **B**; draw and invalid stay separate in stats.

---

---

## Current API (as implemented)

All routes require the cache to be loaded (503 otherwise). Query params are validated; invalid `date`/`from`/`to` format returns 400.

### GET /api/matches/latest

- **Query:** `limit` (optional, default 100, max 500).
- **Response:** `{ matches: NormalizedMatch[] }`.

### GET /api/matches (unified)

- **Query:** One of:
  - `date=YYYY-MM-DD` — matches for that calendar day (in given timezone if `timezone` provided).
  - `from=YYYY-MM-DD&to=YYYY-MM-DD` — matches in that date range (in given timezone if `timezone` provided).
- Optional: `player` (substring, case-insensitive), `timezone` (IANA, e.g. `Europe/Helsinki`), `limit`, `offset`.
- **Response:** `{ matches: NormalizedMatch[], total: number }`.

### GET /api/leaderboard/today

- **Query:** Optional `date=YYYY-MM-DD`, `timezone` (IANA), `player` (filter leaderboard by name), `limit`, `offset`.
- **Response:** `{ leaderboard: { player, wins }[], total: number }`.
- If `timezone` is sent, “today” is interpreted in that timezone; otherwise UTC date is used.

### GET /api/leaderboard (historical)

- **Query:** Required `from=YYYY-MM-DD`, `to=YYYY-MM-DD`. Optional `timezone` (IANA), `player`, `limit`, `offset`.
- **Response:** `{ leaderboard: { player, wins }[], total: number }`.
- If `timezone` is sent, the date range is interpreted as local calendar days in that timezone; otherwise UTC.

---

## Timezone handling

Date and range filtering use **IANA timezone names** (e.g. `Europe/Helsinki`, `America/New_York`), not numeric offsets.

- **Backend:** Day.js with `utc` and `timezone` plugins. Given a `timezone` and a local date (e.g. `2026-03-15`), the backend computes the UTC millisecond range for “midnight–end of that day” in that timezone (DST-correct).
- **Frontend:** Sends `timezone` from `Intl.DateTimeFormat().resolvedOptions().timeZone` for matches and leaderboard requests so “today” and date ranges follow the user’s local calendar.
- If `timezone` is omitted, the backend uses UTC for date/range interpretation.

---

## Backend CI

GitHub Actions workflow **`.github/workflows/backend-ci.yml`** runs on push/PR to `main` or `master` when `backend/` or the workflow file changes.

**Steps:** Checkout → Setup Node.js (matrix: 18, 20) → `npm ci` → `npm audit --audit-level=high` → `npm run format:check` → `npm run lint -- --max-warnings 0` → `npm run test --if-present` → `npm run build`.

**Scripts:** `lint`, `format`, `format:check`, `build`, `dev`, `start`. See `backend/package.json`.

---

## Next steps (to be documented here)

We will update this document as we add features (e.g. more dev routes, tests).
