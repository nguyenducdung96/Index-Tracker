import { useEffect, useMemo, useState } from "react";
import { getStockChart, getStockDetail } from "../../api";
import type { StockChartPoint, StockDetail } from "../../types";
import { StockChart } from "./StockChart";

function moveClass(v: number | null | undefined) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
}

function ratioClass(v: number | null | undefined) {
  if (v == null) return "ratioNeutral";
  if (v >= 2) return "ratioHot";
  if (v >= 1.2) return "ratioStrong";
  if (v >= 0.8) return "ratioWarm";
  return "ratioNeutral";
}

function fmtPrice(v: number | null | undefined) {
  if (v == null) return "—";
  return v.toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function fmtCount(v: number | null | undefined) {
  if (v == null) return "—";
  return Math.round(v).toLocaleString("vi-VN");
}

function fmtPct(v: number | null | undefined) {
  if (v == null) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
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

        {detail.companyWebsite && (
          <a
            className="companyHomepageButton"
            href={detail.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            title={`Mở website chính thức của ${detail.companyName ?? detail.code}`}
          >
            Trang chủ ↗
          </a>
        )}
      </div>

      <section className="stockPanel stockHero">
        <div className="stockHeroTop">
          <div>
            <div className="stockHeroCode">{detail.code} · {detail.floor}</div>
            <h2>{detail.companyName ?? detail.code}</h2>
          </div>
          <div className="stockHeroPriceBox">
            <strong className={moveClass(detail.changePercent)}>{fmtPrice(detail.matchPrice)}</strong>
            <span className={moveClass(detail.changePercent)}>
              {detail.change == null ? "—" : `${detail.change > 0 ? "+" : ""}${fmtPrice(detail.change)}`}
              {" · "}
              {fmtPct(detail.changePercent)}
            </span>
          </div>
        </div>

        <div className="stockPriceMarkers">
          <span className="floorColor">Sàn {fmtPrice(detail.floorPrice)}</span>
          <span className="refColor">TC {fmtPrice(detail.refPrice)}</span>
          <span className="ceilColor">Trần {fmtPrice(detail.ceilingPrice)}</span>
          <span>Khớp gần nhất {fmtCount(detail.matchVol)}</span>
        </div>

        <div className="dayRange">
          <div className="dayRangeLabels">
            <span>Thấp {fmtPrice(detail.lowestPrice)}</span>
            <span>Cao {fmtPrice(detail.highestPrice)}</span>
          </div>
          <div className="dayRangeTrack">
            <span className="dayRangeDot" style={{ left: `${dayPct}%` }} />
          </div>
          <div className="dayRangeCurrent">
            Hiện tại <strong className={moveClass(detail.changePercent)}>{fmtPrice(detail.matchPrice)}</strong>
          </div>
        </div>
      </section>

      <div className="stockDetailColumns">
        <section className="stockPanel">
          <h3>Dòng tiền & Thanh khoản</h3>
          <div className="metricGrid">
            <div><span>Giá TB</span><strong>{fmtPrice(detail.avgPrice)}</strong></div>
            <div><span>Tổng KL</span><strong>{fmtCount(detail.accumulatedVol)} cp</strong></div>
            <div><span>Tổng GT</span><strong>{fmtB(detail.accumulatedVal)}</strong></div>
            <div>
              <span>Vol / Avg20D</span>
              <strong className={`detailRatio ${ratioClass(detail.volumeVsAvg20)}`}>
                {detail.volumeVsAvg20 == null ? "—" : `${detail.volumeVsAvg20.toFixed(2)}x`}
              </strong>
            </div>
          </div>
        </section>

        <section className="stockPanel">
          <h3>Khối ngoại</h3>
          <div className="metricGrid">
            <div><span>Mua</span><strong>{fmtCount(detail.foreignBuyVol)} cp</strong></div>
            <div><span>Bán</span><strong>{fmtCount(detail.foreignSellVol)} cp</strong></div>
            <div><span>Mua/Bán ròng</span><strong className={moveClass(detail.foreignNetVal)}>{fmtB(detail.foreignNetVal)}</strong></div>
            <div><span>NN tham gia</span><strong>{detail.foreignParticipationPct == null ? "—" : `${detail.foreignParticipationPct.toFixed(1)}%`}</strong></div>
            <div><span>Room còn lại</span><strong>{fmtCount(detail.currentRoom)}</strong></div>
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
            {detail.bid.map((x,i) => <div key={i}><span>{fmtCount(x.volume)}</span><b>{fmtPrice(x.price)}</b></div>)}
          </div>
          <div>
            <strong>Dư bán</strong>
            {detail.ask.map((x,i) => <div key={i}><b>{fmtPrice(x.price)}</b><span>{fmtCount(x.volume)}</span></div>)}
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
