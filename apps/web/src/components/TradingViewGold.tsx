import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldGoldQuote } from "../types";

type WidgetProps = {
  scriptSrc: string;
  config: Record<string, unknown>;
  className?: string;
  onReady?: () => void;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [query]);

  return matches;
}

function TradingViewWidget({ scriptSrc, config, className = "", onReady }: WidgetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const configJson = JSON.stringify(config);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    host.replaceChildren();

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.cssText =
      "width:100%;height:100%;max-width:100%;min-width:0;overflow:hidden;";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.cssText =
      "width:100%;height:100%;max-width:100%;min-width:0;overflow:hidden;";
    container.appendChild(widget);
    host.appendChild(container);

    let ready = false;
    const checkReady = () => {
      if (!ready && container.querySelector("iframe")) {
        ready = true;
        onReady?.();
      }
    };

    const observer = new MutationObserver(checkReady);
    observer.observe(container, { childList: true, subtree: true });

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = scriptSrc;
    script.textContent = configJson;
    script.onload = () => window.setTimeout(checkReady, 100);
    container.appendChild(script);

    const probe = window.setInterval(checkReady, 250);

    return () => {
      window.clearInterval(probe);
      observer.disconnect();
      host.replaceChildren();
    };
  }, [scriptSrc, configJson, onReady]);

  return <div ref={ref} className={className} />;
}

function QuoteFallback({ quote }: { quote: WorldGoldQuote | null }) {
  if (!quote) {
    return <div className="mobileGoldFallback">Đang tải giá XAU/USD…</div>;
  }

  const pct = quote.changePct ?? null;
  const up = pct == null ? null : pct >= 0;

  return (
    <div className="mobileGoldFallback">
      <div className="mobileFallbackTop">
        <div>
          <div className="mobileFallbackLabel">XAU/USD</div>
          <div className="mobileFallbackPrice">
            ${quote.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>
        <div className={
          pct == null ? "mobileFallbackChange neutral" :
          up ? "mobileFallbackChange positive" : "mobileFallbackChange negative"
        }>
          {pct == null ? "—" : `${up ? "▲" : "▼"} ${Math.abs(pct).toFixed(2)}%`}
        </div>
      </div>
      <div className="mobileFallbackMeta">Nguồn dự phòng: {quote.source}</div>
    </div>
  );
}

export function TradingViewGoldLive({ quote }: { quote: WorldGoldQuote | null }) {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const [mobileReady, setMobileReady] = useState(false);
  const [mobileTimeout, setMobileTimeout] = useState(false);

  const symbol = String(
    (import.meta as any).env?.VITE_TV_GOLD_SYMBOL ?? "OANDA:XAUUSD"
  );

  useEffect(() => {
    if (!isMobile) return;
    setMobileReady(false);
    setMobileTimeout(false);
    const timer = window.setTimeout(() => setMobileTimeout(true), 6500);
    return () => window.clearTimeout(timer);
  }, [isMobile, symbol]);

  const desktopInfo = useMemo(() => ({
    symbol,
    width: "100%",
    locale: "en",
    colorTheme: "dark",
    isTransparent: true
  }), [symbol]);

  const desktopChart = useMemo(() => ({
    autosize: true,
    symbol,
    interval: "1",
    timezone: "Asia/Ho_Chi_Minh",
    theme: "dark",
    style: "1",
    locale: "en",
    backgroundColor: "rgba(7,16,29,1)",
    gridColor: "rgba(30,45,67,.45)",
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    allow_symbol_change: false,
    calendar: false,
    support_host: "https://www.tradingview.com"
  }), [symbol]);

  const mobileOverview = useMemo(() => ({
    lineWidth: 2,
    lineType: 0,
    chartType: "area",
    colorTheme: "dark",
    isTransparent: true,
    locale: "en",
    autosize: true,
    width: "100%",
    height: "100%",
    symbols: [["Gold", `${symbol}|1D`]],
    dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    hideDateRanges: false,
    hideMarketStatus: false,
    hideSymbolLogo: false,
    scalePosition: "right",
    scaleMode: "Normal",
    valuesTracking: "1",
    changeMode: "price-and-percent",
    noTimeScale: false
  }), [symbol]);

  const links = (
    <div className="goldReferenceLinks">
      <a href="https://www.tradingview.com/symbols/XAUUSD/" target="_blank" rel="noreferrer">
        TradingView ↗
      </a>
      <a href="https://tradingeconomics.com/commodity/gold" target="_blank" rel="noreferrer">
        Trading Economics ↗
      </a>
    </div>
  );

  if (isMobile) {
    const fallback = mobileTimeout && !mobileReady;

    return (
      <section className="card tvGoldCard tvGoldMobileCard">
        <div className="tvGoldHeader mobileGoldHeader">
          <div>
            <div className="eyebrowRow">
              <div className="eyebrow">GOLD · XAU/USD</div>
              <span className="liveBadge live">● LIVE</span>
              <span className="freeBadge">FREE</span>
            </div>
            <div className="sectionTitle tvTitle">Vàng thế giới</div>
          </div>
        </div>

        {!fallback && (
          <div className={`tvMobileOverview ${mobileReady ? "ready" : "loading"}`}>
            {!mobileReady && <div className="widgetLoadingOverlay">Đang tải TradingView chart…</div>}
            <TradingViewWidget
              scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js"
              config={mobileOverview}
              className="tvSymbolOverview"
              onReady={() => setMobileReady(true)}
            />
          </div>
        )}

        {fallback && <QuoteFallback quote={quote} />}
        {links}

        <div className="tvNotice mobileTvNotice">
          {fallback
            ? "Chart TradingView không tải trên thiết bị này — đang hiển thị giá dự phòng."
            : `Realtime chart: TradingView · ${symbol}`}
        </div>
      </section>
    );
  }

  return (
    <section className="card tvGoldCard">
      <div className="tvGoldHeader">
        <div>
          <div className="eyebrowRow">
            <div className="eyebrow">GOLD · XAU/USD</div>
            <span className="liveBadge live">● LIVE</span>
            <span className="freeBadge">FREE</span>
          </div>
          <div className="sectionTitle tvTitle">TradingView realtime · OANDA</div>
          <div className="unit">Giá và chart được TradingView render trực tiếp.</div>
        </div>
        {links}
      </div>

      <div className="tvQuoteWidget">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
          config={desktopInfo}
          className="tvSymbolInfo"
        />
      </div>

      <div className="tvChartWidget">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={desktopChart}
          className="tvAdvancedChart"
        />
      </div>

      <div className="tvNotice">
        <strong>Nguồn realtime:</strong> TradingView · {symbol}
      </div>
    </section>
  );
}
