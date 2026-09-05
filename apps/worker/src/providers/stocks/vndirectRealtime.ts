type RawRecord = Record<string, string | number | null>;

export type VndRealtimeStock = {
  code: string;
  floorCode?: string | null;
  companyName?: string | null;
  basicPrice?: number | null;
  floorPrice?: number | null;
  ceilingPrice?: number | null;
  currentPrice?: number | null;
  currentQtty?: number | null;
  matchPrice?: number | null;
  matchQtty?: number | null;
  highestPrice?: number | null;
  lowestPrice?: number | null;
  averagePrice?: number | null;
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
  totalBidQtty?: number | null;
  totalOfferQtty?: number | null;
  time?: string | null;
};

const SNAPSHOT_URL =
  "https://price-streaming-api-free.vndirect.com.vn/v2/stocks/snapshot";

function num(value: unknown): number | null {
  const x = Number(value);
  return Number.isFinite(x) ? x : null;
}

/**
 * VNDIRECT free snapshot encodes every message by subtracting (index % 5)
 * from each character. Public VNDIRECT/community decoder restores it by adding
 * (index % 5), then splitting by "|".
 */
export function decodeFields(encoded: string): string[] {
  let decoded = "";
  for (let i = 0; i < encoded.length; i++) {
    decoded += String.fromCharCode(encoded.charCodeAt(i) + (i % 5));
  }
  return decoded.split("|");
}

function mapFields(names: string[], values: string[]): RawRecord {
  const out: RawRecord = {};
  for (let i = 0; i < names.length; i++) {
    out[names[i]] = values[i] ?? null;
  }
  return out;
}

function parseSFU(values: string[]): RawRecord {
  const stockType = values[1] ?? "";

  if (stockType === "ST") {
    return mapFields([
      "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",
      "bidPrice01","bidPrice02","bidPrice03","bidPrice04","bidPrice05",
      "bidPrice06","bidPrice07","bidPrice08","bidPrice09","bidPrice10",
      "bidQtty01","bidQtty02","bidQtty03","bidQtty04","bidQtty05","bidQtty06",
      "bidQtty07","bidQtty08","bidQtty09","bidQtty10",
      "offerPrice01","offerPrice02","offerPrice03","offerPrice04","offerPrice05",
      "offerPrice06","offerPrice07","offerPrice08","offerPrice09","offerPrice10",
      "offerQtty01","offerQtty02","offerQtty03","offerQtty04","offerQtty05",
      "offerQtty06","offerQtty07","offerQtty08","offerQtty09","offerQtty10",
      "totalBidQtty","totalOfferQtty","tradingSessionId",
      "buyForeignQtty","sellForeignQtty",
      "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
      "matchPrice","matchQtty","currentPrice","currentQtty","projectOpen",
      "totalRoom","currentRoom"
    ], values);
  }

  if (stockType === "W") {
    return mapFields([
      "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",
      "underlyingSymbol","issuerName","exercisePrice","exerciseRatio",
      "bidPrice01","bidPrice02","bidPrice03",
      "bidQtty01","bidQtty02","bidQtty03",
      "offerPrice01","offerPrice02","offerPrice03",
      "offerQtty01","offerQtty02","offerQtty03",
      "totalBidQtty","totalOfferQtty","tradingSessionId",
      "buyForeignQtty","sellForeignQtty",
      "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
      "matchPrice","matchQtty","currentPrice","currentQtty","projectOpen",
      "totalRoom","currentRoom"
    ], values);
  }

  return mapFields([
    "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03",
    "totalBidQtty","totalOfferQtty","tradingSessionId",
    "buyForeignQtty","sellForeignQtty",
    "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
    "matchPrice","matchQtty","currentPrice","currentQtty","projectOpen",
    "totalRoom","currentRoom"
  ], values);
}

function parseSMA(values: string[]): RawRecord {
  return mapFields([
    "code","stockType","tradingSessionId",
    "buyForeignQtty","sellForeignQtty",
    "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
    "matchPrice","matchQtty","currentPrice","currentQtty","projectOpen",
    "totalRoom","currentRoom"
  ], values);
}

function parseSBS(values: string[]): RawRecord {
  return mapFields([
    "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice"
  ], values);
}

