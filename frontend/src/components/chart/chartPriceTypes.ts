import type { OhlcBar } from "@/lib/chartMath";

export const CHART_PRICE_TYPES = [
  { id: "candles", label: "Velas Japonesas", hint: "Candlestick estándar" },
  { id: "heikin", label: "Heikin Ashi", hint: "Velas suavizadas de tendencia" },
  { id: "line", label: "Línea", hint: "Cierre continuo" },
  { id: "area", label: "Área", hint: "Cierre con degradado" },
  { id: "scatter", label: "Puntos", hint: "Scatter / dots" },
  { id: "bars", label: "Barras OHLC", hint: "Barras americanas" },
  { id: "renko", label: "Renko", hint: "Ladrillos ATR sobre el tiempo" },
] as const;

export type ChartPriceType = (typeof CHART_PRICE_TYPES)[number]["id"];

export function isChartPriceType(value: string): value is ChartPriceType {
  return CHART_PRICE_TYPES.some((item) => item.id === value);
}

export function heikinAshiBars(values: OhlcBar[]): OhlcBar[] {
  const out: OhlcBar[] = [];
  for (let i = 0; i < values.length; i += 1) {
    const [open, close, low, high] = values[i];
    const haClose = (open + high + low + close) / 4;
    const prev = out[i - 1];
    const haOpen = prev ? (prev[0] + prev[1]) / 2 : (open + close) / 2;
    out.push([haOpen, haClose, Math.min(low, haOpen, haClose), Math.max(high, haOpen, haClose)]);
  }
  return out;
}

function atrBrick(values: OhlcBar[]): number {
  const len = Math.min(14, values.length);
  if (len < 2) {
    const first = values[0];
    return first ? Math.max(Math.abs(first[3] - first[2]), Math.abs(first[1]) * 0.002) : 1;
  }
  let sum = 0;
  for (let i = values.length - len; i < values.length; i += 1) {
    const bar = values[i];
    const prevClose = values[i - 1]?.[1] ?? bar[1];
    sum += Math.max(bar[3] - bar[2], Math.abs(bar[3] - prevClose), Math.abs(bar[2] - prevClose));
  }
  return Math.max(sum / len, 1e-8);
}

export function timeRenkoBars(values: OhlcBar[]): (OhlcBar | null)[] {
  const out: (OhlcBar | null)[] = values.map(() => null);
  if (values.length === 0) {
    return out;
  }
  const size = atrBrick(values);
  let brick = values[0][1];
  out[0] = [brick, brick, brick, brick];
  for (let i = 1; i < values.length; i += 1) {
    const close = values[i][1];
    let last: OhlcBar | null = null;
    while (close - brick >= size) {
      const open = brick;
      brick += size;
      last = [open, brick, open, brick];
    }
    while (brick - close >= size) {
      const open = brick;
      brick -= size;
      last = [open, brick, brick, open];
    }
    out[i] = last;
  }
  return out;
}

export function priceBarsForType(type: ChartPriceType, values: OhlcBar[]): (OhlcBar | null)[] {
  if (type === "heikin") {
    return heikinAshiBars(values);
  }
  if (type === "renko") {
    return timeRenkoBars(values);
  }
  return values;
}
