import * as cheerio from "cheerio";
import type {
  PortDailyStat,
  PortHarborSummary,
  PortMonthlyStat,
  PortRouteStat,
  PortShipCall,
  PortTerminalAnalytics,
  PortTerminalCapability,
  PortCompanyIntelligence
} from "../../types.js";

const SOURCE_BASE = "https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx";
const SOURCE_HOME = "https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx?d=0";
const CAPABILITY_SOURCE = "https://cangvuhaiphong.gov.vn/thong-tin-cau-cang/";
const SOURCE_TYPE = "PORT_AUTHORITY_MOVEMENT_PLAN" as const;

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

export async function backfillHaiphongChunk(db: D1Database, days = 14) {
  await ensurePortSchema(db);
  const state = await db.prepare("SELECT value FROM app_state WHERE key='ports_backfill_cursor'").first<{value:string}>();
  const cursor = Number(state?.value ?? -14);
  const offsets = Array.from({length:days},(_,i)=>cursor-i);
  const result = await ingestHaiphongOffsets(db, offsets);
  const next = cursor - days;
  await db.prepare(`INSERT INTO app_state(key,value,updated_at) VALUES('ports_backfill_cursor',?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`)
    .bind(String(next),Date.now()).run();
  return { ...result, fromOffset:cursor, toOffset:next+1, nextOffset:next };
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


const COMPANY_INTELLIGENCE: Record<string, {name:string; terminals:Array<{code:string;ownershipPct:number|null;ownershipNote:string;capacityTeu:number|null;capacityTons:number|null;officialUrl:string;sourceLabel:string;sourceUrl:string;sourceAsOf:string}>}> = {
  PHP: { name:"Công ty Cổ phần Cảng Hải Phòng", terminals:[
    {code:"TAN_VU",ownershipPct:null,ownershipNote:"Đơn vị khai thác thuộc hệ thống Cảng Hải Phòng; V8.10 không suy tỷ lệ sở hữu khi nguồn chưa chuẩn hóa.",capacityTeu:null,capacityTons:null,officialUrl:"https://haiphongport.com.vn/",sourceLabel:"Cảng Hải Phòng",sourceUrl:"https://haiphongport.com.vn/",sourceAsOf:"2026-09-08"},
    {code:"CHUA_VE",ownershipPct:null,ownershipNote:"Đơn vị khai thác thuộc hệ thống Cảng Hải Phòng; không gán tỷ lệ giả định.",capacityTeu:null,capacityTons:null,officialUrl:"https://haiphongport.com.vn/",sourceLabel:"Cảng Hải Phòng",sourceUrl:"https://haiphongport.com.vn/",sourceAsOf:"2026-09-08"},
    {code:"HOANG_DIEU",ownershipPct:null,ownershipNote:"Theo dõi hoạt động trong hệ thống PHP; cần lưu ý thay đổi phạm vi khai thác theo thời gian.",capacityTeu:null,capacityTons:null,officialUrl:"https://haiphongport.com.vn/",sourceLabel:"Cảng Hải Phòng",sourceUrl:"https://haiphongport.com.vn/",sourceAsOf:"2026-09-08"},
    {code:"HTIT",ownershipPct:null,ownershipNote:"Liên doanh/đơn vị liên quan PHP; tỷ lệ sở hữu không hard-code trong V8.10 nếu chưa được registry hóa theo effective date.",capacityTeu:null,capacityTons:null,officialUrl:"https://haiphongport.com.vn/",sourceLabel:"Cảng Hải Phòng",sourceUrl:"https://haiphongport.com.vn/",sourceAsOf:"2026-09-08"}
  ]},
  GMD: { name:"Công ty Cổ phần Gemadept", terminals:[
    {code:"NAM_DINH_VU",ownershipPct:null,ownershipNote:"Cụm cảng Nam Đình Vũ thuộc hệ sinh thái cảng Gemadept; V8.10 không suy tỷ lệ sở hữu kinh tế từ tên thương mại.",capacityTeu:2000000,capacityTons:3000000,officialUrl:"https://ndv.gemadept.com.vn/",sourceLabel:"Gemadept – Cụm cảng Nam Đình Vũ",sourceUrl:"https://www.gemadept.com.vn/cum-cang-nam-dinh-vu/",sourceAsOf:"2026-09-08"}
  ]}
};

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
  return {symbol:code,name:cfg.name,days,terminals:cfg.terminals.map(x=>({...x,label:TERMINAL_LABELS[x.code]??x.code})),summary:{dwt:totalDwt,shipCalls:totalCalls,avgDwt:nullableNum(overall?.avg_dwt),maxDwt:nullableNum(overall?.max_dwt),terminalCount:terminals.length,capacityTeu},terminalStats:rows.map((x:any)=>{const c=cfg.terminals.find(t=>t.code===x.terminal);return{terminal:x.terminal,terminalLabel:TERMINAL_LABELS[x.terminal]??x.terminal,dwt:num(x.dwt),shipCalls:num(x.ship_calls),shareDwtPct:totalDwt>0?num(x.dwt)/totalDwt*100:0,capacityTeu:c?.capacityTeu??null,ownershipPct:c?.ownershipPct??null}}),monthly,routes:(routeRaw.results??[]).map((x:any)=>({route:x.route,dwt:num(x.dwt),shipCalls:num(x.ship_calls),shareDwtPct:totalDwt>0?num(x.dwt)/totalDwt*100:0})),caveats:["DWT là proxy quy mô tàu, không phải TEU hay sản lượng hàng thực tế.","Ship-call dùng ARRIVAL convention từ kế hoạch điều động; chưa mặc định là actual realized call.","Company aggregation chỉ gồm terminal đã được registry; không tự suy terminal chưa xác minh.","Ownership % để null khi chưa có nguồn/effective-date registry đủ chắc chắn."],serverTime:new Date().toISOString()};
}
