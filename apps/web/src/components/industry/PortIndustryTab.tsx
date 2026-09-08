import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import {
  getPortHaiphongSummary,
  getPortCompanyIntelligence,
  getPortCompanies,
  getPortOverview,
  getPortTerminalAnalytics,
  getStockQuotes,
  getTrackedPortTerminals,
  getPortRelationships,
  getPortHistoryStatus,
  getPortCompanyPortfolio,
  getNationalPortStats,
  getNationalPortHistory,
  getPortSourceHealth,
  getNationalPortDashboard
} from "../../api";
import type {
  PortCompany, PortCompanyIntelligence, PortHarborSummary, PortMetric, PortOverviewResponse,
  PortTerminalAnalytics, StockQuote, PortCompanyComparison, PortRelationship, PortHistoryStatus, PortThroughputCapacityResponse, PortThroughputHistoryResponse, PortThroughputHistoryPoint, PortCompanyPortfolio, NationalPortStatsResponse, NationalPortHistoryResponse, PortSourceHealthResponse, NationalPortDashboardResponse, NationalDashboardPoint
} from "../../types";
import { ResponsiveTabBar } from "../ResponsiveTabBar";

type PortView = "overview" | "regions" | "company" | "terminal" | "sources";

function fmt(v:number|null|undefined,digits=1){ return v==null?"—":v.toLocaleString("vi-VN",{maximumFractionDigits:digits}); }
function fmtCompact(v:number|null|undefined){ if(v==null)return"—"; if(v>=1e9)return`${(v/1e9).toFixed(2)}B`; if(v>=1e6)return`${(v/1e6).toFixed(2)}M`; if(v>=1e3)return`${(v/1e3).toFixed(1)}K`; return fmt(v,0); }
function stockClass(v:number|null|undefined){ if(v==null||v===0)return"ref"; return v>0?"up":"down"; }
function metricMap(rows:PortMetric[]){ return new Map(rows.map(x=>[x.id,x])); }

function SourceChip({sourceId,data}:{sourceId:string;data:PortOverviewResponse}){
  const src=data.sources.find(x=>x.id===sourceId); if(!src)return null;
  return <a className="portSourceChip" href={src.url} target="_blank" rel="noreferrer">{src.sourceKind==="official"?"Nguồn Nhà nước ↗":"Nguồn DN ↗"}</a>;
}

function StockStrip({quotes}:{quotes:StockQuote[]}){
  return <div className="portStockGrid">{quotes.map(q=><a key={q.code} href={`https://web.fireant.vn/ma-chung-khoan/${q.code}`} target="_blank" rel="noreferrer" className="portStockCard">
    <div><strong className={stockClass(q.changePercent)}>{q.code}</strong><small>{q.floor}</small></div>
    <div className="portStockPrice"><b className={stockClass(q.changePercent)}>{q.matchPrice==null?"—":q.matchPrice.toLocaleString("vi-VN")}</b><span className={stockClass(q.changePercent)}>{q.changePercent==null?"—":`${q.changePercent>0?"+":""}${q.changePercent.toFixed(2)}%`}</span></div>
    <div className="portStockVol"><span>VOL {q.accumulatedVol==null?"—":`${(q.accumulatedVol/1e6).toFixed(1)}M`}</span><span>AVG {q.volumeVsAvg20==null?"—":`${q.volumeVsAvg20.toFixed(2)}x`}</span></div>
  </a>)}</div>;
}

function MiniDailyChart({rows}:{rows:Array<{date:string;dwt:number}>}){
  if(!rows.length)return <div className="portEmpty">Chưa có dữ liệu D1. Collector sẽ bootstrap sau lần chạy đầu tiên.</div>;
  return <div className="portChartBox"><ResponsiveContainer width="100%" height={270}><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickFormatter={x=>String(x).slice(5)} minTickGap={18}/><YAxis tickFormatter={x=>fmtCompact(Number(x))}/><Tooltip formatter={(v:any)=>[Number(v).toLocaleString("vi-VN"),"DWT"]}/><Bar dataKey="dwt" fill="currentColor" className="portChartBar" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div>;
}

