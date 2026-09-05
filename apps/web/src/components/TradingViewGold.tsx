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

function MobileWorldQuote({ quote }: { quote: WorldGoldQuote | null }) {
  if (!quote) {
    return (
      <div className="mobileWorldQuote loading">
        <div>Đang tải XAU/USD…</div>
      </div>
    );
  }

  const pct = quote.changePct ?? null;
  const abs = quote.changeAbs ?? (
    quote.previousClose != null ? quote.price - quote.previousClose : null
  );
  const direction = pct == null ? "neutral" : pct > 0 ? "positive" : pct < 0 ? "negative" : "neutral";

  return (
    <div className="mobileWorldQuote">
      <div className="mobileWorldSymbol">XAU/USD</div>

      <div className="mobileWorldMain">
        <div className="mobileWorldPrice">
          ${quote.price.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>

        <div className={`mobileWorldChange ${direction}`}>
          {pct == null
            ? "—"
            : `${pct > 0 ? "▲" : pct < 0 ? "▼" : "●"} ${pct > 0 ? "+" : ""}${pct.toFixed(2)}%`}
        </div>
      </div>

      <div className="mobileWorldSub">
        {abs != null && (
          <span className={direction}>
            {abs > 0 ? "+" : ""}{abs.toFixed(2)} USD
          </span>
        )}
        <span>so với đóng cửa phiên trước</span>
      </div>

      <div className="mobileWorldMeta">
        <span>Previous close</span>
        <strong>
          {quote.previousClose != null
            ? `$${quote.previousClose.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}`
            : "—"}
        </strong>
      </div>

      <div className="mobileWorldTimestamp">
        Cập nhật: {new Date(quote.receivedAt ?? quote.observedAt).toLocaleTimeString("vi-VN")}
        {" · "}
        feed: {quote.source}
      </div>
    </div>
  );
}

export function TradingViewGoldLive({ quote }: { quote: WorldGoldQuote | null }) {
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
      <section className="card worldMobileCard">
        <div className="worldMobileHeader">
          <div>
            <div className="eyebrowRow">
              <span className="eyebrow">GOLD · WORLD</span>
              <span className="liveBadge live">● LIVE</span>
            </div>
            <h2>Vàng thế giới</h2>
          </div>
        </div>

        <MobileWorldQuote quote={quote} />
        {links}

        <div className="mobileWorldNote">
          Chart nhúng TradingView không được dùng trên mobile/PWA vì không ổn định
          trên một số thiết bị. Hai link trên vẫn mở chart đầy đủ.
        </div>
      </section>
    );
  }

  return (
    <section className="card tvGoldCard">
      <div className="tvGoldHeader">
        <div>
          <div className="eyebrowRow">
            <span className="eyebrow">GOLD · XAU/USD</span>
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
          config={symbolInfoConfig}
          className="tvSymbolInfo"
        />
      </div>

      <div className="tvChartWidget">
        <TradingViewWidget
          scriptSrc="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js"
          config={chartConfig}
          className="tvAdvancedChart"
        />
      </div>

      <div className="tvNotice">
        <strong>Nguồn chart:</strong> TradingView · {symbol}
      </div>
    </section>
  );
}
