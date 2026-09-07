export type WorldGoldQuote = {
  symbol: "XAUUSD";
  price: number;
  currency: "USD";
  unit: "troy_ounce";
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

export type VietnamGoldQuote = {
  brand: string;
  product: "bar" | "ring";
  productName: string;
  buy: number;
  sell: number;
  currency: "VND";
  unit: "luong";
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
  floor: string;
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


export type PortSource = {
  id: string;
  label: string;
  organization: string;
  url: string;
  sourceKind: "official" | "company-official" | "public-reference";
  updateCadence: string;
  coverage: string;
  status: "tracked" | "manual" | "pending-api";
  note?: string;
};

export type PortMetric = {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  period: string;
  yoyPct?: number | null;
  sourceId: string;
  quality: "official" | "derived" | "proxy" | "pending";
  note?: string;
};

export type PortCompanyClass = "DIRECT_PORT" | "MULTI_PORT_LOGISTICS" | "HOLDING_PORT_NETWORK" | "RELATED_PORT_SHIPPING";

export type PortCompany = {
  symbol: string;
  name: string;
  exchange?: "HOSE" | "HNX" | "UPCOM";
  region: "Bắc" | "Trung" | "Nam";
  locality?: string;
  classification?: PortCompanyClass;
  classificationLabel?: string;
  focus: string;
  terminals: string[];
  officialUrl?: string | null;
  exchangeSourceUrl?: string | null;
  verifiedAsOf?: string;
};

export type PortEvent = {
  date: string;
  title: string;
  entity: string;
  kind: "capacity" | "route" | "financial" | "regulation" | "operations";
  sourceId: string;
  note?: string;
};

export type PortRegionCoverage = {
  id:string;
  label:string;
  macroRegion:"Bắc"|"Trung"|"Nam";
  status:"live"|"source-found"|"research";
  detail:string;
  officialUrl?:string|null;
};

export type PortOverviewResponse = {
  industry: "PORTS";
  scope: string;
  asOf: string;
  metrics: PortMetric[];
  companies: PortCompany[];
  events: PortEvent[];
  sources: PortSource[];
  regionCoverage?: PortRegionCoverage[];
  limitations: string[];
  serverTime: string;
};


export type PortShipCall = {
  planDate: string;
  eventTime: string | null;
  vesselName: string;
  draft: number | null;
  loa: number | null;
  dwt: number | null;
  gt: number | null;
  fromRaw: string;
  toRaw: string;
  terminal: string | null;
  agent: string | null;
  channel: string | null;
  sourceUrl: string;
  sourceType: "PORT_AUTHORITY_MOVEMENT_PLAN";
};

export type PortDailyStat = {
  date: string;
  dwt: number;
  shipCalls: number;
  avgDwt: number | null;
  maxDwt: number | null;
};

export type PortMonthlyStat = {
  month: string;
  dwt: number;
  shipCalls: number;
  avgDwt: number | null;
  maxDwt: number | null;
};

export type PortRouteStat = {
  route: string;
  dwt: number;
  shipCalls: number;
};

export type PortTerminalCapability = {
  terminal: string;
  label: string;
  maxDwt: number | null;
  note: string;
  sourceUrl: string;
  asOf: string;
};

export type PortTerminalAnalytics = {
  terminal: string;
  terminalLabel: string;
  days: number;
  summary: {
    dwt: number;
    shipCalls: number;
    avgDwt: number | null;
    maxDwt: number | null;
    lastPlanDate: string | null;
  };
  daily: PortDailyStat[];
  monthly: PortMonthlyStat[];
  routes: PortRouteStat[];
  recentCalls: PortShipCall[];
  capability: PortTerminalCapability | null;
  source: {
    label: string;
    url: string;
    sourceType: "PORT_AUTHORITY_MOVEMENT_PLAN";
    dataStatus: "planned-movement";
  };
  ingestion: {
    lastOkAt: string | null;
    lastError: string | null;
    storedRows: number;
  };
  serverTime: string;
};

export type PortHarborSummary = {
  scope: "HAIPHONG";
  days: number;
  summary: {
    dwt: number;
    shipCalls: number;
    avgDwt: number | null;
    maxDwt: number | null;
    lastPlanDate: string | null;
  };
  topTerminals: Array<{
    terminal: string;
    terminalLabel: string;
    dwt: number;
    shipCalls: number;
  }>;
  daily: PortDailyStat[];
  ingestion: {
    lastOkAt: string | null;
    lastError: string | null;
    storedRows: number;
  };
  source: {
    label: string;
    url: string;
    sourceType: "PORT_AUTHORITY_MOVEMENT_PLAN";
    dataStatus: "planned-movement";
  };
  serverTime: string;
};


export type PortCompanyIntelligence = {
  symbol: string;
  name: string;
  days: number;
  terminals: Array<{ code:string; label:string; ownershipPct:number|null; ownershipNote:string; capacityTeu:number|null; capacityTons:number|null; officialUrl:string; sourceLabel:string; sourceUrl:string; sourceAsOf:string; }>;
  summary: { dwt:number; shipCalls:number; avgDwt:number|null; maxDwt:number|null; terminalCount:number; capacityTeu:number|null; };
  terminalStats: Array<{ terminal:string; terminalLabel:string; dwt:number; shipCalls:number; shareDwtPct:number; capacityTeu:number|null; ownershipPct:number|null; }>;
  monthly: Array<{ month:string; dwt:number; shipCalls:number; previousYearDwt:number|null; yoyDwtPct:number|null; }>;
  routes: Array<{ route:string; dwt:number; shipCalls:number; shareDwtPct:number; }>;
  relationships?: PortRelationship[];
  caveats:string[];
  serverTime:string;
};


export type PortRelationship = {
  companySymbol: string;
  companyName: string;
  terminalCode: string | null;
  terminalLabel: string | null;
  relatedCompany?: string | null;
  relationshipType:
    | "DIRECT_BRANCH"
    | "DIRECT_OPERATOR"
    | "MEMBER_COMPANY"
    | "SUBSIDIARY"
    | "AFFILIATE"
    | "PORT_ECOSYSTEM";
  ownershipPct: number | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  asOf: string;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
};

export type PortHistoryStatus = {
  source: "HAIPHONG_SHIP_PLAN";
  earliestPlanDate: string | null;
  latestPlanDate: string | null;
  arrivalRows: number;
  allRows: number;
  calendarSpanDays: number;
  targetDays: number;
  targetStartDate: string;
  backfillCursor: number;
  targetReached: boolean;
  progressPct: number;
  serverTime: string;
};

export type PortCompanyComparisonRow = {
  symbol: string;
  name: string;
  terminals: string[];
  dwt: number;
  shipCalls: number;
  avgDwt: number | null;
  maxDwt: number | null;
  latestMonth: string | null;
  latestMonthDwt: number | null;
  latestMonthYoyPct: number | null;
  shareOfTrackedDwtPct: number;
  relationshipCoverage: "verified";
  caveat: string;
};

export type PortCompanyComparison = {
  days: number;
  universe: string[];
  totalTrackedDwt: number;
  rows: PortCompanyComparisonRow[];
  label: "SHARE_OF_TRACKED_COMPANY_DWT_PROXY";
  note: string;
  serverTime: string;
};


export type PortThroughputKind = "ACTUAL" | "ESTIMATE" | "TARGET" | "DISCLOSED_RUN_RATE";
export type PortThroughputCapacityRow = {
  id:string; companySymbol:string; assetCode:string; assetLabel:string; region:string; period:string;
  throughputTeu:number|null; throughputKind:PortThroughputKind; throughputLabel:string;
  capacityTeu:number|null; capacityAsOf:string|null; utilizationPct:number|null;
  utilizationKind:"ACTUAL"|"ESTIMATE"|"TARGET"|"UNAVAILABLE"; status:"Latest"|"Unavailable";
  sourceLabel:string; sourceUrl:string; sourceDate:string|null; note:string;
};
export type PortThroughputCapacityResponse = {
  data:PortThroughputCapacityRow[]; methodology:string[]; serverTime:string;
};


export type PortMetricUnit = "TEU" | "TONS";
export type PortHistoryKind = "ACTUAL" | "ESTIMATE" | "TARGET";
export type PortScopeKind = "COMPANY_SYSTEM" | "PORT_OPERATIONS" | "TERMINAL" | "PORT_CLUSTER";

export type PortThroughputHistoryPoint = {
  id:string;
  companySymbol:string;
  assetCode:string;
  assetLabel:string;
  scope:PortScopeKind;
  period:string;
  periodOrder:string;
  unit:PortMetricUnit;
  value:number;
  kind:PortHistoryKind;
  yoyPct:number|null;
  yoyKind:"REPORTED"|"DERIVED"|"UNAVAILABLE";
  sourceLabel:string;
  sourceUrl:string;
  sourceDate:string|null;
  note:string;
};

export type PortCapacityTimelinePoint = {
  id:string;
  companySymbol:string;
  assetCode:string;
  assetLabel:string;
  effectiveFrom:string|null;
  effectiveTo:string|null;
  capacityTeu:number;
  comparator:"EQ"|"GT"|"GTE";
  capacityKind:"DESIGN"|"DISCLOSED_OPERATING_CAPACITY";
  sourceLabel:string;
  sourceUrl:string;
  sourceDate:string|null;
  note:string;
};

export type PortThroughputHistoryResponse = {
  throughput:PortThroughputHistoryPoint[];
  capacityTimeline:PortCapacityTimelinePoint[];
  coverage:{
    companies:string[];
    actualPointCount:number;
    estimatePointCount:number;
    targetPointCount:number;
    capacityPointCount:number;
  };
  methodology:string[];
  limitations:string[];
  serverTime:string;
};

export type PortAssetType = "DEEP_SEA_PORT" | "SEAPORT" | "RIVER_PORT" | "ICD" | "FLOATING_PORT" | "AIR_CARGO";
export type PortAssetStatus = "OPERATING" | "EXPANDING" | "UNDER_CONSTRUCTION";
export type PortAsset = {
  id:string; name:string; region:"Bắc"|"Trung"|"Nam"; locality:string; type:PortAssetType; typeLabel:string; status:PortAssetStatus;
  role:string; operator:string; ownershipPct?:number|null; partner?:string|null; partnerOwnershipPct?:number|null;
  capacityTeu?:number|null; capacityTons?:number|null; capacityComparator?:"="|">"|"~"; capacityNote?:string|null;
  berthLengthM?:number|null; areaHa?:number|null; maxDwt?:number|null; startYear?:number|null; officialUrl:string; sourceLabel:string; sourceUrl:string; sourceAsOf:string; note?:string;
};
export type PortCapacityEvent = { id:string; assetId:string; date:string; label:string; status:"ACTUAL"|"UNDER_CONSTRUCTION"|"PLANNED"; capacityTeu?:number|null; comparator?:"="|">"|"~"; note:string; sourceUrl:string; };
export type PortCompanyPortfolio = {
  symbol:string; name:string; exchange:string; classification:string; footprint:string[]; summary:{assetCount:number; currentSystemCapacityTeu:number|null; berthLengthKm:number|null; note:string};
  assets:PortAsset[]; capacityEvents:PortCapacityEvent[]; relatedAssets:Array<{name:string;type:PortAssetType;note:string;officialUrl:string}>; methodology:string[]; sources:Array<{label:string;url:string;asOf:string}>; serverTime:string;
};
