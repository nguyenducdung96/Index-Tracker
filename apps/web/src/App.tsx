import { useEffect, useState } from "react";
import { getDashboard, subscribeDashboard } from "./api";
import type { Dashboard } from "./types";
import { WorldCard } from "./components/WorldCard";
import { TradingViewGoldLive } from "./components/TradingViewGold";
import { VietnamTable } from "./components/VietnamTable";

const APP_VERSION = "V7.7";

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
          <h1>Gold Tracker</h1>
          <p>Dashboard cá nhân · PWA · {APP_VERSION}</p>
        </div>

        <div className="headerRight">
          <span className="versionBadge">{APP_VERSION}</span>
          <span className={`status ${online ? "ok" : "bad"}`}>
            {online ? "● Online" : "● Offline"}
          </span>
        </div>
      </header>

      <nav className="tabs" aria-label="Các nhóm dữ liệu">
        <button className="active">Vàng</button>
        <button disabled>Chứng khoán</button>
        <button disabled>FX</button>
        <button disabled>Hàng hóa</button>
        <button disabled>Tin tức</button>
      </nav>

      <TradingViewGoldLive quote={dashboard.world} />

      <details className="referenceFeedDetails">
        <summary>Chi tiết nguồn giá tính toán — Gold-API</summary>
        <WorldCard quote={dashboard.world} />
      </details>

      <VietnamTable rows={dashboard.vietnam} providers={dashboard.providers} />

      <footer>
        {APP_VERSION} · Desktop dùng TradingView chart. Mobile ưu tiên độ ổn định:
        giá XAU/USD + % thay đổi và link TradingView/Trading Economics.
      </footer>
    </main>
  );
}
