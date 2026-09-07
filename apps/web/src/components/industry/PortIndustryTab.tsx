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
  getPortCompanyComparison,
  getPortRelationships,
  getPortHistoryStatus
} from "../../api";
import type {
  PortCompany, PortCompanyIntelligence, PortHarborSummary, PortMetric, PortOverviewResponse,
  PortTerminalAnalytics, StockQuote, PortCompanyComparison, PortRelationship, PortHistoryStatus
} from "../../types";
import { ResponsiveTabBar } from "../ResponsiveTabBar";

type PortView = "overview" | "haiphong" | "comparison" | "company" | "terminal" | "sources";

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

function Overview({data,quotes,onPHP,onHarbor,onTerminal}:{data:PortOverviewResponse;quotes:StockQuote[];onPHP:()=>void;onHarbor:()=>void;onTerminal:()=>void}){
  const m=metricMap(data.metrics); const cards=[m.get("php-throughput-2025"),m.get("php-teu-2025"),m.get("php-revenue-2025"),m.get("php-pbt-2025")].filter(Boolean) as PortMetric[];
  return <>
    <section className="portHero portPanel"><div><span className="portEyebrow">INDUSTRY ENGINE · PORTS · V8.10</span><h2>Cảng biển Việt Nam</h2><p>V8.10 kết hợp ship-call/DWT chính thức với lớp Company Intelligence, YoY và capacity registry có kiểm soát. DWT được dùng như proxy quy mô tàu, không phải sản lượng hàng thực tế.</p></div><div className="portHeroActions"><button onClick={onHarbor}>Hải Phòng live</button><button onClick={onPHP}>PHP</button><button onClick={onTerminal}>Terminal</button></div></section>
    <div className="portScopeNotice"><strong>Data policy:</strong> ship-call dùng <b>tàu vào cảng</b> làm convention chính để tránh cộng đôi arrival + departure. Nguồn được gắn trạng thái <b>planned-movement</b>.</div>
    <div className="portKpiGrid">{cards.map(x=><article className="portKpiCard" key={x.id}><span>{x.label}</span><strong>{fmt(x.value)} <em>{x.unit}</em></strong><small>{x.period}{x.yoyPct!=null?` · ${x.yoyPct>0?"+":""}${x.yoyPct.toFixed(1)}% YoY`:""}</small><SourceChip sourceId={x.sourceId} data={data}/></article>)}</div>
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">01</span><h3>Cổ phiếu cảng theo dõi</h3></div><span className="portMuted">VNDIRECT Stock Engine</span></div><StockStrip quotes={quotes}/></section>
    <section className="portPanel"><div className="portSectionHead"><div><span className="portSectionIndex">02</span><h3>Company → Terminal map</h3></div></div><div className="portCompanyGrid">{data.companies.map((c:PortCompany)=><article key={c.symbol} className="portCompanyCard"><div className="portCompanyTitle"><strong>{c.symbol}</strong><span>{c.region}</span></div><h4>{c.name}</h4><p>{c.focus}</p><div className="portTerminalTags">{c.terminals.map(t=><span key={t}>{t}</span>)}</div>{c.officialUrl&&<a href={c.officialUrl} target="_blank" rel="noreferrer">Trang chính thức ↗</a>}</article>)}</div></section>
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

export function PortIndustryTab(){
  const [view,setView]=useState<PortView>("overview"); const [data,setData]=useState<PortOverviewResponse|null>(null); const [quotes,setQuotes]=useState<StockQuote[]>([]); const [harbor,setHarbor]=useState<PortHarborSummary|null>(null); const [terminal,setTerminal]=useState("HTIT"); const [terminalData,setTerminalData]=useState<PortTerminalAnalytics|null>(null); const [terminalOptions,setTerminalOptions]=useState<Array<{code:string;label:string}>>([{code:"HTIT",label:"HTIT · Lạch Huyện 3–4"}]); const [company,setCompany]=useState("PHP"); const [companyData,setCompanyData]=useState<PortCompanyIntelligence|null>(null); const [comparison,setComparison]=useState<PortCompanyComparison|null>(null); const [relationships,setRelationships]=useState<PortRelationship[]>([]); const [history,setHistory]=useState<PortHistoryStatus|null>(null); const [companyOptions,setCompanyOptions]=useState<Array<{symbol:string;name:string}>>([{symbol:"PHP",name:"Cảng Hải Phòng"},{symbol:"GMD",name:"Gemadept"}]); const [error,setError]=useState<string|null>(null);
  useEffect(()=>{getPortOverview().then(setData).catch(e=>setError(String(e))); getTrackedPortTerminals().then(r=>setTerminalOptions(r.data??[])).catch(()=>undefined); getPortCompanies().then(r=>setCompanyOptions(r.data??[])).catch(()=>undefined); const load=()=>getStockQuotes(["PHP","DVP","DXP","GMD","VSC","PDN","HAH"]).then(r=>setQuotes(r.data??[])).catch(()=>undefined);load();const t=window.setInterval(()=>{if(!document.hidden)load()},5000);return()=>window.clearInterval(t)},[]);
  useEffect(()=>{if(view==="haiphong")getPortHaiphongSummary(30).then(setHarbor).catch(e=>setError(String(e)))},[view]);
  useEffect(()=>{if(view==="terminal"){setTerminalData(null);getPortTerminalAnalytics(terminal,90,24).then(setTerminalData).catch(e=>setError(String(e)))}},[view,terminal]);
  useEffect(()=>{if(view==="company"){setCompanyData(null);Promise.all([getPortCompanyIntelligence(company,90,24),getPortRelationships(company)]).then(([d,r])=>{setCompanyData({...d,relationships:r.data??[]} as any);setRelationships(r.data??[])}).catch(e=>setError(String(e)))}},[view,company]);
  useEffect(()=>{if(view==="comparison"){setComparison(null);getPortCompanyComparison(90,24).then(setComparison).catch(e=>setError(String(e)))}},[view]);
  useEffect(()=>{if(view==="haiphong"){getPortHistoryStatus().then(setHistory).catch(()=>undefined)}},[view]);
  const companyQuote=useMemo(()=>quotes.find(x=>x.code===company),[quotes,company]);
  if(error)return <div className="portPanel">Port Industry error: {error}</div>; if(!data)return <div className="portPanel">Đang tải Port Industry…</div>;
  return <div className="portIndustry"><ResponsiveTabBar<PortView> className="portSubTabs" ariaLabel="Cảng biển" activeId={view} onChange={setView} items={[{id:"overview",label:"Tổng quan"},{id:"haiphong",label:"Hải Phòng"},{id:"comparison",label:"So sánh DN"},{id:"company",label:"Doanh nghiệp"},{id:"terminal",label:"Terminal"},{id:"sources",label:"Nguồn dữ liệu"}]}/>{view==="overview"&&<Overview data={data} quotes={quotes} onPHP={()=>{setCompany("PHP");setView("company")}} onHarbor={()=>setView("haiphong")} onTerminal={()=>setView("terminal")}/>} {view==="haiphong"&&<><HarborDashboard data={harbor}/><HistoryProgress history={history}/></>} {view==="comparison"&&<ComparisonDashboard data={comparison} quotes={quotes}/>} {view==="company"&&<CompanyDashboard symbol={company} setSymbol={setCompany} options={companyOptions} data={companyData} quote={companyQuote}/>} {view==="terminal"&&<TerminalDashboard terminal={terminal} setTerminal={setTerminal} terminalOptions={terminalOptions} data={terminalData}/>} {view==="sources"&&<Sources data={data}/>}</div>;
}
