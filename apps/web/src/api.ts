import type { Dashboard, WorldHistoryResponse, WorldRange } from "./types";
const BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

export async function getDashboard(): Promise<Dashboard> {
  const r = await fetch(`${BASE}/api/gold/dashboard`);
  if (!r.ok) throw new Error(`Dashboard HTTP ${r.status}`);
  return r.json();
}

export async function getWorldHistory(range: WorldRange = "1D"): Promise<WorldHistoryResponse> {
  const r = await fetch(`${BASE}/api/gold/world/history?range=${range}`);
  if (!r.ok) throw new Error(`History HTTP ${r.status}`);
  return r.json();
}

export async function getVNHistory(brand: string, product: string, hours = 168) {
  const qs = new URLSearchParams({ brand, product, hours: String(hours) });
  const r = await fetch(`${BASE}/api/gold/vietnam/history?${qs}`);
  if (!r.ok) throw new Error(`VN history HTTP ${r.status}`);
  return r.json();
}

export function subscribeDashboard(onData: (data: Dashboard) => void) {
  const intervalMs = Math.max(
    5000,
    Number((import.meta as any).env?.VITE_DASHBOARD_POLL_MS ?? 5000)
  );

  let stopped = false;
  let running = false;

  const tick = async () => {
    if (stopped || running || document.hidden) return;
    running = true;
    try {
      onData(await getDashboard());
    } catch (error) {
      console.error("Dashboard poll failed", error);
    } finally {
      running = false;
    }
  };

  const id = window.setInterval(tick, intervalMs);
  const onVisible = () => {
    if (!document.hidden) tick();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    stopped = true;
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}


export async function getStockIndices() {
  const r = await fetch(`${BASE}/api/stocks/indices`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Stock indices HTTP ${r.status}`);
  return r.json();
}

export async function getStockQuotes(symbols: string[]) {
  const q = encodeURIComponent(symbols.join(","));
  const r = await fetch(`${BASE}/api/stocks/quotes?symbols=${q}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Stock quotes HTTP ${r.status}`);
  return r.json();
}

export async function getStockDetail(symbol: string) {
  const r = await fetch(`${BASE}/api/stocks/detail/${encodeURIComponent(symbol)}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Stock detail HTTP ${r.status}`);
  return r.json();
}

export async function getStockChart(symbol: string, frame: "1"|"5"|"15"|"D") {
  const r = await fetch(`${BASE}/api/stocks/chart/${encodeURIComponent(symbol)}?frame=${frame}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Stock chart HTTP ${r.status}`);
  return r.json();
}

export async function getWatchlists() {
  const r = await fetch(`${BASE}/api/stocks/watchlists`, { cache: "no-store" });
  if (!r.ok) throw new Error(`Watchlists HTTP ${r.status}`);
  return r.json();
}

export async function createWatchlist(name: string) {
  const r = await fetch(`${BASE}/api/stocks/watchlists`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!r.ok) throw new Error(`Create watchlist HTTP ${r.status}`);
  return r.json();
}

export async function deleteWatchlist(id: number) {
  const r = await fetch(`${BASE}/api/stocks/watchlists/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`Delete watchlist HTTP ${r.status}`);
  return r.json();
}

export async function addWatchlistSymbol(id: number, symbol: string) {
  const r = await fetch(`${BASE}/api/stocks/watchlists/${id}/symbols`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  if (!r.ok) throw new Error(`Add watchlist symbol HTTP ${r.status}`);
  return r.json();
}

export async function removeWatchlistSymbol(id: number, symbol: string) {
  const r = await fetch(`${BASE}/api/stocks/watchlists/${id}/symbols`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  if (!r.ok) throw new Error(`Remove watchlist symbol HTTP ${r.status}`);
  return r.json();
}
