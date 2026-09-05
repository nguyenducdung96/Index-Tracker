import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type UTCTimestamp
} from "lightweight-charts";
import type { StockChartPoint } from "../../types";

function timeOf(value: string | number): UTCTimestamp {
  if (typeof value === "number") return Math.floor(value / (value > 10_000_000_000 ? 1000 : 1)) as UTCTimestamp;
  const ms = Date.parse(value);
  return Math.floor(ms / 1000) as UTCTimestamp;
}

export function StockChart({ rows }: { rows: StockChartPoint[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || !rows.length) return;

    const chart = createChart(ref.current, {
      autoSize: true,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: "#071320" },
        textColor: "#8da9c5",
        attributionLogo: true
      },
      grid: {
        vertLines: { color: "#14263a" },
        horzLines: { color: "#14263a" }
      },
      rightPriceScale: {
        borderColor: "#29435f"
      },
      timeScale: {
        borderColor: "#29435f",
        timeVisible: true,
        secondsVisible: false
      }
    });

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: "#17d784",
      downColor: "#ff5065",
      wickUpColor: "#17d784",
      wickDownColor: "#ff5065",
      borderVisible: false
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: ""
    });
    volume.priceScale().applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 }
    });

    const ma20 = chart.addSeries(LineSeries, { lineWidth: 1, color: "#f3c646", priceLineVisible: false });
    const ma50 = chart.addSeries(LineSeries, { lineWidth: 1, color: "#4aa3ff", priceLineVisible: false });
    const ma200 = chart.addSeries(LineSeries, { lineWidth: 1, color: "#b66cff", priceLineVisible: false });

    candle.setData(rows.map(x => ({
      time: timeOf(x.time),
      open: x.open,
      high: x.high,
      low: x.low,
      close: x.close
    })));

    volume.setData(rows.map(x => ({
      time: timeOf(x.time),
      value: x.volume,
      color: x.close >= x.open ? "rgba(23,215,132,.52)" : "rgba(255,80,101,.52)"
    })));

    ma20.setData(rows.filter(x => x.ma20 != null).map(x => ({ time: timeOf(x.time), value: x.ma20! })));
    ma50.setData(rows.filter(x => x.ma50 != null).map(x => ({ time: timeOf(x.time), value: x.ma50! })));
    ma200.setData(rows.filter(x => x.ma200 != null).map(x => ({ time: timeOf(x.time), value: x.ma200! })));

    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [rows]);

  return <div className="stockChartCanvas" ref={ref} />;
}
