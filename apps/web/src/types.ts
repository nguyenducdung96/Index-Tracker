export type WorldGoldQuote = {
  symbol: string;
  price: number;
  source: "tradingeconomics" | "gold-api";
  sourceUrl: string;
  sourceKind?: "official" | "fallback";
  verificationState?: "official" | "cross-verified" | "single-source";
  verificationSources?: string[];
  observedAt: string;
  receivedAt: string;
  previousClose?: number | null;
  previousCloseSource?: "tradingeconomics" | "gold-api-ohlc" | "stooq" | "yahoo" | "local-db" | null;
  changeAbs?: number | null;
  changePct?: number | null;
};

export type VNQuote = {
  brand: string;
  product: "bar" | "ring";
  productName: string;
  buy: number;
  sell: number;
  sourceUrl: string;
  sourceKind?: "official" | "fallback";
  verificationState?: "official" | "cross-verified" | "single-source";
  verificationSources?: string[];
  observedAt: string;
  region?: string;
  qualityState?: "ok" | "suspect";
  qualityReasons?: string[];
  qualityCheckedAt?: string;
  peerMedianBuy?: number | null;
  peerMedianSell?: number | null;
  peerDeviationPct?: number | null;
};

export type ProviderStatus = {
  brand: string;
  url: string;
  homeUrl: string;
  available: boolean;
  state: "live" | "fallback" | "error";
  stale?: boolean;
  sourceKind: "official" | "fallback" | null;
  sourceLabel: string | null;
  lastAttemptAt: string;
  lastSuccessAt: string | null;
  error: string | null;
  diagnostics?: string[];
  qualityState?: "ok" | "suspect" | null;
  suspectProducts?: ("bar" | "ring")[];
};

export type Dashboard = {
  world: WorldGoldQuote | null;
  vietnam: VNQuote[];
  providers: ProviderStatus[];
  usdVnd: number | null;
  worldVndPerLuong: number | null;
  pollIntervals?: {
    worldMs: number;
    vietnamMs: number;
    fxMs: number;
  };
  dataQuality?: {
    config: { consensusBandPct: number; outlierThresholdPct: number; maxSpreadPct: number; minConsensusSize: number };
    summaries: { product: "bar" | "ring"; peerMedianBuy: number | null; peerMedianSell: number | null; consensusSize: number; totalSize: number }[];
    suspectCount: number;
  };
  serverTime: string;
};

export type WorldRange = "1D" | "1W" | "1M" | "6M" | "1Y" | "5Y" | "10Y" | "25Y" | "50Y" | "ALL";
export type WorldHistoryPoint = { ts: number; price: number; open?: number; high?: number; low?: number; source?: string };
export type WorldHistoryResponse = { range: WorldRange; source: string; points: WorldHistoryPoint[] };


export type StockIndexQuote = {
  code: "VNINDEX" | "HNXINDEX" | "UPCOMINDEX" | "VN30";
  name: string;
  indexValue: number | null;
  change: number | null;
  changePercent: number | null;
  accumulatedVal: number | null;
  accumulatedVol?: number | null;
  advances: number | null;
  declines: number | null;
  noChanges: number | null;
  ceilings?: number | null;
  floors?: number | null;
  updatedAt: string;
};

export type StockQuote = {
  code: string;
  floor: "HOSE" | "HNX" | "UPCOM" | string;
  companyName?: string;
  companyWebsite?: string | null;
  companyWebsiteSource?: string | null;
  matchPrice: number | null;
  matchVol?: number | null;
  change: number | null;
  changePercent: number | null;
  accumulatedVol: number | null;
  accumulatedVal: number | null;
  refPrice?: number | null;
  ceilingPrice?: number | null;
  floorPrice?: number | null;
  openPrice?: number | null;
  highestPrice?: number | null;
  lowestPrice?: number | null;
  avgPrice?: number | null;
  avg20DVol?: number | null;
  volumeVsAvg20?: number | null;
  foreignBuyVol?: number | null;
  foreignSellVol?: number | null;
  foreignBuyVal?: number | null;
  foreignSellVal?: number | null;
  foreignValueEstimated?: boolean;
  currentRoom?: number | null;
  totalRoom?: number | null;
  realtimeSnapshotAvailable?: boolean;
  updatedAt: string;
};

export type StockDepthLevel = { price: number | null; volume: number | null };

export type StockDetail = StockQuote & {
  avg20DVol?: number | null;
  volumeVsAvg20?: number | null;
  bid: StockDepthLevel[];
  ask: StockDepthLevel[];
  bidRatio?: number | null;
  askRatio?: number | null;
  foreignBuyVol?: number | null;
  foreignSellVol?: number | null;
  foreignBuyVal?: number | null;
  foreignSellVal?: number | null;
  foreignNetVal?: number | null;
  foreignParticipationPct?: number | null;
  currentRoom?: number | null;
  realtimeDepthAvailable?: boolean;
};

export type StockChartPoint = {
  time: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma20?: number | null;
  ma50?: number | null;
  ma200?: number | null;
};

export type Watchlist = {
  id: number;
  name: string;
  symbols: string[];
  createdAt?: number;
  updatedAt?: number;
};
