"use client";

import { init, dispose } from "klinecharts";
import { memo, useEffect, useRef, useState } from "react";
import { wrapKlineChart, type ChartEngine } from "@/components/chart/kline/engine";
import {
  centerChartView,
  CHART_CENTER_EVENT,
  CHART_RIGHT_PAD_EVENT,
  padChartRightView,
} from "@/components/chart/kline/scale";
import type { TradeChartMarker, TradeGuideLevels } from "@/components/chart/kline/trade";
import type { PatternOverlay } from "@/components/chart/chartAutoPatterns";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";
import { toKLineData } from "@/components/chart/kline/data";
import { syncKlineIndicators } from "@/components/chart/kline/indicators";
import { logKline } from "@/components/chart/kline/safeCalc";
import { syncKlineOverlays } from "@/components/chart/kline/overlays";
import { klineStyles } from "@/components/chart/kline/styles";
import {
  applyVisualTheme,
  chartSurfaceStyle,
  DEFAULT_CHART_THEME,
  neonAmount,
  neonGlowPx,
  type ChartVisualTheme,
} from "@/components/chart/chartVisualTheme";
import type { BuilderEChartsPayload } from "@/lib/builderApi";
import type { AutoSRDiagonal, AutoSRLevel } from "@/lib/chartMath";
import type { CandlePayload } from "@/lib/marketApi";

export type { TradeChartMarker, TradeGuideLevels };

