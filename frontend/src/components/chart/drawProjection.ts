import type { ChartEngine } from "@/components/chart/kline/engine";
import type { DrawPoint } from "@/components/chart/chartDrawTools";
import type { OhlcBar } from "@/lib/chartMath";

export function pointerOnChart(
  chart: ChartEngine | null,
  clientX: number,
  clientY: number,
  magnet: boolean,
  values?: OhlcBar[],
  dates?: string[],
): DrawPoint | null {
  if (!chart) {
    return null;
  }
  const dom = chart.getDom();
  const rect = dom.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  return pixelToAnchor(chart, px, py, magnet, values, dates);
}

export function pixelToAnchor(
  chart: ChartEngine,
  px: number,
  py: number,
  magnet: boolean,
  values?: OhlcBar[],
  _dates?: string[],
): DrawPoint {
  const mapped = chart.convertFromPixel(px, py);
  let cat = mapped?.cat ?? 0;
  let price = mapped?.price ?? 0;
  if (magnet) {
    cat = Math.round(cat);
    if (values && values.length > 0) {
      price = snapOhlc(values, cat, price);
    }
  }
  return projectAnchor(chart, cat, price, px, py);
}

export function projectAnchor(chart: ChartEngine, cat: number, price: number, fallbackX: number, fallbackY: number): DrawPoint {
  const screen = chart.convertToPixel(cat, price);
  return {
    x: screen?.x ?? fallbackX,
    y: screen?.y ?? fallbackY,
    cat,
    price,
  };
}

export function projectPoint(
  chart: ChartEngine | null,
  point: DrawPoint,
  width: number,
  height: number,
  dates?: string[],
): DrawPoint {
  if (!chart) {
    return point;
  }
  if (typeof point.cat === "number" && typeof point.price === "number") {
    return projectAnchor(chart, point.cat, point.price, point.x, point.y);
  }
  const px = (point.x / 1000) * width;
  const py = (point.y / 1000) * height;
  return pixelToAnchor(chart, px, py, false, undefined, dates);
}

function snapOhlc(values: OhlcBar[], cat: number, price: number): number {
  const bar = values[Math.max(0, Math.min(values.length - 1, Math.round(cat)))];
  if (!bar) {
    return price;
  }
  const levels = [bar[0], bar[1], bar[2], bar[3]];
  return levels.reduce((best, value) => (Math.abs(value - price) < Math.abs(best - price) ? value : best));
}
