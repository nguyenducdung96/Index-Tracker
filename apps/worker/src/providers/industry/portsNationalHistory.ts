import * as XLSX from "xlsx";
import * as cheerio from "cheerio";

const STATS_URL = "https://vimawa.gov.vn/vi/thong-ke";
const QN_URL = "https://kht1.cangvuhanghaiquangninh.gov.vn/";
const QNHON_URL = "https://cangvuhanghaiquynhon.gov.vn/index.aspx?cat=2014&page=news";
const UA = { "user-agent": "MarketTracker/8.18.2 (+official-source-reader)" };
const PARSER_VERSION = "v8.18.2-merged-header-semantic-1";

const abs = (href: string, base: string) => new URL(href, base).toString();
const txt = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();
const norm = (v: unknown) => txt(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
const n = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v !== "string") return null;
  const raw = v.trim();
  if (!raw || /^[-–—]$/.test(raw)) return null;
  const cleaned = raw.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const x = Number(cleaned);
  return Number.isFinite(x) ? x : null;
};

function periodFromTitle(s: string) {
  const z = norm(s);
  const m = z.match(/(?:den\s*)?thang\s*(\d{1,2}).*?(20\d{2})/i);
  return m ? `${m[2]}-${m[1].padStart(2, "0")}` : null;
}
function periodParts(period: string) {
  const [ys, ms] = period.split("-");
  const year = Number(ys), month = Number(ms);
  return Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12 ? { year, month } : null;
}
function safeListingDate(s: string) {
  const m = txt(s).match(/\b(\d{2}\/\d{2}\/20\d{2})\b/);
  return m ? m[1] : null;
}

export type VimawaReport = { title: string; period: string | null; publishedDate: string | null; pageUrl: string; xlsxUrl: string | null };

export async function discoverVimawaReports(limit = 36): Promise<VimawaReport[]> {
  const r = await fetch(STATS_URL, { headers: UA });
  if (!r.ok) throw new Error(`VIMAWA stats HTTP ${r.status}`);
  const $ = cheerio.load(await r.text());
  const out: VimawaReport[] = [];

  $("tr").each((_, tr) => {
    const a = $(tr).find("a").filter((__, el) => /hàng hóa thông qua cảng|khối lượng hàng hóa thông qua cảng biển/i.test(txt($(el).text()))).first();
    if (!a.length) return;
    const title = txt(a.text());
    const href = a.attr("href");
    if (!href) return;
    const cells = $(tr).find("td").map((__, td) => txt($(td).text())).get();
    const publishedDate = cells.map(safeListingDate).find(Boolean) ?? null;
    out.push({ title, period: periodFromTitle(title), publishedDate, pageUrl: abs(href, STATS_URL), xlsxUrl: null });
  });

  if (!out.length) {
    $("a").each((_, a) => {
      const title = txt($(a).text());
      if (!/hàng hóa thông qua cảng|khối lượng hàng hóa thông qua cảng biển/i.test(title)) return;
      const href = $(a).attr("href");
      if (!href) return;
      out.push({ title, period: periodFromTitle(title), publishedDate: null, pageUrl: abs(href, STATS_URL), xlsxUrl: null });
    });
  }

  const uniq = [...new Map(out.map(x => [x.pageUrl, x])).values()].slice(0, limit);
  for (const item of uniq) {
    try {
      const p = await fetch(item.pageUrl, { headers: UA });
      if (!p.ok) continue;
      const $$ = cheerio.load(await p.text());
      const link = $$("a[href$='.xlsx'],a[href*='.xlsx?']").first().attr("href");
      if (link) item.xlsxUrl = abs(link, item.pageUrl);
    } catch { /* preserve discovered report */ }
  }
  return uniq;
}

export type NationalDashboardMetric = "TOTAL" | "EXPORT" | "IMPORT" | "DOMESTIC" | "TRANSIT" | "CONTAINER";
export type NationalDashboardPoint = {
  period: string; year: number; month: number; periodType: "YTD"; comparisonKey: string; metric: NationalDashboardMetric;
  label: string; unit: string | null; ytd: number | null; priorYtd: number | null; yoyPct: number | null;
  sourceUrl: string; publishedDate: string | null; status: "OFFICIAL"; sheet: string; parserVersion?: string;
};
export type NationalTrendPoint = {
  period: string; year: number; month: number; monthLabel: string; metric: NationalDashboardMetric; unit: string | null;
  ytd: number | null; priorYtd: number | null; ytdYoyPct: number | null;
  monthly: number | null; priorYearMonthly: number | null; monthlyYoyPct: number | null;
  monthlyStatus: "DERIVED_FROM_OFFICIAL_YTD" | "UNAVAILABLE";
  sourceUrl: string; publishedDate: string | null;
};

