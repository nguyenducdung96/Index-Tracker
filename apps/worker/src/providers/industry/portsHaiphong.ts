import * as cheerio from "cheerio";
import type {
  PortDailyStat,
  PortHarborSummary,
  PortMonthlyStat,
  PortRouteStat,
  PortShipCall,
  PortTerminalAnalytics,
  PortTerminalCapability,
  PortCompanyIntelligence,
  PortRelationship,
  PortHistoryStatus,
  PortCompanyComparison,
  PortThroughputCapacityResponse,
  PortThroughputHistoryResponse
} from "../../types.js";

const SOURCE_BASE = "https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx";
const SOURCE_HOME = "https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx?d=0";
const CAPABILITY_SOURCE = "https://cangvuhaiphong.gov.vn/thong-tin-cau-cang/";
const SOURCE_TYPE = "PORT_AUTHORITY_MOVEMENT_PLAN" as const;
const HISTORY_TARGET_DAYS = 550; // ~18 months: enough for YoY while limiting load on the official source.


type MovementType = "DEPARTURE" | "MOVE" | "ARRIVAL" | "CHANNEL";

type ParsedMovement = {
  planDate: string;
  movementType: MovementType;
  eventTime: string | null;
  vesselName: string;
  draft: number | null;
  loa: number | null;
  dwt: number | null;
  gt: number | null;
  channel: string | null;
  fromRaw: string;
  toRaw: string;
  fromTerminal: string | null;
  toTerminal: string | null;
  agent: string | null;
  pilot: string | null;
  sourceUrl: string;
  rowKey: string;
};

const TERMINALS: Record<string, string[]> = {
  HTIT: ["HTIT"],
  HICT: ["HICT"],
  HHIT: ["HHIT"],
  TAN_VU: ["TAN VU"],
  CHUA_VE: ["CHUA VE"],
  HOANG_DIEU: ["HOANG DIEU"],
  DINH_VU: ["DINH VU"],
  NAM_DINH_VU: ["NAM DINH VU"],
  NAM_HAI_DINH_VU: ["NAM HAI DINH VU"],
  VIP_GREEN: ["VIP GREEN PORT", "VIP GREENPORT"],
  GREEN_PORT: ["GREEN PORT", "GREENPORT"],
  HAI_AN: ["HAI AN"],
  DOAN_XA: ["DOAN XA"],
  PTSC_DINH_VU: ["PTSC DINH VU"],
  VIMC_DINH_VU: ["VIMC DINH VU"],
  NAM_HAI: ["NAM HAI"],
  EURO_DINH_VU: ["EURO DINH VU"],
  TAN_CANG_189: ["TAN CANG 189"],
  LACH_HUYEN_2: ["LACH HUYEN 2"],
  MPC_PORT: ["MPC PORT"],
  TRANSVINA: ["TRANSVINA"],
  CANG_128: ["CANG 128"],
  VIMC: ["VIMC"]
};

export const TERMINAL_LABELS: Record<string, string> = {
  HTIT: "HTIT · Lạch Huyện 3–4",
  HICT: "HICT · Lạch Huyện",
  HHIT: "HHIT",
  TAN_VU: "Tân Vũ",
  CHUA_VE: "Chùa Vẽ",
  HOANG_DIEU: "Hoàng Diệu",
  DINH_VU: "Đình Vũ",
  NAM_DINH_VU: "Nam Đình Vũ",
  NAM_HAI_DINH_VU: "Nam Hải Đình Vũ",
  VIP_GREEN: "VIP Green Port",
  GREEN_PORT: "Green Port",
  HAI_AN: "Hải An",
  DOAN_XA: "Đoạn Xá",
  PTSC_DINH_VU: "PTSC Đình Vũ",
  VIMC_DINH_VU: "VIMC Đình Vũ",
  NAM_HAI: "Nam Hải",
  EURO_DINH_VU: "EURO Đình Vũ",
  TAN_CANG_189: "Tân Cảng 189",
  LACH_HUYEN_2: "Lạch Huyện 2",
  MPC_PORT: "MPC Port",
  TRANSVINA: "Transvina",
  CANG_128: "Cảng 128",
  VIMC: "VIMC"
};

