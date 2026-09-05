import { useEffect, useMemo, useState } from "react";
import {
  addWatchlistSymbol,
  createWatchlist,
  deleteWatchlist,
  getStockIndices,
  getStockQuotes,
  getWatchlists,
  removeWatchlistSymbol
} from "../../api";
import type { StockIndexQuote, StockQuote, Watchlist } from "../../types";
import { MarketTicker } from "./MarketTicker";
import { StockDetailView } from "./StockDetailView";
import { WatchlistPanel } from "./WatchlistPanel";

export function StocksTab() {
  const [indices, setIndices] = useState<StockIndexQuote[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);

  const active = useMemo(
    () => watchlists.find(x => x.id === activeId) ?? watchlists[0] ?? null,
    [watchlists, activeId]
  );

  async function refreshWatchlists() {
    const r = await getWatchlists();
    const rows = (r.data ?? []) as Watchlist[];
    setWatchlists(rows);
    if (!activeId && rows[0]) setActiveId(rows[0].id);
  }

  useEffect(() => {
    refreshWatchlists().catch(console.error);
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadIndices() {
      const r = await getStockIndices();
      if (!alive) return;
      setIndices(r.data ?? []);
      setProviderError(r.error ?? null);
    }

    loadIndices().catch(e => setProviderError(String(e)));
    const timer = window.setInterval(() => {
      if (!document.hidden) loadIndices().catch(() => undefined);
    }, 3000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!active?.symbols?.length) {
      setQuotes([]);
      return;
    }

    let alive = true;
    async function load() {
      const r = await getStockQuotes(active.symbols);
      if (!alive) return;
      setQuotes(r.data ?? []);
      setProviderError(r.error ?? null);
    }

    load().catch(e => setProviderError(String(e)));
    const timer = window.setInterval(() => {
      if (!document.hidden) load().catch(() => undefined);
    }, 4000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [active?.id, active?.symbols.join(",")]);

  if (detailSymbol) {
    return <StockDetailView symbol={detailSymbol} onBack={() => setDetailSymbol(null)} />;
  }

  async function onCreate(name: string) {
    await createWatchlist(name);
    await refreshWatchlists();
  }

  async function onDelete(id: number) {
    if (!window.confirm("Xóa watchlist này?")) return;
    await deleteWatchlist(id);
    setActiveId(null);
    await refreshWatchlists();
  }

  async function onAddSymbol(symbol: string) {
    if (!active) return;
    await addWatchlistSymbol(active.id, symbol);
    await refreshWatchlists();
  }

  async function onRemoveSymbol(symbol: string) {
    if (!active) return;
    await removeWatchlistSymbol(active.id, symbol);
    await refreshWatchlists();
  }

  return (
    <div className="stocksTab">
      <div className="marketSticky">
        <MarketTicker rows={indices} />
      </div>

      {providerError && (
        <div className="stockProviderNotice">
          VNDIRECT tạm thời chưa trả được dữ liệu: {providerError}
        </div>
      )}

      <WatchlistPanel
        watchlists={watchlists}
        activeId={active?.id ?? null}
        quotes={quotes}
        onChangeList={setActiveId}
        onCreate={onCreate}
        onDelete={onDelete}
        onAddSymbol={onAddSymbol}
        onRemoveSymbol={onRemoveSymbol}
        onOpenSymbol={setDetailSymbol}
      />
    </div>
  );
}