type Candidate = NationalDashboardPoint & { score: number; headerEvidence: string };

function metricOf(label: string): NationalDashboardMetric | null {
  const z = norm(label).replace(/^\d+[.)\-\s]*/, "").trim();
  if (/^container\b/.test(z)) return "CONTAINER";
  if (/^(hang\s+)?xuat khau\b/.test(z)) return "EXPORT";
  if (/^(hang\s+)?nhap khau\b/.test(z)) return "IMPORT";
  if (/^(hang\s+)?noi dia\b/.test(z)) return "DOMESTIC";
  if (/^(hang\s+)?qua canh\b/.test(z) && !/boc do|khong boc do/.test(z)) return "TRANSIT";
  if (/^tong so\b|^tong cong\b|^tong hang hoa\b|^hang hoa thong qua cang\b/.test(z)) return "TOTAL";
  return null;
}

function sheetScopeScore(name: string) {
  const z = norm(name);
  if (/duong thuy|dtnd|noi dia/.test(z) && !/hang hai|cang bien/.test(z)) return -120;
  if (/hang hai|cang bien|maritime/.test(z)) return 120;
  return 0;
}
function sectionScopeScore(rows: any[][], rowIndex: number) {
  const from = Math.max(0, rowIndex - 20);
  let score = 0;
  for (let r = from; r <= rowIndex; r++) {
    const z = norm((rows[r] ?? []).map(txt).filter(Boolean).join(" "));
    if (/hang hai|cang bien|maritime/.test(z)) score = Math.max(score, 90);
    if (/duong thuy|dtnd|duong thuy noi dia/.test(z) && !/hang hai|cang bien/.test(z)) score = Math.min(score, -90);
  }
  return score;
}
function rowScore(label: string, sheet: string, sectionScore: number) {
  const z = norm(label).replace(/^\d+[.)\-\s]*/, "").trim();
  let score = sheetScopeScore(sheet) + sectionScore;
  if (/^(tong so|tong cong|tong hang hoa|hang hoa thong qua cang|container|hang xuat khau|xuat khau|hang nhap khau|nhap khau|hang noi dia|noi dia|hang qua canh|qua canh)$/.test(z)) score += 60;
  if (z.length < 40) score += 10;
  if (/boc do|khong boc do|ke hoach|du kien|uoc tinh/.test(z)) score -= 100;
  return score;
}

function expandMergedRows(sheet: XLSX.WorkSheet): any[][] {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1");
  const rows: any[][] = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: any[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })];
      row[c] = cell ? cell.v : null;
    }
    rows[r] = row;
  }
  for (const merge of sheet["!merges"] ?? []) {
    const anchor = rows[merge.s.r]?.[merge.s.c] ?? null;
    if (anchor == null || txt(anchor) === "") continue;
    for (let r = merge.s.r; r <= merge.e.r; r++) {
      rows[r] = rows[r] ?? [];
      for (let c = merge.s.c; c <= merge.e.c; c++) if (rows[r][c] == null || txt(rows[r][c]) === "") rows[r][c] = anchor;
    }
  }
  return rows;
}

