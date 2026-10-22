"use client";

import type { ECharts, EChartsOption, SeriesOption } from "echarts";
import ReactECharts from "echarts-for-react";
import Image from "next/image";
import { memo, useEffect, useMemo, useRef } from "react";
import {
  bindChartScale,
  centerChartView,
  CHART_CENTER_EVENT,
  peekPriceLock,
} from "@/components/chart/chartScaleInteraction";
import {
  anchoredVwap,
  atrSeries,
  bollinger,
  cciSeries,
  closes,
  emaSeries,
  keltner,
  macdSeries,
  mfiSeries,
  obvSeries,
  parabolicSar,
  rocSeries,
  rsiSeries,
  smaSeries,
  stdDevSeries,
  stochastic,
  supertrendSeries,
  swingRange,
  volumePressure,
  vwapSeries,
  williamsR,
  type AutoSRDiagonal,
  type AutoSRLevel,
} from "@/lib/chartMath";
import type { CandlePayload } from "@/lib/marketApi";
import type { PatternOverlay } from "@/components/chart/chartAutoPatterns";
import { buildPriceSeries, formatPrice } from "@/components/chart/chartPriceSeries";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";
import { computeBuiltSeries, type BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import { indicatorStyle, type IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import {
  applyNeonTheme,
  chartSurfaceStyle,
  DEFAULT_CHART_THEME,
  mixColor,
  neonAmount,
  type ChartVisualTheme,
} from "@/components/chart/chartVisualTheme";

interface ChartCanvasProps {
  data: CandlePayload;
  indicators: Set<IndicatorId>;
  drawings: Set<DrawingId>;
  autoSR?: AutoSRLevel[];
  autoDiagonals?: AutoSRDiagonal[];
  autoPatterns?: PatternOverlay[];
  theme?: ChartVisualTheme;
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  chartType?: ChartPriceType;
  onInstance?: (chart: ECharts | null) => void;
  onViewChange?: () => void;
}

const CHART_STYLE = { height: "100%", width: "100%" } as const;
const CHART_OPTS = { renderer: "canvas" as const, useDirtyRect: false };

function withoutZoomWindow(option: EChartsOption): EChartsOption {
  if (!Array.isArray(option.dataZoom)) {
    return option;
  }
  return {
    ...option,
    dataZoom: option.dataZoom.map((item) => {
      if (!item || typeof item !== "object") {
        return item;
      }
      const next = { ...(item as Record<string, unknown>) };
      delete next.start;
      delete next.end;
      return next;
    }),
  };
}

function withYLock(option: EChartsOption, lock: { min: number; max: number } | null): EChartsOption {
  if (!lock || !Array.isArray(option.yAxis) || !option.yAxis[0] || typeof option.yAxis[0] !== "object") {
    return option;
  }
  const axes = [...option.yAxis];
  axes[0] = { ...(axes[0] as object), min: lock.min, max: lock.max };
  return { ...option, yAxis: axes };
}
const CHART_EVENTS = {};

function shouldSetOption(): boolean {
  return false;
}

export const ChartCanvas = memo(function ChartCanvas({
  data,
  indicators,
  drawings,
  autoSR = [],
  autoDiagonals = [],
  autoPatterns = [],
  theme = DEFAULT_CHART_THEME,
  indicatorSettings = {},
  builtIndicators = [],
  chartType = "candles",
  onInstance,
  onViewChange,
}: ChartCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReactECharts>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const unbindScale = useRef<(() => void) | null>(null);
  const yLockRef = useRef<{ min: number; max: number } | null>(null);
  const seedZoomRef = useRef(true);
  const dataRef = useRef(data);
  dataRef.current = data;
  const onViewRef = useRef(onViewChange);
  const onInstanceRef = useRef(onInstance);
  onViewRef.current = onViewChange;
  onInstanceRef.current = onInstance;

  const visual = useMemo(() => applyNeonTheme(theme), [theme]);
  const option = useMemo(
    () =>
      buildOption(
        data,
        indicators,
        drawings,
        autoSR,
        autoDiagonals,
        autoPatterns,
        visual,
        indicatorSettings,
        builtIndicators,
        chartType,
      ),
    [data, indicators, drawings, autoSR, autoDiagonals, autoPatterns, visual, indicatorSettings, builtIndicators, chartType],
  );

  useEffect(() => {
    try {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) {
        return;
      }
      yLockRef.current = peekPriceLock(chart) ?? yLockRef.current;
      const locked = withYLock(option, yLockRef.current);
      const next = seedZoomRef.current ? locked : withoutZoomWindow(locked);
      seedZoomRef.current = false;
      chart.setOption(next, {
        notMerge: false,
        replaceMerge: ["series"],
        lazyUpdate: false,
        silent: true,
      });
      onViewRef.current?.();
    } catch {
      return;
    }
  }, [option]);

  useEffect(() => {
    yLockRef.current = null;
    seedZoomRef.current = true;
  }, [data.ticker, data.interval]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) {
        return;
      }
      const width = Math.round(box.width);
      const height = Math.round(box.height);
      if (width === sizeRef.current.width && height === sizeRef.current.height) {
        return;
      }
      sizeRef.current = { width, height };
      try {
        chartRef.current?.getEchartsInstance().resize({ animation: { duration: 0 } });
      } catch (err) {
        console.error("Fallo al redimensionar el gráfico:", err);
      }
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      unbindScale.current?.();
      unbindScale.current = null;
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden select-none"
      style={chartSurfaceStyle(visual)}
    >
      <ReactECharts
        ref={chartRef}
        option={option}
        notMerge={false}
        lazyUpdate
        style={CHART_STYLE}
        opts={CHART_OPTS}
        onEvents={CHART_EVENTS}
        shouldSetOption={shouldSetOption}
        onChartReady={(instance: ECharts) => {
          unbindScale.current?.();
          const bump = () => onViewRef.current?.();
          unbindScale.current = bindChartScale(instance, {
            onYLock: (extent) => {
              yLockRef.current = extent;
            },
            onView: bump,
          });
          instance.on("datazoom", bump);
          instance.on("finished", bump);
          onInstanceRef.current?.(instance);
          bump();
          const onCenter = () => {
            yLockRef.current = centerChartView(instance, dataRef.current.values);
            bump();
          };
          window.addEventListener(CHART_CENTER_EVENT, onCenter);
          const prev = unbindScale.current;
          unbindScale.current = () => {
            window.removeEventListener(CHART_CENTER_EVENT, onCenter);
            instance.off("datazoom", bump);
            instance.off("finished", bump);
            onInstanceRef.current?.(null);
            prev?.();
          };
        }}
      />
      <Image
        src="/brand/avizor-mark.png?v=3"
        alt=""
        width={48}
        height={54}
        aria-hidden
        className="pointer-events-none absolute left-3 top-2 z-[1] h-12 w-auto select-none object-contain opacity-15"
      />
      {visual.watermarkTicker || visual.watermarkChange ? (
        <div className="pointer-events-none absolute left-14 top-9 z-[1] select-none">
          {visual.watermarkTicker ? (
            <p
              className="font-mono text-3xl font-semibold tracking-tight"
              style={{
                color:
                  neonAmount(visual) > 0
                    ? `rgba(0,255,102,${(0.1 + neonAmount(visual) * 0.12).toFixed(2)})`
                    : "rgba(255,255,255,0.10)",
              }}
            >
              {data.ticker}
            </p>
          ) : null}
          {visual.watermarkChange ? (
            <p
              className="font-mono text-sm"
              style={{
                color:
                  data.changePct >= 0
                    ? `rgba(0,255,102,${(0.25 + neonAmount(visual) * 0.15).toFixed(2)})`
                    : `rgba(255,0,127,${(0.25 + neonAmount(visual) * 0.15).toFixed(2)})`,
              }}
            >
              {data.changePct >= 0 ? "+" : ""}
              {data.changePct.toFixed(2)}%
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

function buildOption(
  data: CandlePayload,
  indicators: Set<IndicatorId>,
  drawings: Set<DrawingId>,
  autoSR: AutoSRLevel[],
  autoDiagonals: AutoSRDiagonal[],
  autoPatterns: PatternOverlay[],
  theme: ChartVisualTheme,
  settings: IndicatorSettingsMap,
  builtIndicators: BuiltIndicator[],
  chartType: ChartPriceType,
): EChartsOption {
  const { dates, values, volumes } = data;
  const close = closes(values);
  const lastClose = close[close.length - 1] ?? data.last;
  const lastUp = (values[values.length - 1]?.[1] ?? lastClose) >= (values[values.length - 1]?.[0] ?? lastClose);
  const panes = (
    ["rsi", "macd", "stoch", "cci", "roc", "willr", "atr", "stddev", "obv", "mfi", "vol_pressure"] as const
  ).filter((id) => indicators.has(id));
  const builtOn = builtIndicators.filter((item) => item.enabled);
  const builtPanes = builtOn.filter((item) => item.pane === "pane");
  const paneCount = panes.length + builtPanes.length;
  const paneShare = paneCount === 0 ? 0 : Math.min(50, 8 * paneCount + 4);
  const eachPane = paneCount === 0 ? 0 : paneShare / paneCount;

  const grids: EChartsOption["grid"] = [];
  const xAxes: EChartsOption["xAxis"] = [];
  const yAxes: EChartsOption["yAxis"] = [];

  grids.push({
    left: 8,
    right: 54,
    top: 8,
    bottom: paneCount === 0 ? 36 : `${paneShare}%`,
    containLabel: false,
  });
  xAxes.push({
    type: "category",
    data: dates,
    gridIndex: 0,
    boundaryGap: true,
    axisLine: { lineStyle: { color: theme.grid } },
    axisLabel: {
      show: paneCount === 0,
      color: theme.axis,
      fontSize: 11,
      fontWeight: 500,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      margin: 6,
      hideOverlap: true,
    },
    axisTick: { show: false },
    splitLine: {
      show: theme.gridVertical,
      lineStyle: { color: theme.grid, type: "dotted", width: theme.gridWidth },
    },
  });
  yAxes.push({
    scale: true,
    gridIndex: 0,
    position: "right",
    splitLine: {
      show: theme.gridHorizontal,
      lineStyle: { color: theme.grid, type: "dotted", width: theme.gridWidth },
    },
    axisLabel: {
      color: theme.axis,
      fontSize: 11,
      fontWeight: 500,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      margin: 6,
      hideOverlap: true,
      formatter: (value: number) => formatPrice(value),
    },
    axisLine: { show: true, lineStyle: { color: theme.grid } },
    axisTick: { show: false },
  });
  yAxes.push({
    gridIndex: 0,
    min: 0,
    max: Math.max(...volumes, 1) * 4.5,
    scale: false,
    position: "left",
    splitLine: { show: false },
    axisLabel: { show: false },
    axisLine: { show: false },
    axisTick: { show: false },
  });

  panes.forEach((id, index) => {
    const top = 100 - paneShare + index * eachPane;
    grids.push(
      index === paneCount - 1
        ? { left: 8, right: 54, top: `${top + 0.4}%`, bottom: 36, containLabel: false }
        : { left: 8, right: 54, top: `${top + 0.4}%`, height: `${eachPane - 0.6}%`, containLabel: false },
    );
    xAxes.push({
      type: "category",
      data: dates,
      gridIndex: index + 1,
      axisLabel: {
        show: index === paneCount - 1,
        color: theme.axis,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
    });
    const bounded =
      id === "rsi" || id === "stoch" || id === "mfi"
        ? { min: 0, max: 100 }
        : id === "willr"
          ? { min: -100, max: 0 }
          : {};
    yAxes.push({
      gridIndex: index + 1,
      position: "right",
      splitLine: { lineStyle: { color: theme.grid, type: "dotted" } },
      axisLabel: {
        color: theme.axis,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        margin: 6,
      },
      ...bounded,
    });
  });
  builtPanes.forEach((item, offset) => {
    const index = panes.length + offset;
    const top = 100 - paneShare + index * eachPane;
    grids.push(
      index === paneCount - 1
        ? { left: 8, right: 54, top: `${top + 0.4}%`, bottom: 36, containLabel: false }
        : { left: 8, right: 54, top: `${top + 0.4}%`, height: `${eachPane - 0.6}%`, containLabel: false },
    );
    xAxes.push({
      type: "category",
      data: dates,
      gridIndex: index + 1,
      axisLabel: {
        show: index === paneCount - 1,
        color: theme.axis,
        fontSize: 11,
        fontWeight: 500,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
    });
    yAxes.push({
      gridIndex: index + 1,
      position: "right",
      splitLine: { lineStyle: { color: theme.grid, type: "dotted" } },
      axisLabel: {
        color: theme.axis,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        margin: 6,
      },
      ...(item.method === "rsi" ? { min: 0, max: 100 } : {}),
    });
  });

  const series: SeriesOption[] = [
    buildPriceSeries(chartType, dates, values, theme, lastClose, lastUp),
  ];
  series.unshift({
    id: "volume",
    name: "Volumen",
    type: "bar",
    xAxisIndex: 0,
    yAxisIndex: 1,
    z: 1,
    data: volumes.map((volume, i) => {
      const vol = indicatorStyle("vol_hist", settings);
      const up = indicators.has("vol_hist") ? vol.color : theme.volumeBull;
      const down = indicators.has("vol_hist") ? (vol.color2 ?? vol.color) : theme.volumeBear;
      return {
        value: volume,
        itemStyle: { color: values[i][1] >= values[i][0] ? up : down },
      };
    }),
  });

  const overlay = (
    name: string,
    color: string,
    points: (number | null)[],
    width = 1.2,
  ) => {
    series.push({
      id: `overlay-${name}`,
      name,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: points,
      showSymbol: false,
      lineStyle: {
        width,
        color,
        shadowBlur: 10 * neonAmount(theme),
        shadowColor: color,
      },
    });
  };

  const glow = neonAmount(theme);
  const cfg = (id: IndicatorId) => indicatorStyle(id, settings);
  const ink = (value: string) => mixColor(value, value, glow);
  if (indicators.has("ema9")) {
    const s = cfg("ema9");
    overlay("EMA 9", ink(s.color), emaSeries(close, s.period ?? 9), s.width);
  }
  if (indicators.has("ema20")) {
    const s = cfg("ema20");
    overlay("EMA 20", ink(s.color), emaSeries(close, s.period ?? 20), s.width);
  }
  if (indicators.has("ema50")) {
    const s = cfg("ema50");
    overlay("EMA 50", ink(s.color), emaSeries(close, s.period ?? 50), s.width);
  }
  if (indicators.has("ema200")) {
    const s = cfg("ema200");
    overlay("EMA 200", ink(s.color), emaSeries(close, s.period ?? 200), s.width ?? 1.6);
  }
  if (indicators.has("sma50")) {
    const s = cfg("sma50");
    overlay("SMA 50", ink(s.color), smaSeries(close, s.period ?? 50), s.width);
  }
  if (indicators.has("sma200")) {
    const s = cfg("sma200");
    overlay("SMA 200", ink(s.color), smaSeries(close, s.period ?? 200), s.width ?? 1.5);
  }
  if (indicators.has("vwap")) {
    const s = cfg("vwap");
    overlay("VWAP", ink(s.color), vwapSeries(values, volumes), s.width ?? 1.4);
  }
  if (indicators.has("avwap")) {
    const s = cfg("avwap");
    overlay("Anchored VWAP", ink(s.color), anchoredVwap(values, volumes), s.width ?? 1.4);
  }
  if (indicators.has("bb")) {
    const s = cfg("bb");
    const bands = bollinger(close, s.period ?? 20, s.mult ?? 2);
    overlay("BB Mid", ink(s.color), bands.mid, s.width ?? 1);
    overlay("BB Upper", ink(s.color2 ?? s.color), bands.upper, s.width);
    overlay("BB Lower", ink(s.color2 ?? s.color), bands.lower, s.width);
  }
  if (indicators.has("keltner")) {
    const s = cfg("keltner");
    const bands = keltner(values, s.period ?? 20, s.mult ?? 1.5);
    overlay("Keltner Mid", ink(s.color), bands.mid, s.width ?? 1);
    overlay("Keltner Up", ink(s.color2 ?? s.color), bands.upper, s.width);
    overlay("Keltner Lo", ink(s.color2 ?? s.color), bands.lower, s.width);
  }
  if (indicators.has("supertrend")) {
    const s = cfg("supertrend");
    const st = supertrendSeries(values, s.period ?? 10, s.mult ?? 3);
    series.push({
      id: "overlay-Supertrend",
      name: "Supertrend",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: st.line.map((value, i) => ({
        value,
        itemStyle: { color: st.trend[i] === -1 ? (s.color2 ?? "#FF3366") : s.color },
      })),
      showSymbol: false,
      lineStyle: { width: s.width ?? 1.5, color: s.color },
    });
  }
  if (indicators.has("psar")) {
    const s = cfg("psar");
    series.push({
      id: "overlay-Parabolic SAR",
      name: "Parabolic SAR",
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: parabolicSar(values, s.step ?? 0.02, s.max ?? 0.2),
      symbolSize: 4,
      itemStyle: { color: s.color },
    });
  }

  panes.forEach((id, index) => {
    const x = index + 1;
    const y = index + 2;
    const paneLine = (name: string, color: string, data: (number | null)[], width = 1.2) => {
      series.push({
        name,
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data,
        showSymbol: false,
        lineStyle: { width, color },
      });
    };
    if (id === "rsi") {
      const s = cfg("rsi");
      series.push({
        name: "RSI",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: rsiSeries(close, s.period ?? 14),
        showSymbol: false,
        lineStyle: { width: s.width ?? 1.2, color: s.color },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#3f3f46", type: "dashed" },
          data: [{ yAxis: 70 }, { yAxis: 30 }],
        },
      });
    }
    if (id === "macd") {
      const s = cfg("macd");
      const macd = macdSeries(close, s.period ?? 12, s.period2 ?? 26, s.period3 ?? 9);
      paneLine("MACD", s.color, macd.macd, s.width);
      paneLine("Señal", s.color2 ?? "#f97316", macd.signal, s.width);
      series.push({
        name: "Hist MACD",
        type: "bar",
        xAxisIndex: x,
        yAxisIndex: y,
        data: macd.hist.map((value) => ({
          value,
          itemStyle: { color: (value ?? 0) >= 0 ? (s.color3 ?? "#22c55e") : (s.color2 ?? "#ef4444") },
        })),
      });
    }
    if (id === "stoch") {
      const s = cfg("stoch");
      const stoch = stochastic(values, s.period ?? 14, s.period2 ?? 3);
      paneLine("%K", s.color, stoch.k, s.width);
      paneLine("%D", s.color2 ?? s.color, stoch.d, s.width);
    }
    if (id === "cci") {
      const s = cfg("cci");
      paneLine("CCI", s.color, cciSeries(values, s.period ?? 20), s.width);
    }
    if (id === "roc") {
      const s = cfg("roc");
      paneLine("ROC", s.color, rocSeries(close, s.period ?? 12), s.width);
    }
    if (id === "willr") {
      const s = cfg("willr");
      paneLine("Williams %R", s.color, williamsR(values, s.period ?? 14), s.width);
    }
    if (id === "atr") {
      const s = cfg("atr");
      paneLine("ATR 14", s.color, atrSeries(values, s.period ?? 14), s.width);
    }
    if (id === "stddev") {
      const s = cfg("stddev");
      paneLine("StdDev", s.color, stdDevSeries(close, s.period ?? 20), s.width);
    }
    if (id === "obv") {
      const s = cfg("obv");
      paneLine("OBV", s.color, obvSeries(values, volumes), s.width);
    }
    if (id === "mfi") {
      const s = cfg("mfi");
      paneLine("MFI", s.color, mfiSeries(values, volumes, s.period ?? 14), s.width);
    }
    if (id === "vol_pressure") {
      const s = cfg("vol_pressure");
      paneLine("Volume Pressure", s.color, volumePressure(values, volumes, s.period ?? 14), s.width);
    }
  });

  builtOn.forEach((item) => {
    const points = computeBuiltSeries(item, values, volumes);
    if (item.pane === "overlay") {
      overlay(item.name, item.color, points, item.width);
      return;
    }
    const index = panes.length + builtPanes.findIndex((entry) => entry.id === item.id);
    series.push({
      id: `builder-${item.id}`,
      name: item.name,
      type: "line",
      xAxisIndex: index + 1,
      yAxisIndex: index + 2,
      data: points,
      showSymbol: false,
      lineStyle: { width: item.width, color: item.color },
    });
  });

  const markLineData: Array<{
    yAxis: number;
    name: string;
    lineStyle: { color: string; type?: string; width?: number; opacity?: number };
    label?: { formatter?: string; position?: string; color?: string; fontSize?: number; fontFamily?: string };
  }> = [];
  if (values.length > 2) {
    const { high, low } = swingRange(values);
    if (drawings.has("sr")) {
      markLineData.push(
        { yAxis: high, name: "Resistencia", lineStyle: { color: theme.bear } },
        { yAxis: low, name: "Soporte", lineStyle: { color: theme.bull } },
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
    const candleSeries = series.find((item) => (item as { name?: string }).name === "OHLC") as
      | { markLine?: { data?: unknown[] } }
      | undefined;
    if (candleSeries?.markLine) {
      candleSeries.markLine.data = [...(candleSeries.markLine.data ?? []), ...markLineData];
    }
  }

  const patternMarks = autoPatterns.flatMap((hit) =>
    (hit.marks ?? []).map((mark) => ({
      name: mark.label,
      coord: [dates[mark.index], mark.price] as [string, number],
      value: mark.label,
      itemStyle: { color: hit.color },
      label: { color: hit.color, fontSize: 10, fontFamily: "ui-monospace, monospace" },
    })),
  );
  const patternAreas = autoPatterns.flatMap((hit) =>
    (hit.areas ?? []).map((area) => [
      { xAxis: dates[area.start], yAxis: area.y0, itemStyle: { color: `${hit.color}22` } },
      { xAxis: dates[area.end], yAxis: area.y1 },
    ]),
  );
  if (patternMarks.length > 0 || patternAreas.length > 0) {
    const candleSeries = series.find((item) => (item as { name?: string }).name === "OHLC") as
      | { markPoint?: unknown; markArea?: unknown }
      | undefined;
    if (candleSeries) {
      if (patternMarks.length > 0) {
        candleSeries.markPoint = {
          symbol: "circle",
          symbolSize: 8,
          silent: true,
          data: patternMarks,
        };
      }
      if (patternAreas.length > 0) {
        candleSeries.markArea = {
          silent: true,
          data: patternAreas,
        };
      }
    }
  }

  for (const hit of autoPatterns) {
    const hasLine = hit.line.some((value) => value !== null);
    if (hasLine) {
      series.push({
        name: hit.id,
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: hit.line,
        showSymbol: Boolean(hit.marks?.length),
        symbolSize: 7,
        connectNulls: true,
        silent: true,
        lineStyle: { width: 1.6, color: hit.color },
        itemStyle: { color: hit.color },
      });
    }
    (hit.extraLines ?? []).forEach((extra, extraIndex) => {
      if (!extra.some((value) => value !== null)) {
        return;
      }
      series.push({
        name: `${hit.id}-edge-${extraIndex}`,
        type: "line",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: extra,
        showSymbol: false,
        connectNulls: true,
        silent: true,
        lineStyle: { width: 1.3, color: hit.color, type: "dashed" },
      });
    });
  }

  autoSR.forEach((level, index) => {
    const tone = level.kind === "resistance" ? "#FF3366" : "#00FF66";
    series.push({
      id: `auto-sr-${index}`,
      name: level.label,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: dates.map(() => level.price),
      showSymbol: false,
      silent: true,
      lineStyle: { width: 1.2, color: tone, opacity: 0.9 },
      endLabel: {
        show: true,
        formatter: level.label,
        color: tone,
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
      },
    });
  });

  autoDiagonals.forEach((diagonal, index) => {
    const tone = diagonal.kind === "resistance" ? "#FF3366" : "#00FF66";
    series.push({
      id: `auto-sr-diag-${index}`,
      name: diagonal.label,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: diagonal.line,
      showSymbol: false,
      connectNulls: true,
      silent: true,
      lineStyle: { width: 1.4, color: tone, type: "solid" },
      endLabel: {
        show: true,
        formatter: diagonal.label,
        color: tone,
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
      },
    });
  });

  const xAxisCount = Array.isArray(xAxes) ? xAxes.length : 1;
  const barCount = dates.length;
  const visible = barCount > 700 ? Math.min(520, barCount) : barCount;
  const zoomStart = barCount > 0 ? Math.max(0, ((barCount - visible) / barCount) * 100) : 0;

  return {
    backgroundColor: "transparent",
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    legend: { show: false },
    tooltip: {
      trigger: "axis",
      axisPointer:
        theme.crosshair === "hidden"
          ? { type: "none" }
          : {
              type: "cross",
              animation: false,
              lineStyle: {
                color: theme.crosshairColor,
                type: theme.crosshair === "dashed" ? "dashed" : "solid",
                width: 1,
              },
              crossStyle: {
                color: theme.crosshairColor,
                type: theme.crosshair === "dashed" ? "dashed" : "solid",
              },
            },
      backgroundColor: theme.chromeMenu,
      borderColor: theme.chromeBorder,
      textStyle: { color: theme.uiText, fontSize: 11, fontFamily: "ui-monospace, monospace" },
      formatter: (raw) => formatTooltip(raw, values, dates, theme),
    },
    axisPointer: { link: [{ xAxisIndex: "all" }], animation: false },
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    dataZoom: [
      {
        type: "inside",
        xAxisIndex: Array.from({ length: xAxisCount }, (_, i) => i),
        start: zoomStart,
        end: 100,
        filterMode: "none",
        zoomOnMouseWheel: true,
        moveOnMouseMove: false,
        moveOnMouseWheel: false,
        throttle: 16,
        realtime: true,
        preventDefaultMouseMove: false,
      },
      {
        type: "slider",
        xAxisIndex: Array.from({ length: xAxisCount }, (_, i) => i),
        start: zoomStart,
        end: 100,
        height: 18,
        bottom: 6,
        filterMode: "none",
        realtime: true,
        showDetail: false,
        brushSelect: false,
        fillerColor: "rgba(0,255,102,0.12)",
        borderColor: theme.chromeBorder,
        backgroundColor: theme.chromePanel,
        handleStyle: { color: theme.uiAccent, borderColor: theme.uiAccent },
        moveHandleStyle: { color: theme.uiAccent },
        dataBackground: { lineStyle: { color: theme.grid }, areaStyle: { color: theme.grid } },
        selectedDataBackground: { lineStyle: { color: theme.uiAccent }, areaStyle: { color: theme.uiAccent } },
        textStyle: { color: theme.uiMuted, fontSize: 9 },
      },
      {
        type: "inside",
        yAxisIndex: 0,
        filterMode: "none",
        zoomOnMouseWheel: "shift",
        moveOnMouseMove: false,
        moveOnMouseWheel: false,
        throttle: 16,
        realtime: true,
      },
    ],
    series,
  };
}

function formatTooltip(
  raw: unknown,
  values: CandlePayload["values"],
  dates: string[],
  theme: ChartVisualTheme,
): string {
  const list = Array.isArray(raw) ? raw : [];
  const candle = list.find((item) => {
    const name = (item as { seriesName?: string }).seriesName;
    return name === "OHLC" || name === "Precio";
  }) as { dataIndex?: number } | undefined;
  const index = candle?.dataIndex ?? 0;
  const bar = values[index];
  if (!bar) {
    return "";
  }
  const [open, close, low, high] = bar;
  const prev = values[index - 1]?.[1] ?? open;
  const change = prev ? ((close - prev) / prev) * 100 : 0;
  const tone = close >= open ? theme.bull : theme.bear;
  return [
    `<div style="font-weight:600">${dates[index] ?? ""}</div>`,
    `O <b>${open.toFixed(2)}</b>`,
    `H <b>${high.toFixed(2)}</b>`,
    `L <b>${low.toFixed(2)}</b>`,
    `C <b style="color:${tone}">${close.toFixed(2)}</b>`,
    `Var <b style="color:${tone}">${change >= 0 ? "+" : ""}${change.toFixed(2)}%</b>`,
  ].join("<br/>");
}
