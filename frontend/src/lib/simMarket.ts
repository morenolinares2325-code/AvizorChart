import type { CandlePayload } from "@/lib/marketApi";

export function generateSimMarket(
  bars = 160,
  start = 184.5,
  interval = "1h",
): CandlePayload {
  let close = start;
  const dates: string[] = [];
  const values: [number, number, number, number][] = [];
  const volumes: number[] = [];
  const stepMs = interval === "1d" ? 86_400_000 : interval === "15m" ? 900_000 : 3_600_000;
  const origin = Date.now() - bars * stepMs;

  for (let i = 0; i < bars; i += 1) {
    const wave = Math.sin(i / 11) * 0.55 + Math.sin(i / 29) * 0.35;
    const noise = (pseudo(i) - 0.49) * 1.4;
    const open = close;
    close = Math.max(12, open * (1 + (wave + noise) / 100));
    const wick = 0.002 + pseudo(i + 7) * 0.01;
    const high = Math.max(open, close) * (1 + wick);
    const low = Math.min(open, close) * (1 - wick);
    const stamp = new Date(origin + i * stepMs);
    dates.push(
      interval === "1d"
        ? stamp.toISOString().slice(0, 10)
        : stamp.toISOString().replace("T", " ").slice(0, 16),
    );
    values.push([round(open), round(close), round(low), round(high)]);
    volumes.push(Math.round(700_000 + pseudo(i + 3) * 4_200_000));
  }

  const last = values[values.length - 1][1];
  const prev = values[values.length - 2]?.[1] ?? last;
  return {
    ticker: "SIM",
    interval,
    period: "sim",
    dates,
    values,
    volumes,
    last,
    changePct: Number((((last - prev) / prev) * 100).toFixed(4)),
    count: values.length,
  };
}

export function appendSimBar(current: CandlePayload): CandlePayload {
  const last = current.values[current.values.length - 1];
  const open = last[1];
  const noise = (Math.random() - 0.48) * 1.2;
  const close = Math.max(12, open * (1 + noise / 100));
  const wick = 0.003 + Math.random() * 0.008;
  const high = Math.max(open, close) * (1 + wick);
  const low = Math.min(open, close) * (1 - wick);
  const lastDate = Date.parse(current.dates[current.dates.length - 1].replace(" ", "T") + "Z");
  const next = new Date((Number.isNaN(lastDate) ? Date.now() : lastDate) + 3_600_000);
  const date =
    current.interval === "1d"
      ? next.toISOString().slice(0, 10)
      : next.toISOString().replace("T", " ").slice(0, 16);
  const values = [...current.values, [round(open), round(close), round(low), round(high)] as [number, number, number, number]];
  const volumes = [...current.volumes, Math.round(800_000 + Math.random() * 3_000_000)];
  const dates = [...current.dates, date];
  const lastClose = values[values.length - 1][1];
  const prev = values[values.length - 2][1];
  return {
    ...current,
    dates,
    values,
    volumes,
    last: lastClose,
    changePct: Number((((lastClose - prev) / prev) * 100).toFixed(4)),
    count: values.length,
  };
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function pseudo(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
