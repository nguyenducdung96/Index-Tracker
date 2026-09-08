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

function Overview({data,nationalStats,onCompany,onRegions}:{data:PortOverviewResponse;nationalStats:NationalPortStatsResponse|null;onCompany:(symbol:string)=>void;onRegions:()=>void}){
  const [sort,setSort]=useState<"cargoTons"|"containerTeu"|"shipCalls"|"gtTotal">("cargoTons");
  const classifications=[{id:"ALL",label:"Tất cả"},{id:"DIRECT_PORT",label:"Cảng trực tiếp"},{id:"MULTI_PORT_LOGISTICS",label:"Đa cảng / Logistics"},{id:"HOLDING_PORT_NETWORK",label:"Holding"},{id:"RELATED_PORT_SHIPPING",label:"Liên quan"}];
  const [filter,setFilter]=useState("ALL");
  const visible=data.companies.filter(c=>filter==="ALL"||c.classification===filter);
  const regionOf=(name:string)=>/Quảng Ninh|Hải Phòng|Thái Bình|Nam Định/i.test(name)?"Bắc":/Thanh Hóa|Nghệ An|Hà Tĩnh|Quảng Bình|Quảng Trị|Huế|Đà Nẵng|Quảng Nam|Quảng Ngãi|Quy Nhơn|Nha Trang/i.test(name)?"Trung":"Nam";
  const rows=(nationalStats?.rows??[]).slice().sort((a,b)=>(b[sort]??-1)-(a[sort]??-1));
  const kpi=(label:string,value:number|null|undefined,unit:string)=><article className="portKpiCard"><span>{label}</span><strong>{value==null?"—":fmtCompact(value)}</strong><small>{unit}</small></article>;
  return <>
    <section className="portHero portPanel portOverviewHero"><div><span className="portEyebrow">INDUSTRY ENGINE · PORTS · V8.18.3A</span><h2>Cảng biển Việt Nam</h2><p>Tổng quan ngành ưu tiên dữ liệu <b>Cảng vụ chính thức</b>. Dữ liệu doanh nghiệp, terminal, ownership và ship-call chi tiết được tách xuống các tab chuyên biệt.</p></div><div className="portHeroActions"><button onClick={onRegions}>Khám phá khu vực</button><a className="portOverviewSourceBtn" href={nationalStats?.sourceUrl??"https://vimawa.gov.vn/vi/noi-dung/tau-thuyen-ra-vao-cang-bien"} target="_blank" rel="noreferrer">VIMAWA ↗</a></div></section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">00</span><h3>Toàn ngành · nguồn Cảng vụ</h3></div><span className="portMuted">VIMAWA · OFFICIAL</span></div>
      {!nationalStats?<div className="portEmpty">Đang tải dữ liệu Cảng vụ chính thức…</div>:nationalStats.dataStatus!=="LIVE_PARSED"?<div className="portScopeNotice"><strong>Nguồn tạm thời chưa đọc được.</strong> {nationalStats.note}</div>:<>
        <div className="portKpiGrid">{kpi("Tổng lượt tàu",nationalStats.totals.shipCalls,"lượt")}{kpi("Tổng hàng hóa",nationalStats.totals.cargoTons,"tấn")}{kpi("Container",nationalStats.totals.containerTeu,"TEU")}{kpi("Cảng vụ coverage",nationalStats.totals.authorities,"đơn vị")}</div>
        <div className="portScopeNotice"><strong>Data policy:</strong> Aggregate trực tiếp từ bảng Cảng vụ của VIMAWA. GT là Gross Tonnage; không đổi GT thành DWT và không dùng DWT làm sản lượng hàng hóa.</div>
      </>}
    </section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Hoạt động theo Cảng vụ</h3></div><div className="portTrendControls"><div className="portMetricSwitch"><button className={sort==="cargoTons"?"active":""} onClick={()=>setSort("cargoTons")}>Hàng hóa</button><button className={sort==="containerTeu"?"active":""} onClick={()=>setSort("containerTeu")}>TEU</button><button className={sort==="shipCalls"?"active":""} onClick={()=>setSort("shipCalls")}>Lượt tàu</button><button className={sort==="gtTotal"?"active":""} onClick={()=>setSort("gtTotal")}>GT</button></div></div></div>
      {!rows.length?<div className="portEmpty">Chưa đọc được bảng Cảng vụ từ nguồn official.</div>:<div className="portTableWrap"><table className="portTable"><thead><tr><th>Cảng vụ</th><th>Vùng</th><th>Lượt tàu</th><th>GT</th><th>Hàng hóa</th><th>TEU</th></tr></thead><tbody>{rows.map(r=><tr key={r.authority}><td><strong>{r.authority}</strong></td><td>{regionOf(r.authority)}</td><td>{fmt(r.shipCalls,0)}</td><td>{fmtCompact(r.gtTotal)}</td><td>{fmtCompact(r.cargoTons)}</td><td>{fmtCompact(r.containerTeu)}</td></tr>)}</tbody></table></div>}
      <p className="portFootnote">Nguồn: VIMAWA – “Tàu thuyền ra, vào cảng biển”. Bảng giữ nguyên scope Cảng vụ; không phân bổ xuống doanh nghiệp/terminal.</p>
    </section>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Doanh nghiệp cảng niêm yết</h3></div><span className="portMuted">{data.companies.length} mã · verified registry</span></div><p className="portOverviewIntro">Danh sách universe để điều hướng sang tab Doanh nghiệp; không dùng KPI doanh nghiệp để đại diện National Overview.</p><div className="portUniverseFilters">{classifications.map(x=><button key={x.id} className={filter===x.id?"active":""} onClick={()=>setFilter(x.id)}>{x.label}</button>)}</div><div className="portUniverseGrid">{visible.map(c=><button className="portUniverseCard" key={c.symbol} onClick={()=>onCompany(c.symbol)}><div className="portUniverseTop"><strong>{c.symbol}</strong><span>{c.exchange}</span><em>{c.locality}</em></div><h4>{c.name}</h4><p>{c.classificationLabel}</p><small>{c.focus}</small><div className="portUniverseFooter"><span>● Đã xác minh</span><b>Chi tiết →</b></div></button>)}</div></section>
  </>;
}