function headerForColumn(rows: any[][], dataRow: number, col: number) {
  const start = Math.max(0, dataRow - 14);
  const parts: string[] = [];
  for (let r = start; r < dataRow; r++) {
    const v = txt(rows[r]?.[col]);
    if (v && !parts.includes(v)) parts.push(v);
  }
  return parts.join(" | ");
}
function headerRole(header: string): "YTD" | "PRIOR_YTD" | "YOY" | null {
  const z = norm(header);
  if (!z) return null;
  if ((/so sanh|ty le|%/.test(z)) && /cung ky|nam truoc|4\/5|5\/6/.test(z)) return "YOY";
  if (/cung ky|nam truoc/.test(z) && (/luy ke|dau nam|het thang|thang bao cao/.test(z))) return "PRIOR_YTD";
  if (/luy ke|dau nam|het thang|thang bao cao/.test(z) && !/cung ky|nam truoc/.test(z)) return "YTD";
  return null;
}
function detectColumns(rows: any[][], dataRow: number) {
  const width = Math.max(...rows.slice(Math.max(0, dataRow - 14), dataRow + 1).map(r => r?.length ?? 0), 0);
  let ytd = -1, prior = -1, yoy = -1;
  const evidence: string[] = [];
  for (let c = 0; c < width; c++) {
    const h = headerForColumn(rows, dataRow, c);
    const role = headerRole(h);
    if (!role) continue;
    evidence.push(`${c}:${role}:${h}`);
    if (role === "YTD" && ytd < 0) ytd = c;
    if (role === "PRIOR_YTD" && prior < 0) prior = c;
    if (role === "YOY" && yoy < 0) yoy = c;
  }
  return { ytd, prior, yoy, evidence: evidence.join(" || ") };
}
function normalizeYoY(raw: number | null, current: number | null, prior: number | null) {
  if (current != null && prior != null && prior !== 0) return (current / prior - 1) * 100;
  if (raw == null) return null;
  if (raw > 0 && raw < 3) return (raw - 1) * 100;
  if (raw > 50 && raw < 200) return raw - 100;
  return raw;
}
function unitNear(rows: any[][], rowIndex: number, labelIndex: number): string | null {
  for (let c = labelIndex + 1; c < Math.min((rows[rowIndex]?.length ?? 0), labelIndex + 4); c++) {
    const s = txt(rows[rowIndex]?.[c]);
    if (s && !/^\d/.test(s) && n(s) == null) return s;
  }
  const around = [rowIndex - 1, rowIndex - 2, rowIndex - 3].filter(x => x >= 0);
  for (const r of around) {
    const z = txt(rows[r]?.find((v: unknown) => /don vi|đơn vị|1000|nghin|nghìn|teu|tan|tấn/i.test(txt(v))));
    if (z) return z;
  }
  return null;
}

function normalizedWorkbook(buf: ArrayBuffer, report: VimawaReport): { points: NationalDashboardPoint[]; diagnostics: any } {
  const wb = XLSX.read(buf, { type: "array" });
  const pp = report.period ? periodParts(report.period) : null;
  if (!pp) return { points: [], diagnostics: { sheets: wb.SheetNames, reason: "INVALID_PERIOD" } };
  const candidates: Candidate[] = [];
  const sheetDiagnostics: any[] = [];

  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = expandMergedRows(sheet);
    let metricRows = 0, mappedRows = 0;
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri] ?? [];
      let labelIndex = -1;
      let metric: NationalDashboardMetric | null = null;
      for (let ci = 0; ci < row.length; ci++) {
        const m = metricOf(txt(row[ci]));
        if (m) { metric = m; labelIndex = ci; break; }
      }
      if (!metric || labelIndex < 0) continue;
      metricRows++;
      const cols = detectColumns(rows, ri);
      if (cols.ytd < 0 || cols.prior < 0) continue;
      const ytd = n(row[cols.ytd]);
      const prior = n(row[cols.prior]);
      if (ytd == null && prior == null) continue;
      const rawYoy = cols.yoy >= 0 ? n(row[cols.yoy]) : null;
      const label = txt(row[labelIndex]);
      const sectionScore = sectionScopeScore(rows, ri);
      const score = rowScore(label, name, sectionScore);
      candidates.push({
        period: report.period!, year: pp.year, month: pp.month, periodType: "YTD", comparisonKey: `YTD-${String(pp.month).padStart(2, "0")}`,
        metric, label, unit: unitNear(rows, ri, labelIndex), ytd, priorYtd: prior, yoyPct: normalizeYoY(rawYoy, ytd, prior),
        sourceUrl: report.pageUrl, publishedDate: report.publishedDate, status: "OFFICIAL", sheet: name, parserVersion: PARSER_VERSION,
        score, headerEvidence: cols.evidence
      });
      mappedRows++;
    }
    sheetDiagnostics.push({ name, scopeScore: sheetScopeScore(name), metricRows, mappedRows });
  }

  const out: NationalDashboardPoint[] = [];
  const ambiguities: any[] = [];
  for (const metric of ["TOTAL", "EXPORT", "IMPORT", "DOMESTIC", "TRANSIT", "CONTAINER"] as NationalDashboardMetric[]) {
    const xs = candidates.filter(x => x.metric === metric && x.score > -100).sort((a, b) => b.score - a.score);
    if (!xs.length) continue;
    const top = xs[0];
    const tied = xs.filter(x => x.score === top.score && x.ytd != null);
    if (tied.length > 1) {
      const vals = tied.map(x => x.ytd as number).filter(Number.isFinite);
      if (vals.length > 1) {
        const min = Math.min(...vals), max = Math.max(...vals);
        if (min > 0 && max / min > 1.01) {
          ambiguities.push({ metric, reason: "EQUAL_SCORE_CONFLICT", candidates: tied.map(x => ({ sheet: x.sheet, label: x.label, ytd: x.ytd, score: x.score })) });
          continue;
        }
      }
    }
    const { score: _score, headerEvidence: _evidence, ...clean } = top;
    out.push(clean);
  }
  return { points: out, diagnostics: { parserVersion: PARSER_VERSION, sheets: sheetDiagnostics, ambiguities, candidateCount: candidates.length } };
}

