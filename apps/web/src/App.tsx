import { useEffect, useState } from "react";
import { getDashboard, getVNHistory, subscribeDashboard } from "./api";
import type { Dashboard, VNQuote } from "./types";
import { WorldCard } from "./components/WorldCard";
import { TradingViewGoldLive } from "./components/TradingViewGold";
import { VietnamTable } from "./components/VietnamTable";
import { VietnamChart } from "./components/VietnamChart";
import { PremiumCard } from "./components/PremiumCard";

const empty: Dashboard = {
  world: null,
  vietnam: [],
  providers: [],
  usdVnd: null,
  worldVndPerLuong: null,
  serverTime: ""
};

export default function App() {
  const [dashboard, setDashboard] = useState<Dashboard>(empty);
  const [selected, setSelected] = useState<VNQuote | null>(null);
  const [vnHistory, setVnHistory] = useState<any[]>([]);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    getDashboard().then(d => {
      setDashboard(d);
      if (d.vietnam.length) setSelected(current => current ?? d.vietnam[0]);
    }).catch(console.error);

    const unsubscribe = subscribeDashboard((d) => {
      setDashboard(d);
      if (d.vietnam.length) {
        setSelected(current => current ?? d.vietnam[0]);
      }
    });

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (!selected) return;
    getVNHistory(selected.brand, selected.product, 24 * 30)
      .then(setVnHistory)
      .catch(console.error);
  }, [selected?.brand, selected?.product]);

  return (
    <main className="shell">
      <header className="appHeader">
        <div>
          <h1>Gold Tracker</h1>
          <p>Dashboard cá nhân · PWA · V7.2 Responsive</p>
        </div>
        <div className={`status ${online ? "ok" : "bad"}`}>
          {online ? "● Online" : "● Offline"}
        </div>
      </header>

      <nav className="tabs" aria-label="Các nhóm dữ liệu">
        <button className="active">Vàng</button>
        <button disabled>Chứng khoán</button>
        <button disabled>FX</button>
        <button disabled>Hàng hóa</button>
        <button disabled>Tin tức</button>
      </nav>

      <TradingViewGoldLive />

      <details className="referenceFeedDetails">
        <summary>Feed dùng tính premium (Gold-API) — mở để kiểm tra</summary>
        <WorldCard quote={dashboard.world} />
      </details>

      <PremiumCard
        worldVndPerLuong={dashboard.worldVndPerLuong}
        usdVnd={dashboard.usdVnd}
      />

      <VietnamTable
        rows={dashboard.vietnam}
        providers={dashboard.providers}
        worldVndPerLuong={dashboard.worldVndPerLuong}
        dataQuality={dashboard.dataQuality}
        onSelect={setSelected}
      />

      <VietnamChart selected={selected} data={vnHistory} />

      <footer>
        V7.2: một Cloudflare Worker serve PWA + API + D1. TradingView OANDA:XAUUSD
        là nguồn realtime hiển thị; Gold-API chỉ dùng cho tính toán premium.
      </footer>
    </main>
  );
}
