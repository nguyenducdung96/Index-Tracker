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

    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [query]);

  return matches;
}

function TradingViewWidget({ scriptSrc, config, className = "" }: WidgetProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const serializedConfig = JSON.stringify(config);

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

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = scriptSrc;
    script.async = true;
    script.textContent = serializedConfig;

    container.appendChild(widget);
    container.appendChild(script);
    host.appendChild(container);

    return () => host.replaceChildren();
  }, [scriptSrc, serializedConfig]);

  return <div ref={ref} className={className} />;
}

export function TradingViewGoldLive() {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const symbol = String(
    (import.meta as any).env?.VITE_TV_GOLD_SYMBOL ?? "OANDA:XAUUSD"
  );

  const desktopInfo = useMemo(
    () => ({
      symbol,
      width: "100%",
      locale: "en",
      colorTheme: "dark",
      isTransparent: true
    }),
    [symbol]
  );

  const desktopChart = useMemo(
    () => ({
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
    }),
    [symbol]
  );

  const mobileChart = useMemo(
    () => ({
      symbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: "1D",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      chartOnly: false,
      noTimeScale: false
    }),
    [symbol]
  );

  if (isMobile) {
    return (
      <section className="card tvGoldCard tvGoldMobileCard">
        <div className="tvGoldHeader mobileGoldHeader">
          <div className="tvHeading">
            <div className="eyebrowRow">
              <div className="eyebrow">GOLD · XAU/USD</div>
              <span className="liveBadge live">● LIVE</span>
              <span className="freeBadge">FREE</span>
            </div>

            <div className="sectionTitle tvTitle">Gold realtime · OANDA</div>
            <div className="unit tvMobileDescription">
              TradingView responsive chart
            </div>
          </div>
        </div>

        <div className="tvMobileOnlyWidget">
          <TradingViewWidget
            scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js"
            config={mobileChart}
            className="tvMiniOnly"
          />
        </div>

        <div className="tvMobileLinks">
          <a
            href="https://www.tradingview.com/symbols/XAUUSD/"
            target="_blank"
            rel="noreferrer"
          >
            Mở TradingView ↗
          </a>
          <a
            href="https://tradingeconomics.com/commodity/gold"
            target="_blank"
            rel="noreferrer"
          >
            Mở Trading Economics ↗
          </a>
        </div>

        <div className="tvNotice mobileTvNotice">
          <strong>Realtime:</strong> TradingView · {symbol}
        </div>
      </section>
    );
  }

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
          <div className="unit">Giá và chart được TradingView render trực tiếp.</div>
        </div>

        <div className="tvLinks">
          <a
            href="https://www.tradingview.com/symbols/XAUUSD/"
            target="_blank"
            rel="noreferrer"
          >
            TradingView ↗
          </a>
          <a
            href="https://tradingeconomics.com/commodity/gold"
            target="_blank"
            rel="noreferrer"
          >
            Trading Economics ↗
          </a>
        </div>
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
