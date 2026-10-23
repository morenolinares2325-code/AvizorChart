export type BuilderTemplateSection = "tendencia" | "volumetria" | "osciladores" | "momentum";

export interface BuilderTemplate {
  id: string;
  section: BuilderTemplateSection;
  label: string;
  name: string;
  source: string;
}

export const BUILDER_SECTIONS: { id: BuilderTemplateSection; label: string }[] = [
  { id: "tendencia", label: "Tendencia" },
  { id: "volumetria", label: "Volumetría" },
  { id: "osciladores", label: "Osciladores" },
  { id: "momentum", label: "Momentum" },
];

export const AVIZOR_CHART_DTS = `
declare module "@avizor/chart" {
  export const close: "close";
  export const open: "open";
  export const high: "high";
  export const low: "low";
  export const hl2: "hl2";
  export const hlc3: "hlc3";
  export const volume: "volume";
  export function ema(source: unknown, period: number): unknown;
  export function sma(source: unknown, period: number): unknown;
  export function rsi(source: unknown, period: number): unknown;
  export function atr(source: unknown, period: number): unknown;
  export function roc(source: unknown, period: number): unknown;
  export function stddev(source: unknown, period: number): unknown;
  export function bbUpper(source: unknown, period: number): unknown;
  export function bbLower(source: unknown, period: number): unknown;
  export function macd(source: unknown, period: number): unknown;
  export function macdSignal(source: unknown, period: number): unknown;
  export function macdHist(source: unknown, period: number): unknown;
  export function overlay(series: unknown, opts?: Record<string, unknown>): void;
  export function pane(series: unknown, opts?: Record<string, unknown>): void;
  export function signalBuy(spec: Record<string, unknown>, opts?: Record<string, unknown>): void;
  export function signalSell(spec: Record<string, unknown>, opts?: Record<string, unknown>): void;
  export function markLine(spec: { name?: string; y: number; color?: string; style?: string; pane?: string }): void;
  export function markArea(spec: { name?: string; y0: number; y1: number; color?: string; pane?: string }): void;
  export function label(spec: { name?: string; text?: string; color?: string }): void;
}
`;

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    id: "ema-ribbon",
    section: "tendencia",
    label: "EMA Ribbon",
    name: "EMA Ribbon",
    source: `import { overlay, ema, close } from "@avizor/chart";

export const name = "EMA Ribbon";

overlay(ema(close, 8), { color: "#2962FF", width: 1.1, title: "EMA 8" });
overlay(ema(close, 21), { color: "#26A69A", width: 1.3, title: "EMA 21" });
overlay(ema(close, 55), { color: "#FF6D00", width: 1.6, title: "EMA 55" });

export default { name };
`,
  },
  {
    id: "ema-cross",
    section: "tendencia",
    label: "Cruces EMA",
    name: "Cruces EMA 9/21",
    source: `import { overlay, ema, close, signalBuy, signalSell } from "@avizor/chart";

export const name = "Cruces EMA 9/21";

overlay(ema(close, 9), { color: "#2962FF", width: 1.2, title: "EMA 9" });
overlay(ema(close, 21), { color: "#FF6D00", width: 1.5, title: "EMA 21" });

signalBuy(
  { side: "buy", crossMethod: "ema", crossFast: 9, crossSlow: 21 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", crossMethod: "ema", crossFast: 9, crossSlow: 21 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "bollinger",
    section: "tendencia",
    label: "Bollinger",
    name: "Bandas de Bollinger",
    source: `import { overlay, sma, bbUpper, bbLower, close } from "@avizor/chart";

export const name = "Bandas de Bollinger";

overlay(bbUpper(close, 20), { color: "#26C6DA", width: 1, title: "BB Upper", fill: "rgba(38,198,218,0.08)" });
overlay(sma(close, 20), { color: "#42A5F5", width: 1.3, title: "BB Mid" });
overlay(bbLower(close, 20), { color: "#26C6DA", width: 1, title: "BB Lower" });

export default { name };
`,
  },
  {
    id: "sma-trend",
    section: "tendencia",
    label: "SMA 50/200",
    name: "SMA 50/200",
    source: `import { overlay, sma, close, signalBuy, signalSell } from "@avizor/chart";

export const name = "SMA 50/200";

overlay(sma(close, 50), { color: "#AB47BC", width: 1.3, title: "SMA 50" });
overlay(sma(close, 200), { color: "#FFCA28", width: 1.7, title: "SMA 200" });

signalBuy(
  { side: "buy", crossMethod: "sma", crossFast: 50, crossSlow: 200 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", crossMethod: "sma", crossFast: 50, crossSlow: 200 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "volume-flow",
    section: "volumetria",
    label: "Volumen",
    name: "Volumen + Media",
    source: `import { pane, sma, volume } from "@avizor/chart";

export const name = "Volumen + Media";

pane(volume, { color: "#26A69A", color2: "#EF5350", style: "bar", title: "Volumen", group: "vol" });
pane(sma(volume, 20), { color: "#FFCA28", width: 1.2, title: "SMA Vol 20", group: "vol" });

export default { name };
`,
  },
  {
    id: "vwap-proxy",
    section: "volumetria",
    label: "VWAP HL2",
    name: "VWAP aproximado",
    source: `import { overlay, pane, sma, hl2, volume } from "@avizor/chart";

export const name = "VWAP aproximado";

overlay(sma(hl2, 20), { color: "#2962FF", width: 1.4, title: "VWAP HL2" });
pane(volume, { color: "#546E7A", color2: "#90A4AE", style: "bar", title: "Volumen", group: "vol" });

export default { name };
`,
  },
  {
    id: "rsi-zones",
    section: "osciladores",
    label: "RSI zonas",
    name: "RSI 14 Zonas",
    source: `import { pane, rsi, close, markArea, markLine, signalBuy, signalSell } from "@avizor/chart";

export const name = "RSI 14 Zonas";

pane(rsi(close, 14), { color: "#7E57C2", width: 1.4, title: "RSI 14", group: "rsi" });
markArea({ name: "Sobrecompra", y0: 70, y1: 100, color: "rgba(239,83,80,0.12)", pane: "pane" });
markArea({ name: "Sobreventa", y0: 0, y1: 30, color: "rgba(38,166,154,0.12)", pane: "pane" });
markLine({ name: "70", y: 70, color: "#EF5350", style: "dashed", pane: "pane" });
markLine({ name: "30", y: 30, color: "#26A69A", style: "dashed", pane: "pane" });

signalBuy(
  { side: "buy", rsiPeriod: 14, rsiOp: "<", rsiValue: 30 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", rsiPeriod: 14, rsiOp: ">", rsiValue: 70 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "stoch",
    section: "osciladores",
    label: "Estocástico",
    name: "Estocástico",
    source: `import { pane, rsi, close, markArea, signalBuy, signalSell } from "@avizor/chart";

export const name = "Estocástico";

pane(rsi(close, 14), { color: "#42A5F5", width: 1.3, title: "Stoch %K", group: "stoch" });
pane(rsi(close, 5), { color: "#FF6D00", width: 1.1, title: "Stoch %D", group: "stoch" });
markArea({ name: "Extremo alto", y0: 80, y1: 100, color: "rgba(239,83,80,0.10)", pane: "pane" });
markArea({ name: "Extremo bajo", y0: 0, y1: 20, color: "rgba(38,166,154,0.10)", pane: "pane" });

signalBuy(
  { side: "buy", stochPeriod: 14, stochOp: "<", stochValue: 20 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", stochPeriod: 14, stochOp: ">", stochValue: 80 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "bb-rsi-stoch",
    section: "osciladores",
    label: "Confluencia",
    name: "Confluencia BB RSI Stoch",
    source: `import { overlay, pane, sma, bbUpper, bbLower, rsi, close, signalBuy, signalSell } from "@avizor/chart";

export const name = "Confluencia BB RSI Stoch";

overlay(bbUpper(close, 20), { color: "#26C6DA", width: 1, title: "BB Upper" });
overlay(sma(close, 20), { color: "#42A5F5", width: 1.2, title: "BB Mid" });
overlay(bbLower(close, 20), { color: "#26C6DA", width: 1, title: "BB Lower" });
pane(rsi(close, 14), { color: "#7E57C2", width: 1.3, title: "RSI 14", group: "osc" });

signalBuy(
  { side: "buy", bb: "lower", bbPeriod: 20, bbMult: 2, rsiPeriod: 14, rsiOp: "<", rsiValue: 30, stochPeriod: 5, stochOp: "<", stochValue: 20 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", bb: "upper", bbPeriod: 20, bbMult: 2, rsiPeriod: 14, rsiOp: ">", rsiValue: 70, stochPeriod: 5, stochOp: ">", stochValue: 80 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "macd-hist",
    section: "momentum",
    label: "MACD Hist",
    name: "MACD Histograma",
    source: `import { pane, macd, macdSignal, macdHist, close, signalBuy, signalSell } from "@avizor/chart";

export const name = "MACD Histograma";

pane(macdHist(close, 12), { color: "#26A69A", color2: "#EF5350", style: "hist", title: "Histograma", group: "macd" });
pane(macd(close, 12), { color: "#2962FF", width: 1.3, title: "MACD", group: "macd" });
pane(macdSignal(close, 12), { color: "#FF6D00", width: 1.2, title: "Señal", group: "macd" });

signalBuy(
  { side: "buy", crossMethod: "ema", crossFast: 12, crossSlow: 26 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", crossMethod: "ema", crossFast: 12, crossSlow: 26 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "roc-momentum",
    section: "momentum",
    label: "ROC",
    name: "ROC Momentum",
    source: `import { pane, roc, close, markLine, signalBuy, signalSell } from "@avizor/chart";

export const name = "ROC Momentum";

pane(roc(close, 12), { color: "#AB47BC", width: 1.4, title: "ROC 12", group: "roc" });
markLine({ name: "Cero", y: 0, color: "#78909C", style: "dashed", pane: "pane" });

signalBuy(
  { side: "buy", rsiPeriod: 14, rsiOp: "<", rsiValue: 45 },
  { color: "#26A69A", title: "BUY" },
);
signalSell(
  { side: "sell", rsiPeriod: 14, rsiOp: ">", rsiValue: 55 },
  { color: "#EF5350", title: "SELL" },
);

export default { name };
`,
  },
  {
    id: "macd-volume",
    section: "momentum",
    label: "MACD + Vol",
    name: "MACD Volumen",
    source: `import { pane, macd, macdHist, volume, close } from "@avizor/chart";

export const name = "MACD Volumen";

pane(macdHist(close, 12), { color: "#26A69A", color2: "#EF5350", style: "hist", title: "MACD Hist", group: "macd" });
pane(macd(close, 12), { color: "#2962FF", width: 1.2, title: "MACD", group: "macd" });
pane(volume, { color: "#546E7A", color2: "#90A4AE", style: "bar", title: "Volumen", group: "vol" });

export default { name };
`,
  },
];

export const DEFAULT_BUILDER_SOURCE = BUILDER_TEMPLATES.find((item) => item.id === "ema-cross")?.source ?? BUILDER_TEMPLATES[0].source;
export const DEFAULT_BUILDER_NAME = "Cruces EMA 9/21";
