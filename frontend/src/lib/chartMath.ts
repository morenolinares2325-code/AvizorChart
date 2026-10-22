export type OhlcBar = [number, number, number, number];

export function closes(values: OhlcBar[]): number[] {
  return values.map((bar) => bar[1]);
}

export function emaSeries(source: number[], period: number): (number | null)[] {
  const out: (number | null)[] = source.map(() => null);
  if (source.length < period) {
    return out;
  }
  const k = 2 / (period + 1);
  let acc = source.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  out[period - 1] = acc;
  for (let i = period; i < source.length; i += 1) {
    acc = source[i] * k + acc * (1 - k);
    out[i] = acc;
  }
  return out;
}

export function smaSeries(source: number[], period: number): (number | null)[] {
  const out: (number | null)[] = source.map(() => null);
  let acc = 0;
  for (let i = 0; i < source.length; i += 1) {
    acc += source[i];
    if (i >= period) {
      acc -= source[i - period];
    }
    if (i >= period - 1) {
      out[i] = acc / period;
    }
  }
  return out;
}

export function rsiSeries(source: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = source.map(() => null);
  if (source.length <= period) {
    return out;
  }
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i += 1) {
    const diff = source[i] - source[i - 1];
    if (diff >= 0) {
      gain += diff;
    } else {
      loss -= diff;
    }
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < source.length; i += 1) {
    const diff = source[i] - source[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

export function macdSeries(
  source: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
} {
  const fast = emaSeries(source, fastPeriod);
  const slow = emaSeries(source, slowPeriod);
  const macd = source.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? (fast[i] as number) - (slow[i] as number) : null,
  );
  const macdNumeric = macd.map((value) => value ?? 0);
  const signalRaw = emaSeries(macdNumeric, signalPeriod);
  const signal = macd.map((value, i) => (value === null ? null : signalRaw[i]));
  const hist = macd.map((value, i) =>
    value !== null && signal[i] !== null ? value - (signal[i] as number) : null,
  );
  return { macd, signal, hist };
}

export function bollinger(source: number[], period = 20, mult = 2): {
  mid: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const mid = smaSeries(source, period);
  const upper: (number | null)[] = source.map(() => null);
  const lower: (number | null)[] = source.map(() => null);
  for (let i = period - 1; i < source.length; i += 1) {
    const window = source.slice(i - period + 1, i + 1);
    const mean = mid[i] as number;
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    upper[i] = mean + mult * std;
    lower[i] = mean - mult * std;
  }
  return { mid, upper, lower };
}

export function atrSeries(values: OhlcBar[], period = 14): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  if (values.length <= period) {
    return out;
  }
  const tr: number[] = values.map((bar, i) => {
    const high = bar[3];
    const low = bar[2];
    if (i === 0) {
      return high - low;
    }
    const prevClose = values[i - 1][1];
    return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  });
  let acc = tr.slice(1, period + 1).reduce((sum, value) => sum + value, 0) / period;
  out[period] = acc;
  for (let i = period + 1; i < tr.length; i += 1) {
    acc = (acc * (period - 1) + tr[i]) / period;
    out[i] = acc;
  }
  return out;
}

export function vwapSeries(values: OhlcBar[], volumes: number[], from = 0): (number | null)[] {
  let cv = 0;
  let vol = 0;
  return values.map((bar, i) => {
    if (i < from) {
      return null;
    }
    const typical = (bar[3] + bar[2] + bar[1]) / 3;
    const size = volumes[i] ?? 0;
    cv += typical * size;
    vol += size;
    return vol === 0 ? null : cv / vol;
  });
}

export function anchoredVwap(values: OhlcBar[], volumes: number[]): (number | null)[] {
  const look = Math.min(values.length, 80);
  const start = values.length - look;
  let minI = start;
  let min = values[start]?.[2] ?? 0;
  for (let i = start; i < values.length; i += 1) {
    if (values[i][2] < min) {
      min = values[i][2];
      minI = i;
    }
  }
  return vwapSeries(values, volumes, minI);
}

export function stdDevSeries(source: number[], period = 20): (number | null)[] {
  const out: (number | null)[] = source.map(() => null);
  for (let i = period - 1; i < source.length; i += 1) {
    const window = source.slice(i - period + 1, i + 1);
    const mean = window.reduce((sum, value) => sum + value, 0) / period;
    const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    out[i] = Math.sqrt(variance);
  }
  return out;
}

