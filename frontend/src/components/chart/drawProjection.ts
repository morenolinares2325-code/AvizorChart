import type { ECharts } from "echarts";
import type { DrawPoint } from "@/components/chart/chartDrawTools";
import type { OhlcBar } from "@/lib/chartMath";

export function pointerOnChart(
  chart: ECharts | null,
  clientX: number,
  clientY: number,
  magnet: boolean,
  values?: OhlcBar[],
  dates?: string[],
): DrawPoint | null {
  if (!chart) {
    return null;
  }
  const dom = chart.getDom() as HTMLElement | undefined;
  if (!dom) {
    return null;
  }
  const rect = dom.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  return pixelToAnchor(chart, px, py, magnet, values, dates);
}

function asCat(raw: unknown, dates?: string[]): number {
  if (typeof raw === "string" && dates && dates.length > 0) {
    const idx = dates.indexOf(raw);
    if (idx >= 0) {
      return idx;
    }
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function axisValue(cat: number, dates?: string[]): number | string {
  if (!dates || dates.length === 0) {
    return cat;
  }
  const rounded = Math.round(cat);
  if (Math.abs(cat - rounded) < 1e-6 && dates[rounded] !== undefined) {
    return dates[rounded];
  }
  return cat;
}

export function pixelToAnchor(
  chart: ECharts,
  px: number,
  py: number,
  magnet: boolean,
  values?: OhlcBar[],
  dates?: string[],
): DrawPoint {
  let cat = px;
  let price = py;
  try {
    const raw = chart.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [px, py]) as unknown;
    if (Array.isArray(raw) && raw.length >= 2) {
      cat = asCat(raw[0], dates);
      price = Number(raw[1]);
    }
  } catch {
    /* keep pixel fallback */
  }
  if (!Number.isFinite(cat)) {
    cat = 0;
  }
  if (!Number.isFinite(price)) {
    price = 0;
  }
  if (magnet) {
    cat = Math.round(cat);
    if (values && values.length > 0) {
      price = snapOhlc(values, cat, price);
    }
  }
  return projectAnchor(chart, cat, price, px, py, dates);
}

export function projectAnchor(
  chart: ECharts,
  cat: number,
  price: number,
  fallbackX: number,
  fallbackY: number,
  dates?: string[],
): DrawPoint {
  let x = fallbackX;
  let y = fallbackY;
  try {
    const screen = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [axisValue(cat, dates), price]) as unknown;
    if (Array.isArray(screen) && screen.length >= 2) {
      const sx = Number(screen[0]);
      const sy = Number(screen[1]);
      if (Number.isFinite(sx) && Number.isFinite(sy)) {
        x = sx;
        y = sy;
      }
    }
  } catch {
    /* keep fallback */
  }
  return { x, y, cat, price };
}

export function projectPoint(
  chart: ECharts | null,
  point: DrawPoint,
  width: number,
  height: number,
  dates?: string[],
): DrawPoint {
  if (!chart) {
    return point;
  }
  if (typeof point.cat === "number" && typeof point.price === "number") {
    return projectAnchor(chart, point.cat, point.price, point.x, point.y, dates);
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