function buildTrend(points: NationalDashboardPoint[]) {
  const byKey = new Map(points.map(p => [`${p.year}-${String(p.month).padStart(2, "0")}:${p.metric}`, p]));
  const trend: NationalTrendPoint[] = [];
  for (const p of points) {
    let monthly: number | null = null, priorMonthly: number | null = null;
    let monthlyStatus: NationalTrendPoint["monthlyStatus"] = "UNAVAILABLE";
    if (p.month === 1) {
      monthly = p.ytd; priorMonthly = p.priorYtd;
      if (monthly != null) monthlyStatus = "DERIVED_FROM_OFFICIAL_YTD";
    } else {
      const prev = byKey.get(`${p.year}-${String(p.month - 1).padStart(2, "0")}:${p.metric}`);
      if (prev && prev.unit === p.unit && p.ytd != null && prev.ytd != null && p.ytd >= prev.ytd) {
        monthly = p.ytd - prev.ytd; monthlyStatus = "DERIVED_FROM_OFFICIAL_YTD";
      }
      if (prev && prev.unit === p.unit && p.priorYtd != null && prev.priorYtd != null && p.priorYtd >= prev.priorYtd) priorMonthly = p.priorYtd - prev.priorYtd;
    }
    const monthlyYoyPct = monthly != null && priorMonthly != null && priorMonthly !== 0 ? (monthly / priorMonthly - 1) * 100 : null;
    trend.push({ period: p.period, year: p.year, month: p.month, monthLabel: `T${p.month}`, metric: p.metric, unit: p.unit, ytd: p.ytd, priorYtd: p.priorYtd, ytdYoyPct: p.yoyPct, monthly, priorYearMonthly: priorMonthly, monthlyYoyPct, monthlyStatus, sourceUrl: p.sourceUrl, publishedDate: p.publishedDate });
  }
  return trend.sort((a, b) => a.period.localeCompare(b.period));
}

function dashboardFromPoints(points: NationalDashboardPoint[], reports: VimawaReport[], sourceMode: "LIVE" | "D1", diagnostics: any[] = []) {
  points.sort((a, b) => a.period.localeCompare(b.period));
  const periods = [...new Set(points.map(x => x.period))];
  const latestPeriod = periods.length ? periods[periods.length - 1] : (reports.find(x => x.period)?.period ?? null);
  const latest = latestPeriod ? points.filter(x => x.period === latestPeriod) : [];
  const trendPoints = buildTrend(points);
  const years = [...new Set(trendPoints.map(x => x.year))].sort((a, b) => a - b);
  return {
    provider: "VIMAWA", sourceKind: "OFFICIAL_GOV", sourceUrl: STATS_URL, sourceMode,
    status: points.length ? "NORMALIZED" : "PARTIAL", latestPeriod, latest, series: points,
    trend: { availableYears: years, latestYear: years.length ? years[years.length - 1] : null, points: trendPoints, note: "Monthly = official YTD(month) - official YTD(previous month), only when consecutive reports use the same metric/unit. Missing months remain unavailable." },
    reports: reports.map(x => ({ title: x.title, period: x.period, publishedDate: x.publishedDate, pageUrl: x.pageUrl, xlsxUrl: x.xlsxUrl })),
    parserVersion: PARSER_VERSION, diagnostics,
    note: points.length ? "V8.18.2 reconstructs merged/multi-row workbook headers before semantic column mapping. Ambiguous equal-score national rows are suppressed rather than guessed." : "Official reports were discovered, but no national maritime rows passed merged-header and scope validation. Missing values are shown instead of fallback numbers.",
    serverTime: new Date().toISOString()
  };
}

