import { atrSeries, emaSeries, rocSeries, rsiSeries, smaSeries, stdDevSeries, type OhlcBar } from "@/lib/chartMath";

export type BuilderSource = "close" | "open" | "high" | "low" | "hl2" | "hlc3" | "volume";
export type BuilderMethod = "sma" | "ema" | "rsi" | "roc" | "stddev" | "atr" | "raw";
export type BuilderPane = "overlay" | "pane";

export interface BuiltIndicator {
  id: string;
  name: string;
  enabled: boolean;
  source: BuilderSource;
  method: BuilderMethod;
  period: number;
  color: string;
  width: number;
  pane: BuilderPane;
}

export const BUILDER_SOURCES: { id: BuilderSource; label: string }[] = [
  { id: "close", label: "Close" },
  { id: "open", label: "Open" },
  { id: "high", label: "High" },
  { id: "low", label: "Low" },
  { id: "hl2", label: "HL2" },
  { id: "hlc3", label: "HLC3" },
  { id: "volume", label: "Volumen" },
];

export const BUILDER_METHODS: { id: BuilderMethod; label: string }[] = [
  { id: "sma", label: "SMA" },
  { id: "ema", label: "EMA" },
  { id: "rsi", label: "RSI" },
  { id: "roc", label: "ROC" },
  { id: "stddev", label: "StdDev" },
  { id: "atr", label: "ATR" },
  { id: "raw", label: "Fuente" },
];

export function newBuiltId(): string {
  return `bi-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function defaultBuiltName(method: BuilderMethod, period: number, source: BuilderSource): string {
  if (method === "raw") {
    return source.toUpperCase();
  }
  if (method === "atr") {
    return `ATR ${period}`;
  }
  return `${method.toUpperCase()} ${period} ${source}`;
}

export function emptyBuiltIndicator(): BuiltIndicator {
  return {
    id: newBuiltId(),
    name: "EMA 21 close",
    enabled: true,
    source: "close",
    method: "ema",
    period: 21,
    color: "#00FF66",
    width: 1.4,
    pane: "overlay",
  };
}

export function normalizeBuiltIndicators(raw: unknown): BuiltIndicator[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => {
      const method = asMethod(item.method);
      const source = asSource(item.source);
      const period = clampPeriod(Number(item.period));
      return {
        id: String(item.id ?? newBuiltId()),
        name: String(item.name ?? defaultBuiltName(method, period, source)),
        enabled: item.enabled !== false,
        source,
        method,
        period,
        color: typeof item.color === "string" && item.color.startsWith("#") ? item.color : "#00FF66",
        width: Number.isFinite(Number(item.width)) ? Math.min(4, Math.max(0.4, Number(item.width))) : 1.4,
        pane: item.pane === "pane" ? "pane" : "overlay",
      };
    });
}

export function builderSourceSeries(values: OhlcBar[], volumes: number[], source: BuilderSource): number[] {
  return values.map((bar, index) => {
    const open = bar[0];
    const close = bar[1];
    const low = bar[2];
    const high = bar[3];
    if (source === "open") return open;
    if (source === "high") return high;
    if (source === "low") return low;
    if (source === "hl2") return (high + low) / 2;
    if (source === "hlc3") return (high + low + close) / 3;
    if (source === "volume") return volumes[index] ?? 0;
    return close;
  });
}

export function computeBuiltSeries(
  item: BuiltIndicator,
  values: OhlcBar[],
  volumes: number[],
): (number | null)[] {
  const period = clampPeriod(item.period);
  if (item.method === "atr") {
    return atrSeries(values, period);
  }
  const source = builderSourceSeries(values, volumes, item.source);
  if (item.method === "ema") return emaSeries(source, period);
  if (item.method === "rsi") return rsiSeries(source, period);
  if (item.method === "roc") return rocSeries(source, period);
  if (item.method === "stddev") return stdDevSeries(source, period);
  if (item.method === "raw") return source;
  return smaSeries(source, period);
}

function asSource(value: unknown): BuilderSource {
  return BUILDER_SOURCES.some((item) => item.id === value) ? (value as BuilderSource) : "close";
}

function asMethod(value: unknown): BuilderMethod {
  return BUILDER_METHODS.some((item) => item.id === value) ? (value as BuilderMethod) : "ema";
}

function clampPeriod(value: number): number {
  if (!Number.isFinite(value)) {
    return 14;
  }
  return Math.min(400, Math.max(1, Math.round(value)));
}
