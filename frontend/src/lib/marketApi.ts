export type ChartInterval = string;

export interface CandlePayload {
  ticker: string;
  interval: ChartInterval;
  period: string;
  dates: string[];
  values: [number, number, number, number][];
  volumes: number[];
  last: number;
  changePct: number;
  count: number;
}

export const API_BASE = "http://127.0.0.1:8000";

const INTERVAL_PATTERN = /^(\d+)(s|m|h|d|w)$/;

export function parseChartInterval(raw: string): ChartInterval | null {
  const match = raw.trim().toLowerCase().match(INTERVAL_PATTERN);
  if (!match) {
    return null;
  }
  const amount = Number(match[1]);
  if (!Number.isInteger(amount) || amount < 1 || amount > 365) {
    return null;
  }
  return `${amount}${match[2]}`;
}

export function periodForInterval(interval: ChartInterval): string {
  const parsed = parseChartInterval(interval);
  if (!parsed) {
    return "1mo";
  }
  const amount = Number(parsed.slice(0, -1));
  const unit = parsed.slice(-1);
  if (unit === "s" || (unit === "m" && amount <= 5)) {
    return "1d";
  }
  if (unit === "m") {
    return "5d";
  }
  if (unit === "h" && amount <= 1) {
    return "1mo";
  }
  if (unit === "h") {
    return "3mo";
  }
  if (unit === "d") {
    return amount === 1 ? "1mo" : "1y";
  }
  return "5y";
}

function asNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatStamp(millis: number, withTime: boolean): string {
  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  if (!withTime) {
    return date.toISOString().slice(0, 10);
  }
  return date.toISOString().replace("T", " ").slice(0, 16);
}

function fromMatrix(rows: unknown[], interval: ChartInterval): CandlePayload | null {
  const dates: string[] = [];
  const values: [number, number, number, number][] = [];
  const volumes: number[] = [];
  const withTime = !interval.endsWith("d") && !interval.endsWith("w");

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) {
      continue;
    }
    const time = asNumber(row[0]);
    const open = asNumber(row[1]);
    const close = asNumber(row[2]);
    const low = asNumber(row[3]);
    const high = asNumber(row[4]);
    const volume = asNumber(row[5]) ?? 0;
    if (time === null || open === null || close === null || low === null || high === null) {
      continue;
    }
    const millis = time > 10_000_000_000 ? time : time * 1000;
    dates.push(formatStamp(millis, withTime));
    values.push([open, close, low, high]);
    volumes.push(volume);
  }

  if (values.length === 0) {
    return null;
  }
  return toPayload("", interval, "", dates, values, volumes);
}

function fromCandleObjects(rows: unknown[], interval: ChartInterval): CandlePayload | null {
  const dates: string[] = [];
  const values: [number, number, number, number][] = [];
  const volumes: number[] = [];
  const withTime = !interval.endsWith("d") && !interval.endsWith("w");

  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const item = row as Record<string, unknown>;
    const time = asNumber(item.time);
    const open = asNumber(item.open);
    const close = asNumber(item.close);
    const low = asNumber(item.low);
    const high = asNumber(item.high);
    const volume = asNumber(item.volume) ?? 0;
    if (time === null || open === null || close === null || low === null || high === null) {
      continue;
    }
    const millis = time > 10_000_000_000 ? time : time * 1000;
    dates.push(formatStamp(millis, withTime));
    values.push([open, close, low, high]);
    volumes.push(volume);
  }

  if (values.length === 0) {
    return null;
  }
  return toPayload("", interval, "", dates, values, volumes);
}

function toPayload(
  ticker: string,
  interval: ChartInterval,
  period: string,
  dates: string[],
  values: [number, number, number, number][],
  volumes: number[],
): CandlePayload {
  const last = values[values.length - 1][1];
  const prev = values.length > 1 ? values[values.length - 2][1] : last;
  const changePct = prev ? ((last - prev) / prev) * 100 : 0;
  return {
    ticker,
    interval,
    period,
    dates,
    values,
    volumes,
    last,
    changePct: Number(changePct.toFixed(4)),
    count: values.length,
  };
}

function parseHistoryPayload(json: unknown, fallbackInterval: ChartInterval): CandlePayload {
  if (!json || typeof json !== "object") {
    throw new Error("La API no devolvió un JSON de velas válido.");
  }
  const body = json as Record<string, unknown>;
  const interval = String(body.interval ?? fallbackInterval);
  const ticker = String(body.ticker ?? "");
  const period = String(body.period ?? "");

  if (Array.isArray(body.dates) && Array.isArray(body.values) && body.values.length > 0) {
    const dates = body.dates.map((item) => String(item));
    const values = (body.values as unknown[])
      .map((row) => {
        if (!Array.isArray(row) || row.length < 4) {
          return null;
        }
        const open = asNumber(row[0]);
        const close = asNumber(row[1]);
        const low = asNumber(row[2]);
        const high = asNumber(row[3]);
        if (open === null || close === null || low === null || high === null) {
          return null;
        }
        return [open, close, low, high] as [number, number, number, number];
      })
      .filter((row): row is [number, number, number, number] => row !== null);
    const volumes = Array.isArray(body.volumes)
      ? body.volumes.map((item) => asNumber(item) ?? 0)
      : values.map(() => 0);
    if (values.length > 0) {
      return toPayload(ticker, interval, period, dates.slice(0, values.length), values, volumes);
    }
  }

  if (Array.isArray(body.candles) && body.candles.length > 0) {
    const parsed = fromCandleObjects(body.candles, interval);
    if (parsed) {
      return { ...parsed, ticker, period, interval };
    }
  }

  if (Array.isArray(body.data) && body.data.length > 0) {
    const parsed = fromMatrix(body.data, interval);
    if (parsed) {
      return { ...parsed, ticker, period, interval };
    }
  }

  throw new Error("La respuesta no contiene velas (candles/data vacíos).");
}

export async function fetchCandles(
  ticker: string,
  interval: ChartInterval,
  signal?: AbortSignal,
): Promise<CandlePayload> {
  const period = periodForInterval(interval);
  const url = `http://127.0.0.1:8000/api/market/history?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}&interval=${encodeURIComponent(interval)}`;

  try {
    const res = await fetch(url, { signal });
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status} - ${res.statusText}`);
    }
    const json: unknown = await res.json();
    console.log("Datos recibidos de FastAPI:", json);
    return parseHistoryPayload(json, interval);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    console.error("Fallo al conectar con el backend de FastAPI:", err);
    throw err instanceof Error ? err : new Error("Fallo al conectar con el backend de FastAPI.");
  }
}
