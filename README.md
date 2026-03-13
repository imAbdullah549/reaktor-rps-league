# Reaktor RPS League

Assignment: consume the BAD API and present RPS match results and leaderboards.

---

## Run the app

**Backend** (API + cache, proxies to BAD API):

```bash
cd backend && npm install && npm start
```

Runs at `http://localhost:3001`.

**Frontend** (React + Vite):

```bash
cd frontend && npm install && npm run dev
```

Runs at `http://localhost:5173`. API requests to `/api` are proxied to the backend in development.

---

## Stack

- **Backend:** Node, Express, TypeScript. In-memory cache, BAD API client.
- **Frontend:** React, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui.

---

## Documentation

Details (architecture, API reference, step-by-step plan) are in **`docs/`** — see [docs/README.md](docs/README.md).
