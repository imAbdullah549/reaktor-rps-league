# Reaktor RPS League

Assignment: consume the BAD API and present RPS match results and leaderboards.

---

## Run the app

**Backend** (API + cache, BAD API client, optional live stream):

```bash
cd backend && cp .env.example .env && npm install && npm start
```

Set `BEARER_TOKEN` in `backend/.env`. Runs at `http://localhost:3001`.

**Frontend** (React + Vite):

```bash
cd frontend && npm install && npm run dev
```

Runs at `http://localhost:5173`. API requests to `/api` are proxied to the backend in development.

---

## Stack

- **Backend:** Node (≥18), Express, TypeScript. In-memory cache, BAD API client, Day.js (IANA timezone) for local date/range handling, optional live stream.
- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui. Sends IANA timezone for “today” and date-range features.

---

## CI

- **Backend:** [`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml) — on push/PR to `main`/`master` when `backend/` changes: install, audit, format check, lint, test (if present), build. Runs on Node 18 and 20.
- **Frontend:** [`.github/workflows/frontend-ci.yml`](.github/workflows/frontend-ci.yml) — same pattern for `frontend/`.

---

## Documentation

Details (architecture, BAD API reference, backend implementation, step-by-step plan) are in **`docs/`** — see [docs/README.md](docs/README.md).
