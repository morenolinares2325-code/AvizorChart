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

const widthField = (): IndicatorNumField => ({
  key: "width",
  label: "Grosor",
  min: 0.4,
  max: 4,
  step: 0.1,
});

const period = (label = "Periodo"): IndicatorNumField => ({
  key: "period",
  label,
  min: 1,
  max: 400,
  step: 1,
});

export const INDICATOR_DEFAULTS: Record<IndicatorId, IndicatorStyle> = {
  ema9: { color: "#2962FF", period: 9, width: 1.35 },
  ema20: { color: "#FF6D00", period: 20, width: 1.35 },
  ema50: { color: "#AB47BC", period: 50, width: 1.4 },
  ema100: { color: "#26A69A", period: 100, width: 1.5 },
  ema200: { color: "#EF5350", period: 200, width: 1.7 },
  sma20: { color: "#42A5F5", period: 20, width: 1.25 },
  sma50: { color: "#90A4AE", period: 50, width: 1.3 },
  sma200: { color: "#EC407A", period: 200, width: 1.55 },
  vwap: { color: "#FF9800", width: 1.45 },
  avwap: { color: "#7E57C2", width: 1.45 },
  supertrend: { color: "#26A69A", color2: "#EF5350", period: 10, mult: 3, width: 1.55 },
  psar: { color: "#FFB74D", step: 0.02, max: 0.2 },
  rsi: { color: "#7E57C2", period: 14, width: 1.4 },
  macd: { color: "#2962FF", color2: "#FF6D00", color3: "#26A69A", period: 12, period2: 26, period3: 9, width: 1.25 },
  stoch: { color: "#26C6DA", color2: "#FFA726", period: 14, period2: 3, width: 1.25 },
  cci: { color: "#5C6BC0", period: 20, width: 1.25 },
  roc: { color: "#EC407A", period: 12, width: 1.25 },
  willr: { color: "#26A69A", period: 14, width: 1.25 },
  adx: { color: "#42A5F5", color2: "#26A69A", color3: "#EF5350", period: 14, width: 1.35 },
  stoch_rsi: { color: "#AB47BC", period: 14, period2: 14, width: 1.3 },
  bb: { color: "#26A69A", color2: "#80CBC4", period: 20, mult: 2, width: 1 },
  atr: { color: "#FFA726", period: 14, width: 1.25 },
  stddev: { color: "#90A4AE", period: 20, width: 1.2 },
  keltner: { color: "#42A5F5", color2: "#90CAF9", period: 20, mult: 1.5, width: 1 },
  donchian: { color: "#7E57C2", color2: "#B39DDB", period: 20, width: 1 },
  vol_hist: { color: "#26A69A", color2: "#EF5350" },
  obv: { color: "#5C6BC0", width: 1.3 },
  mfi: { color: "#26C6DA", period: 14, width: 1.3 },
  cmf: { color: "#AB47BC", period: 20, width: 1.3 },
  ad_line: { color: "#42A5F5", width: 1.3 },
  vol_pressure: { color: "#FFA726", period: 14, width: 1.25 },
};

export const INDICATOR_NUM_FIELDS: Record<IndicatorId, IndicatorNumField[]> = {
  ema9: [period(), widthField()],
  ema20: [period(), widthField()],
  ema50: [period(), widthField()],
  ema100: [period(), widthField()],
  ema200: [period(), widthField()],
  sma20: [period(), widthField()],
  sma50: [period(), widthField()],
  sma200: [period(), widthField()],
  vwap: [widthField()],
  avwap: [widthField()],
  supertrend: [
    period("ATR"),
    { key: "mult", label: "Multiplicador", min: 0.5, max: 8, step: 0.1 },
    widthField(),
  ],
  psar: [
    { key: "step", label: "Paso AF", min: 0.005, max: 0.2, step: 0.005 },
    { key: "max", label: "AF máx.", min: 0.05, max: 0.5, step: 0.01 },
  ],
  rsi: [period(), widthField()],
  macd: [
    { key: "period", label: "Rápida", min: 2, max: 50, step: 1 },
    { key: "period2", label: "Lenta", min: 5, max: 80, step: 1 },
    { key: "period3", label: "Señal", min: 2, max: 40, step: 1 },
    widthField(),
  ],
  stoch: [
    { key: "period", label: "%K", min: 2, max: 80, step: 1 },
    { key: "period2", label: "%D", min: 1, max: 20, step: 1 },
    widthField(),
  ],
  cci: [period(), widthField()],
  roc: [period(), widthField()],
  willr: [period(), widthField()],
  adx: [period(), widthField()],
  stoch_rsi: [
    period("RSI"),
    { key: "period2", label: "Estocástico", min: 2, max: 80, step: 1 },
    widthField(),
  ],
  bb: [period(), { key: "mult", label: "Desv.", min: 0.5, max: 5, step: 0.1 }, widthField()],
  atr: [period(), widthField()],
  stddev: [period(), widthField()],
  keltner: [period(), { key: "mult", label: "Multiplicador", min: 0.5, max: 6, step: 0.1 }, widthField()],
  donchian: [period(), widthField()],
  vol_hist: [],
  obv: [widthField()],
  mfi: [period(), widthField()],
  cmf: [period(), widthField()],
  ad_line: [widthField()],
  vol_pressure: [period(), widthField()],
};

export const INDICATOR_COLOR_FIELDS: Record<IndicatorId, IndicatorColorField[]> = {
  ema9: [{ key: "color", label: "Color" }],
  ema20: [{ key: "color", label: "Color" }],
  ema50: [{ key: "color", label: "Color" }],
  ema100: [{ key: "color", label: "Color" }],
  ema200: [{ key: "color", label: "Color" }],
  sma20: [{ key: "color", label: "Color" }],
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
    { key: "color3", label: "Histograma +" },
  ],
  stoch: [
    { key: "color", label: "%K" },
    { key: "color2", label: "%D" },
  ],
  cci: [{ key: "color", label: "Color" }],
  roc: [{ key: "color", label: "Color" }],
  willr: [{ key: "color", label: "Color" }],
  adx: [
    { key: "color", label: "ADX" },
    { key: "color2", label: "+DI" },
    { key: "color3", label: "−DI" },
  ],
  stoch_rsi: [{ key: "color", label: "Color" }],
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
  donchian: [
    { key: "color", label: "Media" },
    { key: "color2", label: "Bandas" },
  ],
  vol_hist: [
    { key: "color", label: "Alcista" },
    { key: "color2", label: "Bajista" },
  ],
  obv: [{ key: "color", label: "Color" }],
  mfi: [{ key: "color", label: "Color" }],
  cmf: [{ key: "color", label: "Color" }],
  ad_line: [{ key: "color", label: "Color" }],
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
