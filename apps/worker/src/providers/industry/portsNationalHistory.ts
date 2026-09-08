import * as XLSX from "xlsx";
import * as cheerio from "cheerio";

const STATS_URL="https://www.vimawa.gov.vn/vi/thong-ke";
const UA={"user-agent":"MarketTracker/8.18.3 (+official-source-reader)"};
const abs=(href:string,base:string)=>new URL(href,base).toString();
const txt=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
const norm=(v:unknown)=>txt(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
const num=(v:unknown):number|null=>{if(typeof v==="number"&&Number.isFinite(v))return v;if(typeof v!=="string"||!v.trim())return null;let s=v.trim().replace(/\s/g,"");if(/^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))s=s.replace(/\./g,"").replace(",",".");else if(/^[-+]?\d+(,\d+)?$/.test(s))s=s.replace(",",".");else s=s.replace(/[^0-9,.-]/g,"").replace(/,/g,".");const x=Number(s);return Number.isFinite(x)?x:null};
function periodFromTitle(s:string){const m=s.match(/(?:đến|tính đến)?\s*tháng\s*(\d{1,2}).*?(20\d{2})/i);return m?`${m[2]}-${m[1].padStart(2,"0")}`:null}
function listingDate(s:string){return txt(s).match(/\b(\d{2}\/\d{2}\/20\d{2})\b/)?.[1]??null}
export type VimawaReport={title:string;period:string|null;publishedDate:string|null;pageUrl:string;attachmentUrl:string|null;attachmentType:"XLSX"|"DOCX"|null};
export async function discoverVimawaReports(limit=40):Promise<VimawaReport[]>{
 const pages=[STATS_URL,`${STATS_URL}?field_pl_tk_tid=74&page=1`];const out:VimawaReport[]=[];
 for(const listing of pages){const r=await fetch(listing,{headers:UA});if(!r.ok)continue;const $=cheerio.load(await r.text());$("tr").each((_,tr)=>{const a=$(tr).find("a").filter((__,el)=>/hàng hóa thông qua cảng|khối lượng hàng hóa thông qua cảng biển/i.test(txt($(el).text()))).first();if(!a.length)return;const href=a.attr("href");if(!href)return;const title=txt(a.text());const cells=$(tr).find("td").map((__,td)=>txt($(td).text())).get();out.push({title,period:periodFromTitle(title),publishedDate:cells.map(listingDate).find(Boolean)??null,pageUrl:abs(href,listing),attachmentUrl:null,attachmentType:null});});}
 const uniq=[...new Map(out.map(x=>[x.pageUrl,x])).values()].sort((a,b)=>(b.period??"").localeCompare(a.period??"")).slice(0,limit);
 for(const item of uniq){try{const r=await fetch(item.pageUrl,{headers:UA});if(!r.ok)continue;const $=cheerio.load(await r.text());const a=$("a[href]").filter((_,el)=>/\.(xlsx|docx)(?:\?|$)/i.test($(el).attr("href")??"")).first();const href=a.attr("href");if(href){item.attachmentUrl=abs(href,item.pageUrl);item.attachmentType=/\.xlsx/i.test(href)?"XLSX":"DOCX";}}catch{}}
 return uniq;
}
export type NationalDashboardMetric="TOTAL"|"EXPORT"|"IMPORT"|"DOMESTIC"|"TRANSIT"|"CONTAINER";
export type NationalDashboardPoint={period:string;year:number;month:number;periodType:"YTD";comparisonKey:string;metric:NationalDashboardMetric;label:string;unit:string|null;ytd:number|null;priorYtd:number|null;yoyPct:number|null;sourceUrl:string;publishedDate:string|null;status:"OFFICIAL";sheet:string};
export type NationalTrendPoint={period:string;year:number;month:number;monthLabel:string;metric:NationalDashboardMetric;unit:string|null;ytd:number|null;priorYtd:number|null;ytdYoyPct:number|null;monthly:number|null;priorYearMonthly:number|null;monthlyYoyPct:number|null;monthlyStatus:"DERIVED_FROM_OFFICIAL_YTD"|"UNAVAILABLE";sourceUrl:string;publishedDate:string|null};
function metricOf(label:string):NationalDashboardMetric|null{const z=norm(label).replace(/^\d+[.)\-\s]*/,"").trim();if(/^container\b/.test(z))return"CONTAINER";if(/^hang xuat khau\b|^xuat khau\b/.test(z))return"EXPORT";if(/^hang nhap khau\b|^nhap khau\b/.test(z))return"IMPORT";if(/^hang noi dia\b|^noi dia\b/.test(z))return"DOMESTIC";if((/^hang qua canh\b|^qua canh\b/.test(z))&&!/boc do|khong boc do/.test(z))return"TRANSIT";if(/^tong so\b|^tong cong\b/.test(z))return"TOTAL";return null}
function parts(period:string){const [y,m]=period.split("-").map(Number);return Number.isInteger(y)&&m>=1&&m<=12?{year:y,month:m}:null}
function expandedGrid(ws:XLSX.WorkSheet){const rows:any[][]=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null});for(const merge of ws["!merges"]??[]){const v=rows[merge.s.r]?.[merge.s.c];for(let r=merge.s.r;r<=merge.e.r;r++){rows[r]??=[];for(let c=merge.s.c;c<=merge.e.c;c++)if(rows[r][c]==null||txt(rows[r][c])==="")rows[r][c]=v;}}return rows}
function headerContext(rows:any[][],col:number,row:number){const a:string[]=[];for(let r=Math.max(0,row-6);r<row;r++){const z=norm(rows[r]?.[col]);if(z&&!a.includes(z))a.push(z)}return a.join(" | ")}
function classifyColumn(ctx:string):"YTD"|"PRIOR"|"YOY"|null{if(/cung ky.*nam truoc|luy ke.*cung ky|cung ky/.test(ctx)&&!/so sanh/.test(ctx))return"PRIOR";if(/so sanh.*cung ky|ty le.*cung ky|%.*cung ky/.test(ctx))return"YOY";if(/luy ke.*dau nam|luy ke.*thang bao cao|luy ke/.test(ctx))return"YTD";return null}
function parseOfficialXlsx(buf:ArrayBuffer,report:VimawaReport){const pp=report.period?parts(report.period):null;if(!pp)return {points:[] as NationalDashboardPoint[],diagnostics:[] as any[]};const wb=XLSX.read(buf,{type:"array"});const all:Array<NationalDashboardPoint&{score:number}>=[];const diagnostics:any[]=[];
 for(const sheet of wb.SheetNames){const rows=expandedGrid(wb.Sheets[sheet]);const sz=norm(sheet);const sheetScore=/hang hai|cang bien|maritime/.test(sz)?100:/duong thuy|dtnd/.test(sz)?-100:0;let matched=0;
  for(let ri=0;ri<rows.length;ri++){const row=rows[ri]??[];let labelCol=-1,metric:NationalDashboardMetric|null=null;for(let ci=0;ci<row.length;ci++){const m=metricOf(txt(row[ci]));if(m){labelCol=ci;metric=m;break}}if(!metric)continue;
   let ytd:null|number=null,prior:null|number=null,yoy:null|number=null;let ytdCol=-1,priorCol=-1;
   for(let ci=labelCol+1;ci<row.length;ci++){const value=num(row[ci]);if(value==null)continue;const kind=classifyColumn(headerContext(rows,ci,ri));if(kind==="YTD"&&ytd==null){ytd=value;ytdCol=ci}else if(kind==="PRIOR"&&prior==null){prior=value;priorCol=ci}else if(kind==="YOY"&&yoy==null)yoy=value;}
   // Null safety: no explicit YTD/prior header means no national KPI. Zero is retained only when the source cell itself is numeric zero.
   if(ytd==null&&prior==null)continue;if(yoy!=null){if(yoy>0&&yoy<3)yoy=(yoy-1)*100;else if(yoy>3)yoy=yoy-100;}if(yoy==null&&ytd!=null&&prior!=null&&prior!==0)yoy=(ytd/prior-1)*100;
   const label=txt(row[labelCol]);const unit=txt(row[labelCol+1])||null;let score=sheetScore+50;if(/boc do|khong boc do|ke hoach|du kien/.test(norm(label)))score-=80;all.push({period:report.period!,year:pp.year,month:pp.month,periodType:"YTD",comparisonKey:`YTD-${String(pp.month).padStart(2,"0")}`,metric,label,unit,ytd,priorYtd:prior,yoyPct:yoy,sourceUrl:report.pageUrl,publishedDate:report.publishedDate,status:"OFFICIAL",sheet,score});matched++;diagnostics.push({period:report.period,sheet,row:ri+1,metric,label,ytdCol,priorCol,ytd,prior});
  }diagnostics.push({period:report.period,sheet,rows:rows.length,matchedMetricRows:matched});}
 const points:NationalDashboardPoint[]=[];for(const metric of ["TOTAL","EXPORT","IMPORT","DOMESTIC","TRANSIT","CONTAINER"] as NationalDashboardMetric[]){const xs=all.filter(x=>x.metric===metric).sort((a,b)=>b.score-a.score);if(!xs.length)continue;const best=xs[0];const tied=xs.filter(x=>x.score===best.score);const vals=tied.map(x=>x.ytd).filter((x):x is number=>x!=null);if(vals.length>1&&Math.min(...vals)>0&&Math.max(...vals)/Math.min(...vals)>1.01){diagnostics.push({period:report.period,metric,suppressed:"AMBIGUOUS_EQUAL_SCORE",values:vals});continue}const {score,...p}=best;points.push(p)}return {points,diagnostics};}
