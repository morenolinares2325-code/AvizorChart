"use client";

import type { ECharts, EChartsOption, SeriesOption } from "echarts";
import ReactECharts from "echarts-for-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  bindChartScale,
  centerChartView,
  CHART_CENTER_EVENT,
  CHART_RIGHT_PAD_BARS,
  CHART_RIGHT_PAD_EVENT,
  padChartRightView,
  peekPriceLock,
} from "@/components/chart/chartScaleInteraction";
import {
  adLineSeries,
  adxSeries,
  anchoredVwap,
  atrSeries,
  bollinger,
  cciSeries,
  closes,
  cmfSeries,
  donchian,
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
  stochRsiSeries,
  supertrendSeries,
  swingRange,
  volumePressure,
  vwapSeries,
  williamsR,
  type AutoSRDiagonal,
  type AutoSRLevel,
} from "@/lib/chartMath";
import type { CandlePayload } from "@/lib/marketApi";
import type { BuilderEChartsPayload } from "@/lib/builderApi";
import { buildPatternEchartsLayer, type PatternOverlay } from "@/components/chart/chartAutoPatterns";
import type { ChartPatternPrimitives } from "@/lib/patternPrimitives";
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

export interface TradeGuideLevels {
  entry: number;
  sl?: number | null;
  tp?: number | null;
  side: "buy" | "sell";
}

export interface TradeChartMarker {
  date: string;
  price: number;
  kind: "entry" | "exit";
  side: "buy" | "sell";
  win?: boolean;
  label: string;
}

