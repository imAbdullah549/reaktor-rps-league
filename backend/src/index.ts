import "./loadEnv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { streamLive } from "./badApi";
import { normalizeGameResult } from "./gameLogic";
import { loadAllHistoryIncremental, loadHistoryIncremental, addMatch, getCacheSize } from "./cache";
import { PORT, CACHE_MAX_PAGES, getCorsOrigin, SHUTDOWN_GRACE_MS, isProduction } from "./config";
import { registerRoutes } from "./routes";

// Fail fast in production if BAD API token is missing (e.g. Railway Variables not set)
if (isProduction) {
  const token = process.env.BEARER_TOKEN?.trim();
  if (!token) {
    console.error(
      "BEARER_TOKEN is not set. In Railway: open your service → Variables → add BEARER_TOKEN with your BAD API token."
    );
    process.exit(1);
  }
}

const app = express();
app.use(morgan("combined"));
app.use(cors({ origin: getCorsOrigin() }));
app.use(express.json());

registerRoutes(app);

function start(): void {
  const server = app.listen(PORT, () => {
    console.log(`RPS League backend running at http://localhost:${PORT}`);
  });

  function gracefulShutdown(signal: string): void {
    console.log(`${signal} received. Closing server (grace period ${SHUTDOWN_GRACE_MS}ms)...`);
    server.close(() => {
      console.log("Server closed. Exiting.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("Grace period expired. Forcing exit.");
      process.exit(1);
    }, SHUTDOWN_GRACE_MS);
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  void streamLive((game) => {
    try {
      const m = normalizeGameResult(game);
      if (addMatch(m)) {
        console.log(`Live: added match ${m.gameId} (${m.playerA} vs ${m.playerB})`);
      }
    } catch (e) {
      console.error("Live: normalize error", e);
    }
  });
  console.log("Live stream started (GET /live). New games will be appended to the cache.");

  if (CACHE_MAX_PAGES === 0) {
    console.log(
      "Loading history from BAD API (all pages) in background — API will serve data as it loads."
    );
    void loadAllHistoryIncremental()
      .then(() => console.log(`Cache load complete: ${getCacheSize()} matches (all pages).`))
      .catch((err) => console.error("Cache load failed. Check BEARER_TOKEN and network.", err));
  } else {
    console.log(
      `Loading history from BAD API (max ${CACHE_MAX_PAGES} pages) in background — API will serve data as it loads.`
    );
    void loadHistoryIncremental(CACHE_MAX_PAGES)
      .then(() =>
        console.log(`Cache load complete: ${getCacheSize()} matches (${CACHE_MAX_PAGES} pages).`)
      )
      .catch((err) => console.error("Cache load failed. Check BEARER_TOKEN and network.", err));
  }
}

start();
