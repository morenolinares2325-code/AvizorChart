import type { Chart } from "klinecharts";

export interface ChartEngine {
  kind: "kline";
  raw: Chart;
  getDom: () => HTMLElement;
  convertFromPixel: (px: number, py: number) => { cat: number; price: number } | null;
  convertToPixel: (cat: number, price: number) => { x: number; y: number } | null;
  resize: () => void;
}

export function wrapKlineChart(chart: Chart, host: HTMLElement): ChartEngine {
  return {
    kind: "kline",
    raw: chart,
    getDom: () => chart.getDom() ?? host,
    convertFromPixel(px, py) {
      try {
        const raw = chart.convertFromPixel([{ x: px, y: py }], { paneId: "candle_pane" });
        const point = Array.isArray(raw) ? raw[0] : raw;
        const cat = Number(point?.dataIndex);
        const price = Number(point?.value);
        if (!Number.isFinite(cat) || !Number.isFinite(price)) {
          return null;
        }
        return { cat, price };
      } catch {
        return null;
      }
    },
    convertToPixel(cat, price) {
      try {
        const raw = chart.convertToPixel({ dataIndex: cat, value: price }, { paneId: "candle_pane" });
        const point = Array.isArray(raw) ? raw[0] : raw;
        const x = Number(point?.x);
        const y = Number(point?.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          return null;
        }
        return { x, y };
      } catch {
        return null;
      }
    },
    resize: () => chart.resize(),
  };
}

export function barSpacePx(chart: Chart): number {
  const space = chart.getBarSpace() as unknown;
  if (typeof space === "number" && Number.isFinite(space) && space > 0) {
    return space;
  }
  if (space && typeof space === "object" && "bar" in space) {
    const bar = Number((space as { bar?: number }).bar);
    if (Number.isFinite(bar) && bar > 0) {
      return bar;
    }
  }
  return 8;
}
