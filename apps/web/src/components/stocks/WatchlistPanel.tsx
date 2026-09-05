import { useMemo, useState } from "react";
import type { StockQuote, Watchlist } from "../../types";

type SortKey = "change" | "value" | "code";

function fmtVol(v: number | null) {
  if (v == null) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(Math.round(v));
}

function fmtVal(v: number | null) {
  if (v == null) return "—";
  return `${(v / 1_000_000_000).toFixed(v >= 100_000_000_000 ? 0 : 1)} Tỷ`;
}

function moveClass(v: number | null) {
  if (v == null || v === 0) return "ref";
  return v > 0 ? "up" : "down";
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
    const s = newSymbol.trim().toUpperCase();
    if (!s) return;
    await onAddSymbol(s);
    setNewSymbol("");
  }

  return (
    <section className="stockPanel">
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

      <div className="watchlistHeader stockGridRow">
        <span>Mã / Sàn</span>
        <span>Giá / Biến động</span>
        <span>Thanh khoản</span>
        <span></span>
      </div>

      <div className="watchlistRows">
        {sorted.map(q => (
          <div
            className="watchlistRow stockGridRow"
            key={q.code}
            onClick={() => onOpenSymbol(q.code)}
          >
            <div>
              <div className="stockCodeLine">
                <strong>{q.code}</strong>
                <a
                  href={`https://www.fireant.vn/Home/StockDetail/${q.code}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  title={`Mở ${q.code} trên FireAnt`}
                >
                  ↗
                </a>
              </div>
              <small>{q.floor}</small>
            </div>

            <div>
              <strong className={moveClass(q.changePercent)}>
                {q.matchPrice == null ? "—" : q.matchPrice.toLocaleString("vi-VN")}
              </strong>
              <div className={`stockMoveBadge ${moveClass(q.changePercent)}`}>
                {q.change == null ? "—" : `${q.change > 0 ? "+" : ""}${q.change.toLocaleString("vi-VN")}`}
                {" · "}
                {q.changePercent == null ? "—" : `${q.changePercent > 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`}
              </div>
            </div>

            <div>
              <strong>{fmtVol(q.accumulatedVol)} cp</strong>
              <small>{fmtVal(q.accumulatedVal)}</small>
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
          </div>
        ))}
      </div>
    </section>
  );
}
