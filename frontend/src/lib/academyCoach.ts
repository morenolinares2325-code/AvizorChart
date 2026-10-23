import { API_BASE } from "@/lib/marketApi";
import { riskCash, START_BALANCE, type ClosedTrade, type OrderSide, type SizeUnit } from "@/lib/replayEngine";
import {
  emptySenseiMemory,
  pickSensei,
  rememberSensei,
  type SenseiBucket,
  type SenseiCtx,
  type SenseiMemory,
  type SenseiPick,
  type SenseiTone,
} from "@/lib/senseiBank";

export type { SenseiMemory, SenseiPick };
export { emptySenseiMemory, rememberSensei };

export interface CoachRequest {
  kind: "open" | "entry" | "close" | "chat";
  ticker: string;
  interval: string;
  side: OrderSide;
  entry: number;
  sl: number | null;
  tp: number | null;
  qty: number;
  unit: SizeUnit;
  balance: number;
  thesis: string;
  atrPct: number;
  streak: number;
  pnl?: number;
  reason?: ClosedTrade["reason"];
}

export interface CoachReply {
  tone: SenseiTone;
  text: string;
  source: "ai" | "local";
}

function ctxFrom(req: CoachRequest): SenseiCtx {
  const slPct =
    req.sl != null && req.entry ? (Math.abs(req.entry - req.sl) / req.entry) * 100 : null;
  const risk = riskCash(req.entry, req.sl, req.qty, req.unit);
  const riskPct = risk != null ? (risk / Math.max(req.balance, 1)) * 100 : null;
  return {
    ticker: req.ticker,
    interval: req.interval,
    side: req.side,
    entry: req.entry,
    sl: req.sl,
    tp: req.tp,
    slPct,
    atrPct: req.atrPct,
    riskPct,
    pnl: req.pnl,
    streak: req.streak,
    thesis: req.thesis,
  };
}

function bucketFor(req: CoachRequest): SenseiBucket {
  if (req.kind === "open") {
    return "open";
  }
  if (req.kind === "chat") {
    return "chat";
  }
  if (req.kind === "entry") {
    return "thesis";
  }
  if (req.reason === "sl") {
    return "sl";
  }
  if (req.reason === "tp") {
    return "tp";
  }
  if (req.reason === "session") {
    return "session";
  }
  return (req.pnl ?? 0) >= 0 ? "manual_win" : "manual_loss";
}

export function localCoach(req: CoachRequest, memory: SenseiMemory): SenseiPick {
  return pickSensei(bucketFor(req), ctxFrom(req), memory);
}

function tooSimilar(a: string, b: string): boolean {
  const norm = (text: string) =>
    text
      .toLowerCase()
      .replace(/[0-9]+(\.[0-9]+)?/g, "#")
      .replace(/[^a-záéíóúñü#\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const left = norm(a);
  const right = norm(b);
  if (!left || !right || left === right) {
    return Boolean(left && right);
  }
  const aw = new Set(left.split(" ").filter((w) => w.length > 3));
  const bw = new Set(right.split(" ").filter((w) => w.length > 3));
  if (aw.size === 0 || bw.size === 0) {
    return false;
  }
  let hit = 0;
  aw.forEach((word) => {
    if (bw.has(word)) {
      hit += 1;
    }
  });
  return hit / Math.min(aw.size, bw.size) > 0.7;
}

export async function askCoach(
  req: CoachRequest,
  memory: SenseiMemory,
  signal?: AbortSignal,
): Promise<{ reply: CoachReply; pick: SenseiPick }> {
  const pick = localCoach(req, memory);
  try {
    const res = await fetch(`${API_BASE}/api/academy/coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...req,
        startBalance: START_BALANCE,
        recent: memory.texts.slice(-8),
        slPct: ctxFrom(req).slPct,
        riskPct: ctxFrom(req).riskPct,
      }),
      signal,
    });
    if (!res.ok) {
      return { reply: { ...pick, source: "local" }, pick };
    }
    const json: unknown = await res.json();
    if (!json || typeof json !== "object") {
      return { reply: { ...pick, source: "local" }, pick };
    }
    const body = json as { tone?: string; text?: string };
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (text.length < 12) {
      return { reply: { ...pick, source: "local" }, pick };
    }
    const last = memory.texts[memory.texts.length - 1] ?? "";
    if (memory.texts.some((line) => tooSimilar(line, text)) || tooSimilar(last, text)) {
      return { reply: { ...pick, source: "local" }, pick };
    }
    const tone: SenseiTone =
      body.tone === "praise" || body.tone === "scold" || body.tone === "ask" ? body.tone : pick.tone;
    const aiPick: SenseiPick = { id: `ai-${Date.now()}`, text, tone };
    return { reply: { tone, text, source: "ai" }, pick: aiPick };
  } catch {
    return { reply: { ...pick, source: "local" }, pick };
  }
}

export function idleSensei(ctx: SenseiCtx, memory: SenseiMemory): SenseiPick {
  return pickSensei("idle", ctx, memory);
}
