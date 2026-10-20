"use client";

import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const ChartCanvas = dynamic(
  () => import("@/components/chart/ChartCanvas").then((mod) => mod.ChartCanvas),
  { ssr: false },
);
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import type { DrawingId, IndicatorId } from "@/components/chart/chartTypes";
import { fetchCandles, type CandlePayload, type ChartInterval } from "@/lib/marketApi";

const EMPTY_DRAWINGS = new Set<DrawingId>();

function toggleSet<T>(current: Set<T>, id: T): Set<T> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function MegaChartWorkspace() {
  const params = useSearchParams();
  const initial = (params.get("symbol") ?? params.get("ticker") ?? "NVDA").toUpperCase();

  const [ticker, setTicker] = useState(initial);
  const [interval, setInterval] = useState<ChartInterval>("1d");
  const [data, setData] = useState<CandlePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [indicators, setIndicators] = useState<Set<IndicatorId>>(
    () => new Set<IndicatorId>(["ema20", "ema50"]),
  );

  const load = useCallback(async (symbol: string, tf: ChartInterval, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchCandles(symbol, tf, signal);
      if (signal?.aborted) {
        return;
      }
      setData(payload);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      console.error("Fallo al conectar con el backend de FastAPI:", err);
      setData(null);
      setError(err instanceof Error ? err.message : "No se pudieron cargar las velas.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(ticker, interval, controller.signal);
    return () => controller.abort();
  }, [ticker, interval, load]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08090d]">
      <ChartToolbar
        ticker={ticker}
        onTicker={setTicker}
        interval={interval}
        onInterval={setInterval}
        indicators={indicators}
        onToggleIndicator={(id) => setIndicators((current) => toggleSet(current, id))}
      />

      <div className="relative min-h-0 flex-1">
        {data ? <ChartCanvas data={data} indicators={indicators} drawings={EMPTY_DRAWINGS} /> : null}

        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#08090d]/70 backdrop-blur-[2px]">
            <p className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.16em] text-emerald-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando datos de mercado…
            </p>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
            <p className="max-w-lg rounded-md border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          </div>
        ) : null}

      </div>
    </div>
  );
}
