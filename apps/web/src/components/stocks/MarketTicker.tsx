import type { StockIndexQuote } from "../../types";

function moveClass(v: number | null) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
}

function fmtValue(v: number | null) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1)}K Tỷ`;
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} Tỷ`;
  return v.toLocaleString("vi-VN");
}

export function MarketTicker({ rows }: { rows: StockIndexQuote[] }) {
  const visible = rows.filter(x => x.code === "VNINDEX" || x.code === "VN30");

  return (
    <div className="marketTicker marketTickerTwo" aria-label="Chỉ số thị trường">
      {visible.map((x) => (
        <a
          className="indexTickerCard"
          key={x.code}
          href="https://web.fireant.vn/thi-truong"
          target="_blank"
          rel="noreferrer"
        >
          <div className="indexTickerTop">
            <strong>{x.code}</strong>
            <span className={moveClass(x.changePercent)}>
              {x.indexValue == null ? "—" : x.indexValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className={`indexMove ${moveClass(x.changePercent)}`}>
            {x.change == null ? "—" : `${x.change > 0 ? "+" : ""}${x.change.toFixed(2)}`}
            {" · "}
            {x.changePercent == null ? "—" : `${x.changePercent > 0 ? "+" : ""}${x.changePercent.toFixed(2)}%`}
          </div>

          <div className="indexLiquidity">GT {fmtValue(x.accumulatedVal)}</div>

          <div className="indexBreadth">
            <span className="breadthUp" title="Số mã tăng">▲ {x.advances ?? "—"}</span>
            <span className="breadthRef" title="Số mã tham chiếu">■ {x.noChanges ?? "—"}</span>
            <span className="breadthDown" title="Số mã giảm">▼ {x.declines ?? "—"}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