interface ChartCanvasProps {
  data: CandlePayload;
  indicators: Set<IndicatorId>;
  drawings: Set<DrawingId>;
  tradeGuide?: TradeGuideLevels | null;
  tradeMarkers?: TradeChartMarker[];
  autoSR?: AutoSRLevel[];
  autoDiagonals?: AutoSRDiagonal[];
  autoPatterns?: PatternOverlay[];
  enginePatterns?: ChartPatternPrimitives;
  theme?: ChartVisualTheme;
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  builderVisuals?: BuilderEChartsPayload;
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
  enginePatterns,
  theme = DEFAULT_CHART_THEME,
  indicatorSettings = {},
  builtIndicators = [],
  builderVisuals,
  chartType = "candles",
  tradeGuide = null,
  tradeMarkers = [],
  onInstance,
  onViewChange,
}: ChartCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReactECharts>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const unbindScale = useRef<(() => void) | null>(null);
  const yLockRef = useRef<{ min: number; max: number } | null>(null);
  const seedZoomRef = useRef(true);
  const [rightPad, setRightPad] = useState(0);
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
        enginePatterns,
        visual,
        indicatorSettings,
        builtIndicators,
        chartType,
        rightPad,
        builderVisuals,
        tradeGuide,
        tradeMarkers,
      ),
    [data, indicators, drawings, autoSR, autoDiagonals, autoPatterns, enginePatterns, visual, indicatorSettings, builtIndicators, chartType, rightPad, builderVisuals, tradeGuide, tradeMarkers],
  );

  useEffect(() => {
    try {
      const chart = chartRef.current?.getEchartsInstance();
      if (!chart) {
        return;
      }
      yLockRef.current = peekPriceLock(chart) ?? yLockRef.current;
      const locked = withYLock(option, yLockRef.current);
      const seeding = seedZoomRef.current;
      const next = seeding ? locked : withoutZoomWindow(locked);
      seedZoomRef.current = false;
      chart.setOption(next, {
        notMerge: false,
        replaceMerge: ["series", "graphic"],
        lazyUpdate: false,
        silent: true,
      });
      if (seeding) {
        yLockRef.current = centerChartView(chart, data.values);
      }
      onViewRef.current?.();
    } catch (error) {
      console.warn("[Patrones Auto] setOption rechazó la opción del gráfico.", error);
      return;
    }
  }, [option, data.values.length]);

  useEffect(() => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart || rightPad <= 0) {
      return;
    }
    padChartRightView(chart, data.values.length, rightPad);
  }, [rightPad, data.values.length]);

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
          if (seedZoomRef.current) {
            yLockRef.current = centerChartView(instance, dataRef.current.values);
            seedZoomRef.current = false;
          }
          bump();
          const onCenter = () => {
            yLockRef.current = centerChartView(instance, dataRef.current.values);
            bump();
          };
          const onRightPad = () => {
            setRightPad((current) => (current > 0 ? 0 : CHART_RIGHT_PAD_BARS));
          };
          window.addEventListener(CHART_CENTER_EVENT, onCenter);
          window.addEventListener(CHART_RIGHT_PAD_EVENT, onRightPad);
          const prev = unbindScale.current;
          unbindScale.current = () => {
            window.removeEventListener(CHART_CENTER_EVENT, onCenter);
            window.removeEventListener(CHART_RIGHT_PAD_EVENT, onRightPad);
            instance.off("datazoom", bump);
            instance.off("finished", bump);
            onInstanceRef.current?.(null);
            prev?.();
          };
        }}
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
                    : visual.scheme === "light"
                      ? "rgba(24,24,27,0.12)"
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
  enginePatterns: ChartPatternPrimitives | undefined,
  theme: ChartVisualTheme,
  settings: IndicatorSettingsMap,
  builtIndicators: BuiltIndicator[],
  chartType: ChartPriceType,
  rightPad = 0,
  builderVisuals?: BuilderEChartsPayload,
  tradeGuide?: TradeGuideLevels | null,
  tradeMarkers: TradeChartMarker[] = [],
): EChartsOption {
  const values = data.values;
  const volumes = data.volumes;
  const dates =
    rightPad > 0 ? [...data.dates, ...Array.from({ length: rightPad }, () => "")] : data.dates;
  const close = closes(values);
  const lastClose = close[close.length - 1] ?? data.last;
  const lastUp = (values[values.length - 1]?.[1] ?? lastClose) >= (values[values.length - 1]?.[0] ?? lastClose);
  const panes = (
    [
      "rsi",
      "macd",
      "stoch",
      "cci",
      "roc",
      "willr",
      "adx",
      "stoch_rsi",
      "atr",
      "stddev",
      "obv",
      "mfi",
      "cmf",
      "ad_line",
      "vol_pressure",
    ] as const
  ).filter((id) => indicators.has(id));
  const builtOn = builtIndicators.filter((item) => item.enabled);
  const builtPanes = builtOn.filter((item) => item.pane === "pane");
  const builtPaneKeys: string[] = [];
  for (const item of builtPanes) {
    const key = item.group || item.id;
    if (!builtPaneKeys.includes(key)) {
      builtPaneKeys.push(key);
    }
  }
  const paneCount = panes.length + builtPaneKeys.length;
  const paneShare = paneCount === 0 ? 0 : Math.min(58, paneCount === 1 ? 26 : 16 * paneCount + 4);
  const eachPane = paneCount === 0 ? 0 : paneShare / paneCount;
  const sliderHeight = 22;
  const sliderBottom = 4;
  const gridBottom = sliderBottom + sliderHeight + 24;

  const grids: EChartsOption["grid"] = [];
  const xAxes: EChartsOption["xAxis"] = [];
  const yAxes: EChartsOption["yAxis"] = [];

  grids.push({
    left: 8,
    right: 54,
    top: 8,
    bottom: paneCount === 0 ? gridBottom : `${paneShare + 1.2}%`,
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
      margin: 8,
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
        ? { left: 8, right: 54, top: `${top + 0.4}%`, bottom: gridBottom, containLabel: false }
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
        margin: 8,
      },
      axisTick: { show: false },
      axisLine: { lineStyle: { color: theme.grid } },
    });
    const bounded =
      id === "rsi" || id === "stoch" || id === "mfi" || id === "stoch_rsi" || id === "adx"
        ? { min: 0, max: 100 }
        : id === "willr"
          ? { min: -100, max: 0 }
          : id === "cmf"
            ? { min: -1, max: 1 }
            : id === "macd"
              ? {
                  scale: true,
                  min: (extent: { min: number; max: number }) => {
                    const span = Math.max(Math.abs(extent.min), Math.abs(extent.max), 0.01);
                    return -span * 1.15;
                  },
                  max: (extent: { min: number; max: number }) => {
                    const span = Math.max(Math.abs(extent.min), Math.abs(extent.max), 0.01);
                    return span * 1.15;
                  },
                }
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
  builtPaneKeys.forEach((key, offset) => {
    const index = panes.length + offset;
    const top = 100 - paneShare + index * eachPane;
    const members = builtPanes.filter((item) => (item.group || item.id) === key);
    grids.push(
      index === paneCount - 1
        ? { left: 8, right: 54, top: `${top + 0.4}%`, bottom: gridBottom, containLabel: false }
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
        margin: 8,
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
      ...(members.some((item) => item.method === "rsi") ? { min: 0, max: 100 } : {}),
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
        itemStyle: { color: (values[i]?.[1] ?? 0) >= (values[i]?.[0] ?? 0) ? up : down },
      };
    }),
  });

  const glow = neonAmount(theme);
  const cfg = (id: IndicatorId) => indicatorStyle(id, settings);
  const ink = (value: string) => mixColor(value, value, Math.min(0.35, glow));
  const fillTint = (hex: string, alpha = 0.14) => {
    const raw = hex.replace("#", "");
    const n = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
    const r = Number.parseInt(n.slice(0, 2), 16);
    const g = Number.parseInt(n.slice(2, 4), 16);
    const b = Number.parseInt(n.slice(4, 6), 16);
    if (![r, g, b].every(Number.isFinite)) {
      return hex;
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };
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
      connectNulls: true,
      smooth: 0.08,
      animation: false,
      lineStyle: {
        width,
        color,
        cap: "round",
        join: "round",
        shadowBlur: 4 * glow,
        shadowColor: color,
      },
      z: 4,
    });
  };
  const bandFill = (
    stack: string,
    lower: (number | null)[],
    upper: (number | null)[],
    color: string,
  ) => {
    const span = lower.map((lo, i) => {
      const hi = upper[i];
      return lo == null || hi == null ? null : hi - lo;
    });
    series.push({
      id: `fill-${stack}-base`,
      name: stack,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: lower,
      stack,
      showSymbol: false,
      silent: true,
      animation: false,
      lineStyle: { width: 0, opacity: 0 },
      areaStyle: { opacity: 0 },
      z: 2,
    });
    series.push({
      id: `fill-${stack}-span`,
      name: `${stack} fill`,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: span,
      stack,
      showSymbol: false,
      silent: true,
      animation: false,
      lineStyle: { width: 0, opacity: 0 },
      areaStyle: { color: fillTint(color, 0.16) },
      z: 2,
    });
  };

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
  if (indicators.has("ema100")) {
    const s = cfg("ema100");
    overlay("EMA 100", ink(s.color), emaSeries(close, s.period ?? 100), s.width ?? 1.5);
  }
  if (indicators.has("ema200")) {
    const s = cfg("ema200");
    overlay("EMA 200", ink(s.color), emaSeries(close, s.period ?? 200), s.width ?? 1.7);
  }
  if (indicators.has("sma20")) {
    const s = cfg("sma20");
    overlay("SMA 20", ink(s.color), smaSeries(close, s.period ?? 20), s.width);
  }
  if (indicators.has("sma50")) {
    const s = cfg("sma50");
    overlay("SMA 50", ink(s.color), smaSeries(close, s.period ?? 50), s.width);
  }
  if (indicators.has("sma200")) {
    const s = cfg("sma200");
    overlay("SMA 200", ink(s.color), smaSeries(close, s.period ?? 200), s.width ?? 1.55);
  }
  if (indicators.has("vwap")) {
    const s = cfg("vwap");
    overlay("VWAP", ink(s.color), vwapSeries(values, volumes), s.width ?? 1.45);
  }
  if (indicators.has("avwap")) {
    const s = cfg("avwap");
    overlay("Anchored VWAP", ink(s.color), anchoredVwap(values, volumes), s.width ?? 1.45);
  }
  if (indicators.has("bb")) {
    const s = cfg("bb");
    const bands = bollinger(close, s.period ?? 20, s.mult ?? 2);
    bandFill("bb", bands.lower, bands.upper, s.color2 ?? s.color);
    overlay("BB Mid", ink(s.color), bands.mid, s.width ?? 1);
    overlay("BB Upper", ink(s.color2 ?? s.color), bands.upper, s.width);
    overlay("BB Lower", ink(s.color2 ?? s.color), bands.lower, s.width);
  }
  if (indicators.has("keltner")) {
    const s = cfg("keltner");
    const bands = keltner(values, s.period ?? 20, s.mult ?? 1.5);
    bandFill("keltner", bands.lower, bands.upper, s.color2 ?? s.color);
    overlay("Keltner Mid", ink(s.color), bands.mid, s.width ?? 1);
    overlay("Keltner Up", ink(s.color2 ?? s.color), bands.upper, s.width);
    overlay("Keltner Lo", ink(s.color2 ?? s.color), bands.lower, s.width);
  }
  if (indicators.has("donchian")) {
    const s = cfg("donchian");
    const bands = donchian(values, s.period ?? 20);
    bandFill("donchian", bands.lower, bands.upper, s.color2 ?? s.color);
    overlay("Donchian Mid", ink(s.color), bands.mid, s.width ?? 1);
    overlay("Donchian Up", ink(s.color2 ?? s.color), bands.upper, s.width);
    overlay("Donchian Lo", ink(s.color2 ?? s.color), bands.lower, s.width);
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
        itemStyle: { color: st.trend[i] === -1 ? (s.color2 ?? "#EF5350") : s.color },
      })),
      showSymbol: false,
      animation: false,
      lineStyle: { width: s.width ?? 1.55, color: s.color, cap: "round" },
      z: 5,
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
      symbolSize: 5,
      itemStyle: { color: s.color, borderColor: fillTint("#0A0A0F", 0.6), borderWidth: 0.6 },
      animation: false,
      z: 6,
    });
  }

  panes.forEach((id, index) => {
    const x = index + 1;
    const y = index + 2;
    const zone = (from: number, to: number, color: string) => ({
      silent: true,
      itemStyle: { color },
      data: [[{ yAxis: from }, { yAxis: to }]],
    });
    const dashed = (levels: number[]) => ({
      silent: true,
      symbol: "none" as const,
      lineStyle: { color: "rgba(148,163,184,0.35)", type: "dashed" as const, width: 1 },
      data: levels.map((yAxis) => ({ yAxis })),
    });
    const paneLine = (name: string, color: string, data: (number | null)[], width = 1.2) => {
      series.push({
        name,
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data,
        showSymbol: false,
        connectNulls: true,
        smooth: 0.1,
        animation: false,
        lineStyle: { width, color, cap: "round", join: "round" },
        z: 3,
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
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.4, color: s.color, cap: "round" },
        markArea: {
          silent: true,
          data: [
            ...zone(70, 100, "rgba(239,83,80,0.10)").data,
            ...zone(0, 30, "rgba(38,166,154,0.10)").data,
          ],
        },
        markLine: dashed([70, 50, 30]),
        z: 3,
      });
    }
    if (id === "macd") {
      const s = cfg("macd");
      const macd = macdSeries(close, s.period ?? 12, s.period2 ?? 26, s.period3 ?? 9);
      const histUp = s.color3 ?? "#26A69A";
      const histDn = "#EF5350";
      series.push({
        name: "Hist MACD",
        type: "bar",
        xAxisIndex: x,
        yAxisIndex: y,
        data: macd.hist.map((value, index) => {
          if (value == null) {
            return null;
          }
          const prev = index > 0 ? macd.hist[index - 1] : value;
          const up = value >= 0;
          const rising = value >= (prev ?? value);
          const color = up
            ? rising
              ? histUp
              : fillTint(histUp, 0.38)
            : rising
              ? fillTint(histDn, 0.38)
              : histDn;
          return { value, itemStyle: { color } };
        }),
        barWidth: "42%",
        barMaxWidth: 7,
        barGap: "20%",
        animation: false,
        silent: true,
        z: 2,
        markLine: {
          silent: true,
          symbol: "none",
          animation: false,
          lineStyle: { color: "rgba(148,163,184,0.45)", type: "solid", width: 1 },
          label: { show: false },
          data: [{ yAxis: 0 }],
        },
      });
      series.push({
        name: "MACD",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: macd.macd,
        showSymbol: false,
        connectNulls: false,
        smooth: false,
        animation: false,
        lineStyle: { width: s.width ?? 1.35, color: s.color, cap: "round", join: "round" },
        z: 5,
      });
      series.push({
        name: "Señal",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: macd.signal,
        showSymbol: false,
        connectNulls: false,
        smooth: false,
        animation: false,
        lineStyle: { width: Math.max(1, (s.width ?? 1.35) - 0.15), color: s.color2 ?? "#FF6D00", cap: "round" },
        z: 5,
      });
    }
    if (id === "stoch") {
      const s = cfg("stoch");
      const stoch = stochastic(values, s.period ?? 14, s.period2 ?? 3);
      series.push({
        name: "%K",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: stoch.k,
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.25, color: s.color, cap: "round" },
        markArea: {
          silent: true,
          data: [
            ...zone(80, 100, "rgba(239,83,80,0.10)").data,
            ...zone(0, 20, "rgba(38,166,154,0.10)").data,
          ],
        },
        markLine: dashed([80, 20]),
        z: 3,
      });
      paneLine("%D", s.color2 ?? s.color, stoch.d, s.width);
    }
    if (id === "cci") {
      const s = cfg("cci");
      series.push({
        name: "CCI",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: cciSeries(values, s.period ?? 20),
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.25, color: s.color, cap: "round" },
        markLine: dashed([100, 0, -100]),
        z: 3,
      });
    }
    if (id === "roc") {
      const s = cfg("roc");
      paneLine("ROC", s.color, rocSeries(close, s.period ?? 12), s.width);
    }
    if (id === "willr") {
      const s = cfg("willr");
      series.push({
        name: "Williams %R",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: williamsR(values, s.period ?? 14),
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.25, color: s.color, cap: "round" },
        markLine: dashed([-20, -80]),
        z: 3,
      });
    }
    if (id === "adx") {
      const s = cfg("adx");
      const adx = adxSeries(values, s.period ?? 14);
      paneLine("ADX", s.color, adx.adx, s.width);
      paneLine("+DI", s.color2 ?? "#26A69A", adx.plus, (s.width ?? 1.35) * 0.9);
      paneLine("−DI", s.color3 ?? "#EF5350", adx.minus, (s.width ?? 1.35) * 0.9);
    }
    if (id === "stoch_rsi") {
      const s = cfg("stoch_rsi");
      series.push({
        name: "Stoch RSI",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: stochRsiSeries(close, s.period ?? 14, s.period2 ?? 14),
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.3, color: s.color, cap: "round" },
        markArea: {
          silent: true,
          data: [
            ...zone(80, 100, "rgba(239,83,80,0.10)").data,
            ...zone(0, 20, "rgba(38,166,154,0.10)").data,
          ],
        },
        markLine: dashed([80, 20]),
        z: 3,
      });
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
      series.push({
        name: "MFI",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: mfiSeries(values, volumes, s.period ?? 14),
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.3, color: s.color, cap: "round" },
        markArea: {
          silent: true,
          data: [
            ...zone(80, 100, "rgba(239,83,80,0.10)").data,
            ...zone(0, 20, "rgba(38,166,154,0.10)").data,
          ],
        },
        markLine: dashed([80, 20]),
        z: 3,
      });
    }
    if (id === "cmf") {
      const s = cfg("cmf");
      series.push({
        name: "CMF",
        type: "line",
        xAxisIndex: x,
        yAxisIndex: y,
        data: cmfSeries(values, volumes, s.period ?? 20),
        showSymbol: false,
        smooth: 0.1,
        animation: false,
        lineStyle: { width: s.width ?? 1.3, color: s.color, cap: "round" },
        areaStyle: { color: fillTint(s.color, 0.12) },
        markLine: dashed([0]),
        z: 3,
      });
    }
    if (id === "ad_line") {
      const s = cfg("ad_line");
      paneLine("A/D", s.color, adLineSeries(values, volumes), s.width);
    }
    if (id === "vol_pressure") {
      const s = cfg("vol_pressure");
      paneLine("Volume Pressure", s.color, volumePressure(values, volumes, s.period ?? 14), s.width);
    }
  });

  builtOn.forEach((item) => {
    const points = computeBuiltSeries(item, values, volumes);
    const paneKey = item.group || item.id;
    const paneIndex = panes.length + builtPaneKeys.indexOf(paneKey);
    const axes =
      item.pane === "pane" && paneIndex >= panes.length
        ? { xAxisIndex: paneIndex + 1, yAxisIndex: paneIndex + 2 }
        : { xAxisIndex: 0, yAxisIndex: 0 };
    if (item.method === "signal_buy" || item.method === "signal_sell") {
      series.push({
        id: `builder-${item.id}`,
        name: item.name,
        type: "scatter",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: points,
        symbol: "triangle",
        symbolRotate: item.method === "signal_sell" ? 180 : 0,
        symbolOffset: item.method === "signal_sell" ? [0, -9] : [0, 9],
        symbolSize: 11,
        itemStyle: { color: item.color, borderColor: item.color, borderWidth: 0 },
        animation: false,
        silent: true,
        large: true,
        label: { show: false },
        z: 12,
        clip: false,
      });
      return;
    }
    const asHist = item.style === "hist" || item.method === "macd_hist";
    const asBar = item.style === "bar";
    if (asHist || asBar) {
      series.push({
        id: `builder-${item.id}`,
        name: item.name,
        type: "bar",
        ...axes,
        data: points.map((value, index) => {
          const up = asHist ? (value ?? 0) >= 0 : (values[index]?.[1] ?? 0) >= (values[index]?.[0] ?? 0);
          return {
            value,
            itemStyle: { color: up ? item.color : (item.color2 ?? "#EF5350") },
          };
        }),
        barWidth: asHist ? "55%" : "62%",
        animation: false,
        silent: true,
        z: 2,
      });
      return;
    }
    series.push({
      id: `builder-${item.id}`,
      name: item.name,
      type: "line",
      ...axes,
      data: points,
      showSymbol: false,
      connectNulls: true,
      smooth: 0.12,
      animation: false,
      silent: true,
      emphasis: { disabled: true },
      lineStyle: { width: item.width, color: item.color, cap: "round", join: "round" },
      areaStyle: item.fill ? { color: item.fill, opacity: 1 } : undefined,
      z: item.pane === "overlay" ? 4 : 3,
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
  if (tradeGuide) {
    const long = tradeGuide.side === "buy";
    markLineData.push({
      yAxis: tradeGuide.entry,
      name: long ? "Entrada BUY" : "Entrada SELL",
      lineStyle: { color: long ? "#26A69A" : "#EF5350", width: 1.4 },
      label: {
        formatter: long ? "BUY" : "SELL",
        position: "insideEndTop",
        color: long ? "#26A69A" : "#EF5350",
        fontSize: 10,
        fontFamily: "ui-monospace, monospace",
      },
    });
    if (tradeGuide.sl != null && Number.isFinite(tradeGuide.sl)) {
      markLineData.push({
        yAxis: tradeGuide.sl,
        name: "Stop Loss",
        lineStyle: { color: "#EF5350", type: "dashed", width: 1.2 },
        label: {
          formatter: "SL",
          position: "insideEndTop",
          color: "#EF5350",
          fontSize: 10,
          fontFamily: "ui-monospace, monospace",
        },
      });
    }
    if (tradeGuide.tp != null && Number.isFinite(tradeGuide.tp)) {
      markLineData.push({
        yAxis: tradeGuide.tp,
        name: "Take Profit",
        lineStyle: { color: "#26A69A", type: "dashed", width: 1.2 },
        label: {
          formatter: "TP",
          position: "insideEndTop",
          color: "#26A69A",
          fontSize: 10,
          fontFamily: "ui-monospace, monospace",
        },
      });
    }
  }
  const priceSeries = series.find((item) => {
    const name = (item as { name?: string }).name;
    return name === "OHLC" || name === "Precio";
  }) as
    | {
        markLine?: { data?: unknown[]; silent?: boolean; symbol?: string };
        markArea?: { silent?: boolean; data?: unknown[] };
        markPoint?: unknown;
      }
    | undefined;

  if (markLineData.length > 0 && priceSeries?.markLine) {
    priceSeries.markLine.data = [...(priceSeries.markLine.data ?? []), ...markLineData];
  }

  const patternLayer = buildPatternEchartsLayer(autoPatterns, values.length);
  const patternMarks = patternLayer.markPointData;
  const patternAreas = patternLayer.markAreaData;
  const builderLines = (builderVisuals?.markLines ?? []).filter(
    (item) => item && typeof item === "object" && "yAxis" in (item as object),
  );
  const overlayLines = builderLines.filter((item) => (item as { pane?: string }).pane !== "pane");
  const paneLines = builderLines.filter((item) => (item as { pane?: string }).pane === "pane");
  const builderAreas = builderVisuals?.markAreas ?? [];
  const overlayAreas = builderAreas.filter((item) => {
    const head = Array.isArray(item) ? item[0] : item;
    return !head || typeof head !== "object" || (head as { pane?: string }).pane !== "pane";
  });
  const paneAreas = builderAreas.filter((item) => {
    const head = Array.isArray(item) ? item[0] : item;
    return Boolean(head && typeof head === "object" && (head as { pane?: string }).pane === "pane");
  });
  if (overlayLines.length > 0 && priceSeries?.markLine) {
    priceSeries.markLine.data = [...(priceSeries.markLine.data ?? []), ...overlayLines];
  }
  const paneSeries = series.find((item) => String((item as { id?: string }).id ?? "").startsWith("builder-") && (item as { yAxisIndex?: number }).yAxisIndex !== 0) as
    | { markLine?: { data?: unknown[]; silent?: boolean; symbol?: string; animation?: boolean }; markArea?: { silent?: boolean; animation?: boolean; data?: unknown[] } }
    | undefined;
  if (paneSeries && (paneLines.length > 0 || paneAreas.length > 0)) {
    if (paneLines.length > 0) {
      paneSeries.markLine = {
        silent: true,
        symbol: "none",
        animation: false,
        data: paneLines,
      };
    }
    if (paneAreas.length > 0) {
      paneSeries.markArea = {
        silent: true,
        animation: false,
        data: paneAreas,
      };
    }
  }
  const tradeMarks = tradeMarkers
    .filter((mark) => mark.date && Number.isFinite(mark.price))
    .map((mark) => {
      const win = mark.win === true;
      const entryBuy = mark.kind === "entry" && mark.side === "buy";
      const color =
        mark.kind === "entry" ? (mark.side === "buy" ? "#26A69A" : "#EF5350") : win ? "#22c55e" : "#EF5350";
      const rotate = entryBuy || (mark.kind === "exit" && !win && mark.side === "sell") ? 0 : 180;
      const below = entryBuy || (mark.kind === "exit" && mark.side === "sell");
      return {
        name: mark.label,
        coord: [mark.date, mark.price] as [string, number],
        symbol: "arrow",
        symbolSize: [18, 24],
        symbolRotate: rotate,
        symbolOffset: below ? [0, 22] : [0, -22],
        itemStyle: { color },
        label: {
          show: true,
          formatter: mark.label,
          position: below ? "bottom" : "top",
          color,
          fontSize: 10,
          fontWeight: 600,
          fontFamily: "ui-monospace, monospace",
        },
      };
    });

  if ((tradeMarks.length > 0 || overlayAreas.length > 0) && priceSeries) {
    if (tradeMarks.length > 0) {
      priceSeries.markPoint = {
        silent: true,
        animation: false,
        data: tradeMarks,
      };
    }
    const areaData = [
      ...((priceSeries.markArea?.data as unknown[] | undefined) ?? []),
      ...overlayAreas,
    ];
    if (areaData.length > 0) {
      priceSeries.markArea = {
        silent: true,
        animation: false,
        data: areaData,
      };
    }
  }

  const patternAnchor = dates.map(() => null as number | null);
  const engineLines = enginePatterns?.markLines ?? [];
  const engineAreas = enginePatterns?.markAreas ?? [];
  if (
    patternMarks.length > 0 ||
    patternAreas.length > 0 ||
    patternLayer.markLineData.length > 0 ||
    engineLines.length > 0 ||
    engineAreas.length > 0
  ) {
    series.push({
      id: "auto-patterns-layer",
      name: "Patrones Auto",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: patternAnchor,
      showSymbol: false,
      silent: true,
      animation: false,
      z: 8,
      lineStyle: { width: 0, opacity: 0 },
      markPoint: {
        silent: true,
        animation: false,
        data: patternMarks,
      },
      markLine: {
        silent: true,
        animation: false,
        symbol: "none",
        data: [...patternLayer.markLineData, ...engineLines],
      },
      markArea: {
        silent: true,
        animation: false,
        data: [...patternAreas, ...engineAreas],
      },
    });
  }

  for (const line of patternLayer.lines) {
    const padded =
      dates.length > line.data.length ? [...line.data, ...Array.from({ length: dates.length - line.data.length }, () => null)] : line.data;
    series.push({
      id: `auto-pattern-${line.id}`,
      name: line.id,
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: padded,
      showSymbol: false,
      connectNulls: false,
      silent: true,
      animation: false,
      z: 7,
      lineStyle: {
        width: line.dashed ? 1.3 : 1.7,
        color: line.color,
        type: line.dashed ? "dashed" : "solid",
      },
      itemStyle: { color: line.color },
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
  const visible =
    barCount <= 90 ? barCount : Math.min(barCount, barCount > 800 ? 180 : 120);
  const zoomStart = barCount > 0 ? Math.max(0, ((barCount - visible) / barCount) * 100) : 0;

  return {
    backgroundColor: theme.backgroundMode === "solid" ? theme.background : "transparent",
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
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
        moveOnMouseWheel: false,
        minValueSpan: 12,
        throttle: 16,
        realtime: true,
        preventDefaultMouseMove: false,
      },
      {
        type: "slider",
        xAxisIndex: Array.from({ length: xAxisCount }, (_, i) => i),
        start: zoomStart,
        end: 100,
        height: sliderHeight,
        bottom: sliderBottom,
        filterMode: "none",
        realtime: true,
        showDetail: false,
        brushSelect: false,
        fillerColor: theme.scheme === "light" ? "rgba(24,24,27,0.10)" : "rgba(161,161,170,0.16)",
        borderColor: theme.scheme === "light" ? "#d4d4d8" : "#27272a",
        backgroundColor: theme.scheme === "light" ? "#f4f4f5" : "#09090b",
        handleStyle:
          theme.scheme === "light"
            ? { color: "#52525b", borderColor: "#3f3f46" }
            : { color: "#71717a", borderColor: "#a1a1aa" },
        moveHandleStyle: { color: theme.scheme === "light" ? "#3f3f46" : "#52525b" },
        emphasis: {
          handleStyle:
            theme.scheme === "light"
              ? { color: "#18181b", borderColor: "#09090b" }
              : { color: "#a1a1aa", borderColor: "#d4d4d8" },
          moveHandleStyle: { color: theme.scheme === "light" ? "#18181b" : "#a1a1aa" },
        },
        dataBackground: {
          lineStyle: { color: theme.scheme === "light" ? "#a1a1aa" : "#3f3f46", width: 1 },
          areaStyle: {
            color: theme.scheme === "light" ? "rgba(24,24,27,0.10)" : "rgba(113,113,122,0.22)",
          },
        },
        selectedDataBackground: {
          lineStyle: { color: theme.scheme === "light" ? "#3f3f46" : "#a1a1aa", width: 1 },
          areaStyle: {
            color: theme.scheme === "light" ? "rgba(24,24,27,0.16)" : "rgba(161,161,170,0.28)",
          },
        },
        textStyle: { color: theme.axis, fontSize: 9 },
        minValueSpan: 12,
      },
    ],
    series,
    graphic: builderVisuals?.graphic ?? [],
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