async function readPersistedPoints(db: D1Database): Promise<NationalDashboardPoint[]> {
  try {
    const r = await db.prepare(`SELECT period,metric,label,unit,ytd_value,prior_ytd_value,yoy_pct,source_url,published_date,parser_version FROM port_national_statistics ORDER BY period ASC`).all<any>();
    const out: NationalDashboardPoint[] = [];
    for (const x of r.results ?? []) {
      const pp = periodParts(String(x.period));
      if (!pp) continue;
      out.push({ period: String(x.period), year: pp.year, month: pp.month, periodType: "YTD", comparisonKey: `YTD-${String(pp.month).padStart(2, "0")}`, metric: x.metric as NationalDashboardMetric, label: String(x.label), unit: x.unit ?? null, ytd: x.ytd_value ?? null, priorYtd: x.prior_ytd_value ?? null, yoyPct: x.yoy_pct ?? null, sourceUrl: String(x.source_url), publishedDate: x.published_date ?? null, status: "OFFICIAL", sheet: "D1", parserVersion: x.parser_version ?? PARSER_VERSION });
    }
    return out;
  } catch { return []; }
}

async function persistReports(db: D1Database, reports: VimawaReport[]) {
  for (const r of reports) {
    try {
      await db.prepare(`INSERT INTO port_national_report_registry(period,title,page_url,xlsx_url,published_date,parser_version,discovered_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(page_url) DO UPDATE SET period=excluded.period,title=excluded.title,xlsx_url=excluded.xlsx_url,published_date=excluded.published_date,parser_version=excluded.parser_version,discovered_at=CURRENT_TIMESTAMP`).bind(r.period, r.title, r.pageUrl, r.xlsxUrl, r.publishedDate, PARSER_VERSION).run();
    } catch { /* migration may not exist yet */ }
  }
}
async function persistPoints(db: D1Database, points: NationalDashboardPoint[]) {
  for (const p of points) {
    await db.prepare(`INSERT INTO port_national_statistics(period,metric,label,unit,ytd_value,prior_ytd_value,yoy_pct,data_status,source_url,published_date,parser_version,retrieved_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(period,metric,source_url) DO UPDATE SET label=excluded.label,unit=excluded.unit,ytd_value=excluded.ytd_value,prior_ytd_value=excluded.prior_ytd_value,yoy_pct=excluded.yoy_pct,data_status=excluded.data_status,published_date=excluded.published_date,parser_version=excluded.parser_version,retrieved_at=CURRENT_TIMESTAMP`).bind(p.period, p.metric, p.label, p.unit, p.ytd, p.priorYtd, p.yoyPct, p.status, p.sourceUrl, p.publishedDate, PARSER_VERSION).run();
  }
}
export async function ingestNationalPortStats(db: D1Database, limit = 36) {
  const reports = await discoverVimawaReports(limit);
  const points: NationalDashboardPoint[] = [];
  const diagnostics: any[] = [];
  for (const report of reports) {
    if (!report.xlsxUrl || !report.period) continue;
    try {
      const r = await fetch(report.xlsxUrl, { headers: UA });
      if (!r.ok) { diagnostics.push({ period: report.period, error: `XLSX HTTP ${r.status}` }); continue; }
      const parsed = normalizedWorkbook(await r.arrayBuffer(), report);
      points.push(...parsed.points); diagnostics.push({ period: report.period, ...parsed.diagnostics });
    } catch (e) { diagnostics.push({ period: report.period, error: e instanceof Error ? e.message : String(e) }); }
  }
  await persistReports(db, reports);
  if (points.length) await persistPoints(db, points);
  try {
    await db.prepare(`INSERT INTO port_source_health(source_id,status,latest_period,last_success,last_checked,note) VALUES('vimawa',?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET status=excluded.status,latest_period=excluded.latest_period,last_success=excluded.last_success,last_checked=excluded.last_checked,note=excluded.note`).bind(points.length ? "OK" : "PARTIAL", points.length ? points[points.length - 1].period : (reports.find(x => x.period)?.period ?? null), points.length ? new Date().toISOString() : null, new Date().toISOString(), `parser=${PARSER_VERSION}; normalized=${points.length}`).run();
  } catch { /* migration may not exist */ }
  return { reports, points, diagnostics, parserVersion: PARSER_VERSION, normalizedCount: points.length };
}

