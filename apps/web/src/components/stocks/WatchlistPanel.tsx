import { useMemo, useState } from "react";
import type { StockQuote, Watchlist } from "../../types";

type SortKey = "change" | "value" | "code";

function fmtVol(v: number | null | undefined) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

function fmtVal(v: number | null | undefined) {
  if (v == null) return "—";
  return `${(v / 1_000_000_000).toFixed(Math.abs(v) >= 100_000_000_000 ? 0 : 1)} Tỷ`;
}

function moveClass(v: number | null | undefined) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
}


function ratioClass(v: number | null | undefined) {
  if (v == null) return "ratioNeutral";
  if (v >= 1.5) return "ratioHot";
  if (v >= 1.0) return "ratioStrong";
  return "ratioNeutral";
}

export function WatchlistPanel({
  watchlists,
  activeId,
  quotes,
  onChangeList,
  onCreate,
  onDelete,
  onAddSymbol,
  onRemoveSymbol,
  onOpenSymbol
}: {
  watchlists: Watchlist[];
  activeId: number | null;
  quotes: StockQuote[];
  onChangeList: (id: number) => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onAddSymbol: (symbol: string) => Promise<void>;
  onRemoveSymbol: (symbol: string) => Promise<void>;
  onOpenSymbol: (symbol: string) => void;
}) {
  const [sort, setSort] = useState<SortKey>("value");
  const [newSymbol, setNewSymbol] = useState("");

  const active = watchlists.find(x => x.id === activeId) ?? watchlists[0];

  const sorted = useMemo(() => {
    const copy = [...quotes];
    if (sort === "code") copy.sort((a,b) => a.code.localeCompare(b.code));
    else if (sort === "change") copy.sort((a,b) => (b.changePercent ?? -999) - (a.changePercent ?? -999));
    else copy.sort((a,b) => (b.accumulatedVal ?? -1) - (a.accumulatedVal ?? -1));
    return copy;
  }, [quotes, sort]);

  async function createList() {
    const name = window.prompt("Tên watchlist mới:");
    if (name?.trim()) await onCreate(name.trim());
  }

  async function addSymbol() {
    const symbol = newSymbol.trim().toUpperCase();
    if (!symbol) return;
    await onAddSymbol(symbol);
    setNewSymbol("");
  }

  return (
    <section className="stockPanel watchlistPanel">
      <div className="watchlistToolbar">
        <div className="watchlistTabs">
          {watchlists.map(w => (
            <button
              key={w.id}
              className={w.id === active?.id ? "active" : ""}
              onClick={() => onChangeList(w.id)}
            >
              {w.name}
            </button>
          ))}
          <button className="watchlistAdd" onClick={createList}>＋</button>
        </div>

        <div className="watchlistActions">
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="value">Dòng tiền</option>
            <option value="change">% Tăng/giảm</option>
            <option value="code">Mã A-Z</option>
          </select>
          {active && watchlists.length > 1 && (
            <button className="dangerGhost" onClick={() => onDelete(active.id)}>Xóa WL</button>
          )}
        </div>
      </div>

      <div className="addSymbolBar">
        <input
          value={newSymbol}
          onChange={e => setNewSymbol(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === "Enter" && addSymbol()}
          placeholder="Thêm mã: HPG"
          maxLength={12}
        />
        <button onClick={addSymbol}>Thêm</button>
      </div>

      <div className="watchlistHeader watchGrid">
        <span>Mã / Sàn</span>
        <span>Giá / Biến động</span>
        <span>Thanh khoản</span>
        <span>NN Mua / Bán</span>
        <span></span>
      </div>

      <div className="watchlistRows">
        {sorted.map(q => (
          <article
            className="watchlistRow watchGrid"
            key={q.code}
            onClick={() => onOpenSymbol(q.code)}
          >
            <div className="watchIdentity">
              <div className="stockCodeLine">
                <strong className={moveClass(q.changePercent)}>{q.code}</strong>
                <a
                  href={`https://web.fireant.vn/ma-chung-khoan/${q.code}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={`Mở chart ${q.code} trên FireAnt`}
                >
                  ↗
                </a>
              </div>
              <small>{q.floor}</small>
            </div>

            <div className="watchPrice">
              <strong className={moveClass(q.changePercent)}>
                {q.matchPrice == null ? "—" : q.matchPrice.toLocaleString("vi-VN")}
              </strong>
              <div className={`stockMoveBadge ${moveClass(q.changePercent)}`}>
                {q.change == null ? "—" : `${q.change > 0 ? "+" : ""}${q.change.toLocaleString("vi-VN")}`}
                {" · "}
                {q.changePercent == null ? "—" : `${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`}
              </div>
            </div>

            <div className="watchLiquidity">
              <span className="mobileMetricLabel">Thanh khoản</span>
              <strong>{fmtVol(q.accumulatedVol)} cp</strong>
              <small>{fmtVal(q.accumulatedVal)}</small>
              <div
                className={`volAvg20 ${ratioClass(q.volumeVsAvg20)}`}
                title={q.avg20DVol == null ? "Chưa có Avg20D" : `Avg20D: ${fmtVol(q.avg20DVol)} cp`}
              >
                <span>Vol / Avg20D</span>
                <b>{q.volumeVsAvg20 == null ? "—" : `${q.volumeVsAvg20.toFixed(2)}x`}</b>
              </div>
            </div>

            <div className="watchForeign" title="VNDIRECT: KL NN realtime; GT = KL × giá bình quân">
              <span className="mobileMetricLabel">
                NN Mua / Bán
              </span>
              <div>
                <span className="foreignBuy">M {fmtVal(q.foreignBuyVal)}</span>
                <span className="foreignSell">B {fmtVal(q.foreignSellVal)}</span>
              </div>
            </div>

            <button
              className="removeSymbol"
              title="Xóa khỏi watchlist"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSymbol(q.code);
              }}
            >
              ×
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
