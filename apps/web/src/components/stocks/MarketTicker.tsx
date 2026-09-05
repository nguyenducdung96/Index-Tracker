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
  return (
    <div className="marketTicker" aria-label="Chỉ số thị trường">
      {rows.map((x) => (
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
          <div className="indexMeta">
            <span>GT {fmtValue(x.accumulatedVal)}</span>
            <span className="breadthUp">↑{x.advances ?? "—"}</span>
            <span className="breadthRef">■{x.noChanges ?? "—"}</span>
            <span className="breadthDown">↓{x.declines ?? "—"}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
