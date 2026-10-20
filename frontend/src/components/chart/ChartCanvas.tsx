"use client";

import type { EChartsOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useRef } from "react";
import {
  atrSeries,
  bollinger,
  closes,
  emaSeries,
  macdSeries,
  rsiSeries,
  swingRange,
  vwapSeries,
} from "@/lib/chartMath";
import type { CandlePayload } from "@/lib/marketApi";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";

interface ChartCanvasProps {
  data: CandlePayload;
  indicators: Set<IndicatorId>;
  drawings: Set<DrawingId>;
}

const BULL = "#22c55e";
const BEAR = "#ef4444";
const AXIS = "#71717a";
const GRID = "#18181b";

export function ChartCanvas({ data, indicators, drawings }: ChartCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReactECharts>(null);

  const option = useMemo(
    () => buildOption(data, indicators, drawings),
    [data, indicators, drawings],
  );

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(() => {
      try {
        chartRef.current?.getEchartsInstance().resize();
      } catch (err) {
        console.error("Fallo al redimensionar el gráfico:", err);
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      try {
        const instance = chartRef.current?.getEchartsInstance();
        instance?.clear();
        instance?.dispose();
      } catch (err) {
        console.error("Fallo al destruir el gráfico:", err);
      }
    };
  }, []);

  return (
    <div ref={wrapRef} className="h-full min-h-0 w-full">
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge
        lazyUpdate
        style={{ height: "100%", width: "100%" }}
        opts={{
          renderer: "canvas",
          devicePixelRatio: typeof window === "undefined" ? 2 : window.devicePixelRatio || 2,
        }}
      />
    </div>
  );
}

