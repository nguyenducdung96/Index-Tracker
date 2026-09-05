export type VndRealtimeStock = {
  code: string;
  floorCode?: string | null;
  basicPrice?: number | null;
  floorPrice?: number | null;
  ceilingPrice?: number | null;

  currentPrice?: number | null;
  currentQtty?: number | null;
  matchPrice?: number | null;
  matchQtty?: number | null;

  highestPrice?: number | null;
  lowestPrice?: number | null;

  accumulatedVal?: number | null;
  accumulatedVol?: number | null;

  buyForeignQtty?: number | null;
  sellForeignQtty?: number | null;

  totalRoom?: number | null;
  currentRoom?: number | null;

  bidPrice01?: number | null;
  bidPrice02?: number | null;
  bidPrice03?: number | null;
  bidQtty01?: number | null;
  bidQtty02?: number | null;
  bidQtty03?: number | null;

  offerPrice01?: number | null;
  offerPrice02?: number | null;
  offerPrice03?: number | null;
  offerQtty01?: number | null;
  offerQtty02?: number | null;
  offerQtty03?: number | null;

  time?: string | null;
};

const SNAPSHOT_URL =
  "https://price-streaming-api-free.vndirect.com.vn/v2/stocks/snapshot";

function n(value: unknown): number | null {
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

/**
 * VNDIRECT snapshot obfuscation currently used by the public price page.
 * Each encoded character is restored by adding index % 5, then fields are
 * separated by "|".
 */
export function decodeFields(encoded: string): string[] {
  let decoded = "";
  for (let i = 0; i < encoded.length; i++) {
    decoded += String.fromCharCode(encoded.charCodeAt(i) + (i % 5));
  }
  return decoded.split("|");
}

function shares(value: unknown): number | null {
  const x = n(value);
  // VNDIRECT quote-board quantity unit is 10 shares.
  return x == null ? null : x * 10;
}

function valueVnd(value: unknown): number | null {
  const x = n(value);
  // Snapshot accumulated value is million VND.
  return x == null ? null : x * 1_000_000;
}

function mapValues(keys: string[], values: string[]) {
  const out: Record<string, string | null> = {};
  keys.forEach((key, i) => {
    out[key] = values[i] ?? null;
  });
  return out;
}

/**
 * IMPORTANT — production-verified current SFU/ST layout.
 *
 * We verified this layout against VNDIRECT's own displayed foreign trading:
 *
 * HPG raw:
 *   foreign buy  = 129368   -> 1,293,680 shares -> VNDIRECT shows 1,293.68
 *   foreign sell = 459197.6 -> 4,591,976 shares -> VNDIRECT shows 4,591.97
 *
 * HSG raw:
 *   2590 / 13240 -> VNDIRECT shows 25.90 / 132.40
 *
 * Therefore the two positions immediately after the order-book arrays in the
 * CURRENT free snapshot are foreign BUY/SELL quantity. They are NOT
 * totalBidQtty / totalOfferQtty.
 *
 * Do not insert tradingSessionId/foreign fields from the older 2021 snapshot
 * layout here; doing so shifts price/room fields and corrupts the quote.
 */
function parseSFU(values: string[]): VndRealtimeStock | null {
  const stockType = values[1] ?? "";
  if (!values[0]) return null;

  if (stockType === "ST") {
    const row = mapValues([
      "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",

      "bidPrice01","bidPrice02","bidPrice03","bidPrice04","bidPrice05",
      "bidPrice06","bidPrice07","bidPrice08","bidPrice09","bidPrice10",

      "bidQtty01","bidQtty02","bidQtty03","bidQtty04","bidQtty05",
      "bidQtty06","bidQtty07","bidQtty08","bidQtty09","bidQtty10",

      "offerPrice01","offerPrice02","offerPrice03","offerPrice04","offerPrice05",
      "offerPrice06","offerPrice07","offerPrice08","offerPrice09","offerPrice10",

      "offerQtty01","offerQtty02","offerQtty03","offerQtty04","offerQtty05",
      "offerQtty06","offerQtty07","offerQtty08","offerQtty09","offerQtty10",

      // Production-verified current snapshot positions:
      "buyForeignQtty",
      "sellForeignQtty",

      "highestPrice",
      "lowestPrice",
      "accumulatedVal",
      "accumulatedVol",
      "matchPrice",
      "matchQtty",
      "currentPrice",
      "currentQtty",
      "totalRoom",
      "currentRoom",
      "time"
    ], values);

    return {
      code: String(row.code).toUpperCase(),
      floorCode: row.floorCode,

      basicPrice: n(row.basicPrice),
      floorPrice: n(row.floorPrice),
      ceilingPrice: n(row.ceilingPrice),

      bidPrice01: n(row.bidPrice01),
      bidPrice02: n(row.bidPrice02),
      bidPrice03: n(row.bidPrice03),
      bidQtty01: shares(row.bidQtty01),
      bidQtty02: shares(row.bidQtty02),
      bidQtty03: shares(row.bidQtty03),

      offerPrice01: n(row.offerPrice01),
      offerPrice02: n(row.offerPrice02),
      offerPrice03: n(row.offerPrice03),
      offerQtty01: shares(row.offerQtty01),
      offerQtty02: shares(row.offerQtty02),
      offerQtty03: shares(row.offerQtty03),

      // Exact VNDIRECT foreign quantities from the current snapshot.
      buyForeignQtty: shares(row.buyForeignQtty),
      sellForeignQtty: shares(row.sellForeignQtty),

      highestPrice: n(row.highestPrice),
      lowestPrice: n(row.lowestPrice),
      accumulatedVal: valueVnd(row.accumulatedVal),
      accumulatedVol: shares(row.accumulatedVol),

      matchPrice: n(row.matchPrice),
      matchQtty: shares(row.matchQtty),
      currentPrice: n(row.currentPrice),
      currentQtty: shares(row.currentQtty),

      // Keep raw room values; vndirect.ts applies sanity checks before exposing.
      totalRoom: n(row.totalRoom),
      currentRoom: n(row.currentRoom),

      time: row.time
    };
  }

  // For non-ST products, keep a conservative top-3-only decoder.
  const row = mapValues([
    "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03",
    "buyForeignQtty","sellForeignQtty",
    "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
    "matchPrice","matchQtty","currentPrice","currentQtty","totalRoom","currentRoom"
  ], values);

  return {
    code: String(row.code).toUpperCase(),
    floorCode: row.floorCode,
    basicPrice: n(row.basicPrice),
    floorPrice: n(row.floorPrice),
    ceilingPrice: n(row.ceilingPrice),
    bidPrice01: n(row.bidPrice01),
    bidPrice02: n(row.bidPrice02),
    bidPrice03: n(row.bidPrice03),
    bidQtty01: shares(row.bidQtty01),
    bidQtty02: shares(row.bidQtty02),
    bidQtty03: shares(row.bidQtty03),
    offerPrice01: n(row.offerPrice01),
    offerPrice02: n(row.offerPrice02),
    offerPrice03: n(row.offerPrice03),
    offerQtty01: shares(row.offerQtty01),
    offerQtty02: shares(row.offerQtty02),
    offerQtty03: shares(row.offerQtty03),
    buyForeignQtty: shares(row.buyForeignQtty),
    sellForeignQtty: shares(row.sellForeignQtty),
    highestPrice: n(row.highestPrice),
    lowestPrice: n(row.lowestPrice),
    accumulatedVal: valueVnd(row.accumulatedVal),
    accumulatedVol: shares(row.accumulatedVol),
    matchPrice: n(row.matchPrice),
    matchQtty: shares(row.matchQtty),
    currentPrice: n(row.currentPrice),
    currentQtty: shares(row.currentQtty),
    totalRoom: n(row.totalRoom),
    currentRoom: n(row.currentRoom)
  };
}

function parseSBA(values: string[]): VndRealtimeStock | null {
  const code = String(values[0] ?? "").toUpperCase();
  if (!code) return null;

  const stockType = values[1] ?? "";

  if (stockType === "ST") {
    const row = mapValues([
      "code","stockType",
      "bidPrice01","bidPrice02","bidPrice03","bidPrice04","bidPrice05",
      "bidPrice06","bidPrice07","bidPrice08","bidPrice09","bidPrice10",
      "bidQtty01","bidQtty02","bidQtty03","bidQtty04","bidQtty05",
      "bidQtty06","bidQtty07","bidQtty08","bidQtty09","bidQtty10",
      "offerPrice01","offerPrice02","offerPrice03","offerPrice04","offerPrice05",
      "offerPrice06","offerPrice07","offerPrice08","offerPrice09","offerPrice10",
      "offerQtty01","offerQtty02","offerQtty03","offerQtty04","offerQtty05",
      "offerQtty06","offerQtty07","offerQtty08","offerQtty09","offerQtty10"
    ], values);

    return {
      code,
      bidPrice01: n(row.bidPrice01),
      bidPrice02: n(row.bidPrice02),
      bidPrice03: n(row.bidPrice03),
      bidQtty01: shares(row.bidQtty01),
      bidQtty02: shares(row.bidQtty02),
      bidQtty03: shares(row.bidQtty03),
      offerPrice01: n(row.offerPrice01),
      offerPrice02: n(row.offerPrice02),
      offerPrice03: n(row.offerPrice03),
      offerQtty01: shares(row.offerQtty01),
      offerQtty02: shares(row.offerQtty02),
      offerQtty03: shares(row.offerQtty03)
    };
  }

  const row = mapValues([
    "code","stockType",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03"
  ], values);

  return {
    code,
    bidPrice01: n(row.bidPrice01),
    bidPrice02: n(row.bidPrice02),
    bidPrice03: n(row.bidPrice03),
    bidQtty01: shares(row.bidQtty01),
    bidQtty02: shares(row.bidQtty02),
    bidQtty03: shares(row.bidQtty03),
    offerPrice01: n(row.offerPrice01),
    offerPrice02: n(row.offerPrice02),
    offerPrice03: n(row.offerPrice03),
    offerQtty01: shares(row.offerQtty01),
    offerQtty02: shares(row.offerQtty02),
    offerQtty03: shares(row.offerQtty03)
  };
}

function mergePartial(
  previous: VndRealtimeStock | undefined,
  current: VndRealtimeStock
): VndRealtimeStock {
  const merged: any = { ...(previous ?? { code: current.code }) };

  for (const [key, value] of Object.entries(current)) {
    if (value !== null && value !== undefined && value !== "") {
      merged[key] = value;
    }
  }

  return merged;
}

export async function getRealtimeSnapshots(
  symbols: string[]
): Promise<Map<string, VndRealtimeStock>> {
  const clean = [...new Set(
    symbols
      .map(x => x.trim().toUpperCase())
      .filter(x => /^[A-Z0-9]{2,12}$/.test(x))
  )];

  const out = new Map<string, VndRealtimeStock>();
  if (!clean.length) return out;

  const url = new URL(SNAPSHOT_URL);
  url.searchParams.set("codes", clean.join(","));

  const res = await fetch(url, {
    headers: {
      accept: "application/json,text/plain,*/*",
      "user-agent": "Mozilla/5.0 MarketTrackerPWA/8.4"
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`VNDIRECT realtime snapshot HTTP ${res.status}`);
  }

  const payload = await res.json<any>();
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  for (const raw of rows) {
    if (typeof raw !== "string") continue;

    const fields = decodeFields(raw);
    if (fields.length < 3) continue;

    const type = fields[0];
    const values = fields.slice(1);

    let parsed: VndRealtimeStock | null = null;
    if (type === "SFU") parsed = parseSFU(values);
    else if (type === "SBA") parsed = parseSBA(values);

    if (!parsed || !clean.includes(parsed.code)) continue;
    out.set(parsed.code, mergePartial(out.get(parsed.code), parsed));
  }

  return out;
}