function RegionsDashboard({data,harbor,history,onCompany,onTerminal}:{data:PortOverviewResponse;harbor:PortHarborSummary|null;history:PortHistoryStatus|null;onCompany:(s:string)=>void;onTerminal:()=>void}){
  const [selected,setSelected]=useState("haiphong");
  const coverage=data.regionCoverage??[];
  const current=coverage.find(x=>x.id===selected)??coverage[0];
  return <>
    <section className="portPanel portEntityHero"><div><span className="portEyebrow">KHU VỰC / CẢNG VỤ</span><h2>Dữ liệu vận hành theo khu vực</h2><p>Hải Phòng không phải top-level riêng; đây chỉ là một region trong kiến trúc nationwide. Khu vực chưa có collector chỉ hiện trạng thái nguồn.</p></div></section>
    <div className="portRegionPicker">{coverage.map(x=><button key={x.id} className={selected===x.id?"active":""} onClick={()=>setSelected(x.id)}><strong>{x.label}</strong><span className={`coverageState ${x.status}`}>{x.status==="live"?"LIVE":x.status==="source-found"?"SOURCE":"RESEARCH"}</span></button>)}</div>
    {current?.id==="haiphong"?<><HarborDashboard data={harbor}/><HistoryProgress history={history}/><section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">LINK</span><h3>Đi sâu từ Hải Phòng</h3></div></div><div className="portRegionLinks"><button onClick={()=>onCompany("PHP")}>Doanh nghiệp PHP →</button><button onClick={onTerminal}>Terminal Intelligence →</button></div></section></>:<section className="portPanel portRegionPending"><div><span className={`coverageState ${current?.status}`}>{current?.status==="source-found"?"SOURCE FOUND":"RESEARCH"}</span><h3>{current?.label}</h3><p>{current?.detail}</p>{current?.officialUrl&&<a href={current.officialUrl} target="_blank" rel="noreferrer">Mở nguồn chính thức ↗</a>}<small>V8.14 không dựng KPI giả khi collector chưa được production-validate.</small></div></section>}
  </>;
}

function HarborDashboard({data}:{data:PortHarborSummary|null}){
  if(!data)return <div className="portPanel">Đang tải dữ liệu Hải Phòng…</div>;
  return <>
    <section className="portPanel portEntityHero"><div><span className="portEyebrow">CẢNG VỤ HÀNG HẢI HẢI PHÒNG</span><h2>Hải Phòng · Ship-plan Intelligence</h2><p>Aggregate từ các record <b>tàu vào cảng</b> có terminal được normalize. Đây là kế hoạch điều động chính thức, chưa mặc định là actual realized call.</p></div><a className="companyHomepageButton" href={data.source.url} target="_blank" rel="noreferrer">Nguồn chính thức ↗</a></section>
    <div className="portKpiGrid"><article className="portKpiCard"><span>DWT · {data.days} ngày</span><strong>{fmtCompact(data.summary.dwt)}</strong><small>trọng tải thiết kế tàu</small></article><article className="portKpiCard"><span>Ship calls</span><strong>{fmt(data.summary.shipCalls,0)}</strong><small>arrival convention</small></article><article className="portKpiCard"><span>Avg DWT</span><strong>{fmtCompact(data.summary.avgDwt)}</strong><small>mỗi ship call</small></article><article className="portKpiCard"><span>Largest vessel</span><strong>{fmtCompact(data.summary.maxDwt)}</strong><small>DWT</small></article></div>

    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>DWT theo ngày</h3></div><span className="portMuted">Cập nhật: {data.ingestion.lastOkAt?new Date(data.ingestion.lastOkAt).toLocaleString("vi-VN"):"chờ collector"}</span></div><MiniDailyChart rows={data.daily}/></section>
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Top terminal theo DWT</h3></div></div><div className="portRankList">{data.topTerminals.map((x,i)=><div key={x.terminal}><span>{i+1}. {x.terminalLabel}</span><b>{fmtCompact(x.dwt)}</b><em>{x.shipCalls} calls</em></div>)}</div></section>
    {data.ingestion.lastError&&<div className="portScopeNotice"><strong>Collector error:</strong> {data.ingestion.lastError}</div>}
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
  const [nationalStats,setNationalStats]=useState<NationalPortStatsResponse|null>(null);
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
    getNationalPortStats().then(setNationalStats).catch(()=>setNationalStats(null));
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
    {view==="overview"&&<Overview data={data} nationalStats={nationalStats} onCompany={goCompany} onRegions={()=>setView("regions")}/>} 
    {view==="regions"&&<RegionsDashboard data={data} harbor={harbor} history={history} onCompany={goCompany} onTerminal={()=>setView("terminal")}/>} 
    {view==="company"&&(company==="GMD"?<GmdPortfolio data={companyPortfolio} setSymbol={setCompany} options={companyOptions} quote={companyQuote}/>:intelligenceSymbols.includes(company)?<CompanyDashboard symbol={company} setSymbol={setCompany} options={companyOptions} data={companyData} quote={companyQuote}/>:<CompanyRegistryOnly company={data.companies.find(x=>x.symbol===company)??data.companies[0]} setSymbol={setCompany} options={companyOptions} quote={companyQuote}/>)} 
    {view==="terminal"&&<TerminalDashboard terminal={terminal} setTerminal={setTerminal} terminalOptions={terminalOptions} data={terminalData}/>} 
    {view==="sources"&&<Sources data={data}/>} 
  </div>;
}