function buildOption(
  data: CandlePayload,
  indicators: Set<IndicatorId>,
  drawings: Set<DrawingId>,
): EChartsOption {
  const { dates, values, volumes } = data;
  const close = closes(values);
  const showRsi = indicators.has("rsi");
  const showMacd = indicators.has("macd");
  const extra = Number(showRsi) + Number(showMacd);

  const grids: EChartsOption["grid"] = [];
  const xAxes: EChartsOption["xAxis"] = [];
  const yAxes: EChartsOption["yAxis"] = [];

  const candleBottom = extra === 0 ? "28%" : extra === 1 ? "46%" : "58%";
  grids.push({ left: 56, right: 18, top: 28, bottom: candleBottom });
  xAxes.push({
    type: "category",
    data: dates,
    gridIndex: 0,
    axisLine: { lineStyle: { color: GRID } },
    axisLabel: { color: AXIS, fontSize: 10 },
    axisTick: { show: false },
  });
  yAxes.push({
    scale: true,
    gridIndex: 0,
    splitLine: { lineStyle: { color: GRID } },
    axisLabel: { color: AXIS, fontSize: 10 },
  });

  const volTop = extra === 0 ? "76%" : extra === 1 ? "58%" : "46%";
  const volHeight = extra === 0 ? "18%" : "12%";
  grids.push({ left: 56, right: 18, top: volTop, height: volHeight });
  xAxes.push({
    type: "category",
    data: dates,
    gridIndex: 1,
    axisLabel: { show: extra === 0, color: AXIS, fontSize: 10 },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: GRID } },
  });
  yAxes.push({
    gridIndex: 1,
    splitLine: { show: false },
    axisLabel: { color: AXIS, fontSize: 9 },
  });

  let nextGrid = 2;
  if (showRsi) {
    const top = extra === 2 ? "62%" : "74%";
    grids.push({ left: 56, right: 18, top, height: "12%" });
    xAxes.push({
      type: "category",
      data: dates,
      gridIndex: nextGrid,
      axisLabel: { show: !showMacd, color: AXIS, fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID } },
    });
    yAxes.push({
      gridIndex: nextGrid,
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: AXIS, fontSize: 9 },
    });
    nextGrid += 1;
  }
  if (showMacd) {
    grids.push({ left: 56, right: 18, top: "78%", height: "16%" });
    xAxes.push({
      type: "category",
      data: dates,
      gridIndex: nextGrid,
      axisLabel: { color: AXIS, fontSize: 10 },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: GRID } },
    });
    yAxes.push({
      gridIndex: nextGrid,
      splitLine: { lineStyle: { color: GRID } },
      axisLabel: { color: AXIS, fontSize: 9 },
    });
  }

  const series: EChartsOption["series"] = [
    {
      name: "OHLC",
      type: "candlestick",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: values,
      itemStyle: {
        color: BULL,
        color0: BEAR,
        borderColor: BULL,
        borderColor0: BEAR,
      },
    },
    {
      name: "Volumen",
      type: "bar",
      xAxisIndex: 1,
      yAxisIndex: 1,
      data: volumes.map((volume, i) => ({
        value: volume,
        itemStyle: { color: values[i][1] >= values[i][0] ? "rgba(34,197,94,0.55)" : "rgba(239,68,68,0.55)" },
      })),
    },
  ];

  const overlay = (
    name: string,
    color: string,
    points: (number | null)[],
    width = 1.2,
  ) => {
    series.push({
      name,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: points,
      showSymbol: false,
      lineStyle: { width, color },
    });
  };

  if (indicators.has("ema20")) overlay("EMA 20", "#38bdf8", emaSeries(close, 20));
  if (indicators.has("ema50")) overlay("EMA 50", "#a78bfa", emaSeries(close, 50));
  if (indicators.has("ema200")) overlay("EMA 200", "#f59e0b", emaSeries(close, 200), 1.6);
  if (indicators.has("vwap")) overlay("VWAP", "#f472b6", vwapSeries(values, volumes), 1.4);
  if (indicators.has("bb")) {
    const bands = bollinger(close);
    overlay("BB Mid", "#71717a", bands.mid, 1);
    overlay("BB Upper", "#64748b", bands.upper);
    overlay("BB Lower", "#64748b", bands.lower);
  }
  if (indicators.has("atr")) {
    yAxes.push({
      scale: true,
      gridIndex: 0,
      position: "right",
      splitLine: { show: false },
      axisLabel: { color: "#fb923c", fontSize: 9 },
    });
    const atrAxis = (Array.isArray(yAxes) ? yAxes.length : 1) - 1;
    series.push({
      name: "ATR 14",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: atrAxis,
      data: atrSeries(values),
      showSymbol: false,
      lineStyle: { width: 1.1, color: "#fb923c" },
    });
  }

  if (showRsi) {
    const rsiIndex = 2;
    series.push({
      name: "RSI",
      type: "line",
      xAxisIndex: rsiIndex,
      yAxisIndex: rsiIndex,
      data: rsiSeries(close),
      showSymbol: false,
      lineStyle: { width: 1.2, color: "#eab308" },
      markLine: {
        silent: true,
        symbol: "none",
        lineStyle: { color: "#3f3f46", type: "dashed" },
        data: [{ yAxis: 70 }, { yAxis: 30 }],
      },
    });
  }

  if (showMacd) {
    const macd = macdSeries(close);
    const macdIndex = showRsi ? 3 : 2;
    series.push(
      {
        name: "MACD",
        type: "line",
        xAxisIndex: macdIndex,
        yAxisIndex: macdIndex,
        data: macd.macd,
        showSymbol: false,
        lineStyle: { width: 1.2, color: "#38bdf8" },
      },
      {
        name: "Señal",
        type: "line",
        xAxisIndex: macdIndex,
        yAxisIndex: macdIndex,
        data: macd.signal,
        showSymbol: false,
        lineStyle: { width: 1.2, color: "#f97316" },
      },
      {
        name: "Hist MACD",
        type: "bar",
        xAxisIndex: macdIndex,
        yAxisIndex: macdIndex,
        data: macd.hist.map((value) => ({
          value,
          itemStyle: { color: (value ?? 0) >= 0 ? "rgba(34,197,94,0.7)" : "rgba(239,68,68,0.7)" },
        })),
      },
    );
  }

  const markLineData: Array<{ yAxis: number; name: string; lineStyle: { color: string; type?: string } }> =
    [];
  if (values.length > 2) {
    const { high, low } = swingRange(values);
    if (drawings.has("sr")) {
      markLineData.push(
        { yAxis: high, name: "Resistencia", lineStyle: { color: BEAR } },
        { yAxis: low, name: "Soporte", lineStyle: { color: BULL } },
      );
    }
    if (drawings.has("fibonacci")) {
      const span = high - low;
      const levels = [
        [1, "0%"],
        [0.786, "78.6%"],
        [0.618, "61.8%"],
        [0.5, "50%"],
        [0.382, "38.2%"],
        [0.236, "23.6%"],
        [0, "100%"],
      ] as const;
      for (const [ratio, label] of levels) {
        markLineData.push({
          yAxis: low + span * ratio,
          name: `Fib ${label}`,
          lineStyle: { color: "#fbbf24", type: "dashed" },
        });
      }
    }
    if (drawings.has("channel") || drawings.has("triangle")) {
      const mid = (high + low) / 2;
      markLineData.push({
        yAxis: mid,
        name: drawings.has("triangle") ? "Compresión" : "Canal",
        lineStyle: { color: "#67e8f9", type: "dotted" },
      });
    }
  }
  if (markLineData.length > 0) {
    (series[0] as { markLine?: unknown }).markLine = {
      silent: true,
      symbol: "none",
      label: { color: "#a1a1aa", fontSize: 10 },
      data: markLineData,
    };
  }

  const xAxisCount = Array.isArray(xAxes) ? xAxes.length : 1;

  return {
    backgroundColor: "#08090d",
    animation: false,
    legend: { show: false },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross", crossStyle: { color: "#52525b" } },
      backgroundColor: "rgba(9,9,11,0.94)",
      borderColor: "#27272a",
      textStyle: { color: "#e4e4e7", fontSize: 11, fontFamily: "ui-monospace, monospace" },
      formatter: (raw) => formatTooltip(raw, values, dates),
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: Array.from({ length: xAxisCount }, (_, i) => i),
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        moveOnMouseWheel: false,
      },
    ],
    series,
  };
}

function formatTooltip(raw: unknown, values: CandlePayload["values"], dates: string[]): string {
  const list = Array.isArray(raw) ? raw : [];
  const candle = list.find((item) => (item as { seriesName?: string }).seriesName === "OHLC") as
    | { dataIndex?: number }
    | undefined;
  const index = candle?.dataIndex ?? 0;
  const bar = values[index];
  if (!bar) {
    return "";
  }
  const [open, close, low, high] = bar;
  const prev = values[index - 1]?.[1] ?? open;
  const change = prev ? ((close - prev) / prev) * 100 : 0;
  const tone = close >= open ? BULL : BEAR;
  return [
    `<div style="font-weight:600">${dates[index] ?? ""}</div>`,
    `O <b>${open.toFixed(2)}</b>`,
    `H <b>${high.toFixed(2)}</b>`,
    `L <b>${low.toFixed(2)}</b>`,
    `C <b style="color:${tone}">${close.toFixed(2)}</b>`,
    `Var <b style="color:${tone}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</b>`,
  ].join("<br/>");
}