function Overview({data,nationalDashboard,sourceHealth,onCompany,onRegions}:{data:PortOverviewResponse;nationalDashboard:NationalPortDashboardResponse|null;sourceHealth:PortSourceHealthResponse|null;onCompany:(symbol:string)=>void;onRegions:()=>void}){
  const [filter,setFilter]=useState("ALL");
  const [metric,setMetric]=useState<"TOTAL"|"CONTAINER">("TOTAL");
  const [trendMode,setTrendMode]=useState<"MONTHLY"|"YTD">("MONTHLY");
  const [trendYear,setTrendYear]=useState<number|null>(null);
  const classifications=[{id:"ALL",label:"Tất cả"},{id:"DIRECT_PORT",label:"Cảng trực tiếp"},{id:"MULTI_PORT_LOGISTICS",label:"Đa cảng / Logistics"},{id:"HOLDING_PORT_NETWORK",label:"Holding"},{id:"RELATED_PORT_SHIPPING",label:"Liên quan"}];
  const visible=data.companies.filter(c=>filter==="ALL"||c.classification===filter);
  const regions=["Bắc","Trung","Nam"] as const;
  const latest=new Map((nationalDashboard?.latest??[]).map(x=>[x.metric,x]));
  const total=latest.get("TOTAL"), container=latest.get("CONTAINER"), exp=latest.get("EXPORT"), imp=latest.get("IMPORT"), domestic=latest.get("DOMESTIC"), transit=latest.get("TRANSIT");
  const trendPoints=(nationalDashboard?.trend?.points??[]).filter(x=>x.metric===metric);
  const years=(nationalDashboard?.trend?.availableYears??[]).slice().sort((a,b)=>a-b);
  const monthlyBestYear=years.slice().sort((a,b)=>{const ca=trendPoints.filter(x=>x.year===a&&x.monthly!=null).length,cb=trendPoints.filter(x=>x.year===b&&x.monthly!=null).length;return cb-ca||b-a})[0]??null;
  const defaultYear =
  trendMode === "MONTHLY"
    ? monthlyBestYear
    : (nationalDashboard?.trend?.latestYear ??
       (years.length > 0 ? years[years.length - 1] : null));
  const effectiveYear=trendYear!=null&&years.includes(trendYear)?trendYear:defaultYear;
  const trendRows=trendPoints.filter(x=>x.year===effectiveYear).map(x=>trendMode==="MONTHLY"?{period:x.monthLabel,current:x.monthly,prior:x.priorYearMonthly,yoy:x.monthlyYoyPct,status:x.monthlyStatus,unit:x.unit,sourceUrl:x.sourceUrl}:{period:x.monthLabel,current:x.ytd,prior:x.priorYtd,yoy:x.ytdYoyPct,status:"OFFICIAL_YTD",unit:x.unit,sourceUrl:x.sourceUrl}).filter(x=>x.current!=null||x.prior!=null);
  const card=(label:string,x:NationalDashboardPoint|undefined)=><article className="portKpiCard"><span>{label}</span><strong>{x?.ytd==null?"—":fmtCompact(x.ytd)}</strong><small>{x?.unit??"official source unit"}{x?.yoyPct==null?"":` · ${x.yoyPct>=0?"+":""}${x.yoyPct.toFixed(1)}% YoY`}</small></article>;
  return <>
    <section className="portHero portPanel portOverviewHero"><div><span className="portEyebrow">INDUSTRY ENGINE · PORTS · V8.19</span><h2>Cảng biển Việt Nam</h2><p>Dashboard <b>toàn ngành</b>: throughput, container, cơ cấu hàng hóa, doanh nghiệp niêm yết và coverage dữ liệu. Không đưa KPI riêng PHP/GMD/DVP vào lớp National Overview.</p></div><div className="portHeroActions"><button onClick={onRegions}>Khám phá khu vực</button><a className="portOverviewSourceBtn" href={nationalDashboard?.sourceUrl??"https://www.vimawa.gov.vn/vi/thong-ke"} target="_blank" rel="noreferrer">VIMAWA ↗</a></div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">00</span><h3>National Port Dashboard</h3></div><span className="portMuted">{nationalDashboard?.latestPeriod??"—"} · YTD · OFFICIAL{nationalDashboard?.latest?.[0]?.publishedDate?` · cập nhật ${nationalDashboard.latest[0].publishedDate}`:""}</span></div>
      {!nationalDashboard?<div className="portEmpty">Đang tải thống kê official…</div>:nationalDashboard.status!=="NORMALIZED"?<div className="portScopeNotice"><strong>Chưa normalize an toàn.</strong> {nationalDashboard.note}</div>:<>
        <div className="portKpiGrid">{card("Hàng hóa qua cảng",total)}{card("Container",container)}{card("Xuất khẩu",exp)}{card("Nhập khẩu",imp)}</div>
        <div className="portKpiGrid portCargoKpis">{card("Nội địa",domestic)}{card("Quá cảnh",transit)}</div>
        <div className="portScopeNotice"><strong>Data policy:</strong> Chỉ hiển thị số khi parser nhận diện rõ header YTD và cùng kỳ trong workbook chính thức. Không dùng DWT làm cargo throughput và không phân bổ số quốc gia về doanh nghiệp/terminal.</div>
      </>}
    </section>

    <section className="portPanel"><div className="portSectionHead portTrendHead"><div><span className="portSectionIndex">01</span><h3>National Throughput Trend · Monthly & YoY</h3></div><div className="portTrendControls"><div className="portMetricSwitch"><button className={metric==="TOTAL"?"active":""} onClick={()=>setMetric("TOTAL")}>Hàng hóa</button><button className={metric==="CONTAINER"?"active":""} onClick={()=>setMetric("CONTAINER")}>Container</button></div><div className="portMetricSwitch"><button className={trendMode==="MONTHLY"?"active":""} onClick={()=>{setTrendMode("MONTHLY");setTrendYear(null)}}>Tháng</button><button className={trendMode==="YTD"?"active":""} onClick={()=>{setTrendMode("YTD");setTrendYear(null)}}>YTD</button></div>{years.length>0&&<select className="portTrendYear" value={effectiveYear??""} onChange={e=>setTrendYear(Number(e.target.value))}>{years.slice().reverse().map(y=><option key={y} value={y}>{y}</option>)}</select>}</div></div>
      {trendMode==="MONTHLY"&&<div className="portScopeNotice"><strong>Monthly policy:</strong> Giá trị tháng chỉ được tính từ <b>YTD tháng hiện tại − YTD tháng liền trước</b> khi cả hai report official tồn tại, cùng đơn vị và cùng metric. Thiếu tháng → để trống, không nội suy.</div>}
      {!trendRows.length?<div className="portEmpty">{effectiveYear==null?"Chưa có dữ liệu normalized.":`Chưa đủ kỳ ${trendMode==="MONTHLY"?"liên tiếp để tính monthly":"YTD"} an toàn cho ${effectiveYear}. Hãy chọn năm khác nếu có.`}</div>:<><div className="portTrendLegend"><span><i className="current"/> {effectiveYear??"Kỳ hiện tại"}</span><span><i className="prior"/> {(effectiveYear??0)-1 || "Cùng kỳ năm trước"}</span><em>{trendMode==="MONTHLY"?"So sánh từng tháng YoY":"Lũy kế cùng kỳ YoY"}</em></div><div className="portChartBox"><ResponsiveContainer width="100%" height={310}><BarChart data={trendRows}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="period"/><YAxis tickFormatter={x=>fmtCompact(Number(x))}/><Tooltip formatter={(v:any,name:any)=>[v==null?"—":Number(v).toLocaleString("vi-VN"),name==="current"?String(effectiveYear):String((effectiveYear??0)-1)]}/><Bar dataKey="prior" fill="#9a7b35" radius={[4,4,0,0]}/><Bar dataKey="current" fill="#35d8c7" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div><div className="portTrendYoyGrid">{trendRows.map(x=><div key={x.period}><span>{x.period}</span><strong>{x.current==null?"—":fmtCompact(x.current)}</strong><em className={x.yoy==null?"ref":stockClass(x.yoy)}>{x.yoy==null?"YoY —":`${x.yoy>=0?"+":""}${x.yoy.toFixed(1)}% YoY`}</em></div>)}</div></>}
      <p className="portFootnote">{nationalDashboard?.trend?.note}</p>
    </section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Cơ cấu hàng hóa · kỳ mới nhất</h3></div><span className="portMuted">Export / Import / Domestic / Transit</span></div>
      <div className="portCargoMix">{[["Xuất khẩu",exp],["Nhập khẩu",imp],["Nội địa",domestic],["Quá cảnh",transit]].map(([label,x])=>{const p=x as NationalDashboardPoint|undefined; const base=total?.ytd??null; const share=p?.ytd!=null&&base?100*p.ytd/base:null; return <article key={label as string}><div><strong>{label as string}</strong><span>{p?.ytd==null?"—":`${fmtCompact(p.ytd)} ${p.unit??""}`}</span></div><div className="portMixBar"><i style={{width:`${Math.max(0,Math.min(100,share??0))}%`}}/></div><small>{share==null?"share —":`${share.toFixed(1)}% tổng`} {p?.yoyPct==null?"":`· ${p.yoyPct>=0?"+":""}${p.yoyPct.toFixed(1)}% YoY`}</small></article>})}</div>
    </section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">03</span><h3>Doanh nghiệp cảng niêm yết</h3></div><span className="portMuted">{data.companies.length} mã · verified registry</span></div><p className="portOverviewIntro">Ticker là <b>doanh nghiệp</b>, không mặc định tương đương một terminal. Company → ownership/operator → port/terminal được giữ thành các lớp riêng.</p><div className="portUniverseFilters">{classifications.map(x=><button key={x.id} className={filter===x.id?"active":""} onClick={()=>setFilter(x.id)}>{x.label}</button>)}</div><div className="portUniverseGrid">{visible.map(c=><button className="portUniverseCard" key={c.symbol} onClick={()=>onCompany(c.symbol)}><div className="portUniverseTop"><strong>{c.symbol}</strong><span>{c.exchange}</span><em>{c.locality}</em></div><h4>{c.name}</h4><p>{c.classificationLabel}</p><small>{c.focus}</small><div className="portUniverseFooter"><span>● Đã xác minh</span><b>Chi tiết →</b></div></button>)}</div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">04</span><h3>Phân bố theo khu vực</h3></div><button className="portTextButton" onClick={onRegions}>Mở Khu vực →</button></div><div className="portGeoGrid">{regions.map(r=><article key={r}><div className="portGeoTitle"><strong>{r}</strong><span>{data.companies.filter(c=>c.region===r).length} mã</span></div><div className="portGeoCompanies">{data.companies.filter(c=>c.region===r).map(c=><button key={c.symbol} onClick={()=>onCompany(c.symbol)}><b>{c.symbol}</b><span>{c.locality}</span></button>)}</div></article>)}</div></section>

    <section id="port-policy" className="portPanel portPolicyPanel"><div className="portSectionHead"><div><span className="portSectionIndex">05</span><h3>Source health & limitations</h3></div></div><div className="portCoverageStats"><div><span>VIMAWA</span><strong>{sourceHealth?.data.vimawa.status??"—"}</strong><small>{sourceHealth?.data.vimawa.latestPeriod??"official statistics"}</small></div><div><span>Hải Phòng</span><strong>LIVE</strong><small>ship-plan collector</small></div><div><span>Quảng Ninh</span><strong>{sourceHealth?.data.quangninh.status??"—"}</strong><small>official plan</small></div><div><span>Quy Nhơn</span><strong>{sourceHealth?.data.quynhon.status??"—"}</strong><small>metadata only</small></div></div><ul>{data.limitations.map(x=><li key={x}>{x}</li>)}</ul></section>
  </>;
}

