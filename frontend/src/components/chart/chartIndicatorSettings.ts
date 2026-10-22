import type { IndicatorId } from "@/components/chart/chartTypes";

export interface IndicatorStyle {
  color: string;
  color2?: string;
  color3?: string;
  period?: number;
  period2?: number;
  period3?: number;
  mult?: number;
  step?: number;
  max?: number;
  width?: number;
}

export type IndicatorSettingsMap = Partial<Record<IndicatorId, Partial<IndicatorStyle>>>;

export type IndicatorNumKey = "period" | "period2" | "period3" | "mult" | "step" | "max" | "width";
export type IndicatorColorKey = "color" | "color2" | "color3";

export interface IndicatorNumField {
  key: IndicatorNumKey;
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface IndicatorColorField {
  key: IndicatorColorKey;
  label: string;
}

export const INDICATOR_DEFAULTS: Record<IndicatorId, IndicatorStyle> = {
  ema9: { color: "#00E5FF", period: 9, width: 1.2 },
  ema20: { color: "#38bdf8", period: 20, width: 1.2 },
  ema50: { color: "#a78bfa", period: 50, width: 1.2 },
  ema200: { color: "#f59e0b", period: 200, width: 1.6 },
  sma50: { color: "#94a3b8", period: 50, width: 1.2 },
  sma200: { color: "#fb7185", period: 200, width: 1.5 },
  vwap: { color: "#f472b6", width: 1.4 },
  avwap: { color: "#c084fc", width: 1.4 },
  supertrend: { color: "#00FF66", color2: "#FF3366", period: 10, mult: 3, width: 1.5 },
  psar: { color: "#FFD700", step: 0.02, max: 0.2 },
  rsi: { color: "#eab308", period: 14, width: 1.2 },
  macd: { color: "#38bdf8", color2: "#f97316", color3: "#22c55e", period: 12, period2: 26, period3: 9, width: 1.2 },
  stoch: { color: "#00E5FF", color2: "#FFD700", period: 14, period2: 3, width: 1.2 },
  cci: { color: "#a78bfa", period: 20, width: 1.2 },
  roc: { color: "#fb7185", period: 12, width: 1.2 },
  willr: { color: "#f472b6", period: 14, width: 1.2 },
  bb: { color: "#71717a", color2: "#64748b", period: 20, mult: 2, width: 1 },
  atr: { color: "#fb923c", period: 14, width: 1.2 },
  stddev: { color: "#94a3b8", period: 20, width: 1.2 },
  keltner: { color: "#00FF66", color2: "#22c55e", period: 20, mult: 1.5, width: 1 },
  vol_hist: { color: "#22c55e", color2: "#ef4444" },
  obv: { color: "#00FF66", width: 1.2 },
  mfi: { color: "#38bdf8", period: 14, width: 1.2 },
  vol_pressure: { color: "#FFD700", period: 14, width: 1.2 },
};

const period = (label = "Periodo"): IndicatorNumField => ({
  key: "period",
  label,
  min: 1,
  max: 400,
  step: 1,
});

export const INDICATOR_NUM_FIELDS: Record<IndicatorId, IndicatorNumField[]> = {
  ema9: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  ema20: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  ema50: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  ema200: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  sma50: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  sma200: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  vwap: [{ key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  avwap: [{ key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  supertrend: [
    period("ATR"),
    { key: "mult", label: "Multiplicador", min: 0.5, max: 8, step: 0.1 },
    { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 },
  ],
  psar: [
    { key: "step", label: "Paso AF", min: 0.005, max: 0.2, step: 0.005 },
    { key: "max", label: "AF máx.", min: 0.05, max: 0.5, step: 0.01 },
  ],
  rsi: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  macd: [
    { key: "period", label: "Rápida", min: 2, max: 50, step: 1 },
    { key: "period2", label: "Lenta", min: 5, max: 80, step: 1 },
    { key: "period3", label: "Señal", min: 2, max: 40, step: 1 },
    { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 },
  ],
  stoch: [
    { key: "period", label: "%K", min: 2, max: 80, step: 1 },
    { key: "period2", label: "%D", min: 1, max: 20, step: 1 },
    { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 },
  ],
  cci: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  roc: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  willr: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  bb: [
    period(),
    { key: "mult", label: "Desv.", min: 0.5, max: 5, step: 0.1 },
    { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 },
  ],
  atr: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  stddev: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  keltner: [
    period(),
    { key: "mult", label: "Multiplicador", min: 0.5, max: 6, step: 0.1 },
    { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 },
  ],
  vol_hist: [],
  obv: [{ key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  mfi: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
  vol_pressure: [period(), { key: "width", label: "Grosor", min: 0.4, max: 4, step: 0.1 }],
};

export const INDICATOR_COLOR_FIELDS: Record<IndicatorId, IndicatorColorField[]> = {
  ema9: [{ key: "color", label: "Color" }],
  ema20: [{ key: "color", label: "Color" }],
  ema50: [{ key: "color", label: "Color" }],
  ema200: [{ key: "color", label: "Color" }],
  sma50: [{ key: "color", label: "Color" }],
  sma200: [{ key: "color", label: "Color" }],
  vwap: [{ key: "color", label: "Color" }],
  avwap: [{ key: "color", label: "Color" }],
  supertrend: [
    { key: "color", label: "Alcista" },
    { key: "color2", label: "Bajista" },
  ],
  psar: [{ key: "color", label: "Color" }],
  rsi: [{ key: "color", label: "Color" }],
  macd: [
    { key: "color", label: "MACD" },
    { key: "color2", label: "Señal" },
    { key: "color3", label: "Histograma" },
  ],
  stoch: [
    { key: "color", label: "%K" },
    { key: "color2", label: "%D" },
  ],
  cci: [{ key: "color", label: "Color" }],
  roc: [{ key: "color", label: "Color" }],
  willr: [{ key: "color", label: "Color" }],
  bb: [
    { key: "color", label: "Media" },
    { key: "color2", label: "Bandas" },
  ],
  atr: [{ key: "color", label: "Color" }],
  stddev: [{ key: "color", label: "Color" }],
  keltner: [
    { key: "color", label: "Media" },
    { key: "color2", label: "Bandas" },
  ],
  vol_hist: [
    { key: "color", label: "Alcista" },
    { key: "color2", label: "Bajista" },
  ],
  obv: [{ key: "color", label: "Color" }],
  mfi: [{ key: "color", label: "Color" }],
  vol_pressure: [{ key: "color", label: "Color" }],
};

export function indicatorStyle(id: IndicatorId, map?: IndicatorSettingsMap): IndicatorStyle {
  return { ...INDICATOR_DEFAULTS[id], ...map?.[id] };
}

export function normalizeIndicatorSettings(raw: unknown): IndicatorSettingsMap {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  const next: IndicatorSettingsMap = {};
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    next[id as IndicatorId] = value as Partial<IndicatorStyle>;
  }
  return next;
}
