import * as XLSX from "xlsx";
import * as cheerio from "cheerio";

const STATS_URL="https://vimawa.gov.vn/vi/thong-ke";
const QN_URL="https://kht1.cangvuhanghaiquangninh.gov.vn/";
const QNHON_URL="https://cangvuhanghaiquynhon.gov.vn/index.aspx?cat=2014&page=news";
const UA={"user-agent":"MarketTracker/8.17 (+official-source-reader)"};
const abs=(href:string,base:string)=>new URL(href,base).toString();
const n=(v:unknown):number|null=>{if(typeof v==="number"&&Number.isFinite(v))return v;if(typeof v!=="string")return null;const s=v.replace(/\s/g,"").replace(/\./g,"").replace(/,/g,".").replace(/[^0-9.-]/g,"");const x=Number(s);return Number.isFinite(x)?x:null};
const txt=(v:unknown)=>String(v??"").replace(/\s+/g," ").trim();
function periodFromTitle(s:string){const m=s.match(/tháng\s*(\d{1,2}).*?(20\d{2})/i)||s.match(/đến\s*tháng\s*(\d{1,2}).*?(20\d{2})/i);return m?`${m[2]}-${m[1].padStart(2,"0")}`:null}

export type VimawaReport={title:string;period:string|null;publishedDate:string|null;pageUrl:string;xlsxUrl:string|null};
function safeListingDate(s:string){const m=txt(s).match(/\b(\d{2}\/\d{2}\/20\d{2})\b/);return m?.[1]??null}
export async function discoverVimawaReports(limit=24):Promise<VimawaReport[]>{
 const r=await fetch(STATS_URL,{headers:UA});if(!r.ok)throw new Error(`VIMAWA stats HTTP ${r.status}`);const $=cheerio.load(await r.text());const out:VimawaReport[]=[];
 // The statistics listing exposes the authoritative "Ngày cập nhật" next to each report.
 // Read that table cell instead of scanning the report body, whose footer contains the 29/12/2003 portal licence date.
 $("tr").each((_,tr)=>{const a=$(tr).find("a").filter((__,el)=>/hàng hóa thông qua cảng|khối lượng hàng hóa thông qua cảng biển/i.test(txt($(el).text()))).first();if(!a.length)return;const title=txt(a.text());const href=a.attr("href");if(!href)return;const cells=$(tr).find("td").map((__,td)=>txt($(td).text())).get();const publishedDate=cells.map(safeListingDate).find(Boolean)??null;out.push({title,period:periodFromTitle(title),publishedDate,pageUrl:abs(href,STATS_URL),xlsxUrl:null})});
 // Fallback if the upstream page stops using table rows.
 if(!out.length)$("a").each((_,a)=>{const title=txt($(a).text());if(!/hàng hóa thông qua cảng|khối lượng hàng hóa thông qua cảng biển/i.test(title))return;const href=$(a).attr("href");if(!href)return;out.push({title,period:periodFromTitle(title),publishedDate:null,pageUrl:abs(href,STATS_URL),xlsxUrl:null})});
 const uniq=[...new Map(out.map(x=>[x.pageUrl,x])).values()].slice(0,limit);
 for(const item of uniq){try{const p=await fetch(item.pageUrl,{headers:UA});if(!p.ok)continue;const $$=cheerio.load(await p.text());const link=$$("a[href$='.xlsx'],a[href*='.xlsx?']").first().attr("href");if(link)item.xlsxUrl=abs(link,item.pageUrl);}catch{}}
 return uniq;
}

function parseWorkbook(buf:ArrayBuffer,report:VimawaReport){const wb=XLSX.read(buf,{type:"array"});const metrics:any[]=[];
 for(const name of wb.SheetNames){const rows:any[][]=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,defval:null});for(const row of rows){const label=row.map(txt).join(" ");if(!/tổng số|hàng xuất khẩu|hàng nhập khẩu|hàng nội địa|hàng quá cảnh|container/i.test(label))continue;const nums=row.map(n).filter((x):x is number=>x!==null);if(nums.length<2)continue;let metric="OTHER";if(/container/i.test(label))metric="CONTAINER";else if(/xuất khẩu/i.test(label))metric="EXPORT";else if(/nhập khẩu/i.test(label))metric="IMPORT";else if(/nội địa/i.test(label))metric="DOMESTIC";else if(/quá cảnh/i.test(label))metric="TRANSIT";else if(/tổng số/i.test(label))metric="TOTAL";metrics.push({sheet:name,metric,label:txt(row.find(x=>typeof x==="string"&&txt(x))??label),values:nums});}}
 return {report,metrics,parserVersion:"v8.18.1-xlsx-flex-2"};}
