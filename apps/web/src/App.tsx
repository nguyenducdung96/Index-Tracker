import { useEffect, useState } from "react";
import { getDashboard, subscribeDashboard } from "./api";
import type { Dashboard } from "./types";
import { TradingViewGoldLive } from "./components/TradingViewGold";
import { VietnamTable } from "./components/VietnamTable";
import { StocksTab } from "./components/stocks/StocksTab";

const APP_VERSION = "V8.3.1";
type MainTab = "gold" | "stocks" | "fx" | "commodities" | "news";

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
  const [online, setOnline] = useState(navigator.onLine);
  const [tab, setTab] = useState<MainTab>("gold");

  useEffect(() => {
    getDashboard().then(setDashboard).catch(console.error);
    const unsubscribe = subscribeDashboard(setDashboard);

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

  return (
    <main className="shell">
      <header className="appHeader">
        <div>
          <h1>Market Tracker</h1>
          <p>PWA · {APP_VERSION}</p>
        </div>

        <div className="headerRight">
          <span className="versionBadge">{APP_VERSION}</span>
          <span className={`status ${online ? "ok" : "bad"}`}>
            {online ? "● Online" : "● Offline"}
          </span>
        </div>
      </header>

      <nav className="tabs" aria-label="Các nhóm dữ liệu">
        <button className={tab === "gold" ? "active" : ""} onClick={() => setTab("gold")}>Vàng</button>
        <button className={tab === "stocks" ? "active" : ""} onClick={() => setTab("stocks")}>Chứng khoán</button>
        <button className={tab === "fx" ? "active" : ""} disabled>FX</button>
        <button className={tab === "commodities" ? "active" : ""} disabled>Hàng hóa</button>
        <button className={tab === "news" ? "active" : ""} disabled>Tin tức</button>
      </nav>

      {tab === "gold" && (
        <>
          <TradingViewGoldLive quote={dashboard.world} />
          <VietnamTable rows={dashboard.vietnam} providers={dashboard.providers} />
        </>
      )}

      {tab === "stocks" && <StocksTab />}
    </main>
  );
}
