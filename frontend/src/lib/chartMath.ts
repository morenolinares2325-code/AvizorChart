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

export function macdSeries(source: number[]): {
  macd: (number | null)[];
  signal: (number | null)[];
  hist: (number | null)[];
} {
  const fast = emaSeries(source, 12);
  const slow = emaSeries(source, 26);
  const macd = source.map((_, i) =>
    fast[i] !== null && slow[i] !== null ? (fast[i] as number) - (slow[i] as number) : null,
  );
  const macdNumeric = macd.map((value) => value ?? 0);
  const signalRaw = emaSeries(macdNumeric, 9);
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

export function vwapSeries(values: OhlcBar[], volumes: number[]): (number | null)[] {
  let cv = 0;
  let vol = 0;
  return values.map((bar, i) => {
    const typical = (bar[3] + bar[2] + bar[1]) / 3;
    const size = volumes[i] ?? 0;
    cv += typical * size;
    vol += size;
    return vol === 0 ? null : cv / vol;
  });
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
