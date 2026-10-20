"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo } from "react";
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
  const option = useMemo(() => {
    const markLine =
      entry && side !== "flat"
        ? {
            silent: true,
            symbol: "none",
            label: { color: "#e4e4e7", fontSize: 10 },
            data: [{ yAxis: entry, name: side === "long" ? "Entrada LONG" : "Entrada SHORT" }],
            lineStyle: { color: side === "long" ? BULL : BEAR },
          }
        : undefined;
    const chart: EChartsOption = {
      backgroundColor: "#08090d",
      animation: false,
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      grid: [
        { left: 52, right: 16, top: 24, bottom: "28%" },
        { left: 52, right: 16, top: "78%", height: "16%" },
      ],
      xAxis: [
        {
          type: "category",
          data: data.dates,
          axisLabel: { color: "#71717a", fontSize: 10 },
          axisLine: { lineStyle: { color: "#18181b" } },
        },
        {
          type: "category",
          data: data.dates,
          gridIndex: 1,
          axisLabel: { color: "#71717a", fontSize: 9 },
        },
      ],
      yAxis: [
        { scale: true, splitLine: { lineStyle: { color: "#18181b" } }, axisLabel: { color: "#71717a", fontSize: 10 } },
        { gridIndex: 1, splitLine: { show: false }, axisLabel: { color: "#71717a", fontSize: 9 } },
      ],
      dataZoom: [{ type: "inside", xAxisIndex: [0, 1] }],
      series: [
        {
          type: "candlestick",
          data: data.values,
          itemStyle: { color: BULL, color0: BEAR, borderColor: BULL, borderColor0: BEAR },
          markLine,
        },
        {
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.volumes.map((volume, i) => ({
            value: volume,
            itemStyle: {
              color: data.values[i][1] >= data.values[i][0] ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
            },
          })),
        },
      ],
    };
    return chart;
  }, [data, entry, side]);

  return (
    <ReactECharts
      option={option}
      notMerge
      style={{ height: "100%", width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  );
}
