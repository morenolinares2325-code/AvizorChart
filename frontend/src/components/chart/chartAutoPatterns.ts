import { atrSeries, type OhlcBar } from "@/lib/chartMath";

export const AUTO_PATTERN_GROUPS = [
  {
    id: "harmonic",
    label: "Patrones Armónicos",
    items: [
      { id: "gartley", label: "Gartley" },
      { id: "butterfly", label: "Butterfly" },
      { id: "bat", label: "Bat" },
      { id: "crab", label: "Crab" },
    ],
  },
  {
    id: "candles",
    label: "Figuras de Velas Japonesas",
    items: [
      { id: "doji", label: "Doji" },
      { id: "engulfing", label: "Engulfing" },
      { id: "hammer", label: "Hammer" },
      { id: "morning_star", label: "Morning Star" },
    ],
  },
  {
    id: "abcd",
    label: "Patrones ABCD",
    items: [{ id: "abcd", label: "Secuencias ABCD (expansión / retroceso)" }],
  },
  {
    id: "elliott",
    label: "Ondas de Elliott",
    items: [
      { id: "elliott_impulse", label: "Impulsos (1-5)" },
      { id: "elliott_abc", label: "Correcciones (ABC)" },
    ],
  },
  {
    id: "geo",
    label: "Patrones Geométricos",
    items: [
      { id: "channel_auto", label: "Canal paralelo automático" },
      { id: "triangle_sym", label: "Triángulo simétrico" },
      { id: "triangle_asc", label: "Triángulo ascendente" },
      { id: "triangle_desc", label: "Triángulo descendente" },
      { id: "wedge_rising", label: "Cuña alcista (Rising Wedge)" },
      { id: "wedge_falling", label: "Cuña bajista (Falling Wedge)" },
      { id: "rectangle", label: "Rectángulo de consolidación" },
      { id: "double_triple", label: "Doble / Triple techo-suelo" },
    ],
  },
] as const;

export type AutoPatternId = (typeof AUTO_PATTERN_GROUPS)[number]["items"][number]["id"];

export interface PatternMark {
  index: number;
  price: number;
  label: string;
}

export interface PatternArea {
  start: number;
  end: number;
  y0: number;
  y1: number;
}

export interface PatternNode {
  i: number;
  price: number;
}

export interface PatternOverlay {
  id: string;
  pattern: AutoPatternId;
  label: string;
  color: string;
  line: (number | null)[];
  extraLines?: (number | null)[][];
  areas?: PatternArea[];
  marks?: PatternMark[];
  nodes?: PatternNode[];
}

const PER_PATTERN_CAP = 20;

function pushCapped(hits: PatternOverlay[], hit: PatternOverlay): void {
  if (hits.some((item) => item.id === hit.id)) {
    return;
  }
  const count = hits.reduce((sum, item) => (item.pattern === hit.pattern ? sum + 1 : sum), 0);
  if (count < PER_PATTERN_CAP) {
    hits.push(hit);
  }
}

export interface Pivot {
  i: number;
  price: number;
  kind: "h" | "l";
}

const COLOR = {
  harmonic: "#FFD700",
  candles: "#00E5FF",
  abcd: "#A78BFA",
  elliott: "#F472B6",
  geo: "#00FF66",
  bear: "#FF3366",
} as const;

const FIB = {
  gartleyAB: 0.618,
  gartleyAD: 0.786,
  gartleyCD: 1.272,
  butterflyAB: 0.786,
  butterflyAD: 1.272,
  batAB: 0.382,
  batAD: 0.886,
  crabAD: 1.618,
  abcdBC: 0.618,
  abcdCD: 1.272,
  ext: 1.618,
} as const;

function empty(n: number): (number | null)[] {
  return Array.from({ length: n }, () => null);
}

function fibNear(value: number, target: number, rel = 0.1): boolean {
  if (target === 0) {
    return false;
  }
  return Math.abs(value - target) / Math.abs(target) <= rel;
}

