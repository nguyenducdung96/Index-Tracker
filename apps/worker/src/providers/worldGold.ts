import type { WorldGoldQuote } from "../types.js";
import {
  getStooqPreviousClose,
  getYahooGoldPreviousClose
} from "./worldHistory.js";

const GOLD_API_PAGE = "https://gold-api.com/";
const GOLD_API_BASE = "https://api.gold-api.com";

type PrevSource = "gold-api-ohlc" | "stooq" | "yahoo" | null;

let previousCloseCache: {
  value: number | null;
  source: PrevSource;
  expiresAt: number;
} = {
  value: null,
  source: null,
  expiresAt: 0
};

function withChange(price: number, previousClose: number | null) {
  if (!previousClose || !Number.isFinite(previousClose) || previousClose <= 0) {
    return { changeAbs: null, changePct: null };
  }

  const changeAbs = price - previousClose;
  return {
    changeAbs,
    changePct: (changeAbs / previousClose) * 100
  };
}

async function getGoldApiPreviousClose(apiKey: string): Promise<number | null> {
  // One 5-day OHLC window ending at the start of the current UTC day.
  // The returned `close` is the last close available before the window end.
  // Cached for 15 minutes => max ~4 requests/hour, within Gold-API free tier.
  const now = new Date();
  const endMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const startMs = endMs - 5 * 86400_000;

  const url = new URL(`${GOLD_API_BASE}/ohlc/XAU`);
  url.searchParams.set("startTimestamp", String(Math.floor(startMs / 1000)));
  url.searchParams.set("endTimestamp", String(Math.floor(endMs / 1000)));

  const res = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
      "user-agent": "gold-tracker-pwa/7.9"
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`Gold-API OHLC HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  const close = Number(data?.close);

  return Number.isFinite(close) && close > 0 ? close : null;
}

async function getCachedPreviousClose(apiKey?: string) {
  if (
    Date.now() < previousCloseCache.expiresAt &&
    previousCloseCache.value != null
  ) {
    return previousCloseCache;
  }

  if (apiKey) {
    try {
      const value = await getGoldApiPreviousClose(apiKey);
      if (value != null) {
        previousCloseCache = {
          value,
          source: "gold-api-ohlc",
          expiresAt: Date.now() + 15 * 60_000
        };
        return previousCloseCache;
      }
    } catch (error) {
      console.error("Gold-API previous close failed:", error);
    }
  }

  try {
    const value = await getStooqPreviousClose();
    if (value != null && Number.isFinite(value) && value > 0) {
      previousCloseCache = {
        value,
        source: "stooq",
        expiresAt: Date.now() + 10 * 60_000
      };
      return previousCloseCache;
    }
  } catch {
    // continue
  }

  try {
    const value = await getYahooGoldPreviousClose();
    if (value != null && Number.isFinite(value) && value > 0) {
      previousCloseCache = {
        value,
        source: "yahoo",
        expiresAt: Date.now() + 10 * 60_000
      };
      return previousCloseCache;
    }
  } catch {
    // D1 fallback is applied by index.ts.
  }

  return previousCloseCache;
}

async function fetchGoldApi(apiKey?: string): Promise<WorldGoldQuote> {
  const [res, fallback] = await Promise.all([
    fetch(`${GOLD_API_BASE}/price/XAU`, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "user-agent": "gold-tracker-pwa/7.9",
        accept: "application/json"
      },
      cache: "no-store"
    }),
    getCachedPreviousClose(apiKey)
  ]);

  if (!res.ok) throw new Error(`Gold-API HTTP ${res.status}`);

  const data = await res.json() as {
    price: number;
    updatedAt?: string;
    updated_at?: string;
  };

  const price = Number(data.price);
  if (!Number.isFinite(price)) throw new Error("Invalid Gold-API price");

  const previousClose = fallback.value;
  const change = withChange(price, previousClose);
  const now = new Date().toISOString();
  const sourceTime = data.updatedAt ?? data.updated_at;

  return {
    symbol: "XAUUSD",
    price,
    currency: "USD",
    unit: "troy_ounce",
    source: "gold-api",
    sourceUrl: GOLD_API_PAGE,
    observedAt: sourceTime ? new Date(sourceTime).toISOString() : now,
    receivedAt: now,
    previousClose,
    previousCloseSource: fallback.source,
    changeAbs: change.changeAbs,
    changePct: change.changePct
  };
}

export async function getWorldGoldQuote(
  goldApiKey?: string
): Promise<WorldGoldQuote> {
  return fetchGoldApi(goldApiKey);
}
