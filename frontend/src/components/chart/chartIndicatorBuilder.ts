import {
  atrSeries,
  bollinger,
  emaSeries,
  macdSeries,
  rocSeries,
  rsiSeries,
  smaSeries,
  stdDevSeries,
  stochastic,
  type OhlcBar,
} from "@/lib/chartMath";

export type BuilderSource = "close" | "open" | "high" | "low" | "hl2" | "hlc3" | "volume";
export type BuilderMethod =
  | "sma"
  | "ema"
  | "rsi"
  | "roc"
  | "stddev"
  | "atr"
  | "raw"
  | "bb_upper"
  | "bb_lower"
  | "macd"
  | "macd_signal"
  | "macd_hist"
  | "signal_buy"
  | "signal_sell";
export type BuilderPane = "overlay" | "pane";
export type BuilderDrawStyle = "line" | "bar" | "hist";

export interface BuilderSignalSpec {
  side?: "buy" | "sell";
  bb?: "lower" | "upper";
  bbPeriod?: number;
  bbMult?: number;
  rsiPeriod?: number;
  rsiOp?: "<" | ">";
  rsiValue?: number;
  stochPeriod?: number;
  stochOp?: "<" | ">";
  stochValue?: number;
  crossFast?: number;
  crossSlow?: number;
  crossMethod?: "ema" | "sma";
}

export interface BuiltIndicator {
  id: string;
  name: string;
  enabled: boolean;
  source: BuilderSource;
  method: BuilderMethod;
  period: number;
  color: string;
  color2?: string;
  width: number;
  pane: BuilderPane;
  style?: BuilderDrawStyle;
  fill?: string;
  group?: string;
  signal?: BuilderSignalSpec;
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
        color: typeof item.color === "string" && item.color.startsWith("#") ? item.color : "#26A69A",
        color2: typeof item.color2 === "string" ? item.color2 : undefined,
        width: Number.isFinite(Number(item.width)) ? Math.min(4, Math.max(0.4, Number(item.width))) : 1.4,
        pane: item.pane === "pane" ? "pane" : "overlay",
        style: item.style === "bar" || item.style === "hist" ? item.style : "line",
        fill: typeof item.fill === "string" ? item.fill : undefined,
        group: typeof item.group === "string" ? item.group : undefined,
        signal: asSignal(item.signal),
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
  if (item.method === "signal_buy" || item.method === "signal_sell") {
    return computeSignalMarkers(item, values);
  }
  if (item.method === "atr") {
    return atrSeries(values, period);
  }
  const source = builderSourceSeries(values, volumes, item.source);
  if (item.method === "bb_upper") return bollinger(source, period, 2).upper;
  if (item.method === "bb_lower") return bollinger(source, period, 2).lower;
  if (item.method === "macd" || item.method === "macd_signal" || item.method === "macd_hist") {
    const macd = macdSeries(source, period, Math.max(period + 14, 26), 9);
    if (item.method === "macd_signal") return macd.signal;
    if (item.method === "macd_hist") return macd.hist;
    return macd.macd;
  }
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
  if (
    value === "signal_buy" ||
    value === "signal_sell" ||
    value === "bb_upper" ||
    value === "bb_lower" ||
    value === "macd" ||
    value === "macd_signal" ||
    value === "macd_hist"
  ) {
    return value;
  }
  return BUILDER_METHODS.some((item) => item.id === value) ? (value as BuilderMethod) : "ema";
}