function fibIn(value: number, lo: number, hi: number): boolean {
  return value >= lo * 0.9 && value <= hi * 1.1;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function trueRanges(values: OhlcBar[]): number[] {
  return values.map((bar, i) => {
    if (i === 0) {
      return bar[3] - bar[2];
    }
    const prev = values[i - 1][1];
    return Math.max(bar[3] - bar[2], Math.abs(bar[3] - prev), Math.abs(bar[2] - prev));
  });
}

function interpolate(n: number, points: { i: number; price: number }[]): (number | null)[] {
  const line = empty(n);
  const ordered = [...points].sort((a, b) => a.i - b.i);
  if (ordered.length === 0) {
    return line;
  }
  if (ordered.length === 1) {
    line[ordered[0].i] = ordered[0].price;
    return line;
  }
  for (let s = 0; s < ordered.length - 1; s += 1) {
    const a = ordered[s];
    const b = ordered[s + 1];
    const span = Math.max(b.i - a.i, 1);
    for (let i = a.i; i <= b.i; i += 1) {
      const t = (i - a.i) / span;
      line[i] = a.price + (b.price - a.price) * t;
    }
  }
  return line;
}

function rayFrom(n: number, a: Pivot, b: Pivot, from = a.i, to = n - 1): (number | null)[] {
  const line = empty(n);
  const dx = b.i - a.i || 1;
  const slope = (b.price - a.price) / dx;
  const start = Math.max(0, Math.min(from, to));
  const end = Math.min(n - 1, Math.max(from, to));
  for (let i = start; i <= end; i += 1) {
    line[i] = a.price + slope * (i - a.i);
  }
  return line;
}

function slopeOf(a: Pivot, b: Pivot): number {
  return (b.price - a.price) / Math.max(b.i - a.i, 1);
}

function linreg(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i += 1) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function ofKind(pivots: Pivot[], kind: "h" | "l"): Pivot[] {
  return pivots.filter((item) => item.kind === kind);
}

function lastTwo(items: Pivot[]): [Pivot, Pivot] | null {
  if (items.length < 2) {
    return null;
  }
  return [items[items.length - 2], items[items.length - 1]];
}

function finitePrice(value: number): boolean {
  return Number.isFinite(value) && Math.abs(value) < 1e15;
}

export function patternFill(color: string, alpha = 0.16): string {
  const raw = color.replace("#", "").trim();
  const hex = raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
  if (hex.length < 6) {
    return `rgba(0,229,255,${alpha})`;
  }
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (![r, g, b].every(Number.isFinite)) {
    return `rgba(0,229,255,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

function padLine(line: (number | null)[] | undefined, n: number): (number | null)[] {
  const next = empty(n);
  if (!line) {
    return next;
  }
  const limit = Math.min(n, line.length);
  for (let i = 0; i < limit; i += 1) {
    const value = line[i];
    next[i] = value != null && finitePrice(value) ? value : null;
  }
  return next;
}

export function sanitizePatternOverlays(hits: PatternOverlay[], n: number): PatternOverlay[] {
  if (n < 1) {
    return [];
  }
  const cleaned: PatternOverlay[] = [];
  let dropped = 0;
  for (const hit of hits) {
    const nodes = (hit.nodes ?? [])
      .map((node) => ({ i: clampIndex(node.i, n), price: node.price }))
      .filter((node) => finitePrice(node.price));
    const marks = (hit.marks ?? [])
      .map((mark) => ({
        index: clampIndex(mark.index, n),
        price: mark.price,
        label: mark.label,
      }))
      .filter((mark) => finitePrice(mark.price) && mark.label);
    const areas = (hit.areas ?? [])
      .map((area) => ({
        start: clampIndex(area.start, n),
        end: clampIndex(area.end, n),
        y0: area.y0,
        y1: area.y1,
      }))
      .filter((area) => finitePrice(area.y0) && finitePrice(area.y1) && area.end >= area.start);
    const line = padLine(hit.line, n);
    const extraLines = (hit.extraLines ?? []).map((extra) => padLine(extra, n)).filter((extra) => extra.some((value) => value !== null));
    const hasGeom =
      line.some((value) => value !== null) || extraLines.length > 0 || nodes.length >= 2 || marks.length > 0 || areas.length > 0;
    if (!hasGeom) {
      dropped += 1;
      continue;
    }
    cleaned.push({
      ...hit,
      line,
      extraLines: extraLines.length ? extraLines : undefined,
      marks: marks.length ? marks : undefined,
      areas: areas.length ? areas : undefined,
      nodes: nodes.length ? nodes : undefined,
    });
  }
  if (dropped > 0 && typeof console !== "undefined") {
    console.warn(`[Patrones Auto] ${dropped} overlays descartados por coordenadas inválidas.`);
  }
  return cleaned;
}

export interface PatternEchartsLayer {
  markPointData: Record<string, unknown>[];
  markLineData: unknown[];
  markAreaData: unknown[];
  lines: Array<{ id: string; data: (number | null)[]; color: string; dashed?: boolean }>;
}

function nodeSegments(nodes: PatternNode[]): Array<[PatternNode, PatternNode]> {
  const ordered = [...nodes].sort((a, b) => a.i - b.i);
  const pairs: Array<[PatternNode, PatternNode]> = [];
  for (let i = 0; i < ordered.length - 1; i += 1) {
    pairs.push([ordered[i], ordered[i + 1]]);
  }
  return pairs;
}

export function buildPatternEchartsLayer(hits: PatternOverlay[], n: number): PatternEchartsLayer {
  const overlays = sanitizePatternOverlays(hits, n);
  const markPointData: Record<string, unknown>[] = [];
  const markLineData: unknown[] = [];
  const markAreaData: unknown[] = [];
  const lines: PatternEchartsLayer["lines"] = [];

  for (const hit of overlays) {
    const labelStyle = {
      show: true,
      color: hit.color,
      fontSize: 10,
      fontWeight: 650,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      backgroundColor: "rgba(5,5,8,0.72)",
      padding: [2, 5] as [number, number],
      borderRadius: 3,
    };
    for (const mark of hit.marks ?? []) {
      markPointData.push({
        name: mark.label,
        coord: [mark.index, mark.price],
        value: mark.label,
        symbol: "circle",
        symbolSize: 8,
        itemStyle: { color: hit.color, borderColor: "#050508", borderWidth: 1 },
        label: { ...labelStyle, formatter: mark.label, position: "top" },
      });
    }
    const segments = (hit.nodes && hit.nodes.length >= 2 ? nodeSegments(hit.nodes) : []).map(([a, b]) => [
      {
        coord: [a.i, a.price],
        lineStyle: { color: hit.color, width: 1.7 },
      },
      { coord: [b.i, b.price] },
    ]);
    markLineData.push(...segments);
    for (const area of hit.areas ?? []) {
      markAreaData.push([
        {
          xAxis: area.start,
          yAxis: Math.min(area.y0, area.y1),
          itemStyle: { color: patternFill(hit.color, 0.16) },
          label: { ...labelStyle, formatter: hit.label, position: "insideTop" },
        },
        { xAxis: area.end, yAxis: Math.max(area.y0, area.y1) },
      ]);
    }
    if (hit.line.some((value) => value !== null)) {
      lines.push({ id: hit.id, data: hit.line, color: hit.color });
    }
    (hit.extraLines ?? []).forEach((extra, extraIndex) => {
      lines.push({ id: `${hit.id}-edge-${extraIndex}`, data: extra, color: hit.color, dashed: true });
    });
  }

  return { markPointData, markLineData, markAreaData, lines };
}

function retrace(from: number, to: number, ratio: number): number {
  return to - (to - from) * ratio;
}

function clampIndex(i: number, n: number): number {
  return Math.min(n - 1, Math.max(0, Math.round(i)));
}

/**
 * ZigZag de pivotes reales: confirma un peak/valley solo cuando el precio
 * revierte al menos `k` veces el ATR mediano (o 0.8% del precio).
 */
export function detectZigZag(values: OhlcBar[], k = 1.6): Pivot[] {
  const n = values.length;
  if (n < 8) {
    return [];
  }
  const tr = trueRanges(values);
  const last = values[n - 1][1];
  const thr = Math.max(median(tr.slice(-Math.min(n, 80))) * k, Math.abs(last) * 0.008);
  const pivots: Pivot[] = [];

  let dir: -1 | 0 | 1 = 0;
  let peakI = 0;
  let peak = values[0][3];
  let valleyI = 0;
  let valley = values[0][2];

  for (let i = 1; i < n; i += 1) {
    const high = values[i][3];
    const low = values[i][2];

    if (dir >= 0) {
      if (high >= peak) {
        peak = high;
        peakI = i;
      }
      if (peak - low >= thr && peakI !== valleyI) {
        if (dir === 1 || pivots.length === 0) {
          pivots.push({ i: peakI, price: peak, kind: "h" });
        } else if (pivots[pivots.length - 1].kind !== "h") {
          pivots.push({ i: peakI, price: peak, kind: "h" });
        } else if (peak > pivots[pivots.length - 1].price) {
          pivots[pivots.length - 1] = { i: peakI, price: peak, kind: "h" };
        }
        dir = -1;
        valley = low;
        valleyI = i;
        continue;
      }
    }

    if (dir <= 0) {
      if (low <= valley) {
        valley = low;
        valleyI = i;
      }
      if (high - valley >= thr && valleyI !== peakI) {
        if (dir === -1 || pivots.length === 0) {
          pivots.push({ i: valleyI, price: valley, kind: "l" });
        } else if (pivots[pivots.length - 1].kind !== "l") {
          pivots.push({ i: valleyI, price: valley, kind: "l" });
        } else if (valley < pivots[pivots.length - 1].price) {
          pivots[pivots.length - 1] = { i: valleyI, price: valley, kind: "l" };
        }
        dir = 1;
        peak = high;
        peakI = i;
      }
    }
  }

  const cleaned: Pivot[] = [];
  for (const pivot of pivots) {
    const prev = cleaned[cleaned.length - 1];
    if (!prev) {
      cleaned.push(pivot);
      continue;
    }
    if (prev.kind === pivot.kind) {
      const keep =
        pivot.kind === "h" ? pivot.price >= prev.price : pivot.price <= prev.price;
      if (keep) {
        cleaned[cleaned.length - 1] = pivot;
      }
      continue;
    }
    if (pivot.i === prev.i) {
      continue;
    }
    cleaned.push(pivot);
  }
  return cleaned;
}

function overlay(
  pattern: AutoPatternId,
  label: string,
  color: string,
  n: number,
  points: { i: number; price: number }[],
  extra: (number | null)[][] = [],
  marks: PatternMark[] = [],
  areas: PatternArea[] = [],
): PatternOverlay {
  const nodes = points
    .map((point) => ({ i: clampIndex(point.i, n), price: point.price }))
    .filter((point) => Number.isFinite(point.price));
  return {
    id: `${pattern}-${nodes.map((p) => p.i).join("-")}`,
    pattern,
    label,
    color,
    line: interpolate(n, nodes),
    extraLines: extra.length ? extra : undefined,
    marks: marks.length ? marks : undefined,
    areas: areas.length ? areas : undefined,
    nodes: nodes.length ? nodes : undefined,
  };
}

function channelOnWindow(n: number, values: OhlcBar[], zz: Pivot[], start: number, end: number): PatternOverlay | null {
  const look = end - start;
  if (look < 24) {
    return null;
  }
  const xs = Array.from({ length: look }, (_, i) => start + i);
  const ys = xs.map((i) => values[i][1]);
  const { slope, intercept } = linreg(xs, ys);
  const residuals = ys.map((y, i) => y - (intercept + slope * xs[i]));
  const mean = residuals.reduce((sum, v) => sum + v, 0) / residuals.length;
  const variance = residuals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / residuals.length;
  const std = Math.sqrt(variance);
  const mid = (i: number) => intercept + slope * i;
  let width = std * 1.6;
  const highs = lastTwo(ofKind(zz, "h").filter((p) => p.i >= start && p.i <= end));
  if (highs) {
    width = Math.max(width, Math.abs(highs[1].price - mid(highs[1].i)));
  }
  const lows = lastTwo(ofKind(zz, "l").filter((p) => p.i >= start && p.i <= end));
  if (lows) {
    width = Math.max(width, Math.abs(mid(lows[1].i) - lows[1].price));
  }
  if (width <= 0 || !Number.isFinite(width)) {
    return null;
  }
  const upper = empty(n);
  const lower = empty(n);
  for (let i = start; i <= end; i += 1) {
    const m = mid(i);
    upper[i] = m + width;
    lower[i] = m - width;
  }
  return {
    id: `channel_auto-${start}-${end}`,
    pattern: "channel_auto",
    label: "Canal paralelo",
    color: COLOR.geo,
    line: upper,
    extraLines: [lower],
    areas: [{ start, end, y0: mid(start) - width, y1: mid(start) + width }],
    nodes: [
      { i: start, price: mid(start) + width },
      { i: end, price: mid(end) + width },
    ],
    marks: [{ index: end, price: mid(end) + width, label: "Canal" }],
  };
}

function channelOverlays(n: number, values: OhlcBar[], zz: Pivot[]): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  const windowSize = Math.min(80, Math.max(36, Math.floor(n / 4)));
  const step = Math.max(20, Math.floor(windowSize / 2));
  for (let start = 0; start + windowSize <= n; start += step) {
    const found = channelOnWindow(n, values, zz, start, Math.min(n - 1, start + windowSize));
    if (found) {
      pushCapped(hits, found);
    }
  }
  const tail = channelOnWindow(n, values, zz, Math.max(0, n - windowSize), n - 1);
  if (tail) {
    pushCapped(hits, tail);
  }
  return hits;
}

function converging(hs: number, ls: number, scale: number): boolean {
  return hs < ls && Math.abs(hs - ls) > scale * 0.00015;
}

function classifyGeo(
  n: number,
  enabled: Set<AutoPatternId>,
  lastPrice: number,
  h1: Pivot,
  h2: Pivot,
  l1: Pivot,
  l2: Pivot,
): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  const hs = slopeOf(h1, h2);
  const ls = slopeOf(l1, l2);
  const scale = Math.abs(lastPrice) || 1;
  const flatH = Math.abs(h2.price - h1.price) / scale < 0.012;
  const flatL = Math.abs(l2.price - l1.price) / scale < 0.012;
  const from = Math.min(h1.i, l1.i);
  const to = Math.max(h2.i, l2.i);
  const upper = rayFrom(n, h1, h2, from, to);
  const lower = rayFrom(n, l1, l2, from, to);
  const area = {
    start: from,
    end: to,
    y0: Math.min(h1.price, h2.price, l1.price, l2.price),
    y1: Math.max(h1.price, h2.price, l1.price, l2.price),
  };

  if (enabled.has("triangle_sym") && hs < 0 && ls > 0 && converging(hs, ls, scale)) {
    hits.push({
      id: `triangle_sym-${h1.i}-${l2.i}`,
      pattern: "triangle_sym",
      label: "Triángulo simétrico",
      color: COLOR.geo,
      line: upper,
      extraLines: [lower],
      areas: [area],
      marks: [
        { index: h1.i, price: h1.price, label: "R1" },
        { index: h2.i, price: h2.price, label: "R2" },
        { index: l1.i, price: l1.price, label: "S1" },
        { index: l2.i, price: l2.price, label: "S2" },
      ],
      nodes: [h1, l1, h2, l2],
    });
  }
  if (enabled.has("triangle_asc") && flatH && ls > 0) {
    const flat = rayFrom(n, h1, { ...h2, price: (h1.price + h2.price) / 2 }, from, to);
    hits.push({
      id: `triangle_asc-${h1.i}-${l2.i}`,
      pattern: "triangle_asc",
      label: "Triángulo ascendente",
      color: COLOR.geo,
      line: flat,
      extraLines: [lower],
      areas: [area],
      marks: [
        { index: h2.i, price: h2.price, label: "R" },
        { index: l1.i, price: l1.price, label: "S1" },
        { index: l2.i, price: l2.price, label: "S2" },
      ],
      nodes: [l1, h1, l2, h2],
    });
  }
  if (enabled.has("triangle_desc") && flatL && hs < 0) {
    const flat = rayFrom(n, l1, { ...l2, price: (l1.price + l2.price) / 2 }, from, to);
    hits.push({
      id: `triangle_desc-${h1.i}-${l2.i}`,
      pattern: "triangle_desc",
      label: "Triángulo descendente",
      color: COLOR.geo,
      line: upper,
      extraLines: [flat],
      areas: [area],
      marks: [
        { index: l2.i, price: l2.price, label: "S" },
        { index: h1.i, price: h1.price, label: "R1" },
        { index: h2.i, price: h2.price, label: "R2" },
      ],
      nodes: [h1, l1, h2, l2],
    });
  }
  if (enabled.has("wedge_rising") && hs > 0 && ls > 0 && ls > hs) {
    hits.push({
      id: `wedge_rising-${h1.i}-${l2.i}`,
      pattern: "wedge_rising",
      label: "Rising Wedge",
      color: COLOR.bear,
      line: upper,
      extraLines: [lower],
      areas: [area],
      marks: [{ index: to, price: h2.price, label: "Rising Wedge" }],
      nodes: [l1, h1, l2, h2],
    });
  }
  if (enabled.has("wedge_falling") && hs < 0 && ls < 0 && hs < ls) {
    hits.push({
      id: `wedge_falling-${h1.i}-${l2.i}`,
      pattern: "wedge_falling",
      label: "Falling Wedge",
      color: COLOR.geo,
      line: upper,
      extraLines: [lower],
      areas: [area],
      marks: [{ index: to, price: l2.price, label: "Falling Wedge" }],
      nodes: [h1, l1, h2, l2],
    });
  }
  if (enabled.has("rectangle") && flatH && flatL) {
    const highPx = (h1.price + h2.price) / 2;
    const lowPx = (l1.price + l2.price) / 2;
    hits.push({
      id: `rectangle-${from}-${to}`,
      pattern: "rectangle",
      label: "Rectángulo",
      color: COLOR.geo,
      line: empty(n).map((_, i) => (i >= from && i <= to ? highPx : null)),
      extraLines: [empty(n).map((_, i) => (i >= from && i <= to ? lowPx : null))],
      areas: [{ start: from, end: to, y0: lowPx, y1: highPx }],
      marks: [{ index: to, price: highPx, label: "Rectángulo" }],
      nodes: [
        { i: from, price: highPx },
        { i: to, price: highPx },
      ],
    });
  }
  return hits;
}

function geoOverlays(n: number, zz: Pivot[], enabled: Set<AutoPatternId>, lastPrice: number): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  const highs = ofKind(zz, "h");
  const lows = ofKind(zz, "l");
  const scale = Math.abs(lastPrice) || 1;

  for (let hi = 1; hi < highs.length; hi += 1) {
    const h1 = highs[hi - 1];
    const h2 = highs[hi];
    const windowLows = lows.filter((item) => item.i >= h1.i - 8 && item.i <= h2.i + 48);
    for (let li = 1; li < windowLows.length; li += 1) {
      const found = classifyGeo(n, enabled, lastPrice, h1, h2, windowLows[li - 1], windowLows[li]);
      for (const hit of found) {
        pushCapped(hits, hit);
      }
    }
  }

  if (enabled.has("double_triple")) {
    const scan = (items: Pivot[], kind: "h" | "l") => {
      for (let i = 1; i < items.length; i += 1) {
        const cluster = items.filter(
          (item) => Math.abs(item.price - items[i].price) / scale <= 0.012 && Math.abs(item.i - items[i].i) < 80,
        );
        if (cluster.length < 2) {
          continue;
        }
        const label =
          cluster.length >= 3 ? (kind === "h" ? "Triple techo" : "Triple suelo") : kind === "h" ? "Doble techo" : "Doble suelo";
        const px = cluster.reduce((sum, p) => sum + p.price, 0) / cluster.length;
        const from = Math.min(...cluster.map((p) => p.i));
        const to = Math.max(...cluster.map((p) => p.i));
        pushCapped(hits, {
          id: `double_triple-${kind}-${cluster.map((p) => p.i).join("-")}`,
          pattern: "double_triple",
          label,
          color: kind === "h" ? COLOR.bear : COLOR.geo,
          line: empty(n).map((_, idx) => (idx >= from && idx <= to ? px : null)),
          areas: [
            {
              start: from,
              end: to,
              y0: px * (kind === "h" ? 0.995 : 1),
              y1: px * (kind === "h" ? 1 : 1.005),
            },
          ],
          marks: cluster.map((p) => ({ index: p.i, price: p.price, label })),
          nodes: cluster,
        });
      }
    };
    scan(highs, "h");
    scan(lows, "l");
  }
  return hits;
}

type HarmonicId = "gartley" | "butterfly" | "bat" | "crab";

function harmonicSpec(id: HarmonicId): { ab: number; ad: number; cd: number } {
  if (id === "gartley") {
    return { ab: FIB.gartleyAB, ad: FIB.gartleyAD, cd: FIB.gartleyCD };
  }
  if (id === "butterfly") {
    return { ab: FIB.butterflyAB, ad: FIB.butterflyAD, cd: FIB.ext };
  }
  if (id === "bat") {
    return { ab: FIB.batAB, ad: FIB.batAD, cd: FIB.ext };
  }
  return { ab: 0.618, ad: FIB.crabAD, cd: FIB.ext };
}

function harmonicHits(n: number, zz: Pivot[], enabled: HarmonicId[]): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  if (enabled.length === 0 || zz.length < 3) {
    return hits;
  }
  const windows: Pivot[][] = [];
  for (let i = 0; i <= zz.length - 3; i += 1) {
    const slice = zz.slice(i, Math.min(i + 5, zz.length));
    if (slice.length >= 3) {
      windows.push(slice);
    }
  }

  for (const pts of windows) {
    for (const id of enabled) {
      const spec = harmonicSpec(id);
      const x = pts[0];
      const a = pts[1];
      const b = pts[2];
      const c = pts[3];
      const xa = a.price - x.price;
      if (Math.abs(xa) < 1e-9 || a.kind === x.kind) {
        continue;
      }
      const abRatio = Math.abs(b.price - a.price) / Math.abs(xa);
      if (!fibNear(abRatio, spec.ab, 0.12) && !(id === "bat" && fibIn(abRatio, 0.382, 0.5))) {
        continue;
      }
      const bPrice = retrace(x.price, a.price, spec.ab);
      const useB = fibNear(abRatio, spec.ab, 0.12) ? b : { ...b, price: bPrice };
      let cPoint = c;
      if (!cPoint) {
        const bc = retrace(a.price, useB.price, 0.618);
        cPoint = { i: clampIndex(useB.i + (useB.i - a.i), n), price: bc, kind: a.kind };
      } else {
        const bcRatio = Math.abs(cPoint.price - useB.price) / Math.max(Math.abs(useB.price - a.price), 1e-9);
        if (!fibIn(bcRatio, 0.382, 0.886)) {
          continue;
        }
      }
      const dPrice = retrace(x.price, a.price, spec.ad);
      const dIndex = clampIndex((cPoint.i ?? useB.i) + Math.max(useB.i - a.i, 3), n);
      const d: Pivot = pts[4] ? pts[4] : { i: dIndex, price: dPrice, kind: x.kind };
      if (pts[4]) {
        const adRatio = Math.abs(d.price - a.price) / Math.abs(xa);
        if (!fibNear(adRatio, spec.ad, 0.14) && !(id === "butterfly" && fibNear(adRatio, 1.618, 0.12))) {
          continue;
        }
      }
      const nodes = [x, a, useB, cPoint, { ...d, price: pts[4] ? d.price : dPrice }];
      const labels = ["X", "A", "B", "C", "D"];
      pushCapped(
        hits,
        overlay(
          id,
          id.toUpperCase(),
          COLOR.harmonic,
          n,
          nodes,
          [],
          nodes.map((node, index) => ({ index: node.i, price: node.price, label: labels[index] ?? "" })),
          [
            {
              start: x.i,
              end: nodes[4].i,
              y0: Math.min(...nodes.map((p) => p.price)),
              y1: Math.max(...nodes.map((p) => p.price)),
            },
          ],
        ),
      );
    }
  }
  return hits;
}

function abcdHits(n: number, zz: Pivot[]): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  if (zz.length < 3) {
    return hits;
  }
  const last = Math.max(0, zz.length - 3);
  for (let start = 0; start <= last; start += 1) {
    const pts = zz.slice(start, start + 4);
    const a = pts[0];
    const b = pts[1];
    const c = pts[2];
    if (!a || !b || !c) {
      continue;
    }
    const ab = b.price - a.price;
    if (Math.abs(ab) < 1e-9 || b.kind === a.kind) {
      continue;
    }
    const bcRatio = Math.abs(c.price - b.price) / Math.abs(ab);
    if (!fibNear(bcRatio, FIB.abcdBC, 0.18) && !fibIn(bcRatio, 0.382, 0.886)) {
      continue;
    }
    const dPrice = c.price + ab;
    const dIndex = clampIndex(c.i + (b.i - a.i), n);
    const d = pts[3] ? pts[3] : { i: dIndex, price: dPrice, kind: b.kind };
    if (pts[3]) {
      const cdRatio = Math.abs(d.price - c.price) / Math.abs(ab);
      if (!fibNear(cdRatio, 1, 0.16) && !fibNear(cdRatio, FIB.abcdCD, 0.16)) {
        continue;
      }
    }
    const nodes = [a, b, c, { ...d, price: pts[3] ? d.price : dPrice }];
    pushCapped(
      hits,
      overlay(
        "abcd",
        "ABCD",
        COLOR.abcd,
        n,
        nodes,
        [],
        nodes.map((node, index) => ({ index: node.i, price: node.price, label: ["A", "B", "C", "D"][index] ?? "" })),
        [
          {
            start: a.i,
            end: nodes[3].i,
            y0: Math.min(...nodes.map((p) => p.price)),
            y1: Math.max(...nodes.map((p) => p.price)),
          },
        ],
      ),
    );
  }
  return hits;
}

function elliottImpulseHits(n: number, zz: Pivot[]): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  if (zz.length < 6) {
    return hits;
  }
  for (let i = 0; i <= zz.length - 6; i += 1) {
    const seq = zz.slice(i, i + 6);
    const origin = seq[0];
    const waves = seq.slice(1);
    if (waves.some((w, idx) => idx > 0 && w.kind === waves[idx - 1].kind)) {
      continue;
    }
    const up = waves[4].price > origin.price;
    const len = (from: Pivot, to: Pivot) => Math.abs(to.price - from.price);
    const w1 = len(origin, waves[0]);
    const w2 = len(waves[0], waves[1]);
    const w3 = len(waves[1], waves[2]);
    const w4 = len(waves[2], waves[3]);
    const w5 = len(waves[3], waves[4]);
    if (w2 >= w1 * 1.02) {
      continue;
    }
    if (w3 <= w1 && w3 <= w5) {
      continue;
    }
    if (up && (waves[1].price < origin.price || waves[3].price < waves[0].price)) {
      continue;
    }
    if (!up && (waves[1].price > origin.price || waves[3].price > waves[0].price)) {
      continue;
    }
    pushCapped(
      hits,
      overlay(
        "elliott_impulse",
        "Elliott 1-5",
        COLOR.elliott,
        n,
        waves,
        [],
        waves.map((wave, index) => ({ index: wave.i, price: wave.price, label: String(index + 1) })),
        [
          {
            start: waves[0].i,
            end: waves[4].i,
            y0: Math.min(...waves.map((p) => p.price)),
            y1: Math.max(...waves.map((p) => p.price)),
          },
        ],
      ),
    );
  }
  return hits;
}

function elliottAbcHits(n: number, zz: Pivot[]): PatternOverlay[] {
  const hits: PatternOverlay[] = [];
  if (zz.length < 4) {
    return hits;
  }
  for (let i = 0; i <= zz.length - 4; i += 1) {
    const seq = zz.slice(i, i + 4);
    const origin = seq[0];
    const a = seq[1];
    const b = seq[2];
    const c = seq[3];
    const ab = Math.abs(b.price - a.price);
    const xa = Math.abs(a.price - origin.price);
    const bc = Math.abs(c.price - b.price);
    if (xa < 1e-9 || ab / xa > 0.99) {
      continue;
    }
    if (!fibNear(bc / Math.max(xa, 1e-9), 1, 0.25) && !fibNear(bc / Math.max(xa, 1e-9), FIB.ext, 0.2)) {
      continue;
    }
    pushCapped(
      hits,
      overlay(
        "elliott_abc",
        "Elliott ABC",
        COLOR.elliott,
        n,
        [a, b, c],
        [],
        [
          { index: a.i, price: a.price, label: "A" },
          { index: b.i, price: b.price, label: "B" },
          { index: c.i, price: c.price, label: "C" },
        ],
        [
          {
            start: a.i,
            end: c.i,
            y0: Math.min(a.price, b.price, c.price),
            y1: Math.max(a.price, b.price, c.price),
          },
        ],
      ),
    );
  }
  return hits;
}

function body(bar: OhlcBar): number {
  return Math.abs(bar[1] - bar[0]);
}

function barRange(bar: OhlcBar): number {
  return Math.max(bar[3] - bar[2], 1e-9);
}

function candleHits(values: OhlcBar[], enabled: Set<AutoPatternId>): PatternOverlay[] {
  const n = values.length;
  const hits: PatternOverlay[] = [];

  for (let i = 1; i < n; i += 1) {
    const bar = values[i];
    const span = barRange(bar);
    const size = body(bar);
    const barArea = { start: Math.max(0, i - 1), end: i, y0: bar[2], y1: bar[3] };
    if (enabled.has("doji") && size / span < 0.1) {
      pushCapped(
        hits,
        overlay("doji", "Doji", COLOR.candles, n, [{ i, price: bar[1] }], [], [{ index: i, price: bar[3], label: "Doji" }], [barArea]),
      );
    }
    if (enabled.has("hammer") && size / span < 0.35) {
      const lower = Math.min(bar[0], bar[1]) - bar[2];
      const upper = bar[3] - Math.max(bar[0], bar[1]);
      if (lower > size * 2.1 && upper < size * 0.55) {
        pushCapped(
          hits,
          overlay("hammer", "Hammer", COLOR.candles, n, [{ i, price: bar[2] }], [], [{ index: i, price: bar[2], label: "Hammer" }], [barArea]),
        );
      }
    }
    if (enabled.has("engulfing") && i > 0) {
      const prev = values[i - 1];
      const bull = prev[1] < prev[0] && bar[1] > bar[0] && bar[0] <= prev[1] && bar[1] >= prev[0];
      const bear = prev[1] > prev[0] && bar[1] < bar[0] && bar[0] >= prev[1] && bar[1] <= prev[0];
      if (bull || bear) {
        pushCapped(
          hits,
          overlay(
            "engulfing",
            bull ? "Engulfing +" : "Engulfing −",
            bull ? COLOR.geo : COLOR.bear,
            n,
            [{ i, price: bar[1] }],
            [],
            [{ index: i, price: bar[3], label: bull ? "Eng+" : "Eng-" }],
            [{ start: i - 1, end: i, y0: Math.min(prev[2], bar[2]), y1: Math.max(prev[3], bar[3]) }],
          ),
        );
      }
    }
    if (enabled.has("morning_star") && i > 1) {
      const a = values[i - 2];
      const mid = values[i - 1];
      const c = bar;
      if (a[1] < a[0] && body(mid) / barRange(mid) < 0.32 && c[1] > c[0] && c[1] > (a[0] + a[1]) / 2) {
        pushCapped(
          hits,
          overlay(
            "morning_star",
            "Morning Star",
            COLOR.candles,
            n,
            [
              { i: i - 2, price: a[1] },
              { i: i - 1, price: mid[1] },
              { i, price: c[1] },
            ],
            [],
            [{ index: i, price: c[3], label: "Morning Star" }],
            [{ start: i - 2, end: i, y0: Math.min(a[2], mid[2], c[2]), y1: Math.max(a[3], mid[3], c[3]) }],
          ),
        );
      }
    }
  }
  return hits;
}

export function detectAutoPatterns(values: OhlcBar[], enabled: Set<AutoPatternId>): PatternOverlay[] {
  if (values.length < 16 || enabled.size === 0) {
    return [];
  }
  const n = values.length;
  const zz = detectZigZag(values, 1.15);
  const hits: PatternOverlay[] = [];
  const last = values[n - 1][1];

  const harmonics = (["gartley", "butterfly", "bat", "crab"] as const).filter((id) => enabled.has(id));
  hits.push(...harmonicHits(n, zz, [...harmonics]));

  if (enabled.has("abcd")) {
    hits.push(...abcdHits(n, zz));
  }
  if (enabled.has("elliott_impulse")) {
    hits.push(...elliottImpulseHits(n, zz));
  }
  if (enabled.has("elliott_abc")) {
    hits.push(...elliottAbcHits(n, zz));
  }
  if (enabled.has("channel_auto")) {
    hits.push(...channelOverlays(n, values, zz));
  }
  hits.push(...geoOverlays(n, zz, enabled, last));
  hits.push(...candleHits(values, enabled));
  return sanitizePatternOverlays(
    hits.filter((hit) => enabled.has(hit.pattern)),
    n,
  );
}

export interface AgentBrief {
  ticker: string;
  trend: string;
  trendTone: "up" | "down" | "flat";
  volatility: string;
  volTone: "low" | "mid" | "high";
  notes: string[];
}

export function buildAgentBrief(
  ticker: string,
  values: OhlcBar[],
  volumes: number[],
  patternLabels: string[],
): AgentBrief {
  const last = values[values.length - 1];
  const close = last?.[1] ?? 0;
  const look = values.slice(-20);
  const first = look[0]?.[1] ?? close;
  const change = first ? ((close - first) / first) * 100 : 0;
  const atr = atrSeries(values).filter((item): item is number => item !== null);
  const lastAtr = atr[atr.length - 1] ?? 0;
  const volPct = close ? (lastAtr / close) * 100 : 0;
  const avgVol = volumes.slice(-20).reduce((sum, item) => sum + item, 0) / Math.max(look.length, 1);
  const lastVol = volumes[volumes.length - 1] ?? 0;
  const trendTone: AgentBrief["trendTone"] = change > 0.8 ? "up" : change < -0.8 ? "down" : "flat";
  const volTone: AgentBrief["volTone"] = volPct > 3.2 ? "high" : volPct < 1.2 ? "low" : "mid";
  const notes = [
    `Último cierre ${close.toFixed(2)} · variación 20 velas ${change >= 0 ? "+" : ""}${change.toFixed(2)}%.`,
    `ATR relativo ${volPct.toFixed(2)}% · volumen ${lastVol >= avgVol ? "por encima" : "por debajo"} de la media corta.`,
  ];
  if (patternLabels.length > 0) {
    notes.push(`Patrones confirmados: ${patternLabels.slice(0, 4).join(" · ")}.`);
  } else {
    notes.push("Sin patrón confirmado sobre pivotes ZigZag. El overlay solo aparece si hay estructura válida.");
  }
  if (trendTone === "up") {
    notes.push("Sesgo algorítmico: impulso alcista. Vigilar extensión vs. resistencia más próxima.");
  } else if (trendTone === "down") {
    notes.push("Sesgo algorítmico: presión vendedora. Confirmar con volumen antes de girar.");
  } else {
    notes.push("Sesgo algorítmico: rango. Priorizar extremos del canal y rupturas con volumen.");
  }
  return {
    ticker,
    trend: trendTone === "up" ? "Alcista" : trendTone === "down" ? "Bajista" : "Lateral",
    trendTone,
    volatility: volTone === "high" ? "Alta" : volTone === "low" ? "Comprimida" : "Media",
    volTone,
    notes,
  };
}
