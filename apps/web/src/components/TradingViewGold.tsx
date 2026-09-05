import { useEffect, useMemo, useRef, useState } from "react";
import type { WorldGoldQuote } from "../types";

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

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = scriptSrc;
    script.textContent = configJson;

    container.appendChild(widget);
    container.appendChild(script);
    host.appendChild(container);

    return () => host.replaceChildren();
  }, [scriptSrc, configJson]);

  return <div ref={ref} className={className} />;
}

function GoldQuote({ quote, compact = false }: {
  quote: WorldGoldQuote | null;
  compact?: boolean;
}) {
  if (!quote) {
    return (
      <div className={`goldQuote ${compact ? "compact" : ""} loading`}>
        Đang tải giá vàng…
      </div>
    );
  }

  const previous = quote.previousClose ?? null;
  const abs = quote.changeAbs ?? (
    previous != null ? quote.price - previous : null
  );
  const pct = quote.changePct ?? (
    previous != null && previous > 0 ? ((quote.price - previous) / previous) * 100 : null
  );

  const direction =
    pct == null ? "neutral" :
    pct > 0 ? "positive" :
    pct < 0 ? "negative" : "neutral";

  return (
    <div className={`goldQuote ${compact ? "compact" : ""}`}>
      <div className="goldQuoteTop">
        <div>
          <div className="goldQuoteSymbol">XAU/USD</div>
          <div className="goldQuotePrice">
            ${quote.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
        </div>

        <div className={`goldMove ${direction}`}>
          <div className="goldMovePct">
            {pct == null
              ? "Đang lấy %"
              : `${pct > 0 ? "▲" : pct < 0 ? "▼" : "●"} ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
          </div>

          <div className="goldMoveAbs">
            {abs == null
              ? "—"
              : `${abs > 0 ? "+" : ""}${abs.toFixed(2)} USD`}
          </div>
        </div>
      </div>

      <div className="goldQuoteBottom">
        <div>
          <span>Đóng cửa trước</span>
          <strong>
            {previous == null
              ? "Đang cập nhật"
              : `$${previous.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}`}
          </strong>
        </div>

        <div>
          <span>Cập nhật</span>
          <strong>
            {new Date(quote.receivedAt ?? quote.observedAt).toLocaleTimeString("vi-VN")}
          </strong>
        </div>
      </div>
    </div>
  );
}

export function TradingViewGoldLive({ quote }: { quote: WorldGoldQuote | null }) {
  const isMobile = useMediaQuery("(max-width: 760px)");
  const symbol = String(
    (import.meta as any).env?.VITE_TV_GOLD_SYMBOL ?? "OANDA:XAUUSD"
  );

  const chartConfig = useMemo(() => ({
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

  const links = (
    <div className="goldReferenceLinks">
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
  );

  if (isMobile) {
    return (
      <section className="card mobileWorldCard">
        <div className="goldSectionHeader">
          <div>
            <div className="eyebrowRow">
              <span className="eyebrow">GOLD · WORLD</span>
              <span className="liveBadge live">● LIVE</span>
            </div>
            <div className="sectionTitle">Vàng thế giới</div>
          </div>
        </div>

        <GoldQuote quote={quote} compact />
        {links}
      </section>
    );
  }

  return (
    <section className="card desktopWorldCard">
      <div className="goldSectionHeader">
        <div>
          <div className="eyebrowRow">
            <span className="eyebrow">GOLD · XAU/USD</span>
            <span className="liveBadge live">● LIVE</span>
          </div>
          <div className="sectionTitle">Vàng thế giới</div>
        </div>

        {links}
      </div>

      <GoldQuote quote={quote} />

      <div className="tvChartWidget">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={chartConfig}
          className="tvAdvancedChart"
        />
      </div>
    </section>
  );
}