export function keltner(values: OhlcBar[], period = 20, mult = 1.5): {
  mid: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
} {
  const mid = emaSeries(
    values.map((bar) => (bar[3] + bar[2] + bar[1]) / 3),
    period,
  );
  const atr = atrSeries(values, period);
  const upper = mid.map((value, i) => (value === null || atr[i] === null ? null : value + (atr[i] as number) * mult));
  const lower = mid.map((value, i) => (value === null || atr[i] === null ? null : value - (atr[i] as number) * mult));
  return { mid, upper, lower };
}

export function supertrendSeries(
  values: OhlcBar[],
  period = 10,
  mult = 3,
): { line: (number | null)[]; trend: (1 | -1 | null)[] } {
  const n = values.length;
  const atr = atrSeries(values, period);
  const line: (number | null)[] = values.map(() => null);
  const trend: (1 | -1 | null)[] = values.map(() => null);
  let finalUpper = 0;
  let finalLower = 0;
  let dir: 1 | -1 = 1;
  for (let i = 0; i < n; i += 1) {
    const hl2 = (values[i][3] + values[i][2]) / 2;
    const range = atr[i];
    if (range === null) {
      continue;
    }
    const upper = hl2 + mult * range;
    const lower = hl2 - mult * range;
    if (i === period) {
      finalUpper = upper;
      finalLower = lower;
      dir = values[i][1] >= hl2 ? 1 : -1;
      line[i] = dir === 1 ? finalLower : finalUpper;
      trend[i] = dir;
      continue;
    }
    if (i < period) {
      continue;
    }
    finalUpper = values[i - 1][1] <= finalUpper ? Math.min(upper, finalUpper) : upper;
    finalLower = values[i - 1][1] >= finalLower ? Math.max(lower, finalLower) : lower;
    if (dir === 1) {
      dir = values[i][1] < finalLower ? -1 : 1;
    } else {
      dir = values[i][1] > finalUpper ? 1 : -1;
    }
    line[i] = dir === 1 ? finalLower : finalUpper;
    trend[i] = dir;
  }
  return { line, trend };
}

export function parabolicSar(values: OhlcBar[], step = 0.02, max = 0.2): (number | null)[] {
  const n = values.length;
  const out: (number | null)[] = values.map(() => null);
  if (n < 3) {
    return out;
  }
  let long = values[1][1] >= values[0][1];
  let af = step;
  let ep = long ? values[0][3] : values[0][2];
  let sar = long ? values[0][2] : values[0][3];
  out[0] = sar;
  for (let i = 1; i < n; i += 1) {
    const high = values[i][3];
    const low = values[i][2];
    sar = sar + af * (ep - sar);
    if (long) {
      sar = Math.min(sar, values[i - 1][2], i > 1 ? values[i - 2][2] : values[i - 1][2]);
      if (low < sar) {
        long = false;
        sar = ep;
        ep = low;
        af = step;
      } else {
        if (high > ep) {
          ep = high;
          af = Math.min(max, af + step);
        }
      }
    } else {
      sar = Math.max(sar, values[i - 1][3], i > 1 ? values[i - 2][3] : values[i - 1][3]);
      if (high > sar) {
        long = true;
        sar = ep;
        ep = high;
        af = step;
      } else if (low < ep) {
        ep = low;
        af = Math.min(max, af + step);
      }
    }
    out[i] = sar;
  }
  return out;
}

export function stochastic(
  values: OhlcBar[],
  kPeriod = 14,
  dPeriod = 3,
): { k: (number | null)[]; d: (number | null)[] } {
  const k: (number | null)[] = values.map(() => null);
  for (let i = kPeriod - 1; i < values.length; i += 1) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j += 1) {
      hh = Math.max(hh, values[j][3]);
      ll = Math.min(ll, values[j][2]);
    }
    k[i] = hh === ll ? 50 : ((values[i][1] - ll) / (hh - ll)) * 100;
  }
  const numeric = k.map((value) => value ?? 0);
  const dRaw = smaSeries(numeric, dPeriod);
  const d = k.map((value, i) => (value === null ? null : dRaw[i]));
  return { k, d };
}

