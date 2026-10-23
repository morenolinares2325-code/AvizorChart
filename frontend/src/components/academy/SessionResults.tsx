"use client";

import { Trophy, Repeat, X } from "lucide-react";
import { START_BALANCE, type ClosedTrade } from "@/lib/replayEngine";

interface SessionResultsProps {
  trades: ClosedTrade[];
  balance: number;
  onRestart: () => void;
  onClose: () => void;
}

const REASON: Record<ClosedTrade["reason"], string> = {
  sl: "Stop Loss",
  tp: "Take Profit",
  manual: "Cierre manual",
  session: "Fin de sesión",
};

export function SessionResults({ trades, balance, onRestart, onClose }: SessionResultsProps) {
  const pnl = balance - START_BALANCE;
  const wins = trades.filter((item) => item.pnl > 0).length;
  const losses = trades.filter((item) => item.pnl < 0).length;
  const flats = trades.length - wins - losses;
  const positive = pnl > 0;
  const ordered = [...trades].reverse();

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#050508]/94 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#1F1F2E] bg-[#0A0A0F] p-6 shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
          title="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#00FF66]">
          <Trophy className="h-3.5 w-3.5" />
          Replay Lab · resultado de sesión
        </p>
        <h2
          className={`mt-3 text-3xl font-bold tracking-[0.04em] sm:text-4xl ${
            positive ? "text-[#00FF66]" : "text-[#EF5350]"
          }`}
        >
          {positive ? "CONGRATULATIONS TRADER!" : "FAIL: NEEDS MORE DISCIPLINE"}
        </h2>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
          {positive ? "Cantidad ganada" : "Cantidad perdida"}
        </p>
        <p
          className={`font-mono text-5xl tabular-nums tracking-tight ${
            positive ? "text-[#00FF66]" : "text-[#EF5350]"
          }`}
        >
          {pnl >= 0 ? "+" : ""}
          {pnl.toFixed(2)}
        </p>
        <p className="mt-1 font-mono text-sm text-zinc-500">
          Balance {START_BALANCE.toFixed(2)} → {balance.toFixed(2)}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Wins" value={String(wins)} tone="up" />
          <Stat label="Losses" value={String(losses)} tone="down" />
          <Stat label="Breakeven" value={String(flats)} tone="flat" />
          <Stat label="Trades" value={String(trades.length)} tone="flat" />
        </div>
        <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          Listado de operaciones
        </p>
        <ul className="mt-2 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
          {ordered.length === 0 ? (
            <li className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-500">
              No hubo operaciones en esta sesión.
            </li>
          ) : (
            ordered.map((trade, index) => {
              const win = trade.pnl > 0;
              const lost = trade.pnl < 0;
              const tone = win ? "text-emerald-300" : lost ? "text-red-300" : "text-zinc-300";
              const box = win
                ? "border-emerald-500/30 bg-emerald-500/10"
                : lost
                  ? "border-red-500/30 bg-red-500/10"
                  : "border-zinc-700 bg-white/[0.03]";
              return (
                <li key={trade.id} className={`rounded-lg border px-3 py-2.5 ${box}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`font-mono text-[12px] font-semibold uppercase tracking-wide ${tone}`}>
                      #{index + 1} · {trade.side} · {trade.ticker ?? "—"} · {REASON[trade.reason]}
                    </p>
                    <p className={`font-mono text-base tabular-nums ${tone}`}>
                      {trade.pnl >= 0 ? "+" : ""}
                      {trade.pnl.toFixed(2)}
                    </p>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400">
                    {trade.qty} {trade.unit} · {trade.entry.toFixed(2)} → {trade.exit.toFixed(2)}
                    {trade.sl != null ? ` · SL ${trade.sl.toFixed(2)}` : " · sin SL"}
                    {trade.tp != null ? ` · TP ${trade.tp.toFixed(2)}` : " · sin TP"}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-zinc-600">
                    {trade.openedAt} → {trade.closedAt}
                  </p>
                  {trade.thesis ? (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-zinc-500">{trade.thesis}</p>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 rounded-md bg-[#00FF66] px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-wide text-black"
          >
            <Repeat className="h-3.5 w-3.5" />
            Nueva sesión
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-700 px-4 py-2 font-mono text-[12px] uppercase tracking-wide text-zinc-300"
          >
            Seguir revisando el gráfico
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "up" | "down" | "flat" }) {
  const color = tone === "up" ? "text-emerald-300" : tone === "down" ? "text-red-300" : "text-zinc-200";
  return (
    <div className="rounded-lg border border-[#1F1F2E] bg-[#050508] px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`font-mono text-lg tabular-nums ${color}`}>{value}</p>
    </div>
  );
}