const CAPABILITIES: Record<string, PortTerminalCapability> = {
  HTIT: { terminal:"HTIT", label:"HTIT · Lạch Huyện 3–4", maxDwt:165000, note:"100.000 DWT đầy tải; đến 165.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  HICT: { terminal:"HICT", label:"HICT · Lạch Huyện", maxDwt:165000, note:">160.000 đến 165.000 DWT theo phương án khai thác được công bố.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  TAN_VU: { terminal:"TAN_VU", label:"Tân Vũ", maxDwt:55000, note:"20.000 DWT đầy tải; >20.000–55.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  CHUA_VE: { terminal:"CHUA_VE", label:"Chùa Vẽ", maxDwt:10000, note:"Công bố tiếp nhận 10.000 DWT.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  DINH_VU: { terminal:"DINH_VU", label:"Đình Vũ", maxDwt:48000, note:"Cầu 1 & 2 đến 48.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  NAM_DINH_VU: { terminal:"NAM_DINH_VU", label:"Nam Đình Vũ", maxDwt:55000, note:"20.000 DWT đầy tải; >20.000–55.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  VIP_GREEN: { terminal:"VIP_GREEN", label:"VIP Green Port", maxDwt:55000, note:"20.000 DWT đầy tải; >20.000–55.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  GREEN_PORT: { terminal:"GREEN_PORT", label:"Green Port", maxDwt:25000, note:"25.000 DWT giảm tải.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  HAI_AN: { terminal:"HAI_AN", label:"Hải An", maxDwt:25800, note:"25.800 DWT / khoảng 1.800 TEU theo công bố cầu cảng.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" },
  DOAN_XA: { terminal:"DOAN_XA", label:"Đoạn Xá", maxDwt:40000, note:"40.000 DWT giảm tải, LOA<188m.", sourceUrl:CAPABILITY_SOURCE, asOf:"2026-09-04" }
};

function ascii(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
}

export function normalizeTerminal(raw: string | null | undefined): string | null {
  const n = ascii(String(raw ?? ""));
  if (!n) return null;
  for (const [canonical, aliases] of Object.entries(TERMINALS)) {
    if (aliases.some(a => n === ascii(a))) return canonical;
  }
  return null;
}

function parseDecimal(v: string): number | null {
  const x = v.trim();
  if (!x || x === "N/A" || x === "-") return null;
  const normalized = x.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseMeasure(v: string): number | null {
  const x = v.trim().replace(/\s/g, "");
  if (!x || x === "N/A" || x === "-") return null;
  const normalized = x.replace(/,/g, ".").replace(/[^0-9.\-]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function yyyyMmDd(ddmmyyyy: string) {
  const [d,m,y] = ddmmyyyy.split("/");
  return `${y}-${m}-${d}`;
}

export function parseHaiphongPlanHtml(html: string, sourceUrl: string): ParsedMovement[] {
  const $ = cheerio.load(html);
  const pageText = $.root().text().replace(/\s+/g," ");
  const dateMatch = pageText.match(/KẾ HOẠCH ĐIỀU ĐỘNG TÀU NGÀY\s+(\d{2}\/\d{2}\/\d{4})/i);
  if (!dateMatch) throw new Error("Cannot find plan date in Hai Phong ship plan");
  const planDate = yyyyMmDd(dateMatch[1]);
  const candidateTables = $("table").toArray().filter(el => {
    const t = ascii($(el).text());
    return t.includes("TEN TAU") && t.includes("DWT");
  });
  const fallbackTypes: MovementType[] = ["DEPARTURE","MOVE","ARRIVAL","CHANNEL"];
  const out: ParsedMovement[] = [];

  candidateTables.forEach((tableEl, tableIndex) => {
    const $table = $(tableEl);
    let context = "";
    let node = $table.prev();
    for (let i=0;i<8 && node.length;i++) {
      context = `${node.text()} ${context}`;
      node = node.prev();
    }
    const c = ascii(context);
    let movementType: MovementType | null = null;
    if (c.includes("TAU ROI CANG")) movementType = "DEPARTURE";
    else if (c.includes("TAU DI CHUYEN")) movementType = "MOVE";
    else if (c.includes("TAU VAO CANG")) movementType = "ARRIVAL";
    else if (c.includes("TAU QUA LUONG")) movementType = "CHANNEL";
    movementType = movementType ?? fallbackTypes[tableIndex] ?? null;
    if (!movementType || movementType === "CHANNEL") return;

    $table.find("tr").each((_, tr) => {
      const cells = $(tr).find("th,td").toArray().map(td => $(td).text().replace(/\s+/g," ").trim());
      if (cells.length < 11 || !/^\d+$/.test(cells[0] ?? "")) return;
      const eventTime = cells[1] || null;
      const vesselName = cells[2] || "";
      if (!vesselName) return;
      const draft = parseMeasure(cells[3] ?? "");
      const loa = parseMeasure(cells[4] ?? "");
      const dwt = parseDecimal(cells[5] ?? "");
      const gt = parseDecimal(cells[6] ?? "");
      const channel = cells[8] || null;
      const fromRaw = cells[9] || "";
      const toRaw = cells[10] || "";
      const agent = cells[11] || null;
      const pilot = cells[12] || null;
      const fromTerminal = normalizeTerminal(fromRaw);
      const toTerminal = normalizeTerminal(toRaw);
      const rowKey = [planDate,movementType,eventTime,vesselName,dwt ?? "",fromRaw,toRaw].join("|").toUpperCase();
      out.push({ planDate,movementType,eventTime,vesselName,draft,loa,dwt,gt,channel,fromRaw,toRaw,fromTerminal,toTerminal,agent,pilot,sourceUrl,rowKey });
    });
  });

  if (!out.length) throw new Error("No movement rows parsed from Hai Phong ship plan");
  return out;
}

export async function fetchHaiphongPlan(offset: number): Promise<ParsedMovement[]> {
  const url = `${SOURCE_BASE}?d=${Math.trunc(offset)}`;
  const res = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml",
      "user-agent": "MarketTracker/8.9 (+official-public-data-collector)"
    },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`Hai Phong ship-plan HTTP ${res.status}`);
  return parseHaiphongPlanHtml(await res.text(), url);
}

export async function ensurePortSchema(db: D1Database) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS port_ship_movements (
      row_key TEXT PRIMARY KEY,
      plan_date TEXT NOT NULL,
      movement_type TEXT NOT NULL,
      event_time TEXT,
      vessel_name TEXT NOT NULL,
      draft REAL,
      loa REAL,
      dwt REAL,
      gt REAL,
      channel TEXT,
      from_raw TEXT NOT NULL,
      to_raw TEXT NOT NULL,
      from_terminal TEXT,
      to_terminal TEXT,
      agent TEXT,
      pilot TEXT,
      source_url TEXT NOT NULL,
      source_type TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_port_move_date_type ON port_ship_movements(plan_date,movement_type)"),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_port_move_to_terminal ON port_ship_movements(to_terminal,plan_date,movement_type)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS port_ingest_log (
      source_key TEXT PRIMARY KEY,
      last_run_at INTEGER NOT NULL,
      last_ok_at INTEGER,
      last_error TEXT,
      rows_seen INTEGER NOT NULL DEFAULT 0,
      rows_written INTEGER NOT NULL DEFAULT 0
    )`)
  ]);
}

async function logIngest(db: D1Database, ok: boolean, rowsSeen: number, rowsWritten: number, error?: string) {
  const now = Date.now();
  await db.prepare(`INSERT INTO port_ingest_log(source_key,last_run_at,last_ok_at,last_error,rows_seen,rows_written)
    VALUES('haiphong-ship-plan',?,?,?,?,?)
    ON CONFLICT(source_key) DO UPDATE SET
      last_run_at=excluded.last_run_at,
      last_ok_at=CASE WHEN ? THEN excluded.last_run_at ELSE port_ingest_log.last_ok_at END,
      last_error=excluded.last_error,
      rows_seen=excluded.rows_seen,
      rows_written=excluded.rows_written`)
    .bind(now, ok ? now : null, error ?? null, rowsSeen, rowsWritten, ok ? 1 : 0).run();
}

async function saveMovements(db: D1Database, rows: ParsedMovement[]) {
  let written = 0;
  const now = Date.now();
  for (let i=0;i<rows.length;i+=40) {
    const chunk = rows.slice(i,i+40);
    const statements = chunk.map(r => db.prepare(`INSERT INTO port_ship_movements(
      row_key,plan_date,movement_type,event_time,vessel_name,draft,loa,dwt,gt,channel,
      from_raw,to_raw,from_terminal,to_terminal,agent,pilot,source_url,source_type,fetched_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(row_key) DO UPDATE SET
      draft=excluded.draft,loa=excluded.loa,dwt=excluded.dwt,gt=excluded.gt,channel=excluded.channel,
      from_terminal=excluded.from_terminal,to_terminal=excluded.to_terminal,agent=excluded.agent,pilot=excluded.pilot,
      source_url=excluded.source_url,fetched_at=excluded.fetched_at`)
      .bind(r.rowKey,r.planDate,r.movementType,r.eventTime,r.vesselName,r.draft,r.loa,r.dwt,r.gt,r.channel,
        r.fromRaw,r.toRaw,r.fromTerminal,r.toTerminal,r.agent,r.pilot,r.sourceUrl,SOURCE_TYPE,now));
    const results = await db.batch(statements);
    written += results.length;
  }
  return written;
}

export async function ingestHaiphongOffsets(db: D1Database, offsets: number[]) {
  await ensurePortSchema(db);
  let seen=0,written=0;
  try {
    for (const offset of [...new Set(offsets.map(x=>Math.trunc(x)))]) {
      const rows = await fetchHaiphongPlan(offset);
      seen += rows.length;
      written += await saveMovements(db, rows);
    }
    await logIngest(db,true,seen,written);
    return { ok:true, rowsSeen:seen, rowsWritten:written };
  } catch (e) {
    await logIngest(db,false,seen,written,e instanceof Error ? e.message : String(e));
    throw e;
  }
}

export async function bootstrapHaiphongIfNeeded(db: D1Database) {
  await ensurePortSchema(db);
  const count = await db.prepare("SELECT COUNT(*) AS c FROM port_ship_movements").first<{c:number}>();
  if (Number(count?.c ?? 0) > 0) return { bootstrapped:false };
  await ingestHaiphongOffsets(db, Array.from({length:14},(_,i)=>-i));
  return { bootstrapped:true };
}

export async function backfillHaiphongChunk(db: D1Database, days = 21) {
  await ensurePortSchema(db);
  const state = await db.prepare("SELECT value FROM app_state WHERE key='ports_backfill_cursor'").first<{value:string}>();
  const cursor = Number(state?.value ?? -14);

  if (Math.abs(cursor) >= HISTORY_TARGET_DAYS) {
    return {
      ok: true,
      rowsSeen: 0,
      rowsWritten: 0,
      fromOffset: cursor,
      toOffset: cursor,
      nextOffset: cursor,
      targetReached: true,
      targetDays: HISTORY_TARGET_DAYS
    };
  }

  const remaining = Math.max(0, HISTORY_TARGET_DAYS - Math.abs(cursor));
  const chunk = Math.max(1, Math.min(Math.trunc(days), remaining));
  const offsets = Array.from({length:chunk},(_,i)=>cursor-i);
  const result = await ingestHaiphongOffsets(db, offsets);
  const next = cursor - chunk;

  await db.prepare(`INSERT INTO app_state(key,value,updated_at) VALUES('ports_backfill_cursor',?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`)
    .bind(String(next),Date.now()).run();

  return {
    ...result,
    fromOffset:cursor,
    toOffset:next+1,
    nextOffset:next,
    targetReached: Math.abs(next) >= HISTORY_TARGET_DAYS,
    targetDays: HISTORY_TARGET_DAYS
  };
}

export async function getPortHistoryStatus(db:D1Database): Promise<PortHistoryStatus> {
  await ensurePortSchema(db);
  const dates = await db.prepare(`SELECT
      MIN(CASE WHEN movement_type='ARRIVAL' THEN plan_date END) earliest_arrival,
      MAX(CASE WHEN movement_type='ARRIVAL' THEN plan_date END) latest_arrival,
      SUM(CASE WHEN movement_type='ARRIVAL' THEN 1 ELSE 0 END) arrival_rows,
      COUNT(*) all_rows
    FROM port_ship_movements`).first<any>();
  const state = await db.prepare("SELECT value FROM app_state WHERE key='ports_backfill_cursor'").first<{value:string}>();
  const cursor = Number(state?.value ?? -14);

  const earliest = dates?.earliest_arrival ?? null;
  const latest = dates?.latest_arrival ?? null;
  let calendarSpanDays = 0;
  if (earliest && latest) {
    calendarSpanDays = Math.max(
      1,
      Math.floor((Date.parse(`${latest}T00:00:00Z`) - Date.parse(`${earliest}T00:00:00Z`))/86400000) + 1
    );
  }

  const targetStartDate = new Date(Date.now() - (HISTORY_TARGET_DAYS - 1)*86400000).toISOString().slice(0,10);
  const progressPct = Math.min(100, Math.max(0, calendarSpanDays / HISTORY_TARGET_DAYS * 100));

  return {
    source:"HAIPHONG_SHIP_PLAN",
    earliestPlanDate:earliest,
    latestPlanDate:latest,
    arrivalRows:num(dates?.arrival_rows),
    allRows:num(dates?.all_rows),
    calendarSpanDays,
    targetDays:HISTORY_TARGET_DAYS,
    targetStartDate,
    backfillCursor:cursor,
    targetReached: calendarSpanDays >= HISTORY_TARGET_DAYS - 7 || Math.abs(cursor) >= HISTORY_TARGET_DAYS,
    progressPct,
    serverTime:new Date().toISOString()
  };
}

function sinceDate(days: number) {
  return new Date(Date.now() - Math.max(1,days-1)*86400000).toISOString().slice(0,10);
}

async function ingestStatus(db:D1Database) {
  await ensurePortSchema(db);
  const row = await db.prepare("SELECT * FROM port_ingest_log WHERE source_key='haiphong-ship-plan'").first<any>();
  const count = await db.prepare("SELECT COUNT(*) AS c FROM port_ship_movements").first<{c:number}>();
  return {
    lastOkAt: row?.last_ok_at ? new Date(Number(row.last_ok_at)).toISOString() : null,
    lastError: row?.last_error ?? null,
    storedRows: Number(count?.c ?? 0)
  };
}

function num(v:any){ const n=Number(v); return Number.isFinite(n)?n:0; }
function nullableNum(v:any){ return v==null?null:Number(v); }

export async function getHaiphongSummary(db:D1Database, days=30): Promise<PortHarborSummary> {
  await ensurePortSchema(db);
  const since=sinceDate(days);
  const summary=await db.prepare(`SELECT COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls,AVG(dwt) avg_dwt,MAX(dwt) max_dwt,MAX(plan_date) last_date
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IS NOT NULL AND plan_date>=?`).bind(since).first<any>();
  const top=await db.prepare(`SELECT to_terminal terminal,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IS NOT NULL AND plan_date>=?
    GROUP BY to_terminal ORDER BY dwt DESC LIMIT 12`).bind(since).all<any>();
  const daily=await db.prepare(`SELECT plan_date date,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls,AVG(dwt) avg_dwt,MAX(dwt) max_dwt
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IS NOT NULL AND plan_date>=?
    GROUP BY plan_date ORDER BY plan_date`).bind(since).all<any>();
  return {
    scope:"HAIPHONG",days,
    summary:{dwt:num(summary?.dwt),shipCalls:num(summary?.ship_calls),avgDwt:nullableNum(summary?.avg_dwt),maxDwt:nullableNum(summary?.max_dwt),lastPlanDate:summary?.last_date??null},
    topTerminals:(top.results??[]).map((r:any)=>({terminal:r.terminal,terminalLabel:TERMINAL_LABELS[r.terminal]??r.terminal,dwt:num(r.dwt),shipCalls:num(r.ship_calls)})),
    daily:(daily.results??[]).map((r:any)=>({date:r.date,dwt:num(r.dwt),shipCalls:num(r.ship_calls),avgDwt:nullableNum(r.avg_dwt),maxDwt:nullableNum(r.max_dwt)} as PortDailyStat)),
    ingestion:await ingestStatus(db),
    source:{label:"CSDL tàu – Cảng vụ Hàng hải Hải Phòng",url:SOURCE_HOME,sourceType:SOURCE_TYPE,dataStatus:"planned-movement"},
    serverTime:new Date().toISOString()
  };
}

export async function getTerminalAnalytics(db:D1Database, terminal:string, days=90, months=24): Promise<PortTerminalAnalytics> {
  await ensurePortSchema(db);
  const code=terminal.toUpperCase();
  if (!TERMINAL_LABELS[code]) throw new Error(`Unknown terminal: ${terminal}`);
  const since=sinceDate(days);
  const monthSince=new Date(); monthSince.setMonth(monthSince.getMonth()-Math.max(1,months-1)); const monthSinceText=monthSince.toISOString().slice(0,7)+"-01";
  const summary=await db.prepare(`SELECT COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls,AVG(dwt) avg_dwt,MAX(dwt) max_dwt,MAX(plan_date) last_date
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal=? AND plan_date>=?`).bind(code,since).first<any>();
  const daily=await db.prepare(`SELECT plan_date date,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls,AVG(dwt) avg_dwt,MAX(dwt) max_dwt
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal=? AND plan_date>=? GROUP BY plan_date ORDER BY plan_date`).bind(code,since).all<any>();
  const monthly=await db.prepare(`SELECT substr(plan_date,1,7) month,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls,AVG(dwt) avg_dwt,MAX(dwt) max_dwt
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal=? AND plan_date>=? GROUP BY substr(plan_date,1,7) ORDER BY month`).bind(code,monthSinceText).all<any>();
  const routes=await db.prepare(`SELECT from_raw route,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls FROM port_ship_movements
    WHERE movement_type='ARRIVAL' AND to_terminal=? AND plan_date>=? GROUP BY from_raw ORDER BY dwt DESC LIMIT 10`).bind(code,since).all<any>();
  const calls=await db.prepare(`SELECT plan_date,event_time,vessel_name,draft,loa,dwt,gt,from_raw,to_raw,to_terminal,agent,channel,source_url
    FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal=? AND plan_date>=? ORDER BY plan_date DESC,event_time DESC LIMIT 60`).bind(code,since).all<any>();
  return {
    terminal:code,terminalLabel:TERMINAL_LABELS[code],days,
    summary:{dwt:num(summary?.dwt),shipCalls:num(summary?.ship_calls),avgDwt:nullableNum(summary?.avg_dwt),maxDwt:nullableNum(summary?.max_dwt),lastPlanDate:summary?.last_date??null},
    daily:(daily.results??[]).map((r:any)=>({date:r.date,dwt:num(r.dwt),shipCalls:num(r.ship_calls),avgDwt:nullableNum(r.avg_dwt),maxDwt:nullableNum(r.max_dwt)} as PortDailyStat)),
    monthly:(monthly.results??[]).map((r:any)=>({month:r.month,dwt:num(r.dwt),shipCalls:num(r.ship_calls),avgDwt:nullableNum(r.avg_dwt),maxDwt:nullableNum(r.max_dwt)} as PortMonthlyStat)),
    routes:(routes.results??[]).map((r:any)=>({route:r.route,dwt:num(r.dwt),shipCalls:num(r.ship_calls)} as PortRouteStat)),
    recentCalls:(calls.results??[]).map((r:any)=>({planDate:r.plan_date,eventTime:r.event_time,vesselName:r.vessel_name,draft:nullableNum(r.draft),loa:nullableNum(r.loa),dwt:nullableNum(r.dwt),gt:nullableNum(r.gt),fromRaw:r.from_raw,toRaw:r.to_raw,terminal:r.to_terminal,agent:r.agent,channel:r.channel,sourceUrl:r.source_url,sourceType:SOURCE_TYPE} as PortShipCall)),
    capability:CAPABILITIES[code]??null,
    source:{label:"CSDL tàu – Cảng vụ Hàng hải Hải Phòng",url:SOURCE_HOME,sourceType:SOURCE_TYPE,dataStatus:"planned-movement"},
    ingestion:await ingestStatus(db),serverTime:new Date().toISOString()
  };
}

export async function getPortSourcePreview(offset:number) {
  const rows=await fetchHaiphongPlan(offset);
  return { offset, rows:rows.slice(0,120), parsedRows:rows.length, sourceUrl:`${SOURCE_BASE}?d=${Math.trunc(offset)}`, serverTime:new Date().toISOString() };
}

export const trackedPortTerminals = Object.keys(TERMINAL_LABELS).map(code=>({code,label:TERMINAL_LABELS[code]}));


type CompanyTerminalCfg = {
  code:string;
  ownershipPct:number|null;
  ownershipNote:string;
  capacityTeu:number|null;
  capacityTons:number|null;
  officialUrl:string;
  sourceLabel:string;
  sourceUrl:string;
  sourceAsOf:string;
};

const COMPANY_INTELLIGENCE: Record<string, {name:string; terminals:CompanyTerminalCfg[]}> = {
  PHP: {
    name:"Công ty Cổ phần Cảng Hải Phòng",
    terminals:[
      {
        code:"TAN_VU",
        ownershipPct:null,
        ownershipNote:"Chi nhánh Cảng Tân Vũ được website chính thức Cảng Hải Phòng xác nhận là chi nhánh trực thuộc; không dùng % sở hữu vì đây không phải pháp nhân độc lập.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://haiphongport.com.vn/",
        sourceLabel:"Cảng Hải Phòng – Chi nhánh Cảng Tân Vũ",
        sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien/chi-nhanh-cang-tan-vu-389.html",
        sourceAsOf:"2026-09-08"
      },
      {
        code:"CHUA_VE",
        ownershipPct:null,
        ownershipNote:"Cảng Hoàng Diệu Chùa Vẽ được Cảng Hải Phòng liệt kê trong danh sách đơn vị thành viên; chưa gán % sở hữu khi chưa chuẩn hóa pháp nhân theo BCTC 2025.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://haiphongport.com.vn/",
        sourceLabel:"Cảng Hải Phòng – Đơn vị thành viên",
        sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien",
        sourceAsOf:"2026-09-08"
      },
      {
        code:"HOANG_DIEU",
        ownershipPct:null,
        ownershipNote:"Cảng Hoàng Diệu Chùa Vẽ thuộc danh sách đơn vị thành viên Cảng Hải Phòng; mapping hoạt động được giữ riêng để theo dõi thay đổi phạm vi khai thác.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://haiphongport.com.vn/",
        sourceLabel:"Cảng Hải Phòng – Đơn vị thành viên",
        sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien",
        sourceAsOf:"2026-09-08"
      },
      {
        code:"HTIT",
        ownershipPct:null,
        ownershipNote:"Công ty TNHH Cảng Quốc tế TIL Cảng Hải Phòng (HTIT) được website Cảng Hải Phòng liệt kê là đơn vị thành viên. V8.11 chưa hard-code % sở hữu nếu chưa có nguồn pháp lý/BCTC xác nhận trực tiếp.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://haiphongport.com.vn/",
        sourceLabel:"Cảng Hải Phòng – Đơn vị thành viên",
        sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien",
        sourceAsOf:"2026-09-08"
      }
    ]
  },

  GMD: {
    name:"Công ty Cổ phần Gemadept",
    terminals:[
      {
        code:"NAM_DINH_VU",
        ownershipPct:null,
        ownershipNote:"Nguồn chính thức Gemadept xác nhận Cảng Nam Đình Vũ thuộc hệ thống Gemadept; V8.11 không tự suy % sở hữu khi chưa parse trực tiếp BCTC 2025 cho pháp nhân cảng.",
        capacityTeu:2000000,capacityTons:null,
        officialUrl:"https://www.gemadept.com.vn/",
        sourceLabel:"Gemadept – Nam Đình Vũ",
        sourceUrl:"https://ndv.gemadept.com.vn/tap-doan-gemadept-va-hanh-trinh-kien-tao-ky-nguyen-hang-hai-moi/",
        sourceAsOf:"2026-09-08"
      }
    ]
  },

  VSC: {
    name:"Công ty Cổ phần Container Việt Nam",
    terminals:[
      {
        code:"VIP_GREEN",
        ownershipPct:74,
        ownershipNote:"BCTC hợp nhất kiểm toán 2024 của VSC ghi VIP Greenport là công ty con trực tiếp với tỷ lệ sở hữu và quyền biểu quyết 74% tại 31/12/2024.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://viconship.com/",
        sourceLabel:"VSC – BCTC hợp nhất kiểm toán 2024",
        sourceUrl:"https://viconship.com/Upload/images/Tai%20lieu%202025/TA/20250320%20-%20VSC%20-%20AUDITED%20CONSO%20FS%202024_EN.pdf",
        sourceAsOf:"2024-12-31"
      },
      {
        code:"NAM_HAI_DINH_VU",
        ownershipPct:99.99,
        ownershipNote:"BCTC hợp nhất kiểm toán 2024 của VSC ghi Nam Hai Dinh Vu Port Co., Ltd. là công ty con trực tiếp, sở hữu 99,99% tại 31/12/2024. Tài liệu ĐHĐCĐ 2025 nói VSC tiếp tục tăng tỷ lệ lên gần 100%; registry giữ con số kiểm toán 99,99% đến khi parse BCTC 2025.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://viconship.com/",
        sourceLabel:"VSC – BCTC hợp nhất kiểm toán 2024",
        sourceUrl:"https://viconship.com/Upload/images/Tai%20lieu%202025/TA/20250320%20-%20VSC%20-%20AUDITED%20CONSO%20FS%202024_EN.pdf",
        sourceAsOf:"2024-12-31"
      },
      {
        code:"GREEN_PORT",
        ownershipPct:null,
        ownershipNote:"Website chính thức Viconship xác nhận GREENPORT là cảng do Viconship thành lập/vận hành trong hệ sinh thái. Không gán % pháp nhân khi chưa có linkage pháp lý đủ rõ giữa tên terminal và pháp nhân Greenport Services.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://viconship.com/",
        sourceLabel:"Viconship – Giới thiệu",
        sourceUrl:"https://viconship.com/gioi-thieu",
        sourceAsOf:"2026-09-08"
      }
    ]
  },

  DVP: {
    name:"CTCP Đầu tư và Phát triển Cảng Đình Vũ",
    terminals:[
      {
        code:"DINH_VU",
        ownershipPct:null,
        ownershipNote:"Cảng Đình Vũ là terminal do chính CTCP Đầu tư và Phát triển Cảng Đình Vũ khai thác; % sở hữu không áp dụng vì terminal không được mô hình hóa như pháp nhân con.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://dinhvuport.com.vn/",
        sourceLabel:"Cảng Đình Vũ – website chính thức",
        sourceUrl:"https://dinhvuport.com.vn/",
        sourceAsOf:"2026-09-08"
      }
    ]
  },

  HAH: {
    name:"CTCP Vận tải và Xếp dỡ Hải An",
    terminals:[
      {
        code:"HAI_AN",
        ownershipPct:100,
        ownershipNote:"Báo cáo thường niên 2024 của HAH ghi Công ty TNHH Cảng Hải An là công ty con với tỷ lệ sở hữu 100% tại 31/12/2024. Registry chưa nâng mốc as-of nếu chưa parse được bảng tương ứng trong BCTN 2025.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://haiants.vn/",
        sourceLabel:"HAH – Báo cáo thường niên 2024",
        sourceUrl:"https://haiants.vn/files/Quan_he_co_dong/Bao-cao-thuong-nien/HAH-Bao-cao-thuong-nien-nam-2024-F.pdf",
        sourceAsOf:"2024-12-31"
      }
    ]
  },

  DXP: {
    name:"Công ty Cổ phần Cảng Đoạn Xá",
    terminals:[
      {
        code:"DOAN_XA",
        ownershipPct:null,
        ownershipNote:"Website chính thức DXP xác nhận Cảng Đoạn Xá do chính DXP khai thác, chính thức hoạt động từ 27/11/2001 và tiếp nhận tàu đến 40.000 DWT giảm tải.",
        capacityTeu:null,capacityTons:null,
        officialUrl:"https://doanxaport.com.vn/",
        sourceLabel:"DXP – Dịch vụ khai thác cảng",
        sourceUrl:"https://doanxaport.com.vn/dich-vu-khai-thac-cang",
        sourceAsOf:"2026-09-08"
      }
    ]
  }
};

/*
 * Relationship registry is separate from the movement-aggregation registry.
 * This prevents double counting. Example: PHP officially held 51% of DVP
 * according to Port of Hai Phong's 2025 AGM news, but DVP's DINH_VU movements
 * remain counted only in DVP company analytics, not again inside PHP.
 */
export const PORT_RELATIONSHIPS: PortRelationship[] = [
  {
    companySymbol:"PHP", companyName:"Công ty Cổ phần Cảng Hải Phòng",
    terminalCode:"TAN_VU", terminalLabel:"Tân Vũ", relatedCompany:null,
    relationshipType:"DIRECT_BRANCH", ownershipPct:null,
    effectiveFrom:null,effectiveTo:null,asOf:"2026-09-08",
    sourceLabel:"Cảng Hải Phòng – Chi nhánh Cảng Tân Vũ",
    sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien/chi-nhanh-cang-tan-vu-389.html",
    note:"Chi nhánh trực thuộc; không biểu diễn bằng % sở hữu."
  },
  {
    companySymbol:"PHP", companyName:"Công ty Cổ phần Cảng Hải Phòng",
    terminalCode:"HTIT", terminalLabel:"HTIT · Lạch Huyện 3–4",
    relatedCompany:"Công ty TNHH Cảng Quốc tế TIL Cảng Hải Phòng",
    relationshipType:"MEMBER_COMPANY", ownershipPct:null,
    effectiveFrom:null,effectiveTo:null,asOf:"2026-09-08",
    sourceLabel:"Cảng Hải Phòng – Đơn vị thành viên",
    sourceUrl:"https://haiphongport.com.vn/vi/don-vi-thanh-vien",
    note:"Website chính thức xác nhận quan hệ đơn vị thành viên; chưa gán % khi chưa có nguồn pháp lý/BCTC trực tiếp."
  },
  {
    companySymbol:"PHP", companyName:"Công ty Cổ phần Cảng Hải Phòng",
    terminalCode:"DINH_VU", terminalLabel:"Đình Vũ",
    relatedCompany:"CTCP Đầu tư và Phát triển Cảng Đình Vũ (DVP)",
    relationshipType:"SUBSIDIARY", ownershipPct:51,
    effectiveFrom:null,effectiveTo:null,asOf:"2025-04-18",
    sourceLabel:"Cảng Hải Phòng – ĐHĐCĐ DVP 2025",
    sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/dai-hoi-co-dong-thuong-nien-nam-2025-cua-cong-ty-cp-dau-tu-va-phat-trien-cang-dinh-vu.html",
    note:"Nguồn chính thức Cảng Hải Phòng ghi Cảng Hải Phòng nắm 51% vốn điều lệ DVP. Không cộng DVP vào PHP DWT proxy để tránh double count."
  },
  {
    companySymbol:"VSC", companyName:"Công ty Cổ phần Container Việt Nam",
    terminalCode:"VIP_GREEN", terminalLabel:"VIP Green Port",
    relatedCompany:"VIP Greenport JSC", relationshipType:"SUBSIDIARY",
    ownershipPct:74,effectiveFrom:null,effectiveTo:null,asOf:"2024-12-31",
    sourceLabel:"VSC – BCTC hợp nhất kiểm toán 2024",
    sourceUrl:"https://viconship.com/Upload/images/Tai%20lieu%202025/TA/20250320%20-%20VSC%20-%20AUDITED%20CONSO%20FS%202024_EN.pdf",
    note:"Tỷ lệ sở hữu và quyền biểu quyết 74% tại 31/12/2024."
  },
  {
    companySymbol:"VSC", companyName:"Công ty Cổ phần Container Việt Nam",
    terminalCode:"NAM_HAI_DINH_VU", terminalLabel:"Nam Hải Đình Vũ",
    relatedCompany:"Nam Hai Dinh Vu Port Co., Ltd.", relationshipType:"SUBSIDIARY",
    ownershipPct:99.99,effectiveFrom:"2024-07-18",effectiveTo:null,asOf:"2024-12-31",
    sourceLabel:"VSC – BCTC hợp nhất kiểm toán 2024",
    sourceUrl:"https://viconship.com/Upload/images/Tai%20lieu%202025/TA/20250320%20-%20VSC%20-%20AUDITED%20CONSO%20FS%202024_EN.pdf",
    note:"BCTC ghi 99,99% tại 31/12/2024; tài liệu 2025 nói tiếp tục tăng lên gần 100%."
  },
  {
    companySymbol:"HAH", companyName:"CTCP Vận tải và Xếp dỡ Hải An",
    terminalCode:"HAI_AN", terminalLabel:"Hải An",
    relatedCompany:"Công ty TNHH Cảng Hải An", relationshipType:"SUBSIDIARY",
    ownershipPct:100,effectiveFrom:null,effectiveTo:null,asOf:"2024-12-31",
    sourceLabel:"HAH – Báo cáo thường niên 2024",
    sourceUrl:"https://haiants.vn/files/Quan_he_co_dong/Bao-cao-thuong-nien/HAH-Bao-cao-thuong-nien-nam-2024-F.pdf",
    note:"BCTN 2024 ghi công ty con 100% tại 31/12/2024."
  },
  {
    companySymbol:"DXP", companyName:"Công ty Cổ phần Cảng Đoạn Xá",
    terminalCode:"DOAN_XA", terminalLabel:"Đoạn Xá", relatedCompany:null,
    relationshipType:"DIRECT_OPERATOR", ownershipPct:null,
    effectiveFrom:"2001-11-27",effectiveTo:null,asOf:"2026-09-08",
    sourceLabel:"DXP – Dịch vụ khai thác cảng",
    sourceUrl:"https://doanxaport.com.vn/dich-vu-khai-thac-cang",
    note:"DXP xác nhận trực tiếp khai thác Cảng Đoạn Xá; tiếp nhận tàu đến 40.000 DWT giảm tải."
  }
];

export const trackedPortCompanies = Object.entries(COMPANY_INTELLIGENCE).map(([symbol,x])=>({symbol,name:x.name}));

export async function getPortCompanyIntelligence(db:D1Database, symbol:string, days=90, months=24): Promise<PortCompanyIntelligence> {
  await ensurePortSchema(db);
  const code=symbol.toUpperCase(); const cfg=COMPANY_INTELLIGENCE[code];
  if(!cfg) throw new Error(`Unknown/unsupported port company: ${symbol}`);
  const terminals=cfg.terminals.map(x=>x.code); const placeholders=terminals.map(()=>'?').join(',');
  const since=sinceDate(days); const monthSince=new Date(); monthSince.setMonth(monthSince.getMonth()-Math.max(months+12,24)); const monthSinceText=monthSince.toISOString().slice(0,7)+'-01';
  const terminalStats=await db.prepare(`SELECT to_terminal terminal,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IN (${placeholders}) AND plan_date>=? GROUP BY to_terminal ORDER BY dwt DESC`).bind(...terminals,since).all<any>();
  const rows=(terminalStats.results??[]); const totalDwt=rows.reduce((a:any,x:any)=>a+num(x.dwt),0); const totalCalls=rows.reduce((a:any,x:any)=>a+num(x.ship_calls),0);
  const overall=await db.prepare(`SELECT AVG(dwt) avg_dwt,MAX(dwt) max_dwt FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IN (${placeholders}) AND plan_date>=?`).bind(...terminals,since).first<any>();
  const monthlyRaw=await db.prepare(`SELECT substr(plan_date,1,7) month,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IN (${placeholders}) AND plan_date>=? GROUP BY substr(plan_date,1,7) ORDER BY month`).bind(...terminals,monthSinceText).all<any>();
  const mm=new Map<string,{dwt:number;shipCalls:number}>((monthlyRaw.results??[]).map((x:any)=>[String(x.month),{dwt:num(x.dwt),shipCalls:num(x.ship_calls)}]));
  const recent=[...mm.keys()].sort().slice(-months); const monthly=recent.map(month=>{const cur:any=mm.get(month); const [y,m]=month.split('-'); const prev:any=mm.get(`${Number(y)-1}-${m}`); return {month,dwt:cur.dwt,shipCalls:cur.shipCalls,previousYearDwt:prev?.dwt??null,yoyDwtPct:prev?.dwt>0?(cur.dwt/prev.dwt-1)*100:null};});
  const routeRaw=await db.prepare(`SELECT from_raw route,COALESCE(SUM(dwt),0) dwt,COUNT(*) ship_calls FROM port_ship_movements WHERE movement_type='ARRIVAL' AND to_terminal IN (${placeholders}) AND plan_date>=? GROUP BY from_raw ORDER BY dwt DESC LIMIT 12`).bind(...terminals,since).all<any>();
  const capacityTeu=cfg.terminals.every(x=>x.capacityTeu!=null)?cfg.terminals.reduce((a,x)=>a+(x.capacityTeu??0),0):cfg.terminals.some(x=>x.capacityTeu!=null)?cfg.terminals.reduce((a,x)=>a+(x.capacityTeu??0),0):null;
  return {symbol:code,name:cfg.name,days,terminals:cfg.terminals.map(x=>({...x,label:TERMINAL_LABELS[x.code]??x.code})),summary:{dwt:totalDwt,shipCalls:totalCalls,avgDwt:nullableNum(overall?.avg_dwt),maxDwt:nullableNum(overall?.max_dwt),terminalCount:terminals.length,capacityTeu},terminalStats:rows.map((x:any)=>{const c=cfg.terminals.find(t=>t.code===x.terminal);return{terminal:x.terminal,terminalLabel:TERMINAL_LABELS[x.terminal]??x.terminal,dwt:num(x.dwt),shipCalls:num(x.ship_calls),shareDwtPct:totalDwt>0?num(x.dwt)/totalDwt*100:0,capacityTeu:c?.capacityTeu??null,ownershipPct:c?.ownershipPct??null}}),monthly,routes:(routeRaw.results??[]).map((x:any)=>({route:x.route,dwt:num(x.dwt),shipCalls:num(x.ship_calls),shareDwtPct:totalDwt>0?num(x.dwt)/totalDwt*100:0})),relationships:PORT_RELATIONSHIPS.filter(r=>r.companySymbol===code),caveats:["DWT là proxy quy mô tàu, không phải TEU hay sản lượng hàng thực tế.","Ship-call dùng ARRIVAL convention từ kế hoạch điều động; chưa mặc định là actual realized call.","Company aggregation chỉ gồm terminal đã được registry; không tự suy terminal chưa xác minh.","Ownership % để null khi chưa có nguồn/effective-date registry đủ chắc chắn."],serverTime:new Date().toISOString()};
}


export function getPortRelationships(symbol?:string) {
  const code = symbol?.trim().toUpperCase();
  const data = code ? PORT_RELATIONSHIPS.filter(x=>x.companySymbol===code) : PORT_RELATIONSHIPS;
  return { data, serverTime:new Date().toISOString() };
}

export async function getPortCompanyComparison(db:D1Database, days=90, months=24): Promise<PortCompanyComparison> {
  await ensurePortSchema(db);
  const symbols = Object.keys(COMPANY_INTELLIGENCE);
  const rows = await Promise.all(symbols.map(async symbol => {
    const x = await getPortCompanyIntelligence(db, symbol, days, months);
    const latest = x.monthly.length ? x.monthly[x.monthly.length-1] : null;
    return {
      symbol:x.symbol,
      name:x.name,
      terminals:x.terminals.map(t=>t.label),
      dwt:x.summary.dwt,
      shipCalls:x.summary.shipCalls,
      avgDwt:x.summary.avgDwt,
      maxDwt:x.summary.maxDwt,
      latestMonth:latest?.month ?? null,
      latestMonthDwt:latest?.dwt ?? null,
      latestMonthYoyPct:latest?.yoyDwtPct ?? null,
      shareOfTrackedDwtPct:0,
      relationshipCoverage:"verified" as const,
      caveat:"Share chỉ tính trên tập terminal đã registry cho 6 doanh nghiệp, không phải market share TEU/toàn Hải Phòng."
    };
  }));

  const totalTrackedDwt = rows.reduce((a,x)=>a+x.dwt,0);
  const withShare = rows
    .map(x=>({...x,shareOfTrackedDwtPct:totalTrackedDwt>0?x.dwt/totalTrackedDwt*100:0}))
    .sort((a,b)=>b.dwt-a.dwt);

  return {
    days,
    universe:symbols,
    totalTrackedDwt,
    rows:withShare,
    label:"SHARE_OF_TRACKED_COMPANY_DWT_PROXY",
    note:"Không gọi đây là thị phần ngành. Đây là tỷ trọng DWT arrival proxy trong tập terminal đã xác minh và không chồng lặp giữa các doanh nghiệp.",
    serverTime:new Date().toISOString()
  };
}

export function getPortThroughputCapacity(): PortThroughputCapacityResponse {
  const data = [
    {id:"PHP-2025",companySymbol:"PHP",assetCode:"PHP_SYSTEM",assetLabel:"Cảng Hải Phòng · hợp nhất",region:"Hải Phòng",period:"2025",throughputTeu:2072000,throughputKind:"ACTUAL" as const,throughputLabel:"Container thông qua 2025",capacityTeu:null,capacityAsOf:null,utilizationPct:null,utilizationKind:"UNAVAILABLE" as const,status:"Latest" as const,sourceLabel:"Cảng Hải Phòng – ĐHĐCĐ 2026",sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/dai-hoi-dong-co-dong-thuong-nien-cang-hai-phong-nam-2026-khang-dinh-vi-the-dan-dau-kien-tao-dong-luc-phat-trien-moi.html",sourceDate:"2026-04-28",note:"Actual 2025 >2,072 triệu TEU, +12,3% YoY. Không tính utilization vì chưa có capacity hợp nhất cùng phạm vi."},
    {id:"PHP-H1-2026",companySymbol:"PHP",assetCode:"PHP_SYSTEM",assetLabel:"Cảng Hải Phòng · hợp nhất",region:"Hải Phòng",period:"H1 2026",throughputTeu:1220000,throughputKind:"ACTUAL" as const,throughputLabel:"Container H1 2026",capacityTeu:null,capacityAsOf:null,utilizationPct:null,utilizationKind:"UNAVAILABLE" as const,status:"Latest" as const,sourceLabel:"Cảng Hải Phòng – Sơ kết 6T2026",sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/dang-bo-cang-hai-phong-so-ket-cong-tac-6-thang-dau-nam-2026-giu-vung-vai-tro-hat-nhan-lanh-dao-tao-da-tang-truong-ben-vung.html",sourceDate:"2026-07-21",note:"Actual H1 2026 = 1,22 triệu TEU, +31,5% YoY. Không annualize tự động."},
    {id:"TANVU-2025",companySymbol:"PHP",assetCode:"TAN_VU",assetLabel:"Cảng Tân Vũ",region:"Hải Phòng",period:"2025",throughputTeu:1100000,throughputKind:"ESTIMATE" as const,throughputLabel:"Sản lượng ước 2025",capacityTeu:null,capacityAsOf:null,utilizationPct:null,utilizationKind:"UNAVAILABLE" as const,status:"Latest" as const,sourceLabel:"Cảng Hải Phòng – Tân Vũ 17 năm",sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/cang-tan-vu-17-nam-hanh-trinh-vuon-xa.html",sourceDate:"2025-12-18",note:"Nguồn doanh nghiệp ghi ước đạt 1,1 triệu TEU; giữ đúng nhãn Estimate."},
    {id:"HTIT-2026",companySymbol:"PHP",assetCode:"HTIT",assetLabel:"HTIT · Lạch Huyện 3–4",region:"Hải Phòng",period:"2026 target",throughputTeu:700000,throughputKind:"TARGET" as const,throughputLabel:"Mục tiêu sản lượng 2026",capacityTeu:1100000,capacityAsOf:"2026-07-01",utilizationPct:63.6,utilizationKind:"TARGET" as const,status:"Latest" as const,sourceLabel:"Cảng Hải Phòng – Bến 3,4 Lạch Huyện",sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/ben-so-3-4-lach-huyen-tao-cu-hich-cang-hai-phong-php-tang-toc-voi-loat-du-an-moi.html",sourceDate:"2026-07-01",note:"63,6% = target/capacity (700k/1,1m), KHÔNG phải actual utilization."},
    {id:"NDV-CAP",companySymbol:"GMD",assetCode:"NAM_DINH_VU",assetLabel:"Cụm cảng Nam Đình Vũ",region:"Hải Phòng",period:"Current capacity",throughputTeu:null,throughputKind:"DISCLOSED_RUN_RATE" as const,throughputLabel:"Actual annual TEU chưa có disclosure đủ chuẩn",capacityTeu:2000000,capacityAsOf:"2025-09-30",utilizationPct:null,utilizationKind:"UNAVAILABLE" as const,status:"Latest" as const,sourceLabel:"Gemadept – Nam Đình Vũ GĐ3",sourceUrl:"https://www.gemadept.com.vn/gemadept-chinh-thuc-dua-giai-doan-3-cum-cang-nam-dinh-vu-vao-hoat-dong/",sourceDate:"2025-10-07",note:"GĐ3 vận hành từ 30/09/2025, tổng công suất hơn 2 triệu TEU/năm. Không dùng kế hoạch 2025 làm actual."},
    {id:"VSC-CAP",companySymbol:"VSC",assetCode:"VSC_PORT_SYSTEM",assetLabel:"Viconship · hệ thống cảng công bố",region:"Hải Phòng",period:"Published capacity",throughputTeu:null,throughputKind:"DISCLOSED_RUN_RATE" as const,throughputLabel:"Actual TEU chưa có nguồn official cùng phạm vi",capacityTeu:1500000,capacityAsOf:"2023-06-15",utilizationPct:null,utilizationKind:"UNAVAILABLE" as const,status:"Latest" as const,sourceLabel:"Viconship – công bố quy mô công suất",sourceUrl:"https://one.viconship.com/vi/vsc-tai-cau-truc-toan-dien-dat-muc-tieu-tro-thanh-cong-ty-logistics-tam-co-khu-vuc-va-the-gioi",sourceDate:"2023-06-15",note:"Capacity 1,5 triệu TEU/năm là disclosure cấp hệ thống tại thời điểm nguồn; không ghép với throughput khác scope."}
  ];
  return {data,methodology:["Actual, Estimate và Target được tách nhãn; không chuyển kế hoạch thành số thực hiện.","Utilization chỉ tính khi throughput/capacity cùng asset, đơn vị và kỳ so sánh.","DWT/ship-call không được dùng để suy ra TEU.","Thiếu nguồn official tương thích => utilization để null/—."],serverTime:new Date().toISOString()};
}


/*
 * V8.13 historical throughput + capacity timeline.
 *
 * Admission policy:
 * - only official company / official port disclosures;
 * - period/scope/unit are preserved;
 * - actual, estimate and target are never merged;
 * - no TEU is inferred from DWT;
 * - no utilization is calculated across incompatible scopes.
 */
export function getPortThroughputHistory(): PortThroughputHistoryResponse {
  const throughput = [
    {
      id:"PHP-2024-ACTUAL", companySymbol:"PHP", assetCode:"PHP_SYSTEM",
      assetLabel:"Cảng Hải Phòng · hợp nhất", scope:"COMPANY_SYSTEM" as const,
      period:"2024", periodOrder:"2024-12-31", unit:"TEU" as const, value:1846300,
      kind:"ACTUAL" as const, yoyPct:2.3, yoyKind:"REPORTED" as const,
      sourceLabel:"Cảng Hải Phòng – ĐHĐCĐ thường niên 2025",
      sourceUrl:"https://haiphongport.com.vn/vi/san-xuat-kinh-doanh/cang-hai-phong-to-chuc-thanh-cong-dai-hoi-dong-co-dong-thuong-nien-nam-2025.html",
      sourceDate:"2025-04-25",
      note:"Sản lượng container hợp nhất năm 2024 đạt 1.846.300 TEU, tăng 2,3% YoY."
    },
    {
      id:"PHP-2025-ACTUAL", companySymbol:"PHP", assetCode:"PHP_SYSTEM",
      assetLabel:"Cảng Hải Phòng · hợp nhất", scope:"COMPANY_SYSTEM" as const,
      period:"2025", periodOrder:"2025-12-31", unit:"TEU" as const, value:2072000,
      kind:"ACTUAL" as const, yoyPct:12.3, yoyKind:"REPORTED" as const,
      sourceLabel:"Cảng Hải Phòng – ĐHĐCĐ thường niên 2026",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/dai-hoi-dong-co-dong-thuong-nien-cang-hai-phong-nam-2026-khang-dinh-vi-the-dan-dau-kien-tao-dong-luc-phat-trien-moi.html",
      sourceDate:"2026-04-28",
      note:"Sản lượng container hợp nhất năm 2025 hơn 2,072 triệu TEU, tăng 12,3% YoY."
    },
    {
      id:"PHP-H1-2026-ACTUAL", companySymbol:"PHP", assetCode:"PHP_SYSTEM",
      assetLabel:"Cảng Hải Phòng · hợp nhất", scope:"COMPANY_SYSTEM" as const,
      period:"H1 2026", periodOrder:"2026-06-30", unit:"TEU" as const, value:1220000,
      kind:"ACTUAL" as const, yoyPct:31.5, yoyKind:"REPORTED" as const,
      sourceLabel:"Cảng Hải Phòng – Sơ kết 6 tháng đầu năm 2026",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/dang-bo-cang-hai-phong-so-ket-cong-tac-6-thang-dau-nam-2026-giu-vung-vai-tro-hat-nhan-lanh-dao-tao-da-tang-truong-ben-vung.html",
      sourceDate:"2026-07-21",
      note:"Sản lượng container H1/2026 đạt 1,22 triệu TEU, tăng 31,5% YoY. Không annualize."
    },
    {
      id:"PHP-MAY-2026-ACTUAL", companySymbol:"PHP", assetCode:"PHP_SYSTEM",
      assetLabel:"Cảng Hải Phòng · hợp nhất", scope:"COMPANY_SYSTEM" as const,
      period:"May 2026", periodOrder:"2026-05-31", unit:"TEU" as const, value:239000,
      kind:"ACTUAL" as const, yoyPct:17.9, yoyKind:"REPORTED" as const,
      sourceLabel:"Cảng Hải Phòng – giao ban tháng 5/2026",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/cang-hai-phong-duy-tri-da-tang-truong-khen-thuong-tap-the-ca-nhan-xuat-sac-thang-52026.html",
      sourceDate:"2026-06-09",
      note:"Sản lượng container riêng tháng 5/2026 đạt 239.000 TEU, tăng 17,9% YoY."
    },
    {
      id:"TANVU-2025-EST", companySymbol:"PHP", assetCode:"TAN_VU",
      assetLabel:"Cảng Tân Vũ", scope:"TERMINAL" as const,
      period:"2025", periodOrder:"2025-12-31", unit:"TEU" as const, value:1100000,
      kind:"ESTIMATE" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"Cảng Hải Phòng – Tân Vũ 17 năm",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/cang-tan-vu-17-nam-hanh-trinh-vuon-xa.html",
      sourceDate:"2025-12-18",
      note:"Nguồn doanh nghiệp dùng từ 'ước đạt'; giữ đúng nhãn ESTIMATE."
    },
    {
      id:"HTIT-2026-TARGET", companySymbol:"PHP", assetCode:"HTIT",
      assetLabel:"HTIT · Lạch Huyện 3–4", scope:"TERMINAL" as const,
      period:"2026 target", periodOrder:"2026-12-31", unit:"TEU" as const, value:700000,
      kind:"TARGET" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"Cảng Hải Phòng – cập nhật Bến 3,4 Lạch Huyện",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/ben-so-3-4-lach-huyen-tao-cu-hich-cang-hai-phong-php-tang-toc-voi-loat-du-an-moi.html",
      sourceDate:"2026-07-01",
      note:"Mục tiêu 2026, không phải actual throughput."
    },
    {
      id:"DVP-2025-ACTUAL", companySymbol:"DVP", assetCode:"DINH_VU",
      assetLabel:"Cảng Đình Vũ", scope:"TERMINAL" as const,
      period:"2025", periodOrder:"2025-12-31", unit:"TEU" as const, value:513942,
      kind:"ACTUAL" as const, yoyPct:-10.33, yoyKind:"REPORTED" as const,
      sourceLabel:"DVP – Tờ trình kết quả SXKD 2025",
      sourceUrl:"https://dinhvuport.com.vn/aj/Download.ashx?Key=885",
      sourceDate:"2026-04-01",
      note:"Sản lượng quy đổi 2025 = 513.942 TEU, bằng 89,67% năm 2024. App lưu YoY -10,33% theo tỷ lệ công bố; không tự suy ngược số 2024."
    },
    {
      id:"HAH-PORT-2024-ACTUAL", companySymbol:"HAH", assetCode:"HAI_AN",
      assetLabel:"Khai thác cảng Hải An", scope:"PORT_OPERATIONS" as const,
      period:"2024", periodOrder:"2024-12-31", unit:"TEU" as const, value:549229,
      kind:"ACTUAL" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"HAH – Báo cáo HĐQT trình ĐHĐCĐ 2025",
      sourceUrl:"https://haiants.vn/files/Quan_he_co_dong/Tai-lieu-co-dong/2025/up-date-12-06/4-Bao-cao-Hoi-dong-quan-tri.pdf",
      sourceDate:"2025-06-12",
      note:"Chỉ tiêu 'Khai thác cảng' 2024, tách khỏi vận tải container và depot."
    },
    {
      id:"HAH-PORT-2025-TARGET", companySymbol:"HAH", assetCode:"HAI_AN",
      assetLabel:"Khai thác cảng Hải An", scope:"PORT_OPERATIONS" as const,
      period:"2025 target", periodOrder:"2025-12-31", unit:"TEU" as const, value:588000,
      kind:"TARGET" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"HAH – Nghị quyết/biên bản ĐHĐCĐ 2025",
      sourceUrl:"https://haiants.vn/files/Quan_he_co_dong/Tai-lieu-co-dong/12-Draft-Minutes-and-Resolution-the-2025-General-Meeting-of-Shareholders.pdf",
      sourceDate:"2025-06-26",
      note:"Kế hoạch khai thác cảng 2025 = 588.000 TEU; không hiển thị như actual."
    },
    {
      id:"GMD-9M-2025-ACTUAL", companySymbol:"GMD", assetCode:"GMD_PORT_SYSTEM",
      assetLabel:"Hệ thống cảng Gemadept", scope:"COMPANY_SYSTEM" as const,
      period:"9M 2025", periodOrder:"2025-09-30", unit:"TEU" as const, value:3700000,
      kind:"ACTUAL" as const, yoyPct:16, yoyKind:"REPORTED" as const,
      sourceLabel:"Gemadept – Top 10 Logistics 2025",
      sourceUrl:"https://www.gemadept.com.vn/gemadept-4-don-vi-dong-loat-vao-top-10-cong-ty-uy-tin-ngang-logistics-2025/",
      sourceDate:"2025-12-15",
      note:"Tổng sản lượng thông qua hệ thống cảng Gemadept 9M/2025 = 3,7 triệu TEU, +16%."
    },
    {
      id:"GMD-2025-ACTUAL", companySymbol:"GMD", assetCode:"GMD_PORT_SYSTEM",
      assetLabel:"Hệ thống cảng Gemadept", scope:"COMPANY_SYSTEM" as const,
      period:"2025", periodOrder:"2025-12-31", unit:"TEU" as const, value:5000000,
      kind:"ACTUAL" as const, yoyPct:15, yoyKind:"REPORTED" as const,
      sourceLabel:"Cảng Nam Đình Vũ / Gemadept – tổng kết 2025",
      sourceUrl:"https://ndv.gemadept.com.vn/tap-doan-gemadept-va-hanh-trinh-kien-tao-ky-nguyen-hang-hai-moi/",
      sourceDate:"2026-05-15",
      note:"Nguồn ghi sản lượng năm 2025 'vượt ngưỡng 5 triệu TEU'. V8.13 lưu 5.000.000 như ngưỡng tối thiểu hiển thị; không dùng để tính utilization."
    },
    {
      id:"DXP-2023-ACTUAL", companySymbol:"DXP", assetCode:"DOAN_XA",
      assetLabel:"Cảng Đoạn Xá", scope:"TERMINAL" as const,
      period:"2023", periodOrder:"2023-12-31", unit:"TONS" as const, value:1200760,
      kind:"ACTUAL" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"DXP – Tài liệu ĐHĐCĐ 2024",
      sourceUrl:"https://doanxaport.com.vn/upload/upload-old/uploads/Ch%C6%B0%C6%A1ng-tr%C3%ACnh-%C4%90%E1%BA%A1i-h%E1%BB%99i-%C4%91%E1%BB%93ng-c%E1%BB%95-%C4%91%C3%B4ng-C%C3%B4ng-ty-CP-C%E1%BA%A3ng-%C4%90o%E1%BA%A1n-X%C3%A1-n%C4%83m-2024_compressed.pdf",
      sourceDate:"2024-04-25",
      note:"DXP công bố sản lượng hàng hóa thông qua cảng 2023 theo TẤN, không quy đổi sang TEU."
    },
    {
      id:"DXP-2024-TARGET", companySymbol:"DXP", assetCode:"DOAN_XA",
      assetLabel:"Cảng Đoạn Xá", scope:"TERMINAL" as const,
      period:"2024 target", periodOrder:"2024-12-31", unit:"TONS" as const, value:1133947,
      kind:"TARGET" as const, yoyPct:null, yoyKind:"UNAVAILABLE" as const,
      sourceLabel:"DXP – Nghị quyết ĐHĐCĐ 2024",
      sourceUrl:"https://doanxaport.com.vn/Upload/file/nghi-quyet-dai-hoi-dong-co-dong-nam-2024.pdf",
      sourceDate:"2024-04-25",
      note:"Kế hoạch sản lượng hàng hóa qua cảng 2024, đơn vị TẤN; giữ nguyên đơn vị."
    }
  ];

  const capacityTimeline = [
    {
      id:"HTIT-11M", companySymbol:"PHP", assetCode:"HTIT", assetLabel:"HTIT · Lạch Huyện 3–4",
      effectiveFrom:"2025", effectiveTo:null, capacityTeu:1100000, comparator:"EQ" as const,
      capacityKind:"DESIGN" as const,
      sourceLabel:"Cảng Hải Phòng – hoàn thành Bến 3,4 Lạch Huyện",
      sourceUrl:"https://haiphongport.com.vn/vi/tin-tuc/cang-hai-phong-gan-bien-hoan-thanh-hai-cau-cang-so-34-cang-cua-ngo-quoc-te-hai-phong-tai-lach-huyen.html",
      sourceDate:"2025-05-13",
      note:"Thiết kế đáp ứng sản lượng 1,1 triệu TEU/năm."
    },
    {
      id:"NDV-P12", companySymbol:"GMD", assetCode:"NAM_DINH_VU", assetLabel:"Nam Đình Vũ · GĐ1+2",
      effectiveFrom:null, effectiveTo:"2025-09-29", capacityTeu:1200000, comparator:"EQ" as const,
      capacityKind:"DESIGN" as const,
      sourceLabel:"Nam Đình Vũ – Trang thiết bị Giai đoạn 1 & 2",
      sourceUrl:"https://ndv.gemadept.com.vn/gioi-thieu/trang-thiet-bi/",
      sourceDate:"2025-05-01",
      note:"Công suất thiết kế GĐ1+2 = 1,2 triệu TEU/năm."
    },
    {
      id:"NDV-P123", companySymbol:"GMD", assetCode:"NAM_DINH_VU", assetLabel:"Nam Đình Vũ · sau GĐ3",
      effectiveFrom:"2025-09-30", effectiveTo:null, capacityTeu:2000000, comparator:"GT" as const,
      capacityKind:"DISCLOSED_OPERATING_CAPACITY" as const,
      sourceLabel:"Gemadept – GĐ3 Nam Đình Vũ đi vào hoạt động",
      sourceUrl:"https://www.gemadept.com.vn/gemadept-chinh-thuc-dua-giai-doan-3-cum-cang-nam-dinh-vu-vao-hoat-dong/",
      sourceDate:"2025-10-07",
      note:"Nguồn corporate ghi GĐ3 bổ sung khoảng 650.000 TEU/năm và đưa tổng công suất lên HƠN 2 triệu TEU/năm. App dùng comparator '>'."
    },
    {
      id:"DVP-CAP", companySymbol:"DVP", assetCode:"DINH_VU", assetLabel:"Cảng Đình Vũ",
      effectiveFrom:null, effectiveTo:null, capacityTeu:600000, comparator:"GT" as const,
      capacityKind:"DISCLOSED_OPERATING_CAPACITY" as const,
      sourceLabel:"DVP – website chính thức",
      sourceUrl:"https://www.dinhvuport.com.vn/",
      sourceDate:"2026-09-08",
      note:"Website mô tả năng suất xếp dỡ 'trên 600.000 TEU/năm'; không coi 600.000 là design capacity chính xác."
    }
  ];

  const actualPointCount = throughput.filter(x=>x.kind==="ACTUAL").length;
  const estimatePointCount = throughput.filter(x=>x.kind==="ESTIMATE").length;
  const targetPointCount = throughput.filter(x=>x.kind==="TARGET").length;

  return {
    throughput,
    capacityTimeline,
    coverage:{
      companies:Array.from(new Set(throughput.map(x=>x.companySymbol))).sort(),
      actualPointCount,
      estimatePointCount,
      targetPointCount,
      capacityPointCount:capacityTimeline.length
    },
    methodology:[
      "Mỗi điểm giữ nguyên scope (company system / port operations / terminal), kỳ và đơn vị từ nguồn chính thức.",
      "ACTUAL, ESTIMATE và TARGET không được nối thành một chuỗi actual giả.",
      "TEU và TONS không quy đổi qua lại.",
      "YoY chỉ dùng số nguồn công bố hoặc phép tính trên hai actual point cùng scope; V8.13 ưu tiên YoY nguồn công bố.",
      "Capacity timeline có effective date/comparator; dấu '>' được giữ khi nguồn chỉ nói 'hơn'."
    ],
    limitations:[
      "Chưa có official/free feed terminal-level actual TEU đồng nhất cho VSC, Nam Đình Vũ, DXP và toàn bộ terminal Hải Phòng.",
      "Gemadept công bố actual hệ thống cảng, không đồng nghĩa actual riêng Nam Đình Vũ.",
      "DVP công bố capacity theo mô tả 'trên 600.000 TEU/năm', nên không tự tính utilization chính xác.",
      "DXP dùng tấn cho sản lượng hàng hóa qua cảng; không đổi sang TEU.",
      "Capacity Nam Đình Vũ có nhiều cách diễn đạt trong nguồn chính thức; V8.13 lưu 1,2m trước GĐ3 và '>2m' sau 30/09/2025 theo disclosure corporate, không tự cộng thành 2,2m."
    ],
    serverTime:new Date().toISOString()
  };
}
