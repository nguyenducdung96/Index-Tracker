import { useEffect, useMemo, useState } from "react";
import { getStockChart, getStockDetail } from "../../api";
import type { StockChartPoint, StockDetail } from "../../types";
import { StockChart } from "./StockChart";

function moveClass(v: number | null | undefined) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
}

function fmt(v: number | null | undefined, digits = 0) {
  if (v == null) return "—";
  return v.toLocaleString("vi-VN", { maximumFractionDigits: digits });
}

function fmtB(v: number | null | undefined) {
  if (v == null) return "—";
  return `${(v / 1_000_000_000).toFixed(1)} Tỷ`;
}

export function StockDetailView({
  symbol,
  onBack
}: {
  symbol: string;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<StockDetail | null>(null);
  const [frame, setFrame] = useState<"1"|"5"|"15"|"D">("D");
  const [chart, setChart] = useState<StockChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const r = await getStockDetail(symbol);
      if (active) setDetail(r.data ?? null);
      setLoading(false);
    }
    load().catch(() => setLoading(false));
    const t = window.setInterval(() => {
      if (!document.hidden) load().catch(() => undefined);
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [symbol]);

  useEffect(() => {
    let active = true;
    getStockChart(symbol, frame)
      .then(r => active && setChart(r.data ?? []))
      .catch(() => active && setChart([]));
    return () => { active = false; };
  }, [symbol, frame]);

  const dayPct = useMemo(() => {
    if (!detail || detail.lowestPrice == null || detail.highestPrice == null || detail.matchPrice == null) return 50;
    const range = detail.highestPrice - detail.lowestPrice;
    if (range <= 0) return 50;
    return Math.max(0, Math.min(100, ((detail.matchPrice - detail.lowestPrice) / range) * 100));
  }, [detail]);

  if (loading && !detail) return <div className="stockPanel stockDetailLoading">Đang tải {symbol}…</div>;
  if (!detail) return <div className="stockPanel"><button onClick={onBack}>← Quay lại</button><p>Không lấy được dữ liệu {symbol}.</p></div>;

  return (
    <section className="stockDetailView">
      <div className="stockDetailNav">
        <button onClick={onBack}>← Watchlist</button>
        <a href={`https://www.fireant.vn/Home/StockDetail/${symbol}`} target="_blank" rel="noreferrer">
          FireAnt ↗
        </a>
      </div>

      <section className="stockPanel stockHero">
        <div className="stockHeroTop">
          <div>
            <div className="stockHeroCode">{detail.code} · {detail.floor}</div>
            <h2>{detail.companyName ?? detail.code}</h2>
          </div>
          <div className="stockHeroPriceBox">
            <strong className={moveClass(detail.changePercent)}>{fmt(detail.matchPrice)}</strong>
            <span className={moveClass(detail.changePercent)}>
              {detail.change == null ? "—" : `${detail.change > 0 ? "+" : ""}${fmt(detail.change)}`}
              {" · "}
              {detail.changePercent == null ? "—" : `${detail.changePercent > 0 ? "+" : ""}${detail.changePercent.toFixed(2)}%`}
            </span>
          </div>
        </div>

        <div className="stockPriceMarkers">
          <span className="floorColor">Sàn {fmt(detail.floorPrice)}</span>
          <span className="refColor">TC {fmt(detail.refPrice)}</span>
          <span className="ceilColor">Trần {fmt(detail.ceilingPrice)}</span>
          <span>Khớp gần nhất {fmt(detail.matchVol)}</span>
        </div>

        <div className="dayRange">
          <div className="dayRangeLabels">
            <span>Thấp {fmt(detail.lowestPrice)}</span>
            <span>Cao {fmt(detail.highestPrice)}</span>
          </div>
          <div className="dayRangeTrack">
            <span className="dayRangeDot" style={{ left: `${dayPct}%` }} />
          </div>
        </div>
      </section>

      <div className="stockDetailColumns">
        <section className="stockPanel">
          <h3>Dòng tiền & Thanh khoản</h3>
          <div className="metricGrid">
            <div><span>Giá TB</span><strong>{fmt(detail.avgPrice)}</strong></div>
            <div><span>Tổng KL</span><strong>{fmt(detail.accumulatedVol)} cp</strong></div>
            <div><span>Tổng GT</span><strong>{fmtB(detail.accumulatedVal)}</strong></div>
            <div><span>Vol / Avg20D</span><strong>{detail.volumeVsAvg20 == null ? "—" : `${detail.volumeVsAvg20.toFixed(2)}x`}</strong></div>
          </div>
        </section>

        <section className="stockPanel">
          <h3>Khối ngoại</h3>
          <div className="metricGrid">
            <div><span>Mua</span><strong>{fmt(detail.foreignBuyVol)} cp</strong></div>
            <div><span>Bán</span><strong>{fmt(detail.foreignSellVol)} cp</strong></div>
            <div><span>Mua/Bán ròng</span><strong className={moveClass(detail.foreignNetVal)}>{fmtB(detail.foreignNetVal)}</strong></div>
            <div><span>Room còn lại</span><strong>{fmt(detail.currentRoom)}</strong></div>
          </div>
          {!detail.realtimeDepthAvailable && <div className="dataPendingNote">Room ngoại lấy từ VNDIRECT realtime snapshot khi feed trả dữ liệu.</div>}
        </section>
      </div>

      <section className="stockPanel">
        <div className="panelTitleRow">
          <h3>Sổ lệnh Top 3 · Cung / Cầu</h3>
          <div className="supplyDemand">
            <span>Mua {detail.bidRatio == null ? "—" : `${detail.bidRatio.toFixed(0)}%`}</span>
            <div><i style={{ width: `${detail.bidRatio ?? 50}%` }} /></div>
            <span>Bán {detail.askRatio == null ? "—" : `${detail.askRatio.toFixed(0)}%`}</span>
          </div>
        </div>

        <div className="orderDepth">
          <div>
            <strong>Dư mua</strong>
            {detail.bid.map((x,i) => <div key={i}><span>{fmt(x.volume)}</span><b>{fmt(x.price)}</b></div>)}
          </div>
          <div>
            <strong>Dư bán</strong>
            {detail.ask.map((x,i) => <div key={i}><b>{fmt(x.price)}</b><span>{fmt(x.volume)}</span></div>)}
          </div>
        </div>

        {!detail.realtimeDepthAvailable && (
          <div className="dataPendingNote">
            Top-3 bid/ask lấy từ VNDIRECT realtime snapshot. Ngoài giờ giao dịch feed có thể không trả cập nhật mới.
          </div>
        )}
      </section>

      <section className="stockPanel stockChartPanel">
        <div className="panelTitleRow">
          <h3>Đồ thị kỹ thuật</h3>
          <div className="chartFrames">
            {(["1","5","15","D"] as const).map(x => (
              <button key={x} className={x === frame ? "active" : ""} onClick={() => setFrame(x)}>
                {x === "D" ? "D" : `${x}M`}
              </button>
            ))}
          </div>
        </div>
        <StockChart rows={chart} />
        <div className="chartLegend">
          <span className="ma20">MA20</span>
          <span className="ma50">MA50</span>
          <span className="ma200">MA200</span>
          <span>Volume</span>
        </div>
      </section>
    </section>
  );
}
