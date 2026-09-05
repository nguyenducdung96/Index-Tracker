export type ForeignTrading = {
  symbol: string;
  buyForeignQuantity: number | null;
  sellForeignQuantity: number | null;
  buyForeignValue: number | null;
  sellForeignValue: number | null;
  currentForeignRoom: number | null;
  date: string | null;
  source: "fireant";
};

const FIREANT_BASE = "https://restv2.fireant.vn";

function n(...values: unknown[]): number | null {
  for (const value of values) {
    const x = Number(value);
    if (Number.isFinite(x)) return x;
  }
  return null;
}

function pickRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function vietnamDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const get = (type: string) => parts.find(x => x.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function daysAgo(nDays: number) {
  return vietnamDateParts(new Date(Date.now() - nDays * 86400_000));
}

function latestRow(rows: any[]) {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(String(a?.date ?? a?.Date ?? ""));
    const tb = Date.parse(String(b?.date ?? b?.Date ?? ""));
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  })[0] ?? null;
}

async function fetchForeignOne(symbol: string): Promise<ForeignTrading | null> {
  const code = symbol.toUpperCase();

  // Query a short multi-day window so weekends/holidays still return the
  // latest trading session. FireAnt historical quote records expose the exact
  // foreign buy/sell quantity and value fields used by its web UI.
  const startDate = `${daysAgo(7)}T00:00:00+07:00`;
  const endDate = `${vietnamDateParts()}T23:59:59+07:00`;

  const url = new URL(`${FIREANT_BASE}/symbols/${encodeURIComponent(code)}/historical-quotes`);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("offset", "0");
  url.searchParams.set("limit", "10");

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });

  let res = await cache.match(cacheKey);
  if (!res) {
    const upstream = await fetch(url.toString(), {
      headers: {
        accept: "application/json,text/plain,*/*",
        "user-agent": "Mozilla/5.0 MarketTrackerPWA/8.3.3",
        referer: "https://www.fireant.vn/"
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store"
    });

    if (!upstream.ok) {
      throw new Error(`FireAnt HTTP ${upstream.status}`);
    }

    const body = await upstream.text();
    res = new Response(body, {
      status: 200,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
        "cache-control": "public, max-age=15"
      }
    });

    // Cache foreign data for 15 seconds. Core watchlist quotes can still poll
    // every 4 seconds without hammering FireAnt.
    await cache.put(cacheKey, res.clone());
  }

  const payload = await res.json<any>();
  const row = latestRow(pickRows(payload));
  if (!row) return null;

  return {
    symbol: code,
    buyForeignQuantity: n(
      row?.buyForeignQuantity,
      row?.BuyForeignQuantity
    ),
    sellForeignQuantity: n(
      row?.sellForeignQuantity,
      row?.SellForeignQuantity
    ),
    buyForeignValue: n(
      row?.buyForeignValue,
      row?.BuyForeignValue
    ),
    sellForeignValue: n(
      row?.sellForeignValue,
      row?.SellForeignValue
    ),
    currentForeignRoom: n(
      row?.currentForeignRoom,
      row?.CurrentForeignRoom
    ),
    date: String(row?.date ?? row?.Date ?? "") || null,
    source: "fireant"
  };
}

export async function getForeignTradingMap(
  symbols: string[]
): Promise<Map<string, ForeignTrading>> {
  const clean = [...new Set(
    symbols
      .map(x => x.trim().toUpperCase())
      .filter(x => /^[A-Z0-9]{2,12}$/.test(x))
  )];

  const settled = await Promise.allSettled(clean.map(fetchForeignOne));
  const map = new Map<string, ForeignTrading>();

  settled.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      map.set(clean[i], result.value);
    }
  });

  return map;
}
