import type { CandlePayload } from "@/lib/marketApi";

export const START_BALANCE = 100_000;
export const REPLAY_SPEEDS = [1, 2, 5, 10] as const;
export type ReplaySpeed = (typeof REPLAY_SPEEDS)[number];
export type SizeUnit = "shares" | "lots";
export type OrderSide = "buy" | "sell";
export type ExitReason = "sl" | "tp" | "manual" | "session";

export interface OpenPosition {
  id: string;
  side: OrderSide;
  qty: number;
  unit: SizeUnit;
  entry: number;
  sl: number | null;
  tp: number | null;
  openedAt: string;
  openedIndex: number;
}

export interface ClosedTrade {
  id: string;
  ticker?: string;
  side: OrderSide;
  qty: number;
  unit: SizeUnit;
  entry: number;
  exit: number;
  sl: number | null;
  tp: number | null;
  pnl: number;
  reason: ExitReason;
  openedAt: string;
  closedAt: string;
  thesis: string;
}

export function multiplier(unit: SizeUnit): number {
  return unit === "lots" ? 100 : 1;
}

export function signedPnl(side: OrderSide, entry: number, exit: number, qty: number, unit: SizeUnit): number {
  const dir = side === "buy" ? 1 : -1;
  return (exit - entry) * dir * qty * multiplier(unit);
}

export function sliceCandles(full: CandlePayload, count: number): CandlePayload {
  const n = Math.max(8, Math.min(count, full.values.length));
  const values = full.values.slice(0, n);
  const dates = full.dates.slice(0, n);
  const volumes = full.volumes.slice(0, n);
  const last = values[n - 1]?.[1] ?? full.last;
  const open = values[0]?.[0] ?? last;
  return {
    ...full,
    values,
    dates,
    volumes,
    last,
    changePct: open ? ((last - open) / open) * 100 : 0,
    count: n,
  };
}

export function hitStopOrTarget(
  bar: [number, number, number, number],
  position: OpenPosition,
): ExitReason | null {
  const high = bar[3];
  const low = bar[2];
  if (position.side === "buy") {
    if (position.sl != null && low <= position.sl) {
      return "sl";
    }
    if (position.tp != null && high >= position.tp) {
      return "tp";
    }
    return null;
  }
  if (position.sl != null && high >= position.sl) {
    return "sl";
  }
  if (position.tp != null && low <= position.tp) {
    return "tp";
  }
  return null;
}

export function riskCash(
  entry: number,
  sl: number | null,
  qty: number,
  unit: SizeUnit,
): number | null {
  if (sl == null || !Number.isFinite(sl) || sl <= 0) {
    return null;
  }
  return Math.abs(entry - sl) * qty * multiplier(unit);
}