function buildTrend(points:NationalDashboardPoint[]){const map=new Map(points.map(p=>[`${p.year}-${p.month}:${p.metric}`,p]));return points.map(p=>{const prev=p.month>1?map.get(`${p.year}-${p.month-1}:${p.metric}`):undefined;let monthly:number|null=null,prior:number|null=null;if(p.month===1){monthly=p.ytd;prior=p.priorYtd}else if(prev&&prev.unit===p.unit&&p.ytd!=null&&prev.ytd!=null&&p.ytd>=prev.ytd){monthly=p.ytd-prev.ytd;if(p.priorYtd!=null&&prev.priorYtd!=null&&p.priorYtd>=prev.priorYtd)prior=p.priorYtd-prev.priorYtd}return {period:p.period,year:p.year,month:p.month,monthLabel:`T${p.month}`,metric:p.metric,unit:p.unit,ytd:p.ytd,priorYtd:p.priorYtd,ytdYoyPct:p.yoyPct,monthly,priorYearMonthly:prior,monthlyYoyPct:monthly!=null&&prior!=null&&prior!==0?(monthly/prior-1)*100:null,monthlyStatus:monthly!=null?"DERIVED_FROM_OFFICIAL_YTD":"UNAVAILABLE",sourceUrl:p.sourceUrl,publishedDate:p.publishedDate} as NationalTrendPoint}).sort((a,b)=>a.period.localeCompare(b.period))}
async function buildLiveNationalPortDashboard(limit=40){const reports=await discoverVimawaReports(limit);const series:NationalDashboardPoint[]=[];const diagnostics:any[]=[];for(const report of reports){if(report.attachmentType!=="XLSX"||!report.attachmentUrl||!report.period)continue;try{const r=await fetch(report.attachmentUrl,{headers:UA});if(!r.ok){diagnostics.push({period:report.period,error:`HTTP ${r.status}`});continue}const parsed=parseOfficialXlsx(await r.arrayBuffer(),report);series.push(...parsed.points);diagnostics.push(...parsed.diagnostics)}catch(e){diagnostics.push({period:report.period,error:e instanceof Error?e.message:String(e)})}}
 series.sort((a,b)=>a.period.localeCompare(b.period));const periods=[...new Set(series.map(x=>x.period))];const latestPeriod=periods.length?periods[periods.length-1]:null;const latest=latestPeriod?series.filter(x=>x.period===latestPeriod):[];const trendPoints=buildTrend(series);const years=[...new Set(trendPoints.map(x=>x.year))].sort((a,b)=>a-b);const docxReports=reports.filter(x=>x.attachmentType==="DOCX").length;
 return {provider:"VIMAWA",sourceKind:"OFFICIAL_GOV",sourceUrl:STATS_URL,status:series.length?"NORMALIZED":"PARTIAL",parserVersion:"v8.18.3-null-safe-merged-header-1",latestPeriod,latest,series,trend:{availableYears:years,latestYear:years.length?years[years.length-1]:null,points:trendPoints,note:"Monthly = official YTD(month) - official YTD(previous month), only for consecutive normalized periods. Missing periods remain null."},reports,coverage:{discoveredReports:reports.length,xlsxReports:reports.filter(x=>x.attachmentType==="XLSX").length,docxReports,normalizedPeriods:periods},diagnostics:diagnostics.slice(-250),note:series.length?"Official XLSX values only. Missing/ambiguous cells remain null; parse failure is never converted to zero. Historical DOCX reports are discovered and exposed as coverage, but are not silently treated as normalized XLSX data.":"Official reports discovered but no workbook passed semantic validation. UI must display —, never 0/-100% fallback.",serverTime:new Date().toISOString()};}
