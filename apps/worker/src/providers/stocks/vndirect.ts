import { getRealtimeSnapshots, type VndRealtimeStock } from "./vndirectRealtime.js";
import { getForeignTradingMap } from "./fireantForeign.js";
import type {
  StockChartPoint,
  StockDetail,
  StockIndexQuote,
  StockQuote
} from "../../types.js";

const STOCK_PRICES_URL = "https://api-finfo.vndirect.com.vn/v4/stock_prices";
const MARKET_PRICES_URL = "https://api-finfo.vndirect.com.vn/v4/vnmarket_prices";
const DCHART_URL = "https://dchart-api.vndirect.com.vn/dchart/history";

const HEADERS = {
  accept: "application/json,text/plain,*/*",
  "user-agent": "Mozilla/5.0 MarketTrackerPWA/8.1"
};

function n(...values: unknown[]): number | null {
  for (const value of values) {
    const x = Number(value);
    if (Number.isFinite(x)) return x;
  }
  return null;
}

function s(...values: unknown[]): string | null {
  for (const value of values) {
    const x = String(value ?? "").trim();
    if (x) return x;
  }
  return null;
}

function priceScale(value: number | null): number | null {
  if (value == null) return null;

  // VNDIRECT public endpoints have historically exposed listed-equity prices
  // in "thousand VND" units (e.g. 28.85 for 28,850 VND). Keep values in the
  // familiar VN quote-board unit rather than multiplying by 1000.
  return value;
}

function normalizeFloor(row: any): string {
  const raw = String(
    row?.floor ??
    row?.exchange ??
    row?.market ??
    row?.board ??
    row?.type ??
    ""
  ).toUpperCase();

  if (raw.includes("HOSE") || raw.includes("HSX") || raw === "HO") return "HOSE";
  if (raw.includes("HNX")) return "HNX";
  if (raw.includes("UPCOM") || raw.includes("UPC")) return "UPCOM";
  return raw || "UNKNOWN";
}