export async function fetchVimawaHistorical(limit=12){const reports=await discoverVimawaReports(limit);const points:any[]=[];for(const report of reports){if(!report.xlsxUrl||!report.period)continue;try{const r=await fetch(report.xlsxUrl,{headers:UA});if(!r.ok)continue;const parsed=parseWorkbook(await r.arrayBuffer(),report);for(const m of parsed.metrics)points.push({period:report.period,metric:m.metric,label:m.label,values:m.values,sourceUrl:report.pageUrl,publishedDate:report.publishedDate});}catch{}}
 return {provider:"VIMAWA",status:points.length?"PARSED":"PARTIAL",reports,points,note:"Raw official XLSX rows are preserved as numeric arrays because VIMAWA workbook layouts vary by period. No guessed column mapping is applied.",serverTime:new Date().toISOString()};}

export type NationalDashboardMetric="TOTAL"|"EXPORT"|"IMPORT"|"DOMESTIC"|"TRANSIT"|"CONTAINER";
export type NationalDashboardPoint={
  period:string;year:number;month:number;periodType:"YTD";comparisonKey:string;metric:NationalDashboardMetric;
  label:string;unit:string|null;ytd:number|null;priorYtd:number|null;yoyPct:number|null;
  sourceUrl:string;publishedDate:string|null;status:"OFFICIAL";sheet:string;
};
export type NationalTrendPoint={
  period:string;year:number;month:number;monthLabel:string;metric:NationalDashboardMetric;unit:string|null;
  ytd:number|null;priorYtd:number|null;ytdYoyPct:number|null;
  monthly:number|null;priorYearMonthly:number|null;monthlyYoyPct:number|null;
  monthlyStatus:"DERIVED_FROM_OFFICIAL_YTD"|"UNAVAILABLE";
  sourceUrl:string;publishedDate:string|null;
};
const norm=(v:unknown)=>txt(v).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d");
function metricOf(label:string):NationalDashboardMetric|null{
 const z=norm(label).replace(/^\d+[.)\-\s]*/,"").trim();
 if(/^container\b/.test(z))return"CONTAINER";
 if(/^hang xuat khau\b/.test(z)||/^xuat khau\b/.test(z))return"EXPORT";
 if(/^hang nhap khau\b/.test(z)||/^nhap khau\b/.test(z))return"IMPORT";
 if(/^hang noi dia\b/.test(z)||/^noi dia\b/.test(z))return"DOMESTIC";
 if((/^hang qua canh\b/.test(z)||/^qua canh\b/.test(z))&&!/boc do|khong boc do/.test(z))return"TRANSIT";
 if(/^tong so\b/.test(z)||/^tong cong\b/.test(z))return"TOTAL";
 return null;
}
function sheetScopeScore(name: string) {
  const z = norm(name);

  if (/duong thuy|dtnd|noi dia/.test(z)) return -100;
  if (/hang hai|cang bien|maritime/.test(z)) return 100;

  return 0;
}
function rowScore(label:string,sheet:string){const z=norm(label).replace(/^\d+[.)\-\s]*/,"").trim();let score=sheetScopeScore(sheet);if(/^(tong so|tong cong|container|hang xuat khau|xuat khau|hang nhap khau|nhap khau|hang noi dia|noi dia|hang qua canh|qua canh)$/.test(z))score+=50;if(z.length<35)score+=10;if(/boc do|khong boc do|ke hoach|du kien/.test(z))score-=80;return score}
function periodParts(period:string){const [ys,ms]=period.split("-");const year=Number(ys),month=Number(ms);return Number.isInteger(year)&&Number.isInteger(month)&&month>=1&&month<=12?{year,month}:null}
function normalizedWorkbook(buf:ArrayBuffer,report:VimawaReport):NationalDashboardPoint[]{
 const wb=XLSX.read(buf,{type:"array"}); const candidates:Array<NationalDashboardPoint&{score:number}>=[]; const pp=report.period?periodParts(report.period):null;if(!pp)return[];
 for(const name of wb.SheetNames){
  const rows:any[][]=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,raw:true,defval:null});
  let ytdCol=-1,priorCol=-1,yoyCol=-1;
  for(let ri=0;ri<Math.min(rows.length,40);ri++) for(let ci=0;ci<(rows[ri]?.length??0);ci++){
   const z=norm(rows[ri][ci]);
   if((z.includes("luy ke")&&z.includes("thang bao cao"))||z.includes("luy ke tu dau nam")) ytdCol=ci;
   if(z.includes("cung ky nam truoc")&&z.includes("luy ke")) priorCol=ci;
   if(z.includes("so sanh cung ky")||z.includes("4/5")) yoyCol=ci;
  }
  if(ytdCol<0||priorCol<0) continue;
  for(const row of rows){
   const labelCell=row.find(v=>metricOf(txt(v))!==null); if(labelCell==null)continue;
   const metric=metricOf(txt(labelCell)); if(!metric)continue;
   const labelIndex=row.indexOf(labelCell); const unit=labelIndex>=0?txt(row[labelIndex+1])||null:null;
   const ytd=n(row[ytdCol]), prior=n(row[priorCol]); let yoy=yoyCol>=0?n(row[yoyCol]):null;
   if(yoy!=null && yoy>0 && yoy<3) yoy=(yoy-1)*100; else if(yoy!=null && yoy>3) yoy=yoy-100;
   if(yoy==null&&ytd!=null&&prior!=null&&prior!==0)yoy=(ytd/prior-1)*100;
   if(ytd==null&&prior==null)continue;
   candidates.push({period:report.period!,year:pp.year,month:pp.month,periodType:"YTD",comparisonKey:`YTD-${String(pp.month).padStart(2,"0")}`,metric,label:txt(labelCell),unit,ytd,priorYtd:prior,yoyPct:yoy,sourceUrl:report.pageUrl,publishedDate:report.publishedDate,status:"OFFICIAL",sheet:name,score:rowScore(txt(labelCell),name)});
  }
 }
 const out:NationalDashboardPoint[]=[];
 for(const metric of ["TOTAL","EXPORT","IMPORT","DOMESTIC","TRANSIT","CONTAINER"] as NationalDashboardMetric[]){
  const xs=candidates.filter(x=>x.metric===metric).sort((a,b)=>b.score-a.score);if(!xs.length)continue;const top=xs[0];const tied=xs.filter(x=>x.score===top.score&&x.ytd!=null);
  // If equally plausible rows disagree materially, do not emit an ambiguous national KPI.
  if(tied.length>1){const vals=tied.map(x=>x.ytd!).filter(Number.isFinite);const min=Math.min(...vals),max=Math.max(...vals);if(min>0&&max/min>1.01)continue;}
  const {score,...clean}=top;out.push(clean);
 }
 return out;
}
function buildTrend(points:NationalDashboardPoint[]){
 const byKey=new Map(points.map(p=>[`${p.year}-${String(p.month).padStart(2,"0")}:${p.metric}`,p]));const trend:NationalTrendPoint[]=[];
 for(const p of points){let monthly:number|null=null,priorMonthly:number|null=null;let monthlyStatus:NationalTrendPoint["monthlyStatus"]="UNAVAILABLE";
  if(p.month===1){monthly=p.ytd;priorMonthly=p.priorYtd;if(monthly!=null)monthlyStatus="DERIVED_FROM_OFFICIAL_YTD";}
  else {const prev=byKey.get(`${p.year}-${String(p.month-1).padStart(2,"0")}:${p.metric}`);if(prev&&prev.unit===p.unit&&p.ytd!=null&&prev.ytd!=null&&p.ytd>=prev.ytd){monthly=p.ytd-prev.ytd;monthlyStatus="DERIVED_FROM_OFFICIAL_YTD";}if(prev&&prev.unit===p.unit&&p.priorYtd!=null&&prev.priorYtd!=null&&p.priorYtd>=prev.priorYtd)priorMonthly=p.priorYtd-prev.priorYtd;}
  const monthlyYoyPct=monthly!=null&&priorMonthly!=null&&priorMonthly!==0?(monthly/priorMonthly-1)*100:null;
  trend.push({period:p.period,year:p.year,month:p.month,monthLabel:`T${p.month}`,metric:p.metric,unit:p.unit,ytd:p.ytd,priorYtd:p.priorYtd,ytdYoyPct:p.yoyPct,monthly,priorYearMonthly:priorMonthly,monthlyYoyPct,monthlyStatus,sourceUrl:p.sourceUrl,publishedDate:p.publishedDate});
 }
 return trend.sort((a,b)=>a.period.localeCompare(b.period));
}
export async function getNationalPortDashboard(limit=24){
 const reports=await discoverVimawaReports(limit); const points:NationalDashboardPoint[]=[];
 for(const report of reports){if(!report.xlsxUrl||!report.period)continue;try{const r=await fetch(report.xlsxUrl,{headers:UA});if(!r.ok)continue;points.push(...normalizedWorkbook(await r.arrayBuffer(),report));}catch{}}
 points.sort((a,b)=>a.period.localeCompare(b.period));
 const periods=[...new Set(points.map(x=>x.period))]; const latestPeriod=periods.at(-1)??reports.find(x=>x.period)?.period??null;
 const latest=latestPeriod?points.filter(x=>x.period===latestPeriod):[];const trendPoints=buildTrend(points);const years=[...new Set(trendPoints.map(x=>x.year))].sort((a,b)=>a-b);
 return {provider:"VIMAWA",sourceKind:"OFFICIAL_GOV",sourceUrl:STATS_URL,status:points.length?"NORMALIZED":"PARTIAL",latestPeriod,latest,series:points,trend:{availableYears:years,latestYear:years.at(-1)??null,points:trendPoints,note:"Monthly values are derived only as YTD(month) - YTD(previous month) when both consecutive official reports exist with the same unit. Missing months stay unavailable; no interpolation is used."},reports:reports.map(x=>({title:x.title,period:x.period,publishedDate:x.publishedDate,pageUrl:x.pageUrl,xlsxUrl:x.xlsxUrl})),note:points.length?"Normalized only when official workbook headers for YTD and prior-year YTD are explicitly recognized. Equal-score ambiguous rows are suppressed instead of guessed.":"Official reports were discovered, but workbook headers were not safely normalized. UI must show missing data instead of fallback numbers.",serverTime:new Date().toISOString()};
}

