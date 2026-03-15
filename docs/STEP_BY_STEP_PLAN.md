# RPS League — Step-by-step implementation plan (documentation only)

Review this plan first. After you approve, we will implement **step by step** (one step at a time, with your review in between if you want).

---

## Stack (decided)

- **Backend:** Node.js + Express + TypeScript  
- **Frontend:** React + TypeScript + Vite  
- **Data:** In-memory cache on backend (no database for now)

---

## Step 1 — Backend: project setup

- Create `backend/` with `package.json` (express, cors, dotenv, typescript, ts-node-dev).
- Add `tsconfig.json` and `src/index.ts` that starts Express on a port (e.g. 3001).
- Add `.env.example` with `BEARER_TOKEN` and `PORT`; document that user copies to `.env` and sets the token.
- Add `.gitignore` (node_modules, dist, .env).
- Verify: `npm install` and `npm run dev` → server runs and responds to e.g. `GET /health`.

**Deliverable:** Backend runs locally with no API logic yet.

---

## Step 2 — Backend: BAD API client and types

- Add TypeScript types for BAD API (history response, game result) in `src/types.ts` (or similar).
- Add `src/badApi.ts`: function to call `GET https://assignments.reaktor.com/history` (and next page via `cursor`) with Bearer token.
- No cache yet; just one function that returns one page, and optionally another that fetches N pages in a loop.
- Verify: call from a small script or a temporary route and log response shape.

**Deliverable:** Backend can fetch history from BAD API; types match the real response.

---

## Step 3 — Backend: game logic and normalized match

- Add RPS winner logic: given two moves (ROCK/PAPER/SCISSORS), return winner: **A**, **B**, **draw** (same valid move), or **invalid** (at least one move not ROCK/PAPER/SCISSORS). Use **invalid** (not draw) so draw stats and invalid stats stay separate.
- When winner is **invalid**, set **invalidMove** to `"A"` | `"B"` | `"both"` so we can show warnings and later aggregate "invalid moves per player".
- Add a function that takes a raw game result and returns a “normalized match” (gameId, time, playerA, playerB, moveA, moveB, winner, invalidMove when applicable, date as YYYY-MM-DD).
- No routes yet; keep this in a module like `src/gameLogic.ts` (and maybe types in `types.ts`).

**Deliverable:** Pure functions that convert one BAD API game into one normalized match with winner (four outcomes) and date. Draw = real tie only; invalid = separate outcome.

---

## Step 4 — Backend: in-memory cache and load on startup

- Add a cache module (e.g. `src/cache.ts`): in-memory array (or similar) of normalized matches.
- On first use (or on startup), call BAD API for a bounded number of pages (e.g. 30), normalize each game, store in memory.
- Expose simple getters: e.g. all matches, by date, by player (name substring), latest N, and helper to compute leaderboard from a list of matches (rank by wins).
- No HTTP routes yet; we only check that cache loads and getters return correct data (e.g. via a tiny script or temporary route).

**Deliverable:** Backend loads history into memory and can answer “by date”, “by player”, “latest”, and “leaderboard for a date range” from memory.

---

## Step 5 — Backend: REST API routes

- Mount routes under e.g. `/api`:
  - `GET /api/matches/latest?limit=100` → latest matches.
  - `GET /api/matches?date=YYYY-MM-DD` → matches on that date.
  - `GET /api/matches?player=Name` → matches where player name contains “Name”.
  - `GET /api/leaderboard/today` → today’s leaderboard (wins today).
  - `GET /api/leaderboard?from=YYYY-MM-DD&to=YYYY-MM-DD` → historical leaderboard.
- Ensure cache is loaded before handling these (e.g. load on first request or on startup).
- Add CORS so the React app (later) can call the API.
- Verify with browser or Postman/curl.

**Deliverable:** Backend API is ready for the frontend; no frontend code yet.

---

## Step 6 — Frontend: project setup and API client