function asSignal(raw: unknown): BuilderSignalSpec | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }
  const item = raw as Record<string, unknown>;
  return {
    side: item.side === "sell" ? "sell" : item.side === "buy" ? "buy" : undefined,
    bb: item.bb === "upper" || item.bb === "lower" ? item.bb : undefined,
    bbPeriod: asPeriod(item.bbPeriod),
    bbMult: Number.isFinite(Number(item.bbMult)) ? Number(item.bbMult) : undefined,
    rsiPeriod: asPeriod(item.rsiPeriod),
    rsiOp: item.rsiOp === ">" || item.rsiOp === "<" ? item.rsiOp : undefined,
    rsiValue: Number.isFinite(Number(item.rsiValue)) ? Number(item.rsiValue) : undefined,
    stochPeriod: asPeriod(item.stochPeriod),
    crossFast: asPeriod(item.crossFast),
    crossSlow: asPeriod(item.crossSlow),
    crossMethod: item.crossMethod === "sma" ? "sma" : item.crossMethod === "ema" ? "ema" : undefined,
    stochOp: item.stochOp === ">" || item.stochOp === "<" ? item.stochOp : undefined,
    stochValue: Number.isFinite(Number(item.stochValue)) ? Number(item.stochValue) : undefined,
  };
}

function compareOp(left: number, op: "<" | ">" | undefined, right: number): boolean {
  if (!op) {
    return true;
  }
  return op === "<" ? left <= right : left >= right;
}

function computeSignalMarkers(item: BuiltIndicator, values: OhlcBar[]): (number | null)[] {
  const spec = item.signal ?? {};
  const side = item.method === "signal_sell" || spec.side === "sell" ? "sell" : "buy";
  const close = values.map((bar) => bar[1]);
  const bands = spec.bb ? bollinger(close, clampPeriod(spec.bbPeriod ?? 20), spec.bbMult ?? 2) : null;
  const rsi = spec.rsiValue != null ? rsiSeries(close, clampPeriod(spec.rsiPeriod ?? 14)) : null;
  const stoch = spec.stochValue != null ? stochastic(values, clampPeriod(spec.stochPeriod ?? 5), 3) : null;
  const fast =
    spec.crossFast && spec.crossSlow
      ? (spec.crossMethod === "sma" ? smaSeries : emaSeries)(close, clampPeriod(spec.crossFast))
      : null;
  const slow =
    spec.crossFast && spec.crossSlow
      ? (spec.crossMethod === "sma" ? smaSeries : emaSeries)(close, clampPeriod(spec.crossSlow))
      : null;
  const out: (number | null)[] = values.map(() => null);
  let armed = false;
  for (let i = 0; i < values.length; i += 1) {
    let ok = true;
    if (fast && slow) {
      if (i === 0) {
        ok = false;
      } else {
        const prevFast = fast[i - 1];
        const prevSlow = slow[i - 1];
        const nowFast = fast[i];
        const nowSlow = slow[i];
        if (prevFast == null || prevSlow == null || nowFast == null || nowSlow == null) {
          ok = false;
        } else if (side === "buy") {
          ok = prevFast <= prevSlow && nowFast > nowSlow;
        } else {
          ok = prevFast >= prevSlow && nowFast < nowSlow;
        }
      }
    }
    if (bands) {
      const edge = spec.bb === "upper" ? bands.upper[i] : bands.lower[i];
      if (edge == null) {
        ok = false;
      } else if (spec.bb === "lower" && close[i] > edge) {
        ok = false;
      } else if (spec.bb === "upper" && close[i] < edge) {
        ok = false;
      }
    }
    if (ok && rsi) {
      const value = rsi[i];
      ok = value != null && compareOp(value, spec.rsiOp, spec.rsiValue ?? 0);
    }
    if (ok && stoch) {
      const value = stoch.k[i];
      ok = value != null && compareOp(value, spec.stochOp, spec.stochValue ?? 0);
    }
    if (ok && !armed) {
      out[i] = side === "buy" ? values[i][2] : values[i][3];
    }
    armed = ok;
  }
  return out;
}

function clampPeriod(value: number): number {
  if (!Number.isFinite(value)) {
    return 14;
  }
  return Math.min(400, Math.max(1, Math.round(value)));
}

function asPeriod(raw: unknown): number | undefined {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return clampPeriod(value);
}
