# RPS League — Frontend

React + TypeScript + Vite app for the Reaktor RPS League assignment. Consumes the backend API for matches and leaderboards.

---

## Run

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`. Requests to `/api` are proxied to the backend (default `http://localhost:3001`). Ensure the backend is running first.

---

## Build

```bash
npm run build
```

Output in `dist/`. Preview with `npm run preview`.

---

## Stack

- React 18, TypeScript, Vite
- React Router, SWR for data fetching
- Tailwind CSS, shadcn/ui
- Sends **IANA timezone** (`Intl.DateTimeFormat().resolvedOptions().timeZone`) for “today” and date-range API calls so results follow the user’s local calendar.

---

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — ESLint
- `npm run format:check` / `npm run format` — Prettier
