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
      "totalBidQtty","totalOfferQtty","highestPrice","lowestPrice",
      "accumulatedVal","accumulatedVol","matchPrice","matchQtty","currentPrice",
      "currentQtty","totalRoom","currentRoom","iNav","underlyingAsset","issuer",
      "exercisePrice","exerciseRatio","expiryDate","time","bv4","sv4"
    ], values);
  }

  return mapFields([
    "code","stockType","floorCode","basicPrice","floorPrice","ceilingPrice",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03",
    "totalBidQtty","totalOfferQtty","tradingSessionId",
    "buyForeignQtty","sellForeignQtty","highestPrice","lowestPrice",
    "accumulatedVal","accumulatedVol","matchPrice","matchQtty","currentPrice",
    "currentQtty","projectOpen","totalRoom","currentRoom","iNav"
  ], values);
}

function parseSMA(values: string[]): RawRecord {
  return mapFields([
    "code","stockType","floorCode","buyForeignQtty","sellForeignQtty",
    "highestPrice","lowestPrice","accumulatedVal","accumulatedVol",
    "matchPrice","matchQtty","currentPrice","currentQtty","totalRoom","currentRoom"
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
      "code","stockType","floorCode",
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
    "code","stockType","floorCode",
    "bidPrice01","bidPrice02","bidPrice03",
    "bidQtty01","bidQtty02","bidQtty03",
    "offerPrice01","offerPrice02","offerPrice03",
    "offerQtty01","offerQtty02","offerQtty03",
    "totalBidQtty","totalOfferQtty","bv4","sv4"
  ], values);
}

function parseMessage(type: string, values: string[]): RawRecord | null {
  if (type === "SFU") return parseSFU(values);
  if (type === "SMA") return parseSMA(values);
  if (type === "SBS") return parseSBS(values);
  if (type === "SBA") return parseSBA(values);
  return null;
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
    currentQtty: num(row.currentQtty),
    matchPrice: num(row.matchPrice),
    matchQtty: num(row.matchQtty),
    highestPrice: num(row.highestPrice),
    lowestPrice: num(row.lowestPrice),
    averagePrice: num(row.averagePrice),
    accumulatedVal: num(row.accumulatedVal),
    accumulatedVol: num(row.accumulatedVol),
    buyForeignQtty: num(row.buyForeignQtty),
    sellForeignQtty: num(row.sellForeignQtty),
    totalRoom: num(row.totalRoom),
    currentRoom: num(row.currentRoom),
    bidPrice01: num(row.bidPrice01),
    bidPrice02: num(row.bidPrice02),
    bidPrice03: num(row.bidPrice03),
    bidQtty01: num(row.bidQtty01),
    bidQtty02: num(row.bidQtty02),
    bidQtty03: num(row.bidQtty03),
    offerPrice01: num(row.offerPrice01),
    offerPrice02: num(row.offerPrice02),
    offerPrice03: num(row.offerPrice03),
    offerQtty01: num(row.offerQtty01),
    offerQtty02: num(row.offerQtty02),
    offerQtty03: num(row.offerQtty03),
    totalBidQtty: num(row.totalBidQtty),
    totalOfferQtty: num(row.totalOfferQtty),
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
