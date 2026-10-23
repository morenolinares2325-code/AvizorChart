"use client";

import { dispose, init, type Chart } from "klinecharts";
import { useEffect, useRef } from "react";
import { toKLineData } from "@/components/chart/kline/data";
import { klineStyles } from "@/components/chart/kline/styles";
import { DEFAULT_CHART_THEME } from "@/components/chart/chartVisualTheme";
import type { CandlePayload } from "@/lib/marketApi";

const BULL = "#22c55e";
const BEAR = "#ef4444";

export function PracticeChart({
  data,
  entry,
  side,
}: {
  data: CandlePayload;
  entry: number | null;
  side: "long" | "short" | "flat";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const chart = init(host, { locale: "en-US", styles: klineStyles(DEFAULT_CHART_THEME, "candles") });
    if (!chart) {
      return;
    }
    chart.setZoomEnabled(true);
    chart.setScrollEnabled(true);
    chart.createIndicator("VOL", false, { id: "pane_vol", height: 64 });
    chartRef.current = chart;
    return () => {
      chartRef.current = null;
      dispose(chart);
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }
    chart.applyNewData(toKLineData(data, "candles"), false);
    try {
      chart.removeOverlay({ id: "practice-entry" });
    } catch {
      /* none */
    }
    if (entry && side !== "flat") {
      chart.createOverlay(
        {
          name: "priceLine",
          id: "practice-entry",
          lock: true,
          points: [{ value: entry }],
          extendData: side === "long" ? "Entrada LONG" : "Entrada SHORT",
          styles: { line: { color: side === "long" ? BULL : BEAR, size: 1.4 } },
        },
        "candle_pane",
      );
    }
    const host = hostRef.current;
    const width = host?.clientWidth || 640;
    chart.setBarSpace(Math.max(5, Math.min(14, width / Math.min(Math.max(data.values.length, 1), 80))));
    chart.scrollToRealTime();
  }, [data, entry, side]);

  return <div ref={hostRef} className="h-full w-full" />;
}
