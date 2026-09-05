import { getWorldGoldQuote } from "./providers/worldGold.js";
import { getExternalWorldHistory, type HistoryRange } from "./providers/worldHistory.js";
import {
  debugVietnamProvider,
  getVietnamGoldSnapshot,
  vietnamGoldProviders,
  type VietnamProviderStatus
} from "./providers/vietnamGold.js";
import { getUsdVnd } from "./providers/fx.js";
import { validateVietnamQuotes, vietnamQualityConfig } from "./quality.js";
import type { VietnamGoldQuote, WorldGoldQuote } from "./types.js";
import { getMarketIndexes, getStockChart, getStockDetail, getStockQuotes } from "./providers/stocks/vndirect.js";
import { getRealtimeSnapshots } from "./providers/stocks/vndirectRealtime.js";
import { getForeignTradingMap } from "./providers/stocks/fireantForeign.js";
import {
  addWatchlistSymbol,
  createWatchlist,
  deleteWatchlist,
  ensureDefaultWatchlists,
  listWatchlists,
  removeWatchlistSymbol,
  cleanup,
  getFx,
  getLatestVietnam,
  getPreviousWorldClose,
  getProviderStatuses,
  getVNHistory,
  getWorldHistory,
  logCron,
  saveVietnamSnapshot,
  saveWorldIfDue,
  setFx
} from "./db.js";

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GOLD_API_KEY?: string;
}

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const WORLD_CACHE_SECONDS = 5;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...JSON_HEADERS,
      "cache-control": "no-store"
    }
  });
}

