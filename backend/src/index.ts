import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchHistoryPage } from './badApi';
import { normalizeGameResult } from './gameLogic';

dotenv.config();

const PORT = process.env.PORT ?? 3001;

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/** Temporary route to verify BAD API client (Step 2). Remove or replace in later steps. */
app.get('/dev/fetch-history', async (_req, res) => {
  try {
    const page = await fetchHistoryPage();
    res.json({
      message: 'First page from BAD API /history',
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
app.get('/dev/normalize-first', async (_req, res) => {
  try {
    const page = await fetchHistoryPage();
    const first = page.data[0];
    if (!first) {
      return res.json({ message: 'No games in first page', normalized: null });
    }
    const normalized = normalizeGameResult(first);
    res.json({ message: 'First game normalized (Step 3)', raw: first, normalized });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`RPS League backend running at http://localhost:${PORT}`);
});