export async function getQuangNinhMovements(){try{const r=await fetch(QN_URL,{headers:UA});if(!r.ok)throw new Error(`HTTP ${r.status}`);const $=cheerio.load(await r.text());const rows:any[]=[];$("tr").each((_,tr)=>{const c=$(tr).find("td").map((__,td)=>txt($(td).text())).get();if(c.length<7)return;const joined=c.join(" ");if(!/\d/.test(joined))return;const dwt=c.map(n).find(x=>x!==null&&x>1000)??null;rows.push({cells:c,dwt});});return {source:"Cảng vụ Hàng hải Quảng Ninh",sourceUrl:QN_URL,status:rows.length?"LIVE_PARSED":"PARTIAL",rows,serverTime:new Date().toISOString(),note:"Official movement-plan rows. Raw cells retained; terminal-field normalization is intentionally conservative."};}catch(e){return {source:"Cảng vụ Hàng hải Quảng Ninh",sourceUrl:QN_URL,status:"SOURCE_UNAVAILABLE",rows:[],serverTime:new Date().toISOString(),note:e instanceof Error?e.message:String(e)}}}
export async function getQuyNhonStatus(){try{const r=await fetch(QNHON_URL,{headers:UA});if(!r.ok)throw new Error(`HTTP ${r.status}`);const $=cheerio.load(await r.text());const reports:string[]=[];$("a").each((_,a)=>{const t=txt($(a).text());if(/KẾ HOẠCH ĐIỀU ĐỘNG TÀU NGÀY/i.test(t))reports.push(t)});return {source:"Cảng vụ Hàng hải Quy Nhơn",sourceUrl:QNHON_URL,status:reports.length?"PARTIAL":"SOURCE_UNAVAILABLE",reportCount:reports.length,reports:reports.slice(0,20),note:"Archive discovery only. Detail rows are image-based on sampled reports, so V8.17 does not OCR them into official structured data.",serverTime:new Date().toISOString()};}catch(e){return {source:"Cảng vụ Hàng hải Quy Nhơn",sourceUrl:QNHON_URL,status:"SOURCE_UNAVAILABLE",reportCount:0,reports:[],note:e instanceof Error?e.message:String(e),serverTime:new Date().toISOString()}}}
export async function getPortSourceHealth(){const settled=await Promise.allSettled([discoverVimawaReports(3),getQuangNinhMovements(),getQuyNhonStatus()]);return {data:{vimawa:{status:settled[0].status==="fulfilled"&&settled[0].value.length?"OK":"ERROR",latestPeriod:settled[0].status==="fulfilled"?settled[0].value[0]?.period:null},quangninh:{status:settled[1].status==="fulfilled"?settled[1].value.status:"ERROR"},quynhon:{status:settled[2].status==="fulfilled"?settled[2].value.status:"ERROR"}},serverTime:new Date().toISOString()};}
