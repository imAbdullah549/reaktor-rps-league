import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fetchHistoryPage } from "./badApi";
import { normalizeGameResult } from "./gameLogic";
import {
  loadHistory,
  isCacheLoaded,
  getCacheSize,
  getLatest,
  getByDate,
  getByPlayer,
  getLeaderboardForDateRange,
} from "./cache";

dotenv.config();

const PORT = process.env.PORT ?? 3001;
const CACHE_MAX_PAGES = (() => {
  const n = parseInt(process.env.CACHE_MAX_PAGES ?? '30', 10);
  if (!Number.isFinite(n)) return 30;
  return Math.min(100, Math.max(1, n));
})();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/** Temporary route to verify BAD API client (Step 2). Remove or replace in later steps. */
app.get("/dev/fetch-history", async (_req, res) => {
  try {
    const page = await fetchHistoryPage();
    res.json({
      message: "First page from BAD API /history",
      dataLength: page.data.length,
      hasNextCursor: Boolean(page.cursor),
      data: page.data,
      cursor: page.cursor,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

/** Temporary route to verify game logic (Step 3): fetch first page, normalize first game, return it. */
app.get("/dev/normalize-first", async (_req, res) => {
  try {
    const page = await fetchHistoryPage();
    const first = page.data[0];
    if (!first) {
      return res.json({ message: "No games in first page", normalized: null });
    }
    const normalized = normalizeGameResult(first);
    res.json({
      message: "First game normalized (Step 3)",
      raw: first,
      normalized,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

/** Temporary route to verify cache (Step 4): stats, latest, by date, by player, leaderboard today. */
app.get("/dev/cache-verify", (_req, res) => {
  if (!isCacheLoaded()) {
    return res.status(503).json({ error: "Cache not loaded yet" });
  }
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    message: "Cache verification (Step 4)",
    totalMatches: getCacheSize(),
    latest5: getLatest(5),
    byDateSample: getByDate(today).length,
    byPlayerSample: getByPlayer("Kim").length,
    leaderboardToday: getLeaderboardForDateRange(today, today).slice(0, 10),
  });
});

async function start(): Promise<void> {
  try {
    await loadHistory(CACHE_MAX_PAGES);
    console.log(`Cache loaded: ${getCacheSize()} matches (${CACHE_MAX_PAGES} pages)`);
  } catch (err) {
    console.error("Cache load failed. Check BEARER_TOKEN and network. Server will not start.", err);
    throw err;
  }
  app.listen(PORT, () => {
    console.log(`RPS League backend running at http://localhost:${PORT}`);
  });
}

start();