async function fetchJson(url: URL | string) {
  const res = await fetch(String(url), {
    headers: HEADERS,
    signal: AbortSignal.timeout(9000),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`VNDIRECT HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json<any>();
}

function dataRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function latestByDate(rows: any[]): any | null {
  if (!rows.length) return null;

  return [...rows].sort((a, b) => {
    const ta = Date.parse(String(a?.date ?? a?.tradingDate ?? a?.time ?? ""));
    const tb = Date.parse(String(b?.date ?? b?.tradingDate ?? b?.time ?? ""));
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  })[0] ?? null;
}

function dateQuery(code: string, days = 10) {
  const end = new Date();
  const start = new Date(Date.now() - days * 86400_000);

  const endText = end.toISOString().slice(0, 10);
  const startText = start.toISOString().slice(0, 10);

  return `code:${code}~date:gte:${startText}~date:lte:${endText}`;
}

async function getLatestStockRow(code: string) {
  const url = new URL(STOCK_PRICES_URL);
  url.searchParams.set("q", dateQuery(code, 10));
  url.searchParams.set("sort", "date:desc");
  url.searchParams.set("size", "10");
  url.searchParams.set("page", "1");

  const payload = await fetchJson(url);
  return latestByDate(dataRows(payload));
}

async function getStockRows(code: string, days = 420, size = 5000) {
  const url = new URL(STOCK_PRICES_URL);
  url.searchParams.set("q", dateQuery(code, days));
  url.searchParams.set("sort", "date");
  url.searchParams.set("size", String(size));
  url.searchParams.set("page", "1");

  const payload = await fetchJson(url);
  return dataRows(payload);
}

const INDEX_MAP = [
  { code: "VNINDEX", name: "VN-Index", query: "VNINDEX" },
  { code: "VN30", name: "VN30", query: "VN30" }
] as const;

function indexFromRow(meta: typeof INDEX_MAP[number], row: any): StockIndexQuote {
  const indexValue = n(
    row?.indexValue,
    row?.close,
    row?.index,
    row?.value,
    row?.marketIndex
  );

  const change = n(
    row?.change,
    row?.indexChange,
    row?.chg,
    row?.absoluteChange
  );

  let changePercent = n(
    row?.pctChange,
    row?.changePercent,
    row?.indexChangePercent,
    row?.percentChange
  );

  const reference = n(
    row?.basicPrice,
    row?.referencePrice,
    row?.priorIndex,
    row?.previousClose
  );

  if (changePercent == null && indexValue != null && reference != null && reference !== 0) {
    changePercent = ((indexValue - reference) / reference) * 100;
  }

  return {
    code: meta.code,
    name: meta.name,
    indexValue,
    change: change ?? (
      indexValue != null && reference != null ? indexValue - reference : null
    ),
    changePercent,
    accumulatedVal: n(
      row?.accumulatedVal,
      row?.totalValue,
      row?.nmValue,
      row?.totalMatchValue,
      row?.value
    ),
    accumulatedVol: n(
      row?.accumulatedVol,
      row?.totalVolume,
      row?.nmVolume,
      row?.totalMatchVolume,
      row?.volume
    ),
    advances: n(
      row?.advances,
      row?.advance,
      row?.up,
      row?.totalAdvanceStock,
      row?.numUp
    ),
    declines: n(
      row?.declines,
      row?.decline,
      row?.down,
      row?.totalDeclineStock,
      row?.numDown
    ),
    noChanges: n(
      row?.noChanges,
      row?.noChange,
      row?.unchanged,
      row?.steady,
      row?.totalSteadyStock,
      row?.numNoChange
    ),
    ceilings: n(row?.ceilings, row?.totalCeilingStock),
    floors: n(row?.floors, row?.totalFloorStock),
    updatedAt: new Date().toISOString()
  };
}

async function getIndex(meta: typeof INDEX_MAP[number]) {
  const url = new URL(MARKET_PRICES_URL);
  url.searchParams.set("q", dateQuery(meta.query, 10));
  url.searchParams.set("sort", "date:desc");
  url.searchParams.set("size", "10");
  url.searchParams.set("page", "1");

  try {
    const payload = await fetchJson(url);
    const row = latestByDate(dataRows(payload));
    if (row) return indexFromRow(meta, row);
  } catch {
    // Try a query without the date condition because historical versions of
    // vnmarket_prices have accepted different query shapes for indices.
  }

  const fallbackUrl = new URL(MARKET_PRICES_URL);
  fallbackUrl.searchParams.set("q", `code:${meta.query}`);
  fallbackUrl.searchParams.set("sort", "date:desc");
  fallbackUrl.searchParams.set("size", "10");
  fallbackUrl.searchParams.set("page", "1");

  const fallbackPayload = await fetchJson(fallbackUrl);
  const fallbackRow = latestByDate(dataRows(fallbackPayload));

  return fallbackRow
    ? indexFromRow(meta, fallbackRow)
    : {
        code: meta.code,
        name: meta.name,
        indexValue: null,
        change: null,
        changePercent: null,
        accumulatedVal: null,
        accumulatedVol: null,
        advances: null,
        declines: null,
        noChanges: null,
        ceilings: null,
        floors: null,
        updatedAt: new Date().toISOString()
      };
}

export async function getMarketIndexes(): Promise<StockIndexQuote[]> {
  return Promise.all(INDEX_MAP.map(getIndex));
}


function foreignValueFromRow(
  row: any,
  side: "buy" | "sell",
  qty: number | null,
  avgPrice: number | null,
  currentPrice: number | null
): { value: number | null; estimated: boolean } {
  const direct =
    side === "buy"
      ? n(
          row?.buyForeignVal,
          row?.buyForeignValue,
          row?.foreignBuyVal,
          row?.foreignBuyValue,
          row?.foreignBuyValueMatched
        )
      : n(
          row?.sellForeignVal,
          row?.sellForeignValue,
          row?.foreignSellVal,
          row?.foreignSellValue,
          row?.foreignSellValueMatched
        );

  if (direct != null) {
    return { value: direct, estimated: false };
  }

  // Public VNDIRECT price-feed exposes foreign BUY/SELL QUANTITY.
  // When exact side value is absent, estimate notional using average price
  // (fallback current price). Equity quote prices are in thousand VND.
  const px = avgPrice ?? currentPrice;
  if (qty != null && px != null) {
    return {
      value: qty * px * 1000,
      estimated: true
    };
  }

  return { value: null, estimated: false };
}

function quoteFromRow(code: string, row: any): StockQuote {
  const matchPrice = priceScale(n(
    row?.matchPrice,
    row?.close,
    row?.closePrice,
    row?.adClose
  ));

  const refPrice = priceScale(n(
    row?.basicPrice,
    row?.referencePrice,
    row?.refPrice
  ));

  const avgPrice = priceScale(n(
    row?.average,
    row?.averagePrice,
    row?.avgPrice,
    row?.adAverage
  ));

  const foreignBuyVol = n(
    row?.buyForeignQtty,
    row?.foreignBuyQtty,
    row?.foreignBuyVol
  );

  const foreignSellVol = n(
    row?.sellForeignQtty,
    row?.foreignSellQtty,
    row?.foreignSellVol
  );

  const foreignBuy = foreignValueFromRow(
    row,
    "buy",
    foreignBuyVol,
    avgPrice,
    matchPrice
  );

  const foreignSell = foreignValueFromRow(
    row,
    "sell",
    foreignSellVol,
    avgPrice,
    matchPrice
  );

  let change = priceScale(n(
    row?.change,
    row?.priceChange,
    row?.chg
  ));

  if (change == null && matchPrice != null && refPrice != null) {
    change = matchPrice - refPrice;
  }

  let changePercent = n(
    row?.pctChange,
    row?.changePercent,
    row?.priceChangePercent
  );

  if (changePercent == null && change != null && refPrice != null && refPrice !== 0) {
    changePercent = (change / refPrice) * 100;
  }

  return {
    code,
    floor: normalizeFloor(row),
    companyName: s(
      row?.companyName,
      row?.companyNameVi,
      row?.name,
      row?.organName,
      row?.code
    ) ?? code,
    matchPrice,
    matchVol: n(row?.matchVol, row?.matchVolume, row?.lastVolume),
    change,
    changePercent,
    accumulatedVol: n(
      row?.accumulatedVol,
      row?.nmVolume,
      row?.totalVolume,
      row?.volume
    ),
    accumulatedVal: n(
      row?.accumulatedVal,
      row?.nmValue,
      row?.totalValue,
      row?.value
    ),
    refPrice,
    ceilingPrice: priceScale(n(row?.ceilingPrice, row?.ceiling)),
    floorPrice: priceScale(n(row?.floorPrice, row?.floorValue)),
    openPrice: priceScale(n(row?.open, row?.openPrice, row?.adOpen)),
    highestPrice: priceScale(n(row?.high, row?.highPrice, row?.adHigh)),
    lowestPrice: priceScale(n(row?.low, row?.lowPrice, row?.adLow)),
    avgPrice,
    foreignBuyVol,
    foreignSellVol,
    foreignBuyVal: foreignBuy.value,
    foreignSellVal: foreignSell.value,
    foreignValueEstimated: foreignBuy.estimated || foreignSell.estimated,
    updatedAt: new Date().toISOString()
  };
}


function validPositive(value: number | null | undefined) {
  return value != null && Number.isFinite(value) && value > 0 ? value : null;
}

function sanePrice(value: number | null | undefined, basePrice: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;

  // VN listed equity prices are expected to be in the same quote-board unit
  // as the HTTP base price. Reject obviously shifted decoder values.
  if (basePrice != null && basePrice > 0) {
    const ratio = value / basePrice;
    if (ratio < 0.25 || ratio > 4) return null;
  }

  return value;
}

function saneNonNegative(value: number | null | undefined) {
  return value != null && Number.isFinite(value) && value >= 0 ? value : null;
}

function mergeRealtimeQuote(base: StockQuote, rt?: VndRealtimeStock): StockQuote {
  if (!rt) {
    return {
      ...base,
      realtimeSnapshotAvailable: false
    };
  }

  /*
   * IMPORTANT:
   * VNDIRECT v4 HTTP remains the authoritative source for:
   * - matchPrice
   * - change / changePercent
   * - accumulatedVol / accumulatedVal
   * - high / low
   * - reference / ceiling / floor
   *
   * The free realtime snapshot is used ONLY to supplement fields that HTTP
   * does not provide reliably. This prevents a decoder-layout mismatch from
   * corrupting already-correct watchlist prices and liquidity.
   */

  const foreignBuyVol = saneNonNegative(rt.buyForeignQtty) ?? base.foreignBuyVol ?? null;
  const foreignSellVol = saneNonNegative(rt.sellForeignQtty) ?? base.foreignSellVol ?? null;

  const valuePx = base.avgPrice ?? base.matchPrice;
  const foreignBuyVal =
    foreignBuyVol != null && valuePx != null
      ? foreignBuyVol * valuePx * 1000
      : base.foreignBuyVal ?? null;

  const foreignSellVal =
    foreignSellVol != null && valuePx != null
      ? foreignSellVol * valuePx * 1000
      : base.foreignSellVal ?? null;

  // matchQtty is supplemental only. Reject absurd values relative to total vol.
  let matchVol: number | null = base.matchVol ?? null;
  const rtMatch = saneNonNegative(rt.matchQtty ?? rt.currentQtty);
  if (rtMatch != null) {
    if (base.accumulatedVol == null || base.accumulatedVol <= 0 || rtMatch <= base.accumulatedVol) {
      matchVol = rtMatch;
    }
  }

  const currentRoom = saneNonNegative(rt.currentRoom);
  const totalRoom = saneNonNegative(rt.totalRoom);

  const roomValid =
    currentRoom != null &&
    totalRoom != null &&
    totalRoom > 0 &&
    currentRoom <= totalRoom * 1.05;

  return {
    ...base,

    // KEEP all HTTP market price/liquidity fields unchanged.
    matchPrice: base.matchPrice,
    change: base.change,
    changePercent: base.changePercent,
    accumulatedVol: base.accumulatedVol,
    accumulatedVal: base.accumulatedVal,
    refPrice: base.refPrice,
    ceilingPrice: base.ceilingPrice,
    floorPrice: base.floorPrice,
    highestPrice: base.highestPrice,
    lowestPrice: base.lowestPrice,
    avgPrice: base.avgPrice,

    // Supplement only.
    matchVol,
    foreignBuyVol,
    foreignSellVol,
    foreignBuyVal,
    foreignSellVal,
    foreignValueEstimated:
      foreignBuyVol != null || foreignSellVol != null
        ? true
        : base.foreignValueEstimated,
    currentRoom: roomValid ? currentRoom : base.currentRoom ?? null,
    totalRoom: roomValid ? totalRoom : base.totalRoom ?? null,
    realtimeSnapshotAvailable: true,
    updatedAt: new Date().toISOString()
  };
}

export async function getStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const clean = symbols.map(x => x.trim().toUpperCase());

  const [baseRows, realtime, foreignMap] = await Promise.all([
    Promise.all(
      clean.map(async (code) => {
        const row = await getLatestStockRow(code);
        return row
          ? quoteFromRow(code, row)
          : {
              code,
              floor: "UNKNOWN",
              companyName: code,
              matchPrice: null,
              matchVol: null,
              change: null,
              changePercent: null,
              accumulatedVol: null,
              accumulatedVal: null,
              refPrice: null,
              ceilingPrice: null,
              floorPrice: null,
              openPrice: null,
              highestPrice: null,
              lowestPrice: null,
              avgPrice: null,
              foreignBuyVol: null,
              foreignSellVol: null,
              foreignBuyVal: null,
              foreignSellVal: null,
              foreignValueEstimated: false,
              currentRoom: null,
              totalRoom: null,
              realtimeSnapshotAvailable: false,
              updatedAt: new Date().toISOString()
            } satisfies StockQuote;
      })
    ),
    getRealtimeSnapshots(clean).catch(() => new Map<string, VndRealtimeStock>()),
    getForeignTradingMap(clean).catch(() => new Map())
  ]);

  return baseRows.map(base => {
    // First supplement matchVol/room from realtime snapshot, while preserving
    // authoritative HTTP price/liquidity fields.
    const merged = mergeRealtimeQuote(base, realtime.get(base.code));

    // Foreign trading must come from FireAnt's explicit per-symbol fields.
    // Do NOT estimate buy/sell value from VNDIRECT snapshot quantities.
    const fa = foreignMap.get(base.code);
    if (!fa) {
      return {
        ...merged,
        foreignBuyVol: null,
        foreignSellVol: null,
        foreignBuyVal: null,
        foreignSellVal: null,
        foreignValueEstimated: false
      };
    }

    return {
      ...merged,
      foreignBuyVol: fa.buyForeignQuantity,
      foreignSellVol: fa.sellForeignQuantity,
      foreignBuyVal: fa.buyForeignValue,
      foreignSellVal: fa.sellForeignValue,
      foreignValueEstimated: false,
      currentRoom: fa.currentForeignRoom ?? merged.currentRoom ?? null
    };
  });
}

function sma(values: number[], length: number, index: number): number | null {
  if (index + 1 < length) return null;
  let sum = 0;
  for (let i = index - length + 1; i <= index; i++) sum += values[i];
  return sum / length;
}

function dchartResolution(frame: "1" | "5" | "15" | "D") {
  if (frame === "D") return "D";
  return frame;
}

async function getDchart(symbol: string, frame: "1" | "5" | "15" | "D") {
  const nowSec = Math.floor(Date.now() / 1000);
  const lookbackSec =
    frame === "D"
      ? 430 * 86400
      : frame === "15"
        ? 40 * 86400
        : 15 * 86400;

  const url = new URL(DCHART_URL);
  url.searchParams.set("resolution", dchartResolution(frame));
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("from", String(nowSec - lookbackSec));
  url.searchParams.set("to", String(nowSec));

  return fetchJson(url);
}

function chartFromTradingViewPayload(payload: any): StockChartPoint[] {
  const times: any[] = payload?.t ?? [];
  const opens: any[] = payload?.o ?? [];
  const highs: any[] = payload?.h ?? [];
  const lows: any[] = payload?.l ?? [];
  const closes: any[] = payload?.c ?? [];
  const vols: any[] = payload?.v ?? [];

  if (!Array.isArray(times) || !times.length) return [];

  const raw = times.map((time, i) => ({
    time: Number(time),
    open: Number(opens[i]),
    high: Number(highs[i]),
    low: Number(lows[i]),
    close: Number(closes[i]),
    volume: Number(vols[i] ?? 0)
  })).filter(x =>
    Number.isFinite(x.time) &&
    Number.isFinite(x.open) &&
    Number.isFinite(x.high) &&
    Number.isFinite(x.low) &&
    Number.isFinite(x.close)
  );

  const closesNum = raw.map(x => x.close);

  return raw.map((x, i) => ({
    ...x,
    ma20: sma(closesNum, 20, i),
    ma50: sma(closesNum, 50, i),
    ma200: sma(closesNum, 200, i)
  }));
}

function chartFromStockRows(rows: any[]): StockChartPoint[] {
  const sorted = [...rows].sort(
    (a, b) =>
      Date.parse(String(a?.date ?? "")) -
      Date.parse(String(b?.date ?? ""))
  );

  const raw = sorted.map(row => ({
    time: String(row?.date ?? ""),
    open: Number(n(row?.adOpen, row?.open) ?? NaN),
    high: Number(n(row?.adHigh, row?.high) ?? NaN),
    low: Number(n(row?.adLow, row?.low) ?? NaN),
    close: Number(n(row?.adClose, row?.close) ?? NaN),
    volume: Number(n(row?.nmVolume, row?.volume) ?? 0)
  })).filter(x =>
    x.time &&
    Number.isFinite(x.open) &&
    Number.isFinite(x.high) &&
    Number.isFinite(x.low) &&
    Number.isFinite(x.close)
  );

  const closes = raw.map(x => x.close);

  return raw.map((x, i) => ({
    ...x,
    ma20: sma(closes, 20, i),
    ma50: sma(closes, 50, i),
    ma200: sma(closes, 200, i)
  }));
}

export async function getStockChart(
  symbol: string,
  frame: "1" | "5" | "15" | "D"
): Promise<StockChartPoint[]> {
  try {
    const payload = await getDchart(symbol, frame);
    const chart = chartFromTradingViewPayload(payload);
    if (chart.length) return chart;
  } catch {
    // Daily REST fallback below.
  }

  if (frame !== "D") return [];
  return chartFromStockRows(await getStockRows(symbol, 430, 5000));
}

export async function getStockDetail(symbol: string): Promise<StockDetail> {
  const code = symbol.toUpperCase();

  const [[quote], realtime] = await Promise.all([
    getStockQuotes([code]),
    getRealtimeSnapshots([code]).catch(() => new Map<string, VndRealtimeStock>())
  ]);

  const rt = realtime.get(code);

  let avg20DVol: number | null = null;
  try {
    const daily = await getStockChart(code, "D");
    const vols = daily
      .slice(-20)
      .map(x => Number(x.volume))
      .filter(x => Number.isFinite(x) && x >= 0);

    if (vols.length) {
      avg20DVol = vols.reduce((a, b) => a + b, 0) / vols.length;
    }
  } catch {}

  const volumeVsAvg20 =
    avg20DVol && quote.accumulatedVol != null
      ? quote.accumulatedVol / avg20DVol
      : null;

  function validDepthPrice(value: number | null | undefined) {
    if (value == null || !Number.isFinite(value) || value <= 0) return null;
    if (quote.matchPrice != null && quote.matchPrice > 0) {
      const ratio = value / quote.matchPrice;
      if (ratio < 0.5 || ratio > 1.5) return null;
    }
    return value;
  }

  function validDepthVol(value: number | null | undefined) {
    if (value == null || !Number.isFinite(value) || value < 0) return null;
    // Single depth level should not wildly exceed session total volume.
    if (
      quote.accumulatedVol != null &&
      quote.accumulatedVol > 0 &&
      value > quote.accumulatedVol * 5
    ) return null;
    return value;
  }

  const bid = [
    { price: validDepthPrice(rt?.bidPrice01), volume: validDepthVol(rt?.bidQtty01) },
    { price: validDepthPrice(rt?.bidPrice02), volume: validDepthVol(rt?.bidQtty02) },
    { price: validDepthPrice(rt?.bidPrice03), volume: validDepthVol(rt?.bidQtty03) }
  ];

  const ask = [
    { price: validDepthPrice(rt?.offerPrice01), volume: validDepthVol(rt?.offerQtty01) },
    { price: validDepthPrice(rt?.offerPrice02), volume: validDepthVol(rt?.offerQtty02) },
    { price: validDepthPrice(rt?.offerPrice03), volume: validDepthVol(rt?.offerQtty03) }
  ];

  const bidVol = bid.reduce((sum, x) => sum + (x.volume ?? 0), 0);
  const askVol = ask.reduce((sum, x) => sum + (x.volume ?? 0), 0);
  const depthTotal = bidVol + askVol;

  const foreignBuyVol = quote.foreignBuyVol ?? null;
  const foreignSellVol = quote.foreignSellVol ?? null;
  const foreignBuyVal = quote.foreignBuyVal ?? null;
  const foreignSellVal = quote.foreignSellVal ?? null;
  const foreignNetVal =
    foreignBuyVal != null && foreignSellVal != null
      ? foreignBuyVal - foreignSellVal
      : null;

  const foreignParticipationPct =
    quote.accumulatedVal != null &&
    quote.accumulatedVal > 0 &&
    foreignBuyVal != null &&
    foreignSellVal != null
      ? ((foreignBuyVal + foreignSellVal) / quote.accumulatedVal) * 100
      : null;

  const depthAvailable =
    bid.some(x => x.price != null || x.volume != null) ||
    ask.some(x => x.price != null || x.volume != null);

  return {
    ...quote,
    avg20DVol,
    volumeVsAvg20,
    bid,
    ask,
    bidRatio: depthTotal > 0 ? (bidVol / depthTotal) * 100 : null,
    askRatio: depthTotal > 0 ? (askVol / depthTotal) * 100 : null,
    foreignBuyVol,
    foreignSellVol,
    foreignBuyVal,
    foreignSellVal,
    foreignNetVal,
    foreignParticipationPct,
    currentRoom: quote.currentRoom ?? null,
    realtimeDepthAvailable: depthAvailable
  };
}