export async function getNationalPortDashboard(db?: D1Database, limit = 36) {
  if (db) {
    const stored = await readPersistedPoints(db);
    if (stored.length) {
      let reports: VimawaReport[] = [];
      try { reports = await discoverVimawaReports(8); } catch { /* D1 still serves dashboard */ }
      return dashboardFromPoints(stored, reports, "D1");
    }
  }
  const reports = await discoverVimawaReports(limit);
  const points: NationalDashboardPoint[] = [];
  const diagnostics: any[] = [];
  for (const report of reports) {
    if (!report.xlsxUrl || !report.period) continue;
    try {
      const r = await fetch(report.xlsxUrl, { headers: UA });
      if (!r.ok) { diagnostics.push({ period: report.period, error: `XLSX HTTP ${r.status}` }); continue; }
      const parsed = normalizedWorkbook(await r.arrayBuffer(), report);
      points.push(...parsed.points); diagnostics.push({ period: report.period, ...parsed.diagnostics });
    } catch (e) { diagnostics.push({ period: report.period, error: e instanceof Error ? e.message : String(e) }); }
  }
  if (db && points.length) {
    try { await persistReports(db, reports); await persistPoints(db, points); } catch { /* live response still valid */ }
  }
  return dashboardFromPoints(points, reports, "LIVE", diagnostics);
}

export async function fetchVimawaHistorical(limit = 24) {
  const reports = await discoverVimawaReports(limit);
  const points: any[] = [];
  for (const report of reports) {
    if (!report.xlsxUrl || !report.period) continue;
    try {
      const r = await fetch(report.xlsxUrl, { headers: UA });
      if (!r.ok) continue;
      const parsed = normalizedWorkbook(await r.arrayBuffer(), report);
      for (const p of parsed.points) points.push(p);
    } catch { /* raw discovery still returned */ }
  }
  return { provider: "VIMAWA", status: points.length ? "NORMALIZED" : "PARTIAL", reports, points, parserVersion: PARSER_VERSION, note: "V8.18.2 returns only rows that pass merged-header, maritime-scope and ambiguity validation.", serverTime: new Date().toISOString() };
}

export async function getQuangNinhMovements(){try{const r=await fetch(QN_URL,{headers:UA});if(!r.ok)throw new Error(`HTTP ${r.status}`);const $=cheerio.load(await r.text());const rows:any[]=[];$("tr").each((_,tr)=>{const c=$(tr).find("td").map((__,td)=>txt($(td).text())).get();if(c.length<7)return;const joined=c.join(" ");if(!/\d/.test(joined))return;const dwt=c.map(n).find(x=>x!==null&&x>1000)??null;rows.push({cells:c,dwt});});return {source:"Cảng vụ Hàng hải Quảng Ninh",sourceUrl:QN_URL,status:rows.length?"LIVE_PARSED":"PARTIAL",rows,serverTime:new Date().toISOString(),note:"Official movement-plan rows. Raw cells retained; terminal-field normalization is intentionally conservative."};}catch(e){return {source:"Cảng vụ Hàng hải Quảng Ninh",sourceUrl:QN_URL,status:"SOURCE_UNAVAILABLE",rows:[],serverTime:new Date().toISOString(),note:e instanceof Error?e.message:String(e)}}}
export async function getQuyNhonStatus(){try{const r=await fetch(QNHON_URL,{headers:UA});if(!r.ok)throw new Error(`HTTP ${r.status}`);const $=cheerio.load(await r.text());const reports:string[]=[];$("a").each((_,a)=>{const t=txt($(a).text());if(/KẾ HOẠCH ĐIỀU ĐỘNG TÀU NGÀY/i.test(t))reports.push(t)});return {source:"Cảng vụ Hàng hải Quy Nhơn",sourceUrl:QNHON_URL,status:reports.length?"PARTIAL":"SOURCE_UNAVAILABLE",reportCount:reports.length,reports:reports.slice(0,20),note:"Archive discovery only. Detail rows are image-based on sampled reports, so V8.17 does not OCR them into official structured data.",serverTime:new Date().toISOString()};}catch(e){return {source:"Cảng vụ Hàng hải Quy Nhơn",sourceUrl:QNHON_URL,status:"SOURCE_UNAVAILABLE",reportCount:0,reports:[],note:e instanceof Error?e.message:String(e),serverTime:new Date().toISOString()}}}
export async function getPortSourceHealth(){const settled=await Promise.allSettled([discoverVimawaReports(3),getQuangNinhMovements(),getQuyNhonStatus()]);return {data:{vimawa:{status:settled[0].status==="fulfilled"&&settled[0].value.length?"OK":"ERROR",latestPeriod:settled[0].status==="fulfilled"?settled[0].value[0]?.period:null},quangninh:{status:settled[1].status==="fulfilled"?settled[1].value.status:"ERROR"},quynhon:{status:settled[2].status==="fulfilled"?settled[2].value.status:"ERROR"}},serverTime:new Date().toISOString()};}
