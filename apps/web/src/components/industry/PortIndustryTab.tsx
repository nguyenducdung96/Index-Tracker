import { useEffect, useMemo, useState } from "react";
import { getPortOverview, getStockQuotes } from "../../api";
import type { PortCompany, PortMetric, PortOverviewResponse, StockQuote } from "../../types";
import { ResponsiveTabBar } from "../ResponsiveTabBar";

type PortView = "overview" | "php" | "htit" | "sources";

function fmt(v: number | null | undefined, digits = 1) {
  if (v == null) return "—";
  return v.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

function stockClass(v: number | null | undefined) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
}

function metricMap(rows: PortMetric[]) {
  return new Map(rows.map(x => [x.id, x]));
}

function SourceChip({ sourceId, data }: { sourceId: string; data: PortOverviewResponse }) {
  const src = data.sources.find(x => x.id === sourceId);
  if (!src) return null;
  return (
    <a className="portSourceChip" href={src.url} target="_blank" rel="noreferrer">
      {src.sourceKind === "official" ? "Nguồn Nhà nước ↗" : "Nguồn DN ↗"}
    </a>
  );
}

function StockStrip({ quotes }: { quotes: StockQuote[] }) {
  return (
    <div className="portStockGrid">
      {quotes.map(q => (
        <a
          key={q.code}
          href={`https://web.fireant.vn/ma-chung-khoan/${q.code}`}
          target="_blank"
          rel="noreferrer"
          className="portStockCard"
        >
          <div>
            <strong className={stockClass(q.changePercent)}>{q.code}</strong>
            <small>{q.floor}</small>
          </div>
          <div className="portStockPrice">
            <b className={stockClass(q.changePercent)}>
              {q.matchPrice == null ? "—" : q.matchPrice.toLocaleString("vi-VN")}
            </b>
            <span className={stockClass(q.changePercent)}>
              {q.changePercent == null ? "—" : `${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`}
            </span>
          </div>
          <div className="portStockVol">
            <span>VOL {q.accumulatedVol == null ? "—" : `${(q.accumulatedVol / 1_000_000).toFixed(1)}M`}</span>
            <span>AVG {q.volumeVsAvg20 == null ? "—" : `${q.volumeVsAvg20.toFixed(2)}x`}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

function Overview({ data, quotes, onOpenPHP, onOpenHTIT }: {
  data: PortOverviewResponse;
  quotes: StockQuote[];
  onOpenPHP: () => void;
  onOpenHTIT: () => void;
}) {
  const m = metricMap(data.metrics);
  const throughput = m.get("php-throughput-2025");
  const teu = m.get("php-teu-2025");
  const revenue = m.get("php-revenue-2025");
  const pbt = m.get("php-pbt-2025");

  return (
    <>
      <section className="portHero portPanel">
        <div>
          <span className="portEyebrow">INDUSTRY ENGINE · PORTS</span>
          <h2>Cảng biển Việt Nam</h2>
          <p>
            V8.8 khởi động với cụm Hải Phòng/PHP. Dữ liệu vận hành ưu tiên nguồn chính thức;
            DWT tàu theo ngày chưa đưa vào production cho đến khi có feed công khai ổn định.
          </p>
        </div>
        <div className="portHeroActions">
          <button onClick={onOpenPHP}>PHP dashboard</button>
          <button onClick={onOpenHTIT}>HTIT terminal</button>
        </div>
      </section>

      <div className="portScopeNotice">
        <strong>Phạm vi MVP:</strong> KPI bên dưới là snapshot chính thức của <b>CTCP Cảng Hải Phòng (PHP)</b>,
        chưa đại diện toàn bộ ngành cảng Việt Nam.
      </div>

      <div className="portKpiGrid">
        {[throughput, teu, revenue, pbt].filter(Boolean).map(x => (
          <article className="portKpiCard" key={x!.id}>
            <span>{x!.label}</span>
            <strong>{fmt(x!.value)} <em>{x!.unit}</em></strong>
            <small>{x!.period}{x!.yoyPct != null ? ` · ${x!.yoyPct > 0 ? "+" : ""}${x!.yoyPct.toFixed(1)}% YoY` : ""}</small>
            <SourceChip sourceId={x!.sourceId} data={data} />
          </article>
        ))}
      </div>

      <section className="portPanel">
        <div className="portSectionHead">
          <div>
            <span className="portSectionIndex">01</span>
            <h3>Cổ phiếu cảng theo dõi</h3>
          </div>
          <span className="portMuted">Giá realtime từ Stock Engine hiện tại</span>
        </div>
        <StockStrip quotes={quotes} />
      </section>

      <section className="portPanel">
        <div className="portSectionHead">
          <div>
            <span className="portSectionIndex">02</span>
            <h3>Company → Terminal map</h3>
          </div>
        </div>
        <div className="portCompanyGrid">
          {data.companies.map((c: PortCompany) => (
            <article key={c.symbol} className="portCompanyCard">
              <div className="portCompanyTitle">
                <strong>{c.symbol}</strong>
                <span>{c.region}</span>
              </div>
              <h4>{c.name}</h4>
              <p>{c.focus}</p>
              <div className="portTerminalTags">
                {c.terminals.map(t => <span key={t}>{t}</span>)}
              </div>
              {c.officialUrl && <a href={c.officialUrl} target="_blank" rel="noreferrer">Trang chính thức ↗</a>}
            </article>
          ))}
        </div>
      </section>

      <section className="portPanel">
        <div className="portSectionHead">
          <div>
            <span className="portSectionIndex">03</span>
            <h3>Event timeline</h3>
          </div>
          <span className="portMuted">Chỉ đưa event có nguồn truy vết</span>
        </div>
        <div className="portTimeline">
          {data.events.map(e => {
            const src = data.sources.find(x => x.id === e.sourceId);
            return (
              <article key={`${e.date}-${e.title}`}>
                <time>{e.date}</time>
                <div>
                  <strong>{e.title}</strong>
                  <span>{e.entity} · {e.kind}</span>
                  {e.note && <p>{e.note}</p>}
                </div>
                {src && <a href={src.url} target="_blank" rel="noreferrer">Nguồn ↗</a>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="portPanel portLimitPanel">
        <div className="portSectionHead">
          <div>
            <span className="portSectionIndex">!</span>
            <h3>Data-quality guardrails</h3>
          </div>
        </div>
        <ul>
          {data.limitations.map(x => <li key={x}>{x}</li>)}
        </ul>
      </section>
    </>
  );
}

function PHPDashboard({ data, quote }: { data: PortOverviewResponse; quote?: StockQuote }) {
  const m = metricMap(data.metrics);
  const cards = [
    m.get("php-throughput-2025"),
    m.get("php-teu-2025"),
    m.get("php-revenue-2025"),
    m.get("php-pbt-2025")
  ].filter(Boolean) as PortMetric[];

  return (
    <>
      <section className="portPanel portEntityHero">
        <div>
          <span className="portEyebrow">PHP · UPCOM</span>
          <h2>Công ty Cổ phần Cảng Hải Phòng</h2>
          <p>
            Dashboard doanh nghiệp mẫu của Industry Engine: vận hành → tài chính → terminal → stock.
          </p>
        </div>
        {quote && (
          <div className="portEntityPrice">
            <strong className={stockClass(quote.changePercent)}>
              {quote.matchPrice == null ? "—" : quote.matchPrice.toLocaleString("vi-VN")}
            </strong>
            <span className={stockClass(quote.changePercent)}>
              {quote.changePercent == null ? "—" : `${quote.changePercent > 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%`}
            </span>
            <small>VOL/AVG {quote.volumeVsAvg20 == null ? "—" : `${quote.volumeVsAvg20.toFixed(2)}x`}</small>
          </div>
        )}
      </section>

      <div className="portKpiGrid">
        {cards.map(x => (
          <article className="portKpiCard" key={x.id}>
            <span>{x.label}</span>
            <strong>{fmt(x.value)} <em>{x.unit}</em></strong>
            <small>{x.period}{x.yoyPct != null ? ` · ${x.yoyPct > 0 ? "+" : ""}${x.yoyPct.toFixed(1)}% YoY` : ""}</small>
            <SourceChip sourceId={x.sourceId} data={data} />
          </article>
        ))}
      </div>

      <section className="portPanel">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">01</span><h3>Operating structure</h3></div>
        </div>
        <div className="portTerminalBoard">
          <div><strong>Tân Vũ</strong><span>Terminal thường · PHP vận hành trực tiếp</span></div>
          <div><strong>Chùa Vẽ</strong><span>Terminal thường · PHP</span></div>
          <div><strong>Hoàng Diệu</strong><span>Cảng truyền thống · PHP</span></div>
          <div className="hot"><strong>HTIT · Lạch Huyện 3–4</strong><span>Nước sâu · động lực tăng công suất mới</span></div>
        </div>
      </section>

      <section className="portPanel">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">02</span><h3>Operating ↔ Financial</h3></div>
          <span className="portMuted">Không dùng DWT × giá để suy doanh thu</span>
        </div>
        <div className="portRelationGrid">
          <div><span>Hàng hóa thông qua 2025</span><strong>42,67 triệu tấn</strong></div>
          <div><span>Container 2025</span><strong>2,07 triệu TEU</strong></div>
          <div><span>Doanh thu 2025</span><strong>3.545 tỷ</strong></div>
          <div><span>LNTT 2025</span><strong>1.280 tỷ</strong></div>
        </div>
        <p className="portFootnote">
          Đây là các KPI công bố chính thức của doanh nghiệp. DWT/ship-call sẽ là lớp proxy vận hành riêng khi pipeline cảng vụ hoàn tất.
        </p>
      </section>
    </>
  );
}

function HTITDashboard({ data }: { data: PortOverviewResponse }) {
  return (
    <>
      <section className="portPanel portEntityHero">
        <div>
          <span className="portEyebrow">TERMINAL · LẠCH HUYỆN</span>
          <h2>HTIT · Bến 3–4</h2>
          <p>
            Terminal detail prototype: capacity, route/customer intelligence và ship-call sẽ được nối vào feed chính thức ở phase kế tiếp.
          </p>
        </div>
        <span className="portPendingBadge">LIVE SHIP FEED · PENDING</span>
      </section>

      <div className="portKpiGrid">
        <article className="portKpiCard">
          <span>Trạng thái</span><strong>Đang khai thác</strong>
          <small>đưa vào khai thác năm 2025</small>
          <a className="portSourceChip" href="https://haiphongport.com.vn/vi/tin-tuc/dai-hoi-dong-co-dong-thuong-nien-cang-hai-phong-nam-2026-khang-dinh-vi-the-dan-dau-kien-tao-dong-luc-phat-trien-moi.html" target="_blank" rel="noreferrer">Nguồn DN ↗</a>
        </article>
        <article className="portKpiCard">
          <span>Vai trò</span><strong>Cảng nước sâu</strong>
          <small>Lạch Huyện · Hải Phòng</small>
        </article>
        <article className="portKpiCard">
          <span>DWT/ngày</span><strong>—</strong>
          <small>chờ source/feed Cảng vụ ổn định</small>
        </article>
        <article className="portKpiCard">
          <span>Hãng tàu / tuyến</span><strong>—</strong>
          <small>phase 2 · ship intelligence</small>
        </article>
      </div>

      <section className="portPanel">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">01</span><h3>Ship-call pipeline target</h3></div>
        </div>
        <div className="portPipeline">
          <span>Cảng vụ / lịch tàu</span><b>→</b><span>Normalize vessel + terminal + DWT</span><b>→</b>
          <span>D1 daily aggregation</span><b>→</b><span>Tháng / Quý / YoY</span>
        </div>
        <p className="portFootnote">
          V8.8 chưa tự động scrape nguồn trả phí và chưa coi DWT là sản lượng hàng hóa thực tế.
        </p>
      </section>

      <section className="portPanel">
        <div className="portSectionHead">
          <div><span className="portSectionIndex">02</span><h3>Source readiness</h3></div>
        </div>
        <div className="portSourceList">
          {data.sources.filter(x => ["maritime-admin", "php-news", "php-annual"].includes(x.id)).map(src => (
            <a key={src.id} href={src.url} target="_blank" rel="noreferrer">
              <strong>{src.label}</strong>
              <span>{src.coverage}</span>
              <em className={`sourceState ${src.status}`}>{src.status}</em>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function Sources({ data }: { data: PortOverviewResponse }) {
  return (
    <section className="portPanel">
      <div className="portSectionHead">
        <div><span className="portSectionIndex">SRC</span><h3>Nguồn dữ liệu & trạng thái</h3></div>
      </div>
      <div className="portSourceList">
        {data.sources.map(src => (
          <a key={src.id} href={src.url} target="_blank" rel="noreferrer">
            <strong>{src.label}</strong>
            <span>{src.organization} · {src.coverage}</span>
            <small>{src.updateCadence}{src.note ? ` · ${src.note}` : ""}</small>
            <em className={`sourceState ${src.status}`}>{src.status}</em>
          </a>
        ))}
      </div>
    </section>
  );
}

export function PortIndustryTab() {
  const [view, setView] = useState<PortView>("overview");
  const [data, setData] = useState<PortOverviewResponse | null>(null);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortOverview()
      .then(r => setData(r))
      .catch(e => setError(String(e)));

    const loadQuotes = () =>
      getStockQuotes(["PHP", "DVP", "DXP", "GMD", "VSC", "PDN"])
        .then(r => setQuotes(r.data ?? []))
        .catch(() => undefined);

    loadQuotes();
    const t = window.setInterval(() => {
      if (!document.hidden) loadQuotes();
    }, 5000);
    return () => window.clearInterval(t);
  }, []);

  const phpQuote = useMemo(() => quotes.find(x => x.code === "PHP"), [quotes]);

  if (error) return <div className="portPanel">Không tải được Port Industry: {error}</div>;
  if (!data) return <div className="portPanel">Đang tải Port Industry…</div>;

  return (
    <div className="portIndustry">
      <ResponsiveTabBar<PortView>
        className="portSubTabs"
        ariaLabel="Cảng biển"
        activeId={view}
        onChange={setView}
        items={[
          { id: "overview", label: "Tổng quan" },
          { id: "php", label: "PHP" },
          { id: "htit", label: "HTIT" },
          { id: "sources", label: "Nguồn dữ liệu" }
        ]}
      />

      {view === "overview" && (
        <Overview data={data} quotes={quotes} onOpenPHP={() => setView("php")} onOpenHTIT={() => setView("htit")} />
      )}
      {view === "php" && <PHPDashboard data={data} quote={phpQuote} />}
      {view === "htit" && <HTITDashboard data={data} />}
      {view === "sources" && <Sources data={data} />}
    </div>
  );
}
