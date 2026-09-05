import { useEffect, useMemo, useRef, useState } from "react";

type WidgetProps = {
  scriptSrc: string;
  config: Record<string, unknown>;
  className?: string;
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

function TradingViewWidget({ scriptSrc, config, className = "" }: WidgetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const configKey = JSON.stringify(config);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;

    host.replaceChildren();

    const container = document.createElement("div");
    container.className = "tradingview-widget-container";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.maxWidth = "100%";
    container.style.overflow = "hidden";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = "100%";
    widget.style.height = "100%";
    widget.style.maxWidth = "100%";
    container.appendChild(widget);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.textContent = configKey;
    container.appendChild(script);

    host.appendChild(container);

    return () => host.replaceChildren();
  }, [scriptSrc, configKey]);

  return <div ref={ref} className={className} />;
}

export function TradingViewGoldLive() {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const symbol = String(
    (import.meta as any).env?.VITE_TV_GOLD_SYMBOL ?? "OANDA:XAUUSD"
  );

  const symbolInfoConfig = useMemo(() => ({
    symbol,
    width: "100%",
    locale: "en",
    colorTheme: "dark",
    isTransparent: true
  }), [symbol]);

  const desktopChartConfig = useMemo(() => ({
    autosize: true,
    symbol,
    interval: "1",
    timezone: "Asia/Ho_Chi_Minh",
    theme: "dark",
    style: "1",
    locale: "en",
    backgroundColor: "rgba(7, 16, 29, 1)",
    gridColor: "rgba(30, 45, 67, 0.45)",
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false,
    allow_symbol_change: false,
    calendar: false,
    support_host: "https://www.tradingview.com"
  }), [symbol]);

  const mobileChartConfig = useMemo(() => ({
    symbol,
    width: "100%",
    height: "100%",
    locale: "en",
    dateRange: "1D",
    colorTheme: "dark",
    isTransparent: true,
    autosize: true,
    largeChartUrl: "https://www.tradingview.com/symbols/XAUUSD/",
    chartOnly: false,
    noTimeScale: false
  }), [symbol]);

  return (
    <section className="card tvGoldCard">
      <div className="tvGoldHeader">
        <div className="tvHeading">
          <div className="eyebrowRow">
            <div className="eyebrow">GOLD · XAU/USD</div>
            <span className="liveBadge live">● LIVE</span>
            <span className="freeBadge">FREE</span>
          </div>
          <div className="sectionTitle tvTitle">TradingView realtime · OANDA</div>
          <div className="unit tvDescription">
            Giá và chart được TradingView render trực tiếp.
          </div>
        </div>

        <div className="tvLinks">
          <a href="https://www.tradingview.com/symbols/XAUUSD/" target="_blank" rel="noreferrer">
            TradingView ↗
          </a>
          <a href="https://tradingeconomics.com/commodity/gold" target="_blank" rel="noreferrer">
            Trading Economics ↗
          </a>
        </div>
      </div>

      <div className="tvQuoteWidget">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js"
          config={symbolInfoConfig}
          className="tvSymbolInfo"
        />
      </div>

      {isMobile ? (
        <>
          <div className="tvMobileChartWidget">
            <TradingViewWidget
              scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
              config={mobileChartConfig}
              className="tvMiniChart"
            />
          </div>
          <a
            className="tvFullChartButton"
            href="https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD"
            target="_blank"
            rel="noreferrer"
          >
            Mở chart TradingView đầy đủ ↗
          </a>
        </>
      ) : (
        <div className="tvChartWidget">
          <TradingViewWidget
            scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
            config={desktopChartConfig}
            className="tvAdvancedChart"
          />
        </div>
      )}

      <div className="tvNotice">
        <strong>Nguồn realtime:</strong> TradingView · {symbol}
        <span className="desktopOnly">Desktop: Advanced Chart.</span>
        <span className="mobileOnly">Mobile: chart responsive tối ưu màn hình hẹp.</span>
      </div>
    </section>
  );
}
