import type { ECharts } from "echarts";
import type { OhlcBar } from "@/lib/chartMath";

interface ZrEvent {
  offsetX: number;
  offsetY: number;
  wheelDelta?: number;
  event?: { preventDefault?: () => void; button?: number; shiftKey?: boolean; deltaY?: number };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragState =
  | {
      kind: "plot";
      x: number;
      y: number;
      start: number;
      end: number;
      min: number;
      max: number;
      height: number;
      width: number;
    }
  | { kind: "xscale"; x: number; start: number; end: number; anchor: number }
  | { kind: "yscale"; y: number; min: number; max: number; anchor: number };

type ChartWithLock = ECharts & { __avizorYLock?: { min: number; max: number } | null };

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function echartsModel(chart: ECharts): { getComponent: (name: string, index: number) => unknown } {
  return (chart as unknown as { getModel: () => { getComponent: (name: string, index: number) => unknown } }).getModel();
}

function gridRect(chart: ECharts): Rect | null {
  try {
    const model = echartsModel(chart).getComponent("grid", 0) as
      | { coordinateSystem?: { getRect?: () => Rect } }
      | undefined;
    const rect = model?.coordinateSystem?.getRect?.();
    if (rect && rect.width > 0 && rect.height > 0) {
      return rect;
    }
  } catch {
    return null;
  }
  return null;
}

function zoomList(chart: ECharts): Array<Record<string, unknown>> {
  const raw = chart.getOption().dataZoom;
  return (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(
    (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object",
  );
}

function isXZoom(item: Record<string, unknown>): boolean {
  if (item.yAxisIndex !== undefined && item.xAxisIndex === undefined) {
    return false;
  }
  return true;
}

function xZoomIndexes(chart: ECharts): number[] {
  const list = zoomList(chart);
  const indexes = list
    .map((item, index) => (isXZoom(item) ? index : -1))
    .filter((index) => index >= 0);
  return indexes.length > 0 ? indexes : [0];
}

function readZoom(chart: ECharts): { start: number; end: number } {
  const list = zoomList(chart);
  const first = list.find(isXZoom) ?? list[0];
  const start = Number(first?.start);
  const end = Number(first?.end);
  if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
    return { start, end };
  }
  return { start: 0, end: 100 };
}

function readYExtent(chart: ECharts): { min: number; max: number } | null {
  try {
    const axis = (
      echartsModel(chart).getComponent("yAxis", 0) as {
        axis?: { scale?: { getExtent?: () => [number, number] } };
      }
    )?.axis;
    const extent = axis?.scale?.getExtent?.();
    if (!extent || extent[1] === extent[0]) {
      return null;
    }
    return { min: extent[0], max: extent[1] };
  } catch {
    return null;
  }
}

function priceAt(chart: ECharts, pixelY: number): number | null {
  try {
    const value = chart.convertFromPixel({ yAxisIndex: 0 }, pixelY);
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function patchPriceAxis(chart: ECharts, min: number | null, max: number | null): void {
  const raw = chart.getOption().yAxis;
  const list = (Array.isArray(raw) ? raw : raw ? [raw] : []).map((item) =>
    item && typeof item === "object" ? { ...(item as object) } : item,
  );
  if (!list[0] || typeof list[0] !== "object") {
    chart.setOption({ animation: false, yAxis: [{ min, max }] }, { silent: true, lazyUpdate: false });
    return;
  }
  list[0] = { ...(list[0] as object), min, max };
  chart.setOption({ animation: false, yAxis: list }, { silent: true, lazyUpdate: false });
}

function applyY(chart: ECharts, min: number, max: number): void {
  if (!(max > min)) {
    return;
  }
  (chart as ChartWithLock).__avizorYLock = { min, max };
  patchPriceAxis(chart, min, max);
}

export function peekPriceLock(chart: ECharts): { min: number; max: number } | null {
  return (chart as ChartWithLock).__avizorYLock ?? null;
}

function applyX(chart: ECharts, start: number, end: number): void {
  const span = clamp(end - start, 2.4, 100);
  const lo = clamp(start, 0, 100 - span);
  const hi = lo + span;
  chart.dispatchAction({
    type: "dataZoom",
    batch: xZoomIndexes(chart).map((dataZoomIndex) => ({ dataZoomIndex, start: lo, end: hi })),
  });
}

function fitYToVisible(chart: ECharts, handlers: ScaleHandlers = {}): void {
  const rows = priceRows(chart);
  if (rows.length === 0) {
    return;
  }
  const zoom = readZoom(chart);
  const from = Math.max(0, Math.floor((zoom.start / 100) * rows.length));
  const to = Math.min(rows.length, Math.max(from + 2, Math.ceil((zoom.end / 100) * rows.length)));
  let low = Number.POSITIVE_INFINITY;
  let high = Number.NEGATIVE_INFINITY;
  for (let i = from; i < to; i += 1) {
    const row = rows[i];
    if (!row) {
      continue;
    }
    if (!Number.isFinite(row.low) || !Number.isFinite(row.high)) {
      continue;
    }
    if (row.low < low) {
      low = row.low;
    }
    if (row.high > high) {
      high = row.high;
    }
  }
  if (!Number.isFinite(low) || !Number.isFinite(high) || high <= low) {
    return;
  }
  const pad = Math.max((high - low) * 0.12, Math.abs(high) * 0.004, 1e-6);
  const next = { min: low - pad, max: high + pad };
  applyY(chart, next.min, next.max);
  handlers.onYLock?.(next);
}

function zoomTimeWindow(
  chart: ECharts,
  delta: number,
  offsetX: number,
  rect: Rect,
  handlers: ScaleHandlers,
): void {
  const zoom = readZoom(chart);
  const span = clamp((zoom.end - zoom.start) * Math.exp(delta * 0.0018), 2.4, 100);
  const followLatest = zoom.end >= 99.15;
  if (followLatest) {
    applyX(chart, 100 - span, 100);
  } else {
    const t = clamp((offsetX - rect.x) / Math.max(rect.width, 1), 0, 1);
    const anchor = zoom.start + t * (zoom.end - zoom.start);
    applyX(chart, anchor - span * t, anchor + span * (1 - t));
  }
  fitYToVisible(chart, handlers);
  handlers.onView?.();
}

function rowPrices(row: unknown): { low: number; high: number; close: number } | null {
  if (typeof row === "number" && Number.isFinite(row)) {
    return { low: row, high: row, close: row };
  }
  if (row && typeof row === "object" && "value" in row) {
    const value = Number((row as { value: unknown }).value);
    if (Number.isFinite(value)) {
      return { low: value, high: value, close: value };
    }
  }
  if (!Array.isArray(row) || row.length < 2) {
    return null;
  }
  if (row.length >= 5) {
    const open = Number(row[1]);
    const close = Number(row[2]);
    const low = Number(row[3]);
    const high = Number(row[4]);
    if ([open, close, low, high].every((item) => Number.isFinite(item))) {
      return { low, high, close };
    }
  }
  const nums = row.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  if (nums.length === 0) {
    return null;
  }
  return { low: Math.min(...nums), high: Math.max(...nums), close: nums[nums.length - 1] ?? nums[0] };
}

function priceRows(chart: ECharts): { low: number; high: number; close: number }[] {
  const raw = chart.getOption().series;
  const list = Array.isArray(raw) ? raw : [];
  const ohlc = list.find((item) => String((item as { id?: string }).id ?? "").startsWith("ohlc"));
  const data = (ohlc as { data?: unknown[] } | undefined)?.data ?? [];
  return data.map((row) => rowPrices(row)).map((item) => item ?? { low: Number.NaN, high: Number.NaN, close: Number.NaN });
}

function panPlot(
  chart: ECharts,
  drag: Extract<DragState, { kind: "plot" }>,
  x: number,
  y: number,
  shift: boolean,
  handlers: ScaleHandlers,
): void {
  const span = drag.end - drag.start;
  let xDelta = -((x - drag.x) / Math.max(drag.width, 1)) * span;
  let yDelta = ((y - drag.y) / Math.max(drag.height, 1)) * (drag.max - drag.min);
  if (shift) {
    if (Math.abs(x - drag.x) >= Math.abs(y - drag.y)) {
      yDelta = 0;
    } else {
      xDelta = 0;
    }
  }
  applyX(chart, drag.start + xDelta, drag.end + xDelta);
  const next = { min: drag.min + yDelta, max: drag.max + yDelta };
  applyY(chart, next.min, next.max);
  handlers.onYLock?.(next);
  handlers.onView?.();
}

export function beginPlotPan(
  chart: ECharts | null,
  clientX: number,
  clientY: number,
  handlers: ScaleHandlers = {},
): { move: (clientX: number, clientY: number, shift?: boolean) => void; end: () => void } | null {
  if (!chart) {
    return null;
  }
  const rect = gridRect(chart);
  const extent = readYExtent(chart);
  const zoom = readZoom(chart);
  const dom = chart.getDom() as HTMLElement | undefined;
  if (!rect || !extent || !dom) {
    return null;
  }
  const origin = dom.getBoundingClientRect();
  const drag: Extract<DragState, { kind: "plot" }> = {
    kind: "plot",
    x: clientX - origin.left,
    y: clientY - origin.top,
    start: zoom.start,
    end: zoom.end,
    min: extent.min,
    max: extent.max,
    height: Math.max(rect.height, 1),
    width: Math.max(rect.width, 1),
  };
  return {
    move(nextX, nextY, shift = false) {
      const box = dom.getBoundingClientRect();
      panPlot(chart, drag, nextX - box.left, nextY - box.top, shift, handlers);
    },
    end() {
      /* session closed */
    },
  };
}

export function centerChartView(chart: ECharts, values: OhlcBar[] = []): { min: number; max: number } | null {
  const rows = values.length > 0 ? values.map((bar) => ({ low: bar[2], high: bar[3], close: bar[1] })) : priceRows(chart);
  const count = Math.max(rows.length, 1);
  const zoom = readZoom(chart);
  let span = zoom.end - zoom.start;
  if (span >= 88) {
    const visible = Math.min(count, Math.max(64, Math.round(count * 0.32)));
    span = (visible / count) * 100;
  }
  span = clamp(span, 6, 100);
  applyX(chart, 100 - span, 100);

  const from = Math.max(0, Math.floor(((100 - span) / 100) * rows.length));
  const window = rows.slice(from).filter((item) => Number.isFinite(item.low) && Number.isFinite(item.high));
  const last = [...rows].reverse().find((item) => Number.isFinite(item.close) && Number.isFinite(item.low));
  if (!last || window.length === 0) {
    (chart as ChartWithLock).__avizorYLock = null;
    patchPriceAxis(chart, null, null);
    return null;
  }
  const low = Math.min(last.close, last.low, ...window.map((item) => item.low));
  const high = Math.max(last.close, last.high, ...window.map((item) => item.high));
  const pad = Math.max((high - low) * 0.16, Math.abs(last.close) * 0.012, 1e-6);
  const next = { min: low - pad, max: high + pad };
  applyY(chart, next.min, next.max);
  return next;
}

export function padChartRightView(chart: ECharts, realCount: number, pad: number): void {
  const total = Math.max(realCount + Math.max(pad, 0), 1);
  const keep = Math.min(total, Math.max(48, Math.round(realCount * 0.36) + Math.max(pad, 0)));
  applyX(chart, Math.max(0, 100 - (keep / total) * 100), 100);
}

function zone(rect: Rect, width: number, height: number, x: number, y: number): "plot" | "yaxis" | "xaxis" | "none" {
  if (x >= rect.x + rect.width - 2 && x <= width && y >= rect.y && y <= rect.y + rect.height + 8) {
    return "yaxis";
  }
  if (y >= rect.y + rect.height - 2 && y <= height && x >= rect.x && x <= rect.x + rect.width + 8) {
    return "xaxis";
  }
  if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
    return "plot";
  }
  return "none";
}

export function bindChartScale(chart: ECharts, handlers: ScaleHandlers = {}): () => void {
  const zr = chart.getZr();
  const dom = chart.getDom() as HTMLElement;
  let drag: DragState | null = null;
  let frame = 0;

  function lockY(min: number, max: number): void {
    applyY(chart, min, max);
    handlers.onYLock?.({ min, max });
  }

  function setCursor(value: string): void {
    dom.style.cursor = value;
  }

  function onDown(event: ZrEvent): void {
    const rect = gridRect(chart);
    if (!rect) {
      return;
    }
    const hit = zone(rect, dom.clientWidth, dom.clientHeight, event.offsetX, event.offsetY);
    if (hit === "yaxis") {
      const extent = readYExtent(chart);
      const anchor = priceAt(chart, event.offsetY);
      if (extent && anchor !== null) {
        drag = { kind: "yscale", y: event.offsetY, min: extent.min, max: extent.max, anchor };
        setCursor("ns-resize");
        event.event?.preventDefault?.();
      }
      return;
    }
    if (hit === "xaxis") {
      const zoom = readZoom(chart);
      drag = {
        kind: "xscale",
        x: event.offsetX,
        start: zoom.start,
        end: zoom.end,
        anchor: (zoom.start + zoom.end) / 2,
      };
      setCursor("ew-resize");
      event.event?.preventDefault?.();
      return;
    }
    if (hit === "plot") {
      const extent = readYExtent(chart);
      const zoom = readZoom(chart);
      if (!extent) {
        return;
      }
      drag = {
        kind: "plot",
        x: event.offsetX,
        y: event.offsetY,
        start: zoom.start,
        end: zoom.end,
        min: extent.min,
        max: extent.max,
        height: Math.max(rect.height, 1),
        width: Math.max(rect.width, 1),
      };
      setCursor("grabbing");
      event.event?.preventDefault?.();
    }
  }

  function onMove(event: ZrEvent): void {
    const rect = gridRect(chart);
    if (!rect) {
      return;
    }
    if (!drag) {
      const hit = zone(rect, dom.clientWidth, dom.clientHeight, event.offsetX, event.offsetY);
      setCursor(hit === "yaxis" ? "ns-resize" : hit === "xaxis" ? "ew-resize" : hit === "plot" ? "grab" : "default");
      return;
    }

    const current = drag;
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      if (current.kind === "plot") {
        panPlot(chart, current, event.offsetX, event.offsetY, Boolean(event.event?.shiftKey), handlers);
        return;
      }
      if (current.kind === "xscale") {
        const factor = Math.exp((current.x - event.offsetX) * 0.006);
        const span = clamp((current.end - current.start) * factor, 2.4, 100);
        if (current.end >= 99.15) {
          applyX(chart, 100 - span, 100);
        } else {
          applyX(chart, current.anchor - span / 2, current.anchor + span / 2);
        }
        fitYToVisible(chart, handlers);
        handlers.onView?.();
        return;
      }
      const factor = Math.exp((event.offsetY - current.y) * 0.006);
      const range = clamp((current.max - current.min) * factor, 1e-8, Number.MAX_SAFE_INTEGER);
      const t = (current.anchor - current.min) / Math.max(current.max - current.min, 1e-8);
      const min = current.anchor - range * t;
      lockY(min, min + range);
      handlers.onView?.();
    });
  }

  function onUp(): void {
    drag = null;
    setCursor("grab");
  }

  function onDbl(event: ZrEvent): void {
    const rect = gridRect(chart);
    if (!rect) {
      return;
    }
    const hit = zone(rect, dom.clientWidth, dom.clientHeight, event.offsetX, event.offsetY);
    if (hit === "yaxis") {
      (chart as ChartWithLock).__avizorYLock = null;
      handlers.onYLock?.(null);
      patchPriceAxis(chart, null, null);
      handlers.onView?.();
    }
    if (hit === "xaxis") {
      applyX(chart, 0, 100);
      handlers.onView?.();
    }
    if (hit === "plot") {
      handlers.onYLock?.(centerChartView(chart, []));
      handlers.onView?.();
    }
  }

  function onWheel(event: ZrEvent): void {
    const rect = gridRect(chart);
    if (!rect) {
      return;
    }
    const hit = zone(rect, dom.clientWidth, dom.clientHeight, event.offsetX, event.offsetY);
    const native = event.event;
    const delta = native?.deltaY ?? event.wheelDelta ?? 0;
    if (hit === "none" || delta === 0) {
      return;
    }
    native?.preventDefault?.();
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => {
      if (hit === "yaxis" || (hit === "plot" && native?.shiftKey)) {
        const extent = readYExtent(chart);
        const anchor = hit === "yaxis" ? priceAt(chart, event.offsetY) : (extent ? (extent.min + extent.max) / 2 : null);
        if (!extent || anchor === null) {
          return;
        }
        const range = (extent.max - extent.min) * Math.exp(-delta * 0.0014);
        const t = (anchor - extent.min) / Math.max(extent.max - extent.min, 1e-8);
        const min = anchor - range * t;
        lockY(min, min + range);
        handlers.onView?.();
        return;
      }
      if (hit === "plot" || hit === "xaxis") {
        zoomTimeWindow(chart, delta, event.offsetX, rect, handlers);
      }
    });
  }

  zr.on("mousedown", onDown);
  zr.on("mousemove", onMove);
  zr.on("mouseup", onUp);
  zr.on("globalout", onUp);
  zr.on("dblclick", onDbl);
  zr.on("mousewheel", onWheel);

  return () => {
    window.cancelAnimationFrame(frame);
    zr.off("mousedown", onDown);
    zr.off("mousemove", onMove);
    zr.off("mouseup", onUp);
    zr.off("globalout", onUp);
    zr.off("dblclick", onDbl);
    zr.off("mousewheel", onWheel);
  };
}