// Compatibility endpoint retained for existing source/history panels.
export async function fetchVimawaHistorical(limit=24){const d=await buildLiveNationalPortDashboard(limit);return {provider:d.provider,status:d.status,reports:d.reports,points:d.series,note:d.note,serverTime:d.serverTime}}
export async function getQuangNinhMovements(){return {source:"Cảng vụ Hàng hải Quảng Ninh",status:"OUT_OF_SCOPE_V8_18_3",rows:[],note:"V8.18.3 is intentionally scoped to National Overview.",serverTime:new Date().toISOString()}}
export async function getQuyNhonStatus(){return {source:"Cảng vụ Hàng hải Quy Nhơn",status:"OUT_OF_SCOPE_V8_18_3",reports:[],note:"V8.18.3 is intentionally scoped to National Overview.",serverTime:new Date().toISOString()}}
export async function getPortSourceHealth(){const reports=await discoverVimawaReports(40);return {data:{vimawa:{status:reports.length?"OK":"ERROR",latestPeriod:reports[0]?.period??null,reportCount:reports.length,xlsx:reports.filter(x=>x.attachmentType==="XLSX").length,docx:reports.filter(x=>x.attachmentType==="DOCX").length}},serverTime:new Date().toISOString()}}


// V8.18.3 hotfix: preserve the V8.18.2 Worker/D1 contract while keeping
// the V8.18.3 null-safe parser. Old parser rows are intentionally ignored.
const NATIONAL_PARSER_VERSION = "v8.18.3-null-safe-merged-header-1";