async function worldQuote(env: Env, ctx: ExecutionContext): Promise<WorldGoldQuote> {
  const cache = caches.default;
  const cacheKey = new Request("https://gold-tracker.internal/cache/world");
  const cached = await cache.match(cacheKey);

  if (cached) {
    let q = await cached.json<WorldGoldQuote>();

    if (q.previousClose == null) {
      const localPrevious = await getPreviousWorldClose(env.DB);
      if (localPrevious != null && Number.isFinite(localPrevious) && localPrevious > 0) {
        const changeAbs = q.price - localPrevious;
        q = {
          ...q,
          previousClose: localPrevious,
          previousCloseSource: "local-db",
          changeAbs,
          changePct: (changeAbs / localPrevious) * 100
        };
      }
    }

    ctx.waitUntil(saveWorldIfDue(env.DB, q).catch(console.error));
    return q;
  }

  let q = await getWorldGoldQuote(env.GOLD_API_KEY);

  if (q.previousClose == null) {
    const localPrevious = await getPreviousWorldClose(env.DB);
    if (localPrevious != null) {
      const changeAbs = q.price - localPrevious;
      q = {
        ...q,
        previousClose: localPrevious,
        previousCloseSource: "local-db",
        changeAbs,
        changePct: (changeAbs / localPrevious) * 100
      };
    }
  }

  const response = new Response(JSON.stringify(q), {
    headers: {
      ...JSON_HEADERS,
      "cache-control": `public,max-age=${WORLD_CACHE_SECONDS}`
    }
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  ctx.waitUntil(saveWorldIfDue(env.DB, q).catch(console.error));
  return q;
}

async function refreshVietnam(env: Env) {
  const snapshot = await getVietnamGoldSnapshot();
  const validated = validateVietnamQuotes(snapshot.rows);

  const statuses = snapshot.statuses.map(status => {
    const brandRows = validated.rows.filter(x => x.brand === status.brand);
    const suspectProducts = brandRows
      .filter(x => x.qualityState === "suspect")
      .map(x => x.product);
    return {
      ...status,
      qualityState: suspectProducts.length ? "suspect" as const :
        (brandRows.length ? "ok" as const : null),
      suspectProducts
    };
  });

  await saveVietnamSnapshot(env.DB, validated.rows, statuses);
  return { rows: validated.rows, statuses, summaries: validated.summaries };
}

async function refreshFx(env: Env) {
  const value = await getUsdVnd();
  if (value) await setFx(env.DB, value);
  return value;
}

function worldVndPerLuong(world: WorldGoldQuote | null, usdVnd: number | null) {
  if (!world || !usdVnd) return null;
  return world.price * usdVnd * (37.5 / 31.1034768);
}

async function dashboard(env: Env, ctx: ExecutionContext) {
  const [world, vietnam0, providers0, fx0] = await Promise.all([
    worldQuote(env, ctx),
    getLatestVietnam(env.DB),
    getProviderStatuses(env.DB),
    getFx(env.DB)
  ]);

  let vietnam = vietnam0;
  let providers = providers0;
  let usdVnd = fx0;

  // First deploy / empty D1: seed once synchronously.
  if (!vietnam.length) {
    try {
      const seeded = await refreshVietnam(env);
      vietnam = seeded.rows;
      providers = seeded.statuses;
    } catch (e) {
      console.error("Initial VN seed failed", e);
    }
  }

  if (!usdVnd) {
    try { usdVnd = await refreshFx(env); }
    catch (e) { console.error("Initial FX seed failed", e); }
  }

  const validated = validateVietnamQuotes(vietnam);

  // Merge stored provider state with current data availability.
  const byBrand = new Map(providers.map(x => [x.brand, x]));
  const providerView = vietnamGoldProviders.map(p => {
    const status = byBrand.get(p.brand);
    const rows = validated.rows.filter(x => x.brand === p.brand);
    const newest = rows.reduce<string | null>((acc, x) => {
      if (!acc || Date.parse(x.observedAt) > Date.parse(acc)) return x.observedAt;
      return acc;
    }, null);
    const stale = newest ? Date.now() - Date.parse(newest) > 15 * 60_000 : true;

    return {
      ...(status ?? {
        ...p,
        state: rows.length ? "error" : "error",
        available: rows.length > 0,
        sourceKind: rows[0]?.sourceKind ?? null,
        sourceLabel: rows[0]?.sourceKind === "official" ? "Official" :
          rows.length ? "Fallback" : null,
        lastAttemptAt: newest ?? new Date(0).toISOString(),
        lastSuccessAt: newest,
        error: rows.length ? "Loaded from D1 cache" : "No data yet"
      }),
      available: rows.length > 0,
      stale,
      lastSuccessAt: status?.lastSuccessAt ?? newest
    };
  });

  return {
    world,
    vietnam: validated.rows,
    providers: providerView,
    usdVnd,
    worldVndPerLuong: worldVndPerLuong(world, usdVnd),
    pollIntervals: {
      worldMs: 5000,
      vietnamMs: 300000,
      fxMs: 3600000
    },
    dataQuality: {
      config: vietnamQualityConfig,
      summaries: validated.summaries,
      suspectCount: validated.rows.filter(x => x.qualityState === "suspect").length
    },
    cloud: {
      runtime: "cloudflare-workers",
      database: "d1",
      realtimeDisplay: "TradingView OANDA:XAUUSD",
      worldCalculationFeed: world.source
    },
    serverTime: new Date().toISOString()
  };
}


function cleanSymbols(value: string | null) {
  return [...new Set(
    String(value ?? "")
      .split(",")
      .map(x => x.trim().toUpperCase())
      .filter(x => /^[A-Z0-9]{2,12}$/.test(x))
  )].slice(0, 50);
}


async function route(request: Request, env: Env, ctx: ExecutionContext) {
  const url = new URL(request.url);
  if (url.pathname === "/api/stocks/watchlists" && request.method === "POST") {
    const body = await request.json<any>().catch(() => ({}));
    const name = String(body?.name ?? "").trim().slice(0, 40);
    if (!name) return json({ error: "name is required" }, 400);
    try {
      return json({ data: await createWatchlist(env.DB, name) });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : String(error) }, 400);
    }
  }

  const watchlistMatch = url.pathname.match(/^\/api\/stocks\/watchlists\/(\d+)(?:\/symbols)?$/);
  if (watchlistMatch && request.method !== "GET") {
    const id = Number(watchlistMatch[1]);

    if (request.method === "DELETE" && !url.pathname.endsWith("/symbols")) {
      await deleteWatchlist(env.DB, id);
      return json({ ok: true });
    }

    if (url.pathname.endsWith("/symbols")) {
      const body = await request.json<any>().catch(() => ({}));
      const symbol = String(body?.symbol ?? "").trim().toUpperCase();
      if (!/^[A-Z0-9]{2,12}$/.test(symbol)) return json({ error: "invalid symbol" }, 400);

      if (request.method === "POST") {
        await addWatchlistSymbol(env.DB, id, symbol);
        return json({ ok: true });
      }

      if (request.method === "DELETE") {
        await removeWatchlistSymbol(env.DB, id, symbol);
        return json({ ok: true });
      }
    }

    return json({ error: "Method not allowed" }, 405);
  }

  if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);

  if (url.pathname === "/api/stocks/indices") {
    try {
      return json({
        data: await getMarketIndexes(),
        provider: "vndirect-public",
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      return json({
        data: [],
        provider: "vndirect-public",
        error: error instanceof Error ? error.message : String(error),
        serverTime: new Date().toISOString()
      }, 200);
    }
  }

  if (url.pathname === "/api/stocks/foreign-diagnostic") {
    const symbols = cleanSymbols(url.searchParams.get("symbols"));
    if (!symbols.length) return json({ data: [], error: "symbols is required" }, 400);

    try {
      const map = await getForeignTradingMap(symbols);
      return json({
        provider: "fireant-historical-quotes",
        requested: symbols,
        received: [...map.keys()],
        data: [...map.values()],
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      return json({
        provider: "fireant-historical-quotes",
        requested: symbols,
        received: [],
        data: [],
        error: error instanceof Error ? error.message : String(error),
        serverTime: new Date().toISOString()
      }, 200);
    }
  }

  if (url.pathname === "/api/stocks/realtime-diagnostic") {
    const symbols = cleanSymbols(url.searchParams.get("symbols"));
    if (!symbols.length) return json({ data: [], error: "symbols is required" }, 400);

    try {
      const map = await getRealtimeSnapshots(symbols);
      return json({
        provider: "vndirect-realtime-snapshot",
        requested: symbols,
        received: [...map.keys()],
        data: [...map.values()],
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      return json({
        provider: "vndirect-realtime-snapshot",
        requested: symbols,
        received: [],
        data: [],
        error: error instanceof Error ? error.message : String(error),
        serverTime: new Date().toISOString()
      }, 200);
    }
  }

  if (url.pathname === "/api/stocks/quotes") {
    const symbols = cleanSymbols(url.searchParams.get("symbols"));
    if (!symbols.length) return json({ data: [], error: "symbols is required" }, 400);
    try {
      return json({
        data: await getStockQuotes(symbols),
        provider: "vndirect-public",
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      return json({
        data: [],
        provider: "vndirect-public",
        error: error instanceof Error ? error.message : String(error),
        serverTime: new Date().toISOString()
      }, 200);
    }
  }

  if (url.pathname.startsWith("/api/stocks/detail/")) {
    const symbol = url.pathname.split("/").pop()!.toUpperCase();
    try {
      return json({
        data: await getStockDetail(symbol),
        provider: "vndirect-public",
        serverTime: new Date().toISOString()
      });
    } catch (error) {
      return json({
        data: null,
        provider: "vndirect-public",
        error: error instanceof Error ? error.message : String(error),
        serverTime: new Date().toISOString()
      }, 200);
    }
  }

  if (url.pathname.startsWith("/api/stocks/chart/")) {
    const symbol = url.pathname.split("/").pop()!.toUpperCase();
    const frameRaw = String(url.searchParams.get("frame") ?? "D").toUpperCase();
    const frame = (["1","5","15","D"].includes(frameRaw) ? frameRaw : "D") as "1"|"5"|"15"|"D";
    try {
      return json({
        symbol,
        frame,
        data: await getStockChart(symbol, frame),
        provider: "vndirect-public"
      });
    } catch (error) {
      return json({
        symbol,
        frame,
        data: [],
        provider: "vndirect-public",
        error: error instanceof Error ? error.message : String(error)
      }, 200);
    }
  }

  if (url.pathname === "/api/stocks/watchlists") {
    await ensureDefaultWatchlists(env.DB);
    return json({ data: await listWatchlists(env.DB) });
  }


  try {
    if (url.pathname === "/health") {
      return json({
        ok: true,
        runtime: "cloudflare-workers",
        database: "d1",
        now: new Date().toISOString()
      }, 200);
    }

    if (url.pathname === "/api/gold/dashboard") {
      return json(await dashboard(env, ctx), 200);
    }

    if (url.pathname === "/api/gold/world") {
      return json(await worldQuote(env, ctx), 200);
    }

    if (url.pathname === "/api/gold/world/history") {
      const range = (url.searchParams.get("range")?.toUpperCase() ?? "1D") as HistoryRange;
      const allowed: HistoryRange[] = ["1D","1W","1M","6M","1Y","5Y","10Y","25Y","50Y","ALL"];
      if (!allowed.includes(range)) return json({ error: "Invalid range" }, 400);

      if (range === "1D") {
        const rows = await getWorldHistory(env.DB, 24);
        return json({ range, source: "d1-live", points: rows }, 200);
      }

      const points = await getExternalWorldHistory(range);
      return json({ range, source: points[0]?.source ?? "stooq", points }, 200);
    }

    if (url.pathname === "/api/gold/vietnam") {
      return json(await getLatestVietnam(env.DB), 200);
    }

    if (url.pathname === "/api/gold/vietnam/history") {
      const brand = url.searchParams.get("brand");
      const product = url.searchParams.get("product");
      if (!brand || !product) return json([], 200);
      const hours = Math.min(Math.max(Number(url.searchParams.get("hours") ?? 168), 1), 24 * 365);
      return json(await getVNHistory(env.DB, brand, product, hours), 200);
    }

    if (url.pathname === "/api/debug/vietnam-quality") {
      const rows = await getLatestVietnam(env.DB);
      return json(validateVietnamQuotes(rows), 200);
    }

    const debug = url.pathname.match(/^\/api\/debug\/vietnam\/([^/]+)$/);
    if (debug) {
      const result = await debugVietnamProvider(decodeURIComponent(debug[1]));
      if (!result) {
        return json({
          error: "Unknown brand",
          allowed: vietnamGoldProviders.map(x => x.brand)
        }, 404);
      }
      return json(result, 200);
    }

    if (url.pathname === "/api/admin/refresh-vietnam") {
      // Convenience endpoint for manual testing; no mutation from browser other
      // than refreshing public market data into D1.
      return json(await refreshVietnam(env), 200);
    }

    // API/health requests that reach this point are 404.
    if (url.pathname.startsWith("/api/") || url.pathname === "/health") {
      return json({ error: "Not found" }, 404);
    }

    // Everything else is the React PWA/static asset.
    return env.ASSETS.fetch(request);
  } catch (error) {
    console.error(error);
    if (!url.pathname.startsWith("/api/") && url.pathname !== "/health") {
      return env.ASSETS.fetch(request);
    }
    return json({
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return route(request, env, ctx);
  },

  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const cron = controller.cron;

    if (cron === "*/5 * * * *") {
      ctx.waitUntil((async () => {
        try {
          await refreshVietnam(env);
          await logCron(env.DB, "vietnam", true);
        } catch (e) {
          await logCron(env.DB, "vietnam", false, e instanceof Error ? e.message : String(e));
          throw e;
        }
      })());
      return;
    }

    if (cron === "17 * * * *") {
      ctx.waitUntil((async () => {
        try {
          await refreshFx(env);
          await logCron(env.DB, "fx", true);
        } catch (e) {
          await logCron(env.DB, "fx", false, e instanceof Error ? e.message : String(e));
          throw e;
        }
      })());
      return;
    }

    if (cron === "0 3 * * *") {
      ctx.waitUntil((async () => {
        try {
          await cleanup(env.DB);
          await logCron(env.DB, "cleanup", true);
        } catch (e) {
          await logCron(env.DB, "cleanup", false, e instanceof Error ? e.message : String(e));
          throw e;
        }
      })());
    }
  }
} satisfies ExportedHandler<Env>;