function parseSBA(values: string[]): RawRecord {
  const stockType = values[1] ?? "";

  if (stockType === "ST") {
    return mapFields([
      "code","stockType",
      "bidPrice01","bidPrice02","bidPrice03","bidPrice04","bidPrice05",
      "bidPrice06","bidPrice07","bidPrice08","bidPrice09","bidPrice10",
      "bidQtty01","bidQtty02","bidQtty03","bidQtty04","bidQtty05","bidQtty06",
      "bidQtty07","bidQtty08","bidQtty09","bidQtty10",
      "offerPrice01","offerPrice02","offerPrice03","offerPrice04","offerPrice05",
      "offerPrice06","offerPrice07","offerPrice08","offerPrice09","offerPrice10",
      "offerQtty01","offerQtty02","offerQtty03","offerQtty04","offerQtty05",
      "offerQtty06","offerQtty07","offerQtty08","offerQtty09","offerQtty10",
      "totalBidQtty","totalOfferQtty"
    ], values);
  }

  return mapFields([
    "code","stockType",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03",
    "totalBidQtty","totalOfferQtty"
  ], values);
}

function parseMessage(type: string, values: string[]): RawRecord | null {
  if (type === "SFU") return parseSFU(values);
  if (type === "SMA") return parseSMA(values);
  if (type === "SBS") return parseSBS(values);
  if (type === "SBA") return parseSBA(values);
  return null;
}


function shares(value: unknown): number | null {
  const x = num(value);
  // Snapshot quantity fields are in board lots of 10 shares.
  return x == null ? null : x * 10;
}

function roomShares(value: unknown): number | null {
  const x = num(value);
  return x == null ? null : x * 10;
}

function tradedValueVnd(value: unknown): number | null {
  const x = num(value);
  // Snapshot accumulatedVal is in million VND.
  return x == null ? null : x * 1_000_000;
}

function toRealtime(row: RawRecord): VndRealtimeStock | null {
  const code = String(row.code ?? "").toUpperCase().trim();
  if (!code) return null;

  return {
    code,
    floorCode: row.floorCode == null ? null : String(row.floorCode),
    companyName: row.companyName == null ? null : String(row.companyName),
    basicPrice: num(row.basicPrice),
    floorPrice: num(row.floorPrice),
    ceilingPrice: num(row.ceilingPrice),
    currentPrice: num(row.currentPrice),
    currentQtty: shares(row.currentQtty),
    matchPrice: num(row.matchPrice),
    matchQtty: shares(row.matchQtty),
    highestPrice: num(row.highestPrice),
    lowestPrice: num(row.lowestPrice),
    averagePrice: num(row.averagePrice),
    accumulatedVal: tradedValueVnd(row.accumulatedVal),
    accumulatedVol: shares(row.accumulatedVol),
    buyForeignQtty: shares(row.buyForeignQtty),
    sellForeignQtty: shares(row.sellForeignQtty),
    totalRoom: roomShares(row.totalRoom),
    currentRoom: roomShares(row.currentRoom),
    bidPrice01: num(row.bidPrice01),
    bidPrice02: num(row.bidPrice02),
    bidPrice03: num(row.bidPrice03),
    bidQtty01: shares(row.bidQtty01),
    bidQtty02: shares(row.bidQtty02),
    bidQtty03: shares(row.bidQtty03),
    offerPrice01: num(row.offerPrice01),
    offerPrice02: num(row.offerPrice02),
    offerPrice03: num(row.offerPrice03),
    offerQtty01: shares(row.offerQtty01),
    offerQtty02: shares(row.offerQtty02),
    offerQtty03: shares(row.offerQtty03),
    totalBidQtty: shares(row.totalBidQtty),
    totalOfferQtty: shares(row.totalOfferQtty),
    time: row.time == null ? null : String(row.time)
  };
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
      "user-agent": "Mozilla/5.0 MarketTrackerPWA/8.3"
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
    if (!fields.length) continue;

    const type = fields[0];
    const parsed = parseMessage(type, fields.slice(1));
    if (!parsed) continue;

    const rt = toRealtime(parsed);
    if (!rt || !clean.includes(rt.code)) continue;

    const prev = out.get(rt.code) ?? { code: rt.code };
    out.set(rt.code, {
      ...prev,
      ...Object.fromEntries(
        Object.entries(rt).filter(([, value]) => value != null && value !== "")
      )
    } as VndRealtimeStock);
  }

  return out;
}