- Create `frontend/` with Vite + React + TypeScript (e.g. `npm create vite@latest frontend -- --template react-ts`).
- Add React Router. Configure Vite dev server to proxy `/api` to `http://localhost:3001` so the app can call the backend without CORS issues in dev.
- Add a small API client (e.g. `src/api.ts`): functions that `fetch` the backend endpoints and return typed data (matches, leaderboard). Use the same types as backend (or define matching types).
- No pages yet; optional: one minimal page that calls one endpoint and shows result to confirm wiring.

**Deliverable:** Frontend runs, can call backend via proxy, and has typed API helpers.

---

## Step 7 — Frontend: layout and navigation

- Add a simple layout: header/title “RPS League” and a nav with links: Latest, By date, By player, Today’s leaderboard, Historical leaderboard.
- Set up React Router routes for each (e.g. `/`, `/by-date`, `/by-player`, `/leaderboard/today`, `/leaderboard/historical`). Each route can render a placeholder page (e.g. “Latest matches – to be implemented”).
- Optional: basic CSS or Tailwind so the app looks readable.

**Deliverable:** Navigation works; each feature has a route and a placeholder page.

---

## Step 8 — Frontend: Latest matches page

- Implement the “Latest matches” page: call `GET /api/matches/latest`, show a table or list (e.g. time, player A, player B, moves, winner). Handle loading and error states.

**Deliverable:** Users can see the latest match results.

---

## Step 9 — Frontend: Matches by date page

- Add a date picker (or input type date). On change, call `GET /api/matches?date=YYYY-MM-DD` and show matches for that day. Show empty state if no matches.

**Deliverable:** Users can view match results for a given day.

---

## Step 10 — Frontend: Matches by player page

- Add an input for player name (or search). Call `GET /api/matches?player=...` and show matches where that player participated. Show empty state if none.

**Deliverable:** Users can view match results for a specific player.

---

## Step 11 — Frontend: Today’s leaderboard page

- Call `GET /api/leaderboard/today`, show a table: rank, player name, wins. Handle empty state.

**Deliverable:** Users can see today’s leaderboard.

---

## Step 12 — Frontend: Historical leaderboard page

- Add two date inputs (from, to). Call `GET /api/leaderboard?from=...&to=...`, show table: rank, player name, wins. Handle empty and validation (e.g. from ≤ to).

**Deliverable:** All five required features are implemented.

---

## Step 13 — Polish and README

- Add a root `README.md`: how to run backend (env, install, dev), how to run frontend (install, dev), and that backend must run first. Optionally: how to build for production.
- Ensure token is only in `.env` (never committed). Mention in README.
- Optional: error messages, empty states, or simple styling improvements.
- **Timezone:** Frontend sends IANA timezone (e.g. `Intl.DateTimeFormat().resolvedOptions().timeZone`) for matches and leaderboard; backend uses it for "today" and date-range interpretation (DST-correct).

**Deliverable:** Someone else can clone, set token, and run the app from the README.

---

## Optional (if time)

- **Live updates:** Backend subscribes to BAD API `GET /live` (SSE), appends new matches to cache, and optionally exposes an SSE or WebSocket to the frontend so “Latest” and “Today’s leaderboard” update in real time.
- **CI:** GitHub Actions for backend and frontend: `npm ci`, audit, format check, lint, test (if present), build. See root README and `docs/BACKEND.md`.
- **Deployment:** Deploy backend (e.g. Railway, Render) and frontend (e.g. Vercel); document URLs and env vars.

---

## Summary

| Step | What |
|------|------|
| 1 | Backend project setup (Express, TS, env) |
| 2 | BAD API client + types |
| 3 | RPS game logic + normalized match |
| 4 | In-memory cache + load history |
| 5 | REST API routes |
| 6 | Frontend project setup + API client |
| 7 | Layout + navigation + placeholders |
| 8 | Latest matches page |
| 9 | Matches by date page |
| 10 | Matches by player page |
| 11 | Today’s leaderboard page |
| 12 | Historical leaderboard page |
| 13 | README + polish |

After you review this plan, say which step you want to start with (we can start at Step 1), and we’ll implement only that step before moving on.
