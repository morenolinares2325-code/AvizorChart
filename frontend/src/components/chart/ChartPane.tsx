"use client";

import type { ECharts } from "echarts";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { captureChartPane, CHART_CAPTURE_EVENT } from "@/components/chart/chartCapture";
import { ChartDrawOverlay } from "@/components/chart/ChartDrawOverlay";
import { detectAutoPatterns, type AutoPatternId } from "@/components/chart/chartAutoPatterns";
import type { DrawToolId, UserDrawing } from "@/components/chart/chartDrawTools";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { BuilderEChartsPayload } from "@/lib/builderApi";
import type { IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";
import type { AutoSROptions } from "@/components/chart/ChartAutoSRMenu";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { ChartVisualTheme } from "@/components/chart/chartVisualTheme";
import { detectAutoDiagonals, detectAutoSR } from "@/lib/chartMath";
import { fetchCandles, fetchChartPatterns, type CandlePayload, type ChartInterval } from "@/lib/marketApi";
import { buildChartPatternPrimitives, type ChartPatternPrimitives } from "@/lib/patternPrimitives";
import type { TradeChartMarker, TradeGuideLevels } from "@/components/chart/ChartCanvas";

const ChartCanvas = dynamic(
  () => import("@/components/chart/ChartCanvas").then((mod) => mod.ChartCanvas),
  { ssr: false },
);

interface ChartPaneProps {
  ticker: string;
  interval: ChartInterval;
  indicators: IndicatorId[];
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  builderVisuals?: BuilderEChartsPayload;
  drawings: Set<DrawingId>;
  autoSR: AutoSROptions;
  autoPatterns: Set<AutoPatternId>;
  theme: ChartVisualTheme;
  drawTool: DrawToolId;
  magnet: boolean;
  locked: boolean;
  userDrawings: UserDrawing[];
  onUserDrawings: (next: UserDrawing[]) => void;
  focused: boolean;
  onFocus: () => void;
  onQuote?: (payload: CandlePayload | null) => void;
  onEngineLabels?: (labels: string[]) => void;
  period?: string;
  chartType?: ChartPriceType;
  dataOverride?: CandlePayload | null;
  tradeGuide?: TradeGuideLevels | null;
  tradeMarkers?: TradeChartMarker[];
}

export function ChartPane({
  ticker,
  interval,
  indicators,
  indicatorSettings = {},
  builtIndicators = [],
  builderVisuals,
  drawings,
  autoSR,
  autoPatterns,
  theme,
  drawTool,
  magnet,
  locked,
  userDrawings,
  onUserDrawings,
  focused,
  onFocus,
  onQuote,
  onEngineLabels,
  period,
  chartType = "candles",
  dataOverride,
  tradeGuide = null,
  tradeMarkers = [],
}: ChartPaneProps) {
  const indicatorSet = useMemo(() => new Set(indicators), [indicators]);
  const [data, setData] = useState<CandlePayload | null>(null);
  const [enginePatterns, setEnginePatterns] = useState<ChartPatternPrimitives | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chart, setChart] = useState<ECharts | null>(null);
  const [viewTick, setViewTick] = useState(0);
  const [flash, setFlash] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);
  const viewGate = useRef(false);
  const onViewChange = useCallback(() => {
    if (viewGate.current) {
      return;
    }
    viewGate.current = true;
    window.requestAnimationFrame(() => {
      viewGate.current = false;
      setViewTick((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    if (dataOverride !== undefined) {
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void fetchCandles(ticker, interval, controller.signal, period)
      .then((payload) => {
        if (!controller.signal.aborted) {
          setData(payload);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        console.error("Fallo al conectar con el backend de FastAPI:", err);
        setData(null);
        setError(err instanceof Error ? err.message : "No se pudieron cargar las velas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [ticker, interval, period, dataOverride]);

  useEffect(() => {
    if (dataOverride !== undefined || autoPatterns.size === 0) {
      setEnginePatterns(null);
      return;
    }
    const controller = new AbortController();
    void fetchChartPatterns(ticker, interval, controller.signal, period)
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        const primitives = buildChartPatternPrimitives(payload);
        setEnginePatterns(primitives);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!controller.signal.aborted) {
          setEnginePatterns(null);
        }
      });
    return () => controller.abort();
  }, [autoPatterns.size, dataOverride, interval, period, ticker]);

  const chartData = dataOverride !== undefined ? dataOverride : data;

  useEffect(() => {
    if (focused) {
      onEngineLabels?.(enginePatterns?.labels ?? []);
    }
  }, [enginePatterns, focused, onEngineLabels]);

  useEffect(() => {
    if (focused) {
      onQuote?.(chartData);
    }
  }, [chartData, focused, onQuote]);

  const srLevels = useMemo(
    () => (autoSR.horizontal && chartData ? detectAutoSR(chartData.values, chartData.volumes) : []),
    [autoSR.horizontal, chartData],
  );
  const srDiagonals = useMemo(
    () => (autoSR.diagonal && chartData ? detectAutoDiagonals(chartData.values) : []),
    [autoSR.diagonal, chartData],
  );
  const patternHits = useMemo(
    () => (chartData && autoPatterns.size > 0 ? detectAutoPatterns(chartData.values, autoPatterns) : []),
    [autoPatterns, chartData],
  );

  useEffect(() => {
    function onCapture() {
      if (!focused || !paneRef.current) {
        return;
      }
      setFlash(true);
      window.setTimeout(() => setFlash(false), 180);
      void captureChartPane(paneRef.current, ticker, interval).catch((err: unknown) => {
        console.error("Fallo al capturar el gráfico:", err);
      });
    }
    window.addEventListener(CHART_CAPTURE_EVENT, onCapture);
    return () => window.removeEventListener(CHART_CAPTURE_EVENT, onCapture);
  }, [focused, ticker, interval]);

  return (
    <div
      ref={paneRef}
      className={`relative h-full min-h-0 min-w-0 flex-1 overflow-hidden ${
        focused ? "ring-1 ring-inset ring-[#00FF66]/35" : "ring-1 ring-inset ring-[#1F1F2E]"
      }`}
      onMouseDown={onFocus}
    >
      {chartData ? (
        <ChartCanvas
          data={chartData}
          indicators={indicatorSet}
          drawings={drawings}
          tradeGuide={tradeGuide}
          tradeMarkers={tradeMarkers}
          autoSR={srLevels}
          autoDiagonals={srDiagonals}
          autoPatterns={patternHits}
          enginePatterns={enginePatterns ?? undefined}
          theme={theme}
          indicatorSettings={indicatorSettings}
          builtIndicators={builtIndicators}
          builderVisuals={builderVisuals}
          chartType={chartType}
          onInstance={setChart}
          onViewChange={onViewChange}
        />
      ) : null}
      <ChartDrawOverlay
        tool={focused ? drawTool : "cursor"}
        magnet={magnet}
        locked={locked}
        drawings={userDrawings}
        onDrawings={onUserDrawings}
        chart={chart}
        viewTick={viewTick}
        values={chartData?.values}
        dates={chartData?.dates}
        scheme={theme.scheme}
      />
      {loading && !chartData ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#050508]/70">
          <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-[#00FF66]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </p>
        </div>
      ) : null}
      {error && !loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <p className="max-w-sm text-center text-xs text-red-200">{error}</p>
        </div>
      ) : null}
      <div className="pointer-events-none absolute left-2 top-2 z-10 rounded-md border border-white/[0.06] bg-[#0A0A0F]/82 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.12em] text-zinc-200">
        {ticker} · {interval}
      </div>
      {flash ? <div className="pointer-events-none absolute inset-0 z-20 bg-white/70" /> : null}
    </div>
  );
}
