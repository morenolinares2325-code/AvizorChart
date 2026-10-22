"use client";

import type { ECharts } from "echarts";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartDrawOverlay } from "@/components/chart/ChartDrawOverlay";
import { detectAutoPatterns, type AutoPatternId } from "@/components/chart/chartAutoPatterns";
import type { DrawToolId, UserDrawing } from "@/components/chart/chartDrawTools";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";
import type { AutoSROptions } from "@/components/chart/ChartAutoSRMenu";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { ChartVisualTheme } from "@/components/chart/chartVisualTheme";
import { detectAutoDiagonals, detectAutoSR } from "@/lib/chartMath";
import { fetchCandles, type CandlePayload, type ChartInterval } from "@/lib/marketApi";

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
  period?: string;
  chartType?: ChartPriceType;
}

export function ChartPane({
  ticker,
  interval,
  indicators,
  indicatorSettings = {},
  builtIndicators = [],
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
  period,
  chartType = "candles",
}: ChartPaneProps) {
  const indicatorSet = useMemo(() => new Set(indicators), [indicators]);
  const [data, setData] = useState<CandlePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chart, setChart] = useState<ECharts | null>(null);
  const [viewTick, setViewTick] = useState(0);
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
  }, [ticker, interval, period]);

  useEffect(() => {
    if (focused) {
      onQuote?.(data);
    }
  }, [data, focused, onQuote]);

  const srLevels = useMemo(
    () => (autoSR.horizontal && data ? detectAutoSR(data.values, data.volumes) : []),
    [autoSR.horizontal, data],
  );
  const srDiagonals = useMemo(
    () => (autoSR.diagonal && data ? detectAutoDiagonals(data.values) : []),
    [autoSR.diagonal, data],
  );
  const patternHits = useMemo(
    () => (data && autoPatterns.size > 0 ? detectAutoPatterns(data.values, autoPatterns) : []),
    [autoPatterns, data],
  );

  return (
    <div
      className={`relative min-h-0 min-w-0 flex-1 overflow-hidden ${
        focused ? "ring-1 ring-inset ring-[#00FF66]/35" : "ring-1 ring-inset ring-[#1F1F2E]"
      }`}
      onMouseDown={onFocus}
    >
      {data ? (
        <ChartCanvas
          data={data}
          indicators={indicatorSet}
          drawings={drawings}
          autoSR={srLevels}
          autoDiagonals={srDiagonals}
          autoPatterns={patternHits}
          theme={theme}
          indicatorSettings={indicatorSettings}
          builtIndicators={builtIndicators}
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
        values={data?.values}
        dates={data?.dates}
      />
      {loading && !data ? (
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
    </div>
  );
}