export function cciSeries(values: OhlcBar[], period = 20): (number | null)[] {
  const tp = values.map((bar) => (bar[3] + bar[2] + bar[1]) / 3);
  const sma = smaSeries(tp, period);
  const out: (number | null)[] = values.map(() => null);
  for (let i = period - 1; i < values.length; i += 1) {
    const mean = sma[i];
    if (mean === null) {
      continue;
    }
    let dev = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      dev += Math.abs(tp[j] - mean);
    }
    const md = dev / period || 1e-9;
    out[i] = (tp[i] - mean) / (0.015 * md);
  }
  return out;
}

export function rocSeries(source: number[], period = 12): (number | null)[] {
  return source.map((value, i) => {
    if (i < period || source[i - period] === 0) {
      return null;
    }
    return ((value - source[i - period]) / source[i - period]) * 100;
  });
}

export function williamsR(values: OhlcBar[], period = 14): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  for (let i = period - 1; i < values.length; i += 1) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j += 1) {
      hh = Math.max(hh, values[j][3]);
      ll = Math.min(ll, values[j][2]);
    }
    out[i] = hh === ll ? -50 : ((hh - values[i][1]) / (hh - ll)) * -100;
  }
  return out;
}

export function obvSeries(values: OhlcBar[], volumes: number[]): (number | null)[] {
  let acc = 0;
  return values.map((bar, i) => {
    if (i === 0) {
      acc = volumes[i] ?? 0;
      return acc;
    }
    const prev = values[i - 1][1];
    if (bar[1] > prev) {
      acc += volumes[i] ?? 0;
    } else if (bar[1] < prev) {
      acc -= volumes[i] ?? 0;
    }
    return acc;
  });
}

export function mfiSeries(values: OhlcBar[], volumes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = values.map(() => null);
  const rawFlow = values.map((bar, i) => {
    const tp = (bar[3] + bar[2] + bar[1]) / 3;
    const prev = i === 0 ? tp : (values[i - 1][3] + values[i - 1][2] + values[i - 1][1]) / 3;
    const flow = tp * (volumes[i] ?? 0);
    return { pos: tp > prev ? flow : 0, neg: tp < prev ? flow : 0 };
  });
  for (let i = period; i < values.length; i += 1) {
    let pos = 0;
    let neg = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      pos += rawFlow[j].pos;
      neg += rawFlow[j].neg;
    }
    out[i] = neg === 0 ? 100 : 100 - 100 / (1 + pos / neg);
  }
  return out;
}

export function volumePressure(values: OhlcBar[], volumes: number[], period = 14): (number | null)[] {
  const signed = values.map((bar, i) => ((bar[1] >= bar[0] ? 1 : -1) * (volumes[i] ?? 0)));
  const num = smaSeries(signed, period);
  const den = smaSeries(volumes, period);
  return num.map((value, i) => {
    if (value === null || den[i] === null || den[i] === 0) {
      return null;
    }
    return (value / (den[i] as number)) * 100;
  });
}

export interface AutoSRLevel {
  price: number;
  kind: "support" | "resistance";
  label: string;
}