interface ChartCanvasProps {
  data: CandlePayload;
  indicators: Set<IndicatorId>;
  drawings: Set<DrawingId>;
  tradeGuide?: TradeGuideLevels | null;
  tradeMarkers?: TradeChartMarker[];
  autoSR?: AutoSRLevel[];
  autoDiagonals?: AutoSRDiagonal[];
  autoPatterns?: PatternOverlay[];
  theme?: ChartVisualTheme;
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  builderVisuals?: BuilderEChartsPayload;
  chartType?: ChartPriceType;
  onInstance?: (chart: ChartEngine | null) => void;
  onViewChange?: () => void;
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
  builderVisuals,
  chartType = "candles",
  tradeGuide = null,
  tradeMarkers = [],
  onInstance,
  onViewChange,
}: ChartCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ChartEngine | null>(null);
  const seedRef = useRef(true);
  const trackedRef = useRef<Array<{ paneId: string; name: string }>>([]);
  const [rightPad, setRightPad] = useState(false);
  const [ready, setReady] = useState(false);
  const onViewRef = useRef(onViewChange);
  const onInstanceRef = useRef(onInstance);
  onViewRef.current = onViewChange;
  onInstanceRef.current = onInstance;
  const visual = applyVisualTheme(theme);

  useEffect(() => {
    seedRef.current = true;
  }, [data.ticker, data.interval]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const instance = init(host, {
      locale: "en-US",
      styles: klineStyles(visual, chartType),
    });
    if (!instance) {
      return;
    }
    instance.setZoomEnabled(true);
    instance.setScrollEnabled(true);
    instance.setRightMinVisibleBarCount(4);
    instance.setOffsetRightDistance(12);
    const engine = wrapKlineChart(instance, host);
    engineRef.current = engine;
    onInstanceRef.current?.(engine);
    setReady(true);

    const bump = () => onViewRef.current?.();
    instance.subscribeAction("onVisibleRangeChange" as never, bump);
    instance.subscribeAction("onZoom" as never, bump);
    instance.subscribeAction("onScroll" as never, bump);

    const onCenter = () => {
      centerChartView(engine);
      bump();
    };
    const onPad = () => setRightPad((current) => !current);
    window.addEventListener(CHART_CENTER_EVENT, onCenter);
    window.addEventListener(CHART_RIGHT_PAD_EVENT, onPad);

    const observer = new ResizeObserver(() => {
      instance.resize();
      bump();
    });
    observer.observe(host);

    return () => {
      observer.disconnect();
      window.removeEventListener(CHART_CENTER_EVENT, onCenter);
      window.removeEventListener(CHART_RIGHT_PAD_EVENT, onPad);
      instance.unsubscribeAction("onVisibleRangeChange" as never, bump);
      instance.unsubscribeAction("onZoom" as never, bump);
      instance.unsubscribeAction("onScroll" as never, bump);
      engineRef.current = null;
      setReady(false);
      onInstanceRef.current?.(null);
      dispose(instance);
    };
    // Chart instance is bound to the host node for the pane lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) {
      return;
    }
    engine.raw.setStyles(klineStyles(visual, chartType));
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const glow = visual.performanceMode ? 0 : neonGlowPx(visual);
    const amount = neonAmount(visual);
    const canvases = host.querySelectorAll("canvas");
    canvases.forEach((node) => {
      if (!(node instanceof HTMLCanvasElement)) {
        return;
      }
      const ctx = node.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = visual.antialias;
        ctx.imageSmoothingQuality = visual.antialias ? "high" : "low";
      }
      node.style.imageRendering = visual.antialias ? "auto" : "pixelated";
      node.style.filter =
        glow > 0.4
          ? `drop-shadow(0 0 ${Math.round(glow * 0.45)}px ${visual.bull}) drop-shadow(0 0 ${Math.round(glow * 0.22)}px ${visual.bear}) saturate(${(1 + amount * 0.55).toFixed(2)})`
          : "none";
    });
    engine.raw.resize();
  }, [visual, chartType, ready]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) {
      return;
    }
    engine.raw.applyNewData(toKLineData(data, chartType), false);
    if (seedRef.current) {
      seedRef.current = false;
      centerChartView(engine);
    } else {
      engine.raw.scrollToRealTime(visual.performanceMode ? 0 : 180);
    }
    padChartRightView(engine, rightPad);
    onViewRef.current?.();
  }, [data, chartType, rightPad, ready]);

  const indicatorKey = Array.from(indicators).sort().join("|");
  const builtKey = builtIndicators
    .map((item) => `${item.id}:${item.method}:${item.period}:${item.pane}:${item.color}:${item.enabled ? 1 : 0}`)
    .join("|");
  const indicatorsRef = useRef(indicators);
  const builtRef = useRef(builtIndicators);
  const settingsRef = useRef(indicatorSettings);
  indicatorsRef.current = indicators;
  builtRef.current = builtIndicators;
  settingsRef.current = indicatorSettings;

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) {
      return;
    }
    try {
      trackedRef.current = syncKlineIndicators(
        engine.raw,
        indicatorsRef.current,
        settingsRef.current,
        builtRef.current,
        trackedRef.current,
      );
    } catch (err) {
      logKline("error", "syncKlineIndicators abortó; las velas se mantienen", err);
    }
    onViewRef.current?.();
  }, [indicatorKey, builtKey, ready, data.ticker, data.interval]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !ready) {
      return;
    }
    try {
      const list = engine.raw.getDataList();
      const extraSR: AutoSRLevel[] = [];
      if (drawings.has("sr") && list.length > 0) {
        extraSR.push(
          { price: Math.max(...list.map((item) => item.high)), kind: "resistance", label: "Resistencia" },
          { price: Math.min(...list.map((item) => item.low)), kind: "support", label: "Soporte" },
        );
      }
      syncKlineOverlays(
        engine.raw,
        [...autoSR, ...extraSR],
        autoDiagonals,
        autoPatterns,
        tradeGuide,
        tradeMarkers,
        builderVisuals,
        visual,
        data.dates,
      );
    } catch (err) {
      logKline("error", "syncKlineOverlays abortó; las velas se mantienen", err);
    }
    onViewRef.current?.();
  }, [
    autoSR,
    autoDiagonals,
    autoPatterns,
    tradeGuide,
    tradeMarkers,
    builderVisuals,
    drawings,
    visual,
    data.dates,
    ready,
  ]);

  const amount = neonAmount(visual);
  const glow = visual.performanceMode ? 0 : neonGlowPx(visual);
  const surface = chartSurfaceStyle(visual);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden select-none"
      data-fps={visual.fpsLimit || "vsync"}
      data-dpr={visual.pixelRatio}
      style={{
        ...surface,
        filter: `brightness(${visual.gamma.toFixed(3)}) contrast(${(0.92 + visual.gamma * 0.08).toFixed(3)})`,
        transform: visual.pixelRatio === 1 ? "translateZ(0)" : "translateZ(0) scale(1)",
        transformOrigin: "top left",
      }}
    >
      <div
        ref={hostRef}
        className="absolute inset-0"
        style={{ imageRendering: visual.antialias ? "auto" : "pixelated" }}
      />
      {glow > 0.5 ? (
        <div
          className="pointer-events-none absolute inset-0 z-[2] mix-blend-screen"
          style={{
            boxShadow: `inset 0 0 ${Math.round(18 + glow)}px ${Math.round(glow * 0.35)}px ${visual.bull}`,
            background: `radial-gradient(ellipse at 50% 0%, ${visual.bull} 0%, transparent 58%)`,
            opacity: Math.min(0.55, 0.12 + amount * 0.42),
          }}
        />
      ) : null}
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
                color: data.changePct >= 0 ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)",
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
