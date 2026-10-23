import { priceBarsForType, type ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { CandlePayload } from "@/lib/marketApi";
import type { KLineData } from "klinecharts";

export function timestampForDate(date: string, index: number): number {
  const parsed = Date.parse(date);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return index * 86_400_000;
}

export function toKLineData(data: CandlePayload, chartType: ChartPriceType = "candles"): KLineData[] {
  const bars = priceBarsForType(chartType === "heikin" || chartType === "renko" ? chartType : "candles", data.values);
  const list: KLineData[] = [];
  for (let i = 0; i < data.dates.length; i += 1) {
    const bar = bars[i];
    if (!bar) {
      continue;
    }
    const [open, close, low, high] = bar;
    if (![open, close, low, high].every((value) => Number.isFinite(value))) {
      continue;
    }
    list.push({
      timestamp: timestampForDate(data.dates[i] ?? "", i),
      open,
      high,
      low,
      close,
      volume: data.volumes[i] ?? 0,
    });
  }
  return list;
}

export function candleTypeFor(chartType: ChartPriceType): "candle_solid" | "ohlc" | "area" {
  if (chartType === "line" || chartType === "area" || chartType === "scatter") {
    return "area";
  }
  if (chartType === "bars") {
    return "ohlc";
  }
  return "candle_solid";
}