async function persistNationalReports(db: D1Database, reports: VimawaReport[]) {
  for (const r of reports) {
    try {
      await db.prepare(`INSERT INTO port_national_report_registry(period,title,page_url,xlsx_url,published_date,parser_version,discovered_at)
        VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(page_url) DO UPDATE SET period=excluded.period,title=excluded.title,xlsx_url=excluded.xlsx_url,published_date=excluded.published_date,parser_version=excluded.parser_version,discovered_at=CURRENT_TIMESTAMP`)
        .bind(r.period, r.title, r.pageUrl, r.attachmentType === "XLSX" ? r.attachmentUrl : null, r.publishedDate, NATIONAL_PARSER_VERSION).run();
    } catch { /* registry migration may not exist yet */ }
  }
}

async function persistNationalPoints(db: D1Database, points: NationalDashboardPoint[]) {
  for (const p of points) {
    await db.prepare(`INSERT INTO port_national_statistics(period,metric,label,unit,ytd_value,prior_ytd_value,yoy_pct,data_status,source_url,published_date,parser_version,retrieved_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(period,metric,source_url) DO UPDATE SET label=excluded.label,unit=excluded.unit,ytd_value=excluded.ytd_value,prior_ytd_value=excluded.prior_ytd_value,yoy_pct=excluded.yoy_pct,data_status=excluded.data_status,published_date=excluded.published_date,parser_version=excluded.parser_version,retrieved_at=CURRENT_TIMESTAMP`)
      .bind(p.period,p.metric,p.label,p.unit,p.ytd,p.priorYtd,p.yoyPct,p.status,p.sourceUrl,p.publishedDate,NATIONAL_PARSER_VERSION).run();
  }
}