export function detectAutoSR(values: OhlcBar[], volumes: number[], count = 8): AutoSRLevel[] {
  const n = values.length;
  if (n < 24) {
    return [];
  }
  const window = Math.max(3, Math.min(8, Math.round(n / 45)));
  const avgVol = volumes.reduce((sum, value) => sum + value, 0) / Math.max(volumes.length, 1);
  const pivots: { price: number; weight: number; kind: "high" | "low" }[] = [];

  for (let i = window; i < n - window; i += 1) {
    const high = values[i][3];
    const low = values[i][2];
    const volW = 1 + (volumes[i] ?? 0) / (avgVol || 1);
    let isHigh = true;
    let isLow = true;
    for (let k = 1; k <= window; k += 1) {
      if (values[i - k][3] >= high || values[i + k][3] >= high) {
        isHigh = false;
      }
      if (values[i - k][2] <= low || values[i + k][2] <= low) {
        isLow = false;
      }
    }
    if (isHigh) {
      pivots.push({ price: high, weight: volW, kind: "high" });
    }
    if (isLow) {
      pivots.push({ price: low, weight: volW, kind: "low" });
    }
  }

  const last = values[n - 1][1];
  for (const look of [20, 40, 80, 160]) {
    const { high, low } = swingRange(values, look);
    pivots.push({ price: high, weight: 2 + look / 40, kind: "high" });
    pivots.push({ price: low, weight: 2 + look / 40, kind: "low" });
  }
  const tol = Math.abs(last) * 0.0045 || 0.05;
  const clusters: { price: number; weight: number }[] = [];
  const ranked = [...pivots].sort((a, b) => b.weight - a.weight);
  for (const pivot of ranked) {
    const hit = clusters.find((cluster) => Math.abs(cluster.price - pivot.price) <= tol);
    if (hit) {
      const total = hit.weight + pivot.weight;
      hit.price = (hit.price * hit.weight + pivot.price * pivot.weight) / total;
      hit.weight = total;
    } else {
      clusters.push({ price: pivot.price, weight: pivot.weight });
    }
  }

  return clusters
    .sort((a, b) => b.weight - a.weight)
    .slice(0, count)
    .map((cluster) => {
      const kind: AutoSRLevel["kind"] = cluster.price >= last ? "resistance" : "support";
      const price = Number(cluster.price.toFixed(2));
      return {
        price: cluster.price,
        kind,
        label: kind === "resistance" ? `Resistencia Clave: ${price}` : `Soporte Clave: ${price}`,
      };
    })
    .sort((a, b) => b.price - a.price);
}

export interface AutoSRDiagonal {
  kind: "support" | "resistance";
  label: string;
  line: (number | null)[];
}

export function detectAutoDiagonals(values: OhlcBar[]): AutoSRDiagonal[] {
  const n = values.length;
  if (n < 30) {
    return [];
  }
  const window = Math.max(3, Math.min(6, Math.round(n / 50)));
  const highs: { i: number; price: number }[] = [];
  const lows: { i: number; price: number }[] = [];
  for (let i = window; i < n - 1; i += 1) {
    let isHigh = true;
    let isLow = true;
    for (let k = 1; k <= window; k += 1) {
      const left = i - k;
      const right = Math.min(n - 1, i + k);
      if (values[left][3] >= values[i][3] || values[right][3] >= values[i][3]) {
        isHigh = false;
      }
      if (values[left][2] <= values[i][2] || values[right][2] <= values[i][2]) {
        isLow = false;
      }
    }
    if (isHigh) {
      highs.push({ i, price: values[i][3] });
    }
    if (isLow) {
      lows.push({ i, price: values[i][2] });
    }
  }

  function extend(a: { i: number; price: number }, b: { i: number; price: number }): (number | null)[] {
    const line: (number | null)[] = values.map(() => null);
    const dx = b.i - a.i || 1;
    const slope = (b.price - a.price) / dx;
    const from = Math.min(a.i, b.i);
    for (let i = from; i < n; i += 1) {
      line[i] = a.price + slope * (i - a.i);
    }
    return line;
  }

  const out: AutoSRDiagonal[] = [];
  if (highs.length >= 2) {
    const a = highs[highs.length - 2];
    const b = highs[highs.length - 1];
    out.push({
      kind: "resistance",
      label: "Directriz resistencia",
      line: extend(a, b),
    });
  }
  if (lows.length >= 2) {
    const a = lows[lows.length - 2];
    const b = lows[lows.length - 1];
    out.push({
      kind: "support",
      label: "Directriz soporte",
      line: extend(a, b),
    });
  }
  if (highs.length >= 3) {
    const a = highs[highs.length - 3];
    const b = highs[highs.length - 2];
    if (b.price < a.price) {
      out.push({ kind: "resistance", label: "Directriz R2", line: extend(a, b) });
    }
  }
  if (lows.length >= 3) {
    const a = lows[lows.length - 3];
    const b = lows[lows.length - 2];
    if (b.price > a.price) {
      out.push({ kind: "support", label: "Directriz S2", line: extend(a, b) });
    }
  }
  return out;
}

export function swingRange(values: OhlcBar[], lookback = 80): { high: number; low: number } {
  const slice = values.slice(-lookback);
  let high = -Infinity;
  let low = Infinity;
  for (const bar of slice) {
    high = Math.max(high, bar[3]);
    low = Math.min(low, bar[2]);
  }
  return { high, low };
}