function RegionsDashboard({data,harbor,history,onCompany,onTerminal}:{data:PortOverviewResponse;harbor:PortHarborSummary|null;history:PortHistoryStatus|null;onCompany:(s:string)=>void;onTerminal:()=>void}){
  const coverage=data.regionCoverage??[];
  const hp=coverage.find(x=>x.id==="haiphong");
  return <>
    <section className="portPanel portEntityHero portRegionHero"><div><span className="portEyebrow">V8.19 · REGION INTELLIGENCE</span><h2>Khu vực Hải Phòng · Cảng vụ Hải Phòng</h2><p>V8.19 biến tab Khu vực thành màn hình monitor vận hành: DWT/lượt tàu theo thời gian, cùng kỳ, cơ cấu tàu, thị phần terminal và dữ liệu tàu gần nhất. DWT là <b>proxy quy mô tàu</b>, không phải sản lượng hàng hóa.</p></div>{hp?.officialUrl&&<a className="companyHomepageButton" href={hp.officialUrl} target="_blank" rel="noreferrer">Nguồn Cảng vụ ↗</a>}</section>
    <HarborDashboard data={harbor}/>
    <HistoryProgress history={history}/>
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">06</span><h3>Đi sâu để ra quyết định</h3></div></div><div className="portRegionLinks"><button onClick={()=>onCompany("PHP")}>Doanh nghiệp cảng →</button><button onClick={onTerminal}>Terminal Intelligence →</button></div></section>
    <section className="portPanel portLimitPanel"><div className="portSectionHead"><div><span className="portSectionIndex">!</span><h3>Coverage V8.19</h3></div></div><ul><li>Production collector hiện có cho Hải Phòng; các Cảng vụ khác không được giả lập cùng mức chi tiết.</li><li>Không suy TEU/hàng hóa từ DWT. Market share bên dưới là share DWT trong tập arrival được normalize.</li><li>Hãng tàu/container share chưa hiển thị nếu nguồn Cảng vụ không có trường carrier được normalize đáng tin cậy.</li></ul></section>
  </>;
}

