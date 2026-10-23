import { barSpacePx, type ChartEngine } from "@/components/chart/kline/engine";

export const CHART_CENTER_EVENT = "avizor-chart-center";
export const CHART_RIGHT_PAD_EVENT = "avizor-chart-right-pad";
export const CHART_RIGHT_PAD_BARS = 22;

export function requestChartCenter(): void {
  window.dispatchEvent(new Event(CHART_CENTER_EVENT));
}

export function requestChartRightPad(): void {
  window.dispatchEvent(new Event(CHART_RIGHT_PAD_EVENT));
}

interface ScaleHandlers {
  onYLock?: (extent: { min: number; max: number } | null) => void;
  onView?: () => void;
}

export function centerChartView(chart: ChartEngine): { min: number; max: number } | null {
  const width = Math.max(320, chart.getDom().clientWidth || 800);
  const count = chart.raw.getDataList().length;
  const visible = Math.min(count, 120);
  const space = Math.max(4, Math.min(16, width / Math.max(visible, 1)));
  chart.raw.setBarSpace(space);
  chart.raw.scrollToRealTime();
  return null;
}

export function padChartRightView(chart: ChartEngine, enabled: boolean): void {
  chart.raw.setOffsetRightDistance(enabled ? 96 : 12);
  if (enabled) {
    chart.raw.scrollToRealTime();
  }
}

export function beginPlotPan(
  chart: ChartEngine | null,
  clientX: number,
  _clientY: number,
  handlers: ScaleHandlers = {},
): { move: (clientX: number, clientY: number, shift?: boolean) => void; end: () => void } | null {
  if (!chart) {
    return null;
  }
  const originX = clientX;
  const originIndex = chart.raw.getVisibleRange().from;
  const space = barSpacePx(chart.raw);
  return {
    move(nextX) {
      const bars = (nextX - originX) / Math.max(space, 1);
      chart.raw.scrollToDataIndex(Math.round(originIndex - bars));
      handlers.onView?.();
    },
    end() {
      /* session closed */
    },
  };
}
