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

## Deploy

**Backend (Railway)**  
1. New Project → Deploy from GitHub → select this repo.  
2. Service **Settings** → **Build** → **Root Directory** = `backend`.  
3. **Variables:** `BEARER_TOKEN`, `NODE_ENV=production`. Optionally `FRONTEND_ORIGIN=https://your-app.vercel.app` for CORS.  
4. **Generate Domain** (e.g. `https://reaktor-rps-league.up.railway.app`).

**Frontend (Vercel)**  
1. Import this repo in Vercel, set **Root Directory** to `frontend`.  
2. **Environment Variables** → add `VITE_API_URL` = your Railway backend URL + `/api` (e.g. `https://reaktor-rps-league.up.railway.app/api`).  
3. Deploy.  
4. In Railway, set **Variables** → `FRONTEND_ORIGIN` = your Vercel URL (e.g. `https://reaktor-rps-league.vercel.app`) so CORS allows the frontend.

---

## CI

- **Backend:** [`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml) — on push/PR to `main`/`master` when `backend/` changes: install, audit, format check, lint, test (if present), build. Runs on Node 18 and 20.
- **Frontend:** [`.github/workflows/frontend-ci.yml`](.github/workflows/frontend-ci.yml) — same pattern for `frontend/`.

---

## Documentation

Details (architecture, BAD API reference, backend implementation, step-by-step plan) are in **`docs/`** — see [docs/README.md](docs/README.md).
