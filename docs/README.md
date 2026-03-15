# Documentation index

All docs are in the `docs/` folder. Read in this order if you’re starting from scratch.

---

## 1. [ARCHITECTURE_AND_IMPLEMENTATION.md](./ARCHITECTURE_AND_IMPLEMENTATION.md)

- Do we need a backend? (Yes.)
- Which technologies? (React, Node/Express, TypeScript, in-memory cache.)
- Caching vs database recommendation.
- Feature checklist.
- System diagram (ASCII + Mermaid).
- Data flow.
- High-level implementation approach.
- Verified API summary and “best scope” to fulfill the assignment.

---

## 2. [API_REFERENCE.md](./API_REFERENCE.md)

- BAD API base URL and auth.
- `GET /history` and `GET /live` description.
- Exact response shape from a real call.
- TypeScript types for the API and for your normalized match.

---

## 3. [STEP_BY_STEP_PLAN.md](./STEP_BY_STEP_PLAN.md)

- **Implementation plan only (no code).**
- 13 steps: backend setup → API client → game logic → cache → routes → frontend setup → layout → each feature page → README.
- Optional: live updates, deployment.
- Use this to review the plan; then we implement step by step after your review.

---

## 4. [BACKEND.md](./BACKEND.md)

- **Backend implementation log.**
- What we do at each backend step (setup, API client, game logic, cache, routes).
- **Current API:** full list of endpoints and query params (matches, leaderboard, `timezone`).
- **Timezone handling:** IANA timezone (Day.js); how "today" and date ranges work.
- **Backend CI:** GitHub Actions workflow and scripts.
- How to run the backend, env vars, and scripts.

---

**Next:** Review `STEP_BY_STEP_PLAN.md`. When you’re ready, we implement one step at a time (starting with Step 1 if you prefer).