async function readCurrentNationalPoints(db: D1Database): Promise<NationalDashboardPoint[]> {
  try {
    const rs = await db.prepare(`SELECT period,metric,label,unit,ytd_value,prior_ytd_value,yoy_pct,data_status,source_url,published_date
      FROM port_national_statistics WHERE parser_version=? ORDER BY period ASC, metric ASC`).bind(NATIONAL_PARSER_VERSION).all<any>();
    return (rs.results ?? []).flatMap((r:any) => {
      const pp=parts(String(r.period ?? ""));
      if(!pp) return [];
      const metric=String(r.metric ?? "") as NationalDashboardMetric;
      if(!(["TOTAL","EXPORT","IMPORT","DOMESTIC","TRANSIT","CONTAINER"] as string[]).includes(metric)) return [];
      return [{period:String(r.period),year:pp.year,month:pp.month,periodType:"YTD" as const,comparisonKey:`YTD-${String(pp.month).padStart(2,"0")}`,metric,label:String(r.label??metric),unit:r.unit==null?null:String(r.unit),ytd:r.ytd_value==null?null:Number(r.ytd_value),priorYtd:r.prior_ytd_value==null?null:Number(r.prior_ytd_value),yoyPct:r.yoy_pct==null?null:Number(r.yoy_pct),sourceUrl:String(r.source_url??STATS_URL),publishedDate:r.published_date==null?null:String(r.published_date),status:"OFFICIAL" as const,sheet:"D1"}];
    });
  } catch { return []; }
}

function dashboardFromStored(points: NationalDashboardPoint[], reports: VimawaReport[]) {
  const series=[...points].sort((a,b)=>a.period.localeCompare(b.period));
  const periods=[...new Set(series.map(x=>x.period))];
  const latestPeriod=periods.length?periods[periods.length-1]:null;
  const latest=latestPeriod?series.filter(x=>x.period===latestPeriod):[];
  const trendPoints=buildTrend(series);
  const years=[...new Set(trendPoints.map(x=>x.year))].sort((a,b)=>a-b);
  return {provider:"VIMAWA",sourceKind:"OFFICIAL_GOV",sourceUrl:STATS_URL,status:series.length?"NORMALIZED":"PARTIAL",sourceMode:"D1",parserVersion:NATIONAL_PARSER_VERSION,latestPeriod,latest,series,trend:{availableYears:years,latestYear:years.length?years[years.length-1]:null,points:trendPoints,note:"Monthly = official YTD(month) - official YTD(previous month), only for consecutive normalized periods. Missing periods remain null."},reports,coverage:{discoveredReports:reports.length,xlsxReports:reports.filter(x=>x.attachmentType==="XLSX").length,docxReports:reports.filter(x=>x.attachmentType==="DOCX").length,normalizedPeriods:periods},diagnostics:[],note:"Serving only rows normalized by the V8.18.3 null-safe parser. Older parser rows are ignored.",serverTime:new Date().toISOString()};
}

export async function ingestNationalPortStats(db: D1Database, limit=36) {
  const live=await buildLiveNationalPortDashboard(limit);
  await persistNationalReports(db, live.reports);
  if(live.series.length) await persistNationalPoints(db, live.series);
  try {
    await db.prepare(`INSERT INTO port_source_health(source_id,status,latest_period,last_success,last_checked,note)
      VALUES('vimawa',?,?,?,?,?) ON CONFLICT(source_id) DO UPDATE SET status=excluded.status,latest_period=excluded.latest_period,last_success=excluded.last_success,last_checked=excluded.last_checked,note=excluded.note`)
      .bind(live.series.length?"OK":"PARTIAL",live.latestPeriod,live.series.length?new Date().toISOString():null,new Date().toISOString(),`parser=${NATIONAL_PARSER_VERSION}; normalized=${live.series.length}`).run();
  } catch { /* health migration may not exist */ }
  return {...live,sourceMode:"LIVE_INGEST",normalizedCount:live.series.length};
}

export async function getNationalPortDashboard(db?: D1Database, limit=36) {
  if(db){
    const stored=await readCurrentNationalPoints(db);
    if(stored.length){
      let reports:VimawaReport[]=[];
      try{reports=await discoverVimawaReports(Math.min(limit,12));}catch{}
      return dashboardFromStored(stored,reports);
    }
  }
  const live=await buildLiveNationalPortDashboard(limit);
  if(db && live.series.length){
    try{await persistNationalReports(db,live.reports);await persistNationalPoints(db,live.series);}catch{}
  }
  return {...live,sourceMode:"LIVE"};
}