function HarborDashboard({data}:{data:PortHarborSummary|null}){
  const [range,setRange]=useState<"MONTH"|"QUARTER">("MONTH");
  if(!data)return <div className="portPanel">Đang tải dữ liệu Hải Phòng…</div>;
  const daily=data.daily??[];
  const monthMap=new Map<string,{month:string;dwt:number;calls:number}>();
  daily.forEach(x=>{const m=x.date.slice(0,7);const v=monthMap.get(m)??{month:m,dwt:0,calls:0};v.dwt+=x.dwt;v.calls+=x.shipCalls;monthMap.set(m,v)});
  const monthly=[...monthMap.values()].sort((a,b)=>a.month.localeCompare(b.month));
  const monthlyChart=monthly.slice(range==="MONTH"?-18:-24);
  const latest12=monthly.slice(-12);
  const totalDwt12=latest12.reduce((a,x)=>a+x.dwt,0);
  const totalCalls12=latest12.reduce((a,x)=>a+x.calls,0);
  const avgDwt=totalCalls12?totalDwt12/totalCalls12:null;
  const terminalTotal=data.topTerminals.reduce((a,x)=>a+x.dwt,0);
  const latestDaily=daily.slice(-90);
  return <>
    <div className="portKpiGrid portRegionKpis"><article className="portKpiCard featured"><span>DWT · {data.days} ngày</span><strong>{fmtCompact(data.summary.dwt)}</strong><small>arrival proxy · không phải cargo</small></article><article className="portKpiCard"><span>Lượt tàu</span><strong>{fmt(data.summary.shipCalls,0)}</strong><small>arrival records</small></article><article className="portKpiCard"><span>DWT bình quân</span><strong>{fmtCompact(data.summary.avgDwt)}</strong><small>mỗi lượt tàu</small></article><article className="portKpiCard"><span>Tàu lớn nhất</span><strong>{fmtCompact(data.summary.maxDwt)}</strong><small>DWT · kỳ theo dõi</small></article></div>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Lưu lượng DWT qua Cảng vụ</h3></div><div className="portMetricSwitch"><button className={range==="MONTH"?"active":""} onClick={()=>setRange("MONTH")}>Tháng</button><button className={range==="QUARTER"?"active":""} onClick={()=>setRange("QUARTER")}>Dài hạn</button></div></div><p className="portSectionIntro">Theo dõi nhịp tàu vào theo thời gian. DWT phản ánh quy mô đội tàu cập cảng; không thay thế throughput/TEU.</p><div className="portChartBox"><ResponsiveContainer width="100%" height={300}><BarChart data={monthlyChart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={x=>fmtCompact(Number(x))}/><Tooltip formatter={(v:any)=>[Number(v).toLocaleString("vi-VN"),"DWT"]}/><Bar dataKey="dwt" fill="currentColor" className="portChartBar" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div><div className="portRegionSummaryLine"><span>12 tháng gần nhất</span><b>{fmtCompact(totalDwt12)} DWT</b><span>{fmt(totalCalls12,0)} lượt</span><b>{fmtCompact(avgDwt)} DWT/lượt</b></div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Nhịp vận hành theo tháng</h3></div><span className="portMuted">DWT + lượt tàu · recent history trong D1</span></div><div className="portMonthlyTable"><div className="head"><span>Tháng</span><span>DWT</span><span>Lượt tàu</span><span>DWT/lượt</span></div>{latest12.slice().reverse().map(x=><div key={x.month}><strong>{x.month}</strong><span>{fmtCompact(x.dwt)}</span><span>{fmt(x.calls,0)}</span><span>{fmtCompact(x.calls?x.dwt/x.calls:null)}</span></div>)}</div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">03</span><h3>Thị phần terminal trong vùng theo DWT</h3></div><span className="portMuted">Không phải market share TEU</span></div><div className="portShareList">{data.topTerminals.map((x,i)=>{const share=terminalTotal?x.dwt/terminalTotal*100:0;return <div key={x.terminal}><span className="rank">{String(i+1).padStart(2,"0")}</span><strong>{x.terminalLabel}</strong><div className="track"><i style={{width:`${Math.max(1,share)}%`}}/></div><b>{share.toFixed(1)}%</b><em>{fmtCompact(x.dwt)} · {x.shipCalls} lượt</em></div>})}</div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">04</span><h3>Dữ liệu tàu theo ngày</h3></div><span className="portMuted">90 ngày gần nhất</span></div><MiniDailyChart rows={latestDaily.map(x=>({date:x.date,dwt:x.dwt}))}/><p className="portFootnote">Dùng để phát hiện thay đổi nhịp tàu ngắn hạn; cần đối chiếu throughput official trước khi kết luận tác động doanh thu.</p></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">05</span><h3>Chân dung đội tàu</h3></div></div><div className="portFleetProfile"><div><span>DWT bình quân</span><b>{fmtCompact(data.summary.avgDwt)}</b></div><div><span>DWT lớn nhất</span><b>{fmtCompact(data.summary.maxDwt)}</b></div><div><span>Lượt tàu kỳ theo dõi</span><b>{fmt(data.summary.shipCalls,0)}</b></div><div><span>Terminal có dữ liệu</span><b>{data.topTerminals.length}</b></div></div></section>
    {data.ingestion.lastError&&<div className="portScopeNotice"><strong>Collector error:</strong> {data.ingestion.lastError}</div>}
    <div className="portScopeNotice"><strong>Provenance:</strong> {data.source.label} · planned-movement · cập nhật {data.ingestion.lastOkAt?new Date(data.ingestion.lastOkAt).toLocaleString("vi-VN"):"chờ collector"}. Không suy hàng hóa/TEU từ DWT.</div>
  </>;
}

function TerminalDashboard({terminal,setTerminal,terminalOptions,data}:{terminal:string;setTerminal:(v:string)=>void;terminalOptions:Array<{code:string;label:string}>;data:PortTerminalAnalytics|null}){
  return <>
    <section className="portPanel portEntityHero"><div><span className="portEyebrow">TERMINAL INTELLIGENCE · OFFICIAL SHIP PLAN</span><h2>{data?.terminalLabel ?? terminal}</h2><p>DWT, ship calls, route origin và vessel list lấy từ CSDL kế hoạch điều động tàu Cảng vụ Hải Phòng. Arrival là record chính để chống double-count.</p></div><select className="portTerminalSelect" value={terminal} onChange={e=>setTerminal(e.target.value)}>{terminalOptions.map(x=><option key={x.code} value={x.code}>{x.label}</option>)}</select></section>
    {!data?<div className="portPanel">Đang tải terminal…</div>:<>
      <div className="portKpiGrid"><article className="portKpiCard"><span>DWT · {data.days} ngày</span><strong>{fmtCompact(data.summary.dwt)}</strong><small>proxy quy mô tàu</small></article><article className="portKpiCard"><span>Ship calls</span><strong>{fmt(data.summary.shipCalls,0)}</strong><small>arrival records</small></article><article className="portKpiCard"><span>Avg DWT</span><strong>{fmtCompact(data.summary.avgDwt)}</strong><small>mỗi call</small></article><article className="portKpiCard"><span>Largest vessel</span><strong>{fmtCompact(data.summary.maxDwt)}</strong><small>{data.capability?`capability ~${fmtCompact(data.capability.maxDwt)}`:"DWT"}</small></article></div>
      {data.capability&&<div className="portScopeNotice"><strong>Khả năng tiếp nhận:</strong> {data.capability.note} <a href={data.capability.sourceUrl} target="_blank" rel="noreferrer">Nguồn Cảng vụ ↗</a></div>}
  
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>DWT theo ngày</h3></div></div><MiniDailyChart rows={data.daily}/></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>DWT theo tháng</h3></div><span className="portMuted">YoY chỉ có ý nghĩa sau khi backfill đủ lịch sử</span></div><div className="portChartBox"><ResponsiveContainer width="100%" height={270}><BarChart data={data.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={x=>fmtCompact(Number(x))}/><Tooltip formatter={(v:any)=>[Number(v).toLocaleString("vi-VN"),"DWT"]}/><Bar dataKey="dwt" fill="currentColor" className="portChartBar" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">03</span><h3>Top origin / route</h3></div></div><div className="portRankList">{data.routes.map((x,i)=><div key={x.route}><span>{i+1}. {x.route}</span><b>{fmtCompact(x.dwt)}</b><em>{x.shipCalls} calls</em></div>)}</div></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">04</span><h3>Recent ship calls</h3></div><span className="portMuted">Kế hoạch điều động · không phải manifest hàng hóa</span></div><div className="portShipTable"><div className="head"><span>Ngày</span><span>Tàu</span><span>DWT</span><span>LOA</span><span>Từ</span><span>Đại lý</span></div>{data.recentCalls.map((x,i)=><a href={x.sourceUrl} target="_blank" rel="noreferrer" key={`${x.planDate}-${x.vesselName}-${i}`}><span>{x.planDate}<small>{x.eventTime}</small></span><strong>{x.vesselName}</strong><span>{fmt(x.dwt,0)}</span><span>{fmt(x.loa,1)}</span><span>{x.fromRaw}</span><span>{x.agent??"—"}</span></a>)}</div></section>
      <div className="portScopeNotice"><strong>Provenance:</strong> {data.source.label} · trạng thái <b>{data.source.dataStatus}</b> · {data.ingestion.storedRows.toLocaleString("vi-VN")} rows trong D1.</div>
    </>}
  </>;
}

function PHPDashboard({data,quote}:{data:PortOverviewResponse;quote?:StockQuote}){
  const m=metricMap(data.metrics); const cards=[m.get("php-throughput-2025"),m.get("php-teu-2025"),m.get("php-revenue-2025"),m.get("php-pbt-2025")].filter(Boolean) as PortMetric[];
  return <><section className="portPanel portEntityHero"><div><span className="portEyebrow">PHP · UPCOM</span><h2>Công ty Cổ phần Cảng Hải Phòng</h2><p>Company layer: official business KPI + terminal intelligence + stock engine.</p></div>{quote&&<div className="portEntityPrice"><strong className={stockClass(quote.changePercent)}>{quote.matchPrice==null?"—":quote.matchPrice.toLocaleString("vi-VN")}</strong><span className={stockClass(quote.changePercent)}>{quote.changePercent==null?"—":`${quote.changePercent>0?"+":""}${quote.changePercent.toFixed(2)}%`}</span><small>VOL/AVG {quote.volumeVsAvg20==null?"—":`${quote.volumeVsAvg20.toFixed(2)}x`}</small></div>}</section><div className="portKpiGrid">{cards.map(x=><article className="portKpiCard" key={x.id}><span>{x.label}</span><strong>{fmt(x.value)} <em>{x.unit}</em></strong><small>{x.period}</small><SourceChip sourceId={x.sourceId} data={data}/></article>)}</div><section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Operating structure</h3></div></div><div className="portTerminalBoard"><div><strong>Tân Vũ</strong><span>PHP trực tiếp · live collector hỗ trợ</span></div><div><strong>Chùa Vẽ</strong><span>PHP · live collector hỗ trợ</span></div><div><strong>Hoàng Diệu</strong><span>PHP · mapping cần theo dõi phạm vi hoạt động</span></div><div className="hot"><strong>HTIT · Lạch Huyện 3–4</strong><span>Nước sâu · live collector hỗ trợ</span></div></div></section><section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Operating ↔ Financial</h3></div><span className="portMuted">DWT không dùng để suy doanh thu trực tiếp</span></div><div className="portRelationGrid"><div><span>Hàng hóa thông qua 2025</span><strong>42,67 triệu tấn</strong></div><div><span>Container 2025</span><strong>2,07 triệu TEU</strong></div><div><span>Doanh thu 2025</span><strong>3.545 tỷ</strong></div><div><span>LNTT 2025</span><strong>1.280 tỷ</strong></div></div></section></>;
}



function assetStatusLabel(x:string){return x==="OPERATING"?"Đang vận hành":x==="EXPANDING"?"Đang mở rộng":"Đang xây dựng"}
function assetTypeClass(x:string){return x==="DEEP_SEA_PORT"?"deep":x==="ICD"?"icd":x==="RIVER_PORT"?"river":"sea"}
function GmdPortfolio({data,quote,setSymbol,options}:{data:PortCompanyPortfolio|null;quote?:StockQuote;setSymbol:(v:string)=>void;options:Array<{symbol:string;name:string}>}){
 if(!data)return <section className="portPanel">Đang tải GMD Asset Portfolio…</section>;
 return <>
  <section className="portPanel portEntityHero"><div><span className="portEyebrow">COMPANY & ASSET PORTFOLIO · V8.15</span><h2>GMD · Gemadept</h2><p>Company layer chỉ trả lời Gemadept sở hữu/vận hành tài sản nào, ở đâu và vai trò/capacity của từng asset. Ship-call, route và DWT chi tiết để ở Terminal layer.</p></div><div className="portCompanyPicker"><select className="portTerminalSelect" value="GMD" onChange={e=>setSymbol(e.target.value)}>{options.map(x=><option key={x.symbol} value={x.symbol}>{x.symbol} · {x.name}</option>)}</select>{quote&&<div className="portEntityPrice"><strong className={stockClass(quote.changePercent)}>{quote.matchPrice==null?"—":quote.matchPrice.toLocaleString("vi-VN")}</strong><span className={stockClass(quote.changePercent)}>{quote.changePercent==null?"—":`${quote.changePercent>0?"+":""}${quote.changePercent.toFixed(2)}%`}</span></div>}</div></section>
  <div className="portKpiGrid"><article className="portKpiCard"><span>Port & ICD network</span><strong>{data.summary.assetCount}</strong><small>Bắc · Trung · Nam</small></article><article className="portKpiCard"><span>System capacity</span><strong>{data.summary.currentSystemCapacityTeu==null?"—":`${fmtCompact(data.summary.currentSystemCapacityTeu)} TEU`}</strong><small>Gemadept system-level · không phân bổ ngược</small></article><article className="portKpiCard"><span>Berth length</span><strong>{data.summary.berthLengthKm==null?"—":`${data.summary.berthLengthKm} km`}</strong><small>current system disclosure</small></article><article className="portKpiCard"><span>Classification</span><strong>Multi-port</strong><small>Port + Logistics</small></article></div>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Asset Portfolio</h3></div><span className="portMuted">6 Ports & ICDs · official Gemadept registry</span></div><div className="portAssetRegions">{(["Bắc","Trung","Nam"] as const).map(region=><div className="portAssetRegion" key={region}><h4>MIỀN {region.toUpperCase()}</h4><div className="portAssetGrid">{data.assets.filter(a=>a.region===region).map(a=><article className={`portAssetCard ${assetTypeClass(a.type)}`} key={a.id}><div className="portAssetHead"><div><strong>{a.name}</strong><span>{a.typeLabel}</span></div><em>{assetStatusLabel(a.status)}</em></div><p>{a.role}</p><div className="portAssetFacts"><div><span>Operator</span><b>{a.operator}</b></div><div><span>Capacity</span><b>{a.capacityTeu==null?"—":`${a.capacityComparator??""}${fmtCompact(a.capacityTeu)} TEU/y`}</b></div><div><span>Max DWT</span><b>{a.maxDwt==null?"—":fmtCompact(a.maxDwt)}</b></div><div><span>Area</span><b>{a.areaHa==null?"—":`${a.areaHa} ha`}</b></div></div>{a.ownershipPct!=null&&<div className="portAssetOwnership"><span>GMD <b>{a.ownershipPct}%</b></span><span>{a.partner} <b>{a.partnerOwnershipPct}%</b></span></div>}<small>{a.note}</small><a href={a.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a></article>)}</div></div>)}</div></section>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Ownership & Strategic Partnerships</h3></div></div><div className="portGmdOwnership"><article><strong>Gemalink</strong><div><span>Gemadept</span><b>75%</b></div><div><span>CMA Terminals / CMA CGM</span><b>25%</b></div><p>Chỉ hiển thị tỷ lệ được nguồn chính thức Gemadept/Gemalink xác nhận. Asset khác để “—” nếu chưa có disclosure cùng scope.</p></article></div></section>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">03</span><h3>Capacity & Expansion Timeline</h3></div><span className="portMuted">ACTUAL ≠ UNDER CONSTRUCTION</span></div><div className="portCapacityEvents">{data.capacityEvents.map(e=><article key={e.id}><span>{e.date}</span><div><strong>{e.label}</strong><p>{e.note}</p><a href={e.sourceUrl} target="_blank" rel="noreferrer">Official source ↗</a></div><em className={e.status==="ACTUAL"?"actual":"estimate"}>{e.status}</em></article>)}</div></section>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">04</span><h3>Related ecosystem — tách khỏi Port & ICD</h3></div></div>{data.relatedAssets.map(x=><div className="portRelatedAsset" key={x.name}><div><strong>{x.name}</strong><span>{x.type.replace(/_/g," ")}</span></div><p>{x.note}</p><a href={x.officialUrl} target="_blank" rel="noreferrer">Nguồn ↗</a></div>)}</section>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">05</span><h3>Data guardrails</h3></div></div><div className="portMethodList">{data.methodology.map((x,i)=><div key={i}><b>{i+1}</b><span>{x}</span></div>)}</div><p className="portFootnote">{data.summary.note}</p></section>
 </>;
}

function CompanyDashboard({symbol,setSymbol,options,data,quote}:{symbol:string;setSymbol:(v:string)=>void;options:Array<{symbol:string;name:string}>;data:PortCompanyIntelligence|null;quote?:StockQuote}){
  return <>
    <section className="portPanel portEntityHero"><div><span className="portEyebrow">COMPANY INTELLIGENCE · V8.10</span><h2>{data?.symbol ?? symbol} · {data?.name ?? "Đang tải…"}</h2><p>Aggregate các terminal đã được registry cho doanh nghiệp. DWT/ship-call là leading operating proxy; capacity và ownership chỉ hiển thị khi có nguồn được kiểm soát.</p></div><div className="portCompanyPicker"><select className="portTerminalSelect" value={symbol} onChange={e=>setSymbol(e.target.value)}>{options.map(x=><option key={x.symbol} value={x.symbol}>{x.symbol} · {x.name}</option>)}</select>{quote&&<div className="portEntityPrice"><strong className={stockClass(quote.changePercent)}>{quote.matchPrice==null?"—":quote.matchPrice.toLocaleString("vi-VN")}</strong><span className={stockClass(quote.changePercent)}>{quote.changePercent==null?"—":`${quote.changePercent>0?"+":""}${quote.changePercent.toFixed(2)}%`}</span></div>}</div></section>
    {!data?<div className="portPanel">Đang tải Company Intelligence…</div>:<>
      <div className="portKpiGrid"><article className="portKpiCard"><span>DWT · {data.days} ngày</span><strong>{fmtCompact(data.summary.dwt)}</strong><small>arrival proxy</small></article><article className="portKpiCard"><span>Ship calls</span><strong>{fmt(data.summary.shipCalls,0)}</strong><small>{data.summary.terminalCount} terminal registry</small></article><article className="portKpiCard"><span>Avg DWT</span><strong>{fmtCompact(data.summary.avgDwt)}</strong><small>mỗi call</small></article><article className="portKpiCard"><span>Capacity registry</span><strong>{data.summary.capacityTeu==null?"—":fmtCompact(data.summary.capacityTeu)}</strong><small>{data.summary.capacityTeu==null?"chưa đủ official capacity":"TEU/năm · không phải actual throughput"}</small></article></div>
  
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Terminal contribution</h3></div><span className="portMuted">Share theo DWT proxy</span></div><div className="portRankList">{data.terminalStats.map((x,i)=><div key={x.terminal}><span>{i+1}. {x.terminalLabel}</span><b>{x.shareDwtPct.toFixed(1)}%</b><em>{fmtCompact(x.dwt)} · {x.shipCalls} calls</em></div>)}</div></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Monthly DWT & YoY</h3></div><span className="portMuted">YoY = — nếu lịch sử chưa đủ 12 tháng</span></div><div className="portChartBox"><ResponsiveContainer width="100%" height={280}><BarChart data={data.monthly}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month"/><YAxis tickFormatter={x=>fmtCompact(Number(x))}/><Tooltip formatter={(v:any)=>[Number(v).toLocaleString("vi-VN"),"DWT"]}/><Bar dataKey="dwt" fill="currentColor" className="portChartBar" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div><div className="portYoyGrid">{data.monthly.slice(-6).map(x=><div key={x.month}><span>{x.month}</span><strong>{fmtCompact(x.dwt)}</strong><em className={x.yoyDwtPct==null?"ref":stockClass(x.yoyDwtPct)}>{x.yoyDwtPct==null?"YoY —":`${x.yoyDwtPct>0?"+":""}${x.yoyDwtPct.toFixed(1)}% YoY`}</em></div>)}</div></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">03</span><h3>Terminal registry</h3></div></div><div className="portCompanyGrid">{data.terminals.map(t=><article className="portCompanyCard" key={t.code}><div className="portCompanyTitle"><strong>{t.label}</strong><span>{t.capacityTeu==null?"Capacity —":`${fmtCompact(t.capacityTeu)} TEU/năm`}</span></div><p>{t.ownershipNote}</p><a href={t.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a></article>)}</div></section>
      <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">04</span><h3>Route mix</h3></div></div><div className="portRankList">{data.routes.map((x,i)=><div key={x.route}><span>{i+1}. {x.route}</span><b>{x.shareDwtPct.toFixed(1)}%</b><em>{x.shipCalls} calls</em></div>)}</div></section>
      <OwnershipPanel relationships={(data as any).relationships ?? []} />
      <div className="portScopeNotice"><strong>Data guardrails:</strong> {data.caveats.join(" · ")}</div>
    </>}
  </>;
}




function historyKindClass(kind:string){return kind==="ACTUAL"?"actual":kind==="ESTIMATE"?"estimate":"target"}
function unitLabel(x:PortThroughputHistoryPoint){return x.unit==="TEU"?"TEU":"tấn"}

function ThroughputHistoryPanel({data}:{data:PortThroughputHistoryResponse|null}) {
  const [filter,setFilter]=useState("ALL");
  if(!data)return <section className="portPanel">Đang tải historical throughput…</section>;
  const companies=["ALL",...data.coverage.companies];
  const rows=data.throughput.filter(x=>filter==="ALL"||x.companySymbol===filter)
    .slice().sort((a,b)=>b.periodOrder.localeCompare(a.periodOrder));

  return <>
    <section className="portPanel">
      <div className="portSectionHead">
        <div><span className="portSectionIndex">HIS</span><h3>Historical Throughput Registry</h3></div>
        <span className="portMuted">{data.coverage.actualPointCount} actual · {data.coverage.estimatePointCount} estimate · {data.coverage.targetPointCount} target</span>
      </div>
      <div className="portHistoryFilter">{companies.map(x=><button key={x} className={filter===x?"active":""} onClick={()=>setFilter(x)}>{x==="ALL"?"Tất cả":x}</button>)}</div>
      <div className="portHistoryRegistry">
        {rows.map(x=><article key={x.id}>
          <div className="portHistoryMain">
            <div><b>{x.companySymbol}</b><strong>{x.assetLabel}</strong><span>{x.scope.replace(/_/g," ")}</span></div>
            <em className={`portDataKind ${historyKindClass(x.kind)}`}>{x.kind}</em>
          </div>
          <div className="portHistoryNumbers">
            <div><span>PERIOD</span><strong>{x.period}</strong></div>
            <div><span>THROUGHPUT</span><strong>{fmtCompact(x.value)} {unitLabel(x)}</strong></div>
            <div><span>YOY</span><strong className={x.yoyPct==null?"ref":stockClass(x.yoyPct)}>{x.yoyPct==null?"—":`${x.yoyPct>0?"+":""}${x.yoyPct.toFixed(1)}%`}</strong></div>
          </div>
          <p>{x.note}</p>
          <a href={x.sourceUrl} target="_blank" rel="noreferrer">{x.sourceLabel} ↗</a>
        </article>)}
      </div>
    </section>

    <section className="portPanel">
      <div className="portSectionHead"><div><span className="portSectionIndex">CAP</span><h3>Capacity Timeline</h3></div><span className="portMuted">Effective-date aware</span></div>
      <div className="portCapacityTimeline">
        {data.capacityTimeline.map(x=><article key={x.id}>
          <div><b>{x.companySymbol}</b><strong>{x.assetLabel}</strong></div>
          <div className="portCapacityValue"><span>{x.comparator==="GT"?">":x.comparator==="GTE"?"≥":""}</span><b>{fmtCompact(x.capacityTeu)} TEU/y</b></div>
          <small>{x.effectiveFrom??"start —"} → {x.effectiveTo??"current"}</small>
          <p>{x.note}</p>
          <a href={x.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a>
        </article>)}
      </div>
    </section>

    <section className="portPanel portLimitPanel">
      <div className="portSectionHead"><div><span className="portSectionIndex">!</span><h3>Coverage & limitations</h3></div></div>
      <ul>{data.limitations.map(x=><li key={x}>{x}</li>)}</ul>
    </section>
  </>;
}

function ThroughputCapacityDashboard({data}:{data:PortThroughputCapacityResponse|null}) {
  if(!data)return <div className="portPanel">Đang tải throughput/capacity…</div>;
  const kind=(x:string)=>x==="ACTUAL"?"Actual":x==="ESTIMATE"?"Estimate":x==="TARGET"?"Target":"Disclosure";
  return <><section className="portPanel portEntityHero"><div><span className="portEyebrow">V8.13 · HISTORICAL THROUGHPUT + CAPACITY TIMELINE</span><h2>Throughput & Capacity</h2><p>Chỉ dùng disclosure chính thức. Actual / Estimate / Target tách riêng; utilization không suy từ DWT hoặc ghép số khác phạm vi.</p></div></section>
  <div className="portThroughputGrid">{data.data.map(x=><article className="portThroughputCard" key={x.id}><div className="portThroughputHead"><div><b>{x.companySymbol}</b><strong>{x.assetLabel}</strong><span>{x.region} · {x.period}</span></div><em className={`portDataKind ${x.throughputKind.toLowerCase()}`}>{kind(x.throughputKind)}</em></div><div className="portThroughputMetrics"><div><span>THROUGHPUT</span><strong>{x.throughputTeu==null?"—":`${fmtCompact(x.throughputTeu)} TEU`}</strong><small>{x.throughputLabel}</small></div><div><span>CAPACITY</span><strong>{x.capacityTeu==null?"—":`${fmtCompact(x.capacityTeu)} TEU/y`}</strong><small>{x.capacityAsOf?`as of ${x.capacityAsOf}`:"chưa đủ nguồn cùng scope"}</small></div><div><span>UTILIZATION</span><strong>{x.utilizationPct==null?"—":`${x.utilizationPct.toFixed(1)}%`}</strong><small>{x.utilizationKind==="UNAVAILABLE"?"không suy đoán":`${x.utilizationKind.toLowerCase()} utilization`}</small></div></div><p>{x.note}</p><a href={x.sourceUrl} target="_blank" rel="noreferrer">{x.sourceLabel} ↗</a></article>)}</div>
  <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">M</span><h3>Methodology guardrails</h3></div></div><div className="portMethodList">{data.methodology.map((x,i)=><div key={i}><b>{i+1}</b><span>{x}</span></div>)}</div></section></>;
}

function ComparisonDashboard({data,quotes}:{data:PortCompanyComparison|null;quotes:StockQuote[]}) {
  if(!data) return <div className="portPanel">Đang tải Company Comparison…</div>;
  const qMap = new Map(quotes.map(x=>[x.code,x]));
  return <>
    <section className="portPanel portEntityHero">
      <div>
        <span className="portEyebrow">PORT COMPANY MONITOR · V8.11</span>
        <h2>So sánh doanh nghiệp cảng Hải Phòng</h2>
        <p>
          DWT/ship-call dùng arrival proxy từ terminal registry đã xác minh. Tỷ trọng ở đây chỉ là
          <b> share trong tập tracked-company DWT</b>, không phải thị phần TEU/toàn ngành.
        </p>
      </div>
      <div className="portPendingBadge">{data.days}D OPERATING WINDOW</div>
    </section>

    <section className="portPanel">
      <div className="portSectionHead">
        <div><span className="portSectionIndex">01</span><h3>Operating momentum</h3></div>
        <span className="portMuted">YoY = — nếu backfill chưa đủ cùng tháng năm trước</span>
      </div>
      <div className="portComparisonGrid">
        {data.rows.map((x,i)=>{
          const q=qMap.get(x.symbol);
          return <article className="portComparisonCard" key={x.symbol}>
            <div className="portComparisonHead">
              <div><b>{i+1}</b><strong>{x.symbol}</strong><span>{x.name}</span></div>
              {q && <em className={stockClass(q.changePercent)}>{q.changePercent==null?"—":`${q.changePercent>0?"+":""}${q.changePercent.toFixed(2)}%`}</em>}
            </div>
            <div className="portComparisonMetrics">
              <div><span>DWT {data.days}D</span><strong>{fmtCompact(x.dwt)}</strong></div>
              <div><span>Calls</span><strong>{fmt(x.shipCalls,0)}</strong></div>
              <div><span>Avg DWT</span><strong>{fmtCompact(x.avgDwt)}</strong></div>
              <div><span>Tracked share</span><strong>{x.shareOfTrackedDwtPct.toFixed(1)}%</strong></div>
            </div>
            <div className="portComparisonFooter">
              <span>{x.latestMonth ?? "—"}</span>
              <b className={x.latestMonthYoyPct==null?"ref":stockClass(x.latestMonthYoyPct)}>
                {x.latestMonthYoyPct==null?"YoY —":`${x.latestMonthYoyPct>0?"+":""}${x.latestMonthYoyPct.toFixed(1)}% YoY`}
              </b>
            </div>
          </article>
        })}
      </div>
      <p className="portFootnote">{data.note}</p>
    </section>
  </>;
}

function OwnershipPanel({relationships}:{relationships:PortRelationship[]}) {
  return <section className="portPanel">
    <div className="portSectionHead">
      <div><span className="portSectionIndex">REL</span><h3>Ownership / operator registry</h3></div>
      <span className="portMuted">Chỉ hiển thị quan hệ có nguồn chính thức</span>
    </div>
    <div className="portOwnershipList">
      {relationships.map((x,i)=><article key={`${x.companySymbol}-${x.terminalCode}-${i}`}>
        <div>
          <strong>{x.terminalLabel ?? x.relatedCompany ?? x.companySymbol}</strong>
          <span>{x.relationshipType.replace(/_/g, " ")}</span>
        </div>
        <div className="portOwnershipPct">
          <b>{x.ownershipPct==null?"—":`${x.ownershipPct.toFixed(x.ownershipPct%1?2:0)}%`}</b>
          <small>{x.asOf}</small>
        </div>
        <p>{x.note}</p>
        <a href={x.sourceUrl} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a>
      </article>)}
    </div>
  </section>;
}

function HistoryProgress({history}:{history:PortHistoryStatus|null}) {
  if(!history) return null;
  return <section className="portPanel">
    <div className="portSectionHead">
      <div><span className="portSectionIndex">HIS</span><h3>Historical backfill</h3></div>
      <span className={history.targetReached?"up":"ref"}>{history.progressPct.toFixed(1)}%</span>
    </div>
    <div className="portHistoryTrack"><i style={{width:`${Math.min(100,history.progressPct)}%`}} /></div>
    <div className="portHistoryMeta">
      <span>Earliest <b>{history.earliestPlanDate ?? "—"}</b></span>
      <span>Latest <b>{history.latestPlanDate ?? "—"}</b></span>
      <span>Arrival rows <b>{history.arrivalRows.toLocaleString("vi-VN")}</b></span>
      <span>Target <b>{history.targetDays} ngày (~18 tháng)</b></span>
    </div>
    <p className="portFootnote">
      Cron backfill 21 ngày dữ liệu mỗi ngày cho đến target. YoY chỉ hiện khi có cùng tháng năm trước.
    </p>
  </section>;
}

function Sources({data}:{data:PortOverviewResponse}){return <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">SRC</span><h3>Nguồn dữ liệu & trạng thái</h3></div></div><div className="portSourceList">{data.sources.map(src=><a key={src.id} href={src.url} target="_blank" rel="noreferrer"><strong>{src.label}</strong><span>{src.organization} · {src.coverage}</span><small>{src.updateCadence}{src.note?` · ${src.note}`:""}</small><em className={`sourceState ${src.status}`}>{src.status}</em></a>)}<a href="https://csdltau.cangvuhaiphong.gov.vn/pages/ship_plan.aspx?d=0" target="_blank" rel="noreferrer"><strong>CSDL kế hoạch điều động tàu Hải Phòng</strong><span>Cảng vụ Hàng hải Hải Phòng · tàu vào/rời/di chuyển + DWT/LOA/mớn nước/tuyến/đại lý</span><small>V8.10 collector · 4 giờ/lần</small><em className="sourceState tracked">tracked</em></a></div></section>}

function CompanyRegistryOnly({company,setSymbol,options,quote}:{company:PortCompany;setSymbol:(v:string)=>void;options:Array<{symbol:string;name:string}>;quote?:StockQuote}){
  return <>
    <section className="portPanel portEntityHero"><div><span className="portEyebrow">COMPANY REGISTRY · V8.14</span><h2>{company.symbol} · {company.name}</h2><p>{company.focus}</p></div><div className="portCompanyPicker"><select className="portTerminalSelect" value={company.symbol} onChange={e=>setSymbol(e.target.value)}>{options.map(x=><option key={x.symbol} value={x.symbol}>{x.symbol} · {x.name}</option>)}</select>{quote&&<div className="portEntityPrice"><strong className={stockClass(quote.changePercent)}>{quote.matchPrice==null?"—":quote.matchPrice.toLocaleString("vi-VN")}</strong><span className={stockClass(quote.changePercent)}>{quote.changePercent==null?"—":`${quote.changePercent>0?"+":""}${quote.changePercent.toFixed(2)}%`}</span></div>}</div></section>
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">REG</span><h3>Thông tin universe</h3></div></div><div className="portRegistryFacts"><div><span>Sàn</span><strong>{company.exchange??"—"}</strong></div><div><span>Khu vực</span><strong>{company.locality??company.region}</strong></div><div><span>Phân loại</span><strong>{company.classificationLabel??"—"}</strong></div><div><span>Verified</span><strong>{company.verifiedAsOf??"—"}</strong></div></div>{company.terminals.length>0&&<div className="portTerminalTags">{company.terminals.map(x=><span key={x}>{x}</span>)}</div>}<div className="portRegistryLinks">{company.officialUrl&&<a href={company.officialUrl} target="_blank" rel="noreferrer">Trang doanh nghiệp ↗</a>}{company.exchangeSourceUrl&&<a href={company.exchangeSourceUrl} target="_blank" rel="noreferrer">Nguồn niêm yết ↗</a>}</div></section>
    <div className="portScopeNotice"><strong>Detail status:</strong> mã đã nằm trong Port Universe nhưng Company Intelligence chi tiết chưa production-ready. V8.14 không lấy dữ liệu của doanh nghiệp khác để lấp chỗ trống.</div>
  </>;
}

export function PortIndustryTab(){
  const [view,setView]=useState<PortView>("overview");
  const [data,setData]=useState<PortOverviewResponse|null>(null);
  const [nationalDashboard,setNationalDashboard]=useState<NationalPortDashboardResponse|null>(null);
  const [sourceHealth,setSourceHealth]=useState<PortSourceHealthResponse|null>(null);
  const [quotes,setQuotes]=useState<StockQuote[]>([]);
  const [harbor,setHarbor]=useState<PortHarborSummary|null>(null);
  const [history,setHistory]=useState<PortHistoryStatus|null>(null);
  const [terminal,setTerminal]=useState("HTIT");
  const [terminalData,setTerminalData]=useState<PortTerminalAnalytics|null>(null);
  const [terminalOptions,setTerminalOptions]=useState<Array<{code:string;label:string}>>([{code:"HTIT",label:"HTIT · Lạch Huyện 3–4"}]);
  const [company,setCompany]=useState("PHP");
  const [companyData,setCompanyData]=useState<PortCompanyIntelligence|null>(null);
  const [companyPortfolio,setCompanyPortfolio]=useState<PortCompanyPortfolio|null>(null);
  const [companyOptions,setCompanyOptions]=useState<Array<{symbol:string;name:string}>>([]);
  const [intelligenceSymbols,setIntelligenceSymbols]=useState<string[]>([]);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    getPortOverview().then((r)=>{setData(r);setCompanyOptions((r.companies??[]).map((x:PortCompany)=>({symbol:x.symbol,name:x.name}))) }).catch(e=>setError(String(e)));
    getNationalPortDashboard().then(setNationalDashboard).catch(()=>setNationalDashboard(null));
    getPortSourceHealth().then(setSourceHealth).catch(()=>setSourceHealth(null));
    getTrackedPortTerminals().then(r=>setTerminalOptions(r.data??[])).catch(()=>undefined);
    getPortCompanies().then(r=>setIntelligenceSymbols((r.data??[]).map((x:any)=>x.symbol))).catch(()=>undefined);
  },[]);

  useEffect(()=>{
    if(view!=="regions") return;
    getPortHaiphongSummary(30).then(setHarbor).catch(e=>setError(String(e)));
    getPortHistoryStatus().then(setHistory).catch(()=>undefined);
  },[view]);

  useEffect(()=>{
    if(view!=="terminal") return;
    setTerminalData(null);
    getPortTerminalAnalytics(terminal,90,24).then(setTerminalData).catch(e=>setError(String(e)));
  },[view,terminal]);

  useEffect(()=>{
    if(view!=="company") return;
    setCompanyData(null);
    if(intelligenceSymbols.includes(company)){
      Promise.all([getPortCompanyIntelligence(company,90,24),getPortRelationships(company)]).then(([d,r])=>setCompanyData({...d,relationships:r.data??[]} as any)).catch(e=>setError(String(e)));
    }
    getStockQuotes([company]).then(r=>setQuotes(r.data??[])).catch(()=>setQuotes([]));
  },[view,company,intelligenceSymbols]);

  useEffect(()=>{
    if(view!=="company" || company!=="GMD") { setCompanyPortfolio(null); return; }
    getPortCompanyPortfolio("GMD").then(setCompanyPortfolio).catch(e=>setError(String(e)));
  },[view,company]);

  const companyQuote=useMemo(()=>quotes.find(x=>x.code===company),[quotes,company]);
  const goCompany=(symbol:string)=>{setCompany(symbol);setView("company")};

  if(error)return <div className="portPanel">Port Industry error: {error}</div>;
  if(!data)return <div className="portPanel">Đang tải Port Industry…</div>;

  return <div className="portIndustry">
    <ResponsiveTabBar<PortView> className="portSubTabs" ariaLabel="Cảng biển" activeId={view} onChange={setView} items={[
      {id:"overview",label:"Tổng quan"},
      {id:"regions",label:"Khu vực"},
      {id:"company",label:"Doanh nghiệp"},
      {id:"terminal",label:"Terminal"},
      {id:"sources",label:"Nguồn dữ liệu"}
    ]}/>
    {view==="overview"&&<Overview data={data} nationalDashboard={nationalDashboard} sourceHealth={sourceHealth} onCompany={goCompany} onRegions={()=>setView("regions")}/>} 
    {view==="regions"&&<RegionsDashboard data={data} harbor={harbor} history={history} onCompany={goCompany} onTerminal={()=>setView("terminal")}/>} 
    {view==="company"&&(company==="GMD"?<GmdPortfolio data={companyPortfolio} setSymbol={setCompany} options={companyOptions} quote={companyQuote}/>:intelligenceSymbols.includes(company)?<CompanyDashboard symbol={company} setSymbol={setCompany} options={companyOptions} data={companyData} quote={companyQuote}/>:<CompanyRegistryOnly company={data.companies.find(x=>x.symbol===company)??data.companies[0]} setSymbol={setCompany} options={companyOptions} quote={companyQuote}/>)} 
    {view==="terminal"&&<TerminalDashboard terminal={terminal} setTerminal={setTerminal} terminalOptions={terminalOptions} data={terminalData}/>} 
    {view==="sources"&&<Sources data={data}/>} 
  </div>;
}

