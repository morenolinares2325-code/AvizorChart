"use client";

import { DESK_AGENTS } from "@/lib/mockScreenerData";
import { hudPanelClass } from "@/components/screener/screenerUi";

interface AgentDispatcherProps {
  dispatched: string[];
}

export function AgentDispatcher({ dispatched }: AgentDispatcherProps) {
  const live = dispatched.length > 0;
  const status = live ? "STANDBY" : "IDLE";

  return (
    <section className={`${hudPanelClass} relative overflow-hidden p-4`}>
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-10 h-24 w-24 rounded-full bg-zinc-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Mesa de control · 8 especialistas
          </p>
          <p className="mt-1 font-mono text-xs tabular-nums text-zinc-300">
            Cupo activo:{" "}
            {dispatched.length > 0 ? (
              <span className="text-emerald-400">{dispatched.join(", ")}</span>
            ) : (
              <span className="text-zinc-500">sin activos transferidos</span>
            )}
          </p>
        </div>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest ${
            live
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : "border-zinc-700 bg-zinc-900 text-zinc-500"
          }`}
        >
          {status}
        </span>
      </div>

      <ul className="relative mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {DESK_AGENTS.map((agent) => (
          <li
            key={agent.id}
            className={`rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5 backdrop-blur-md transition-all hover:border-zinc-700/80 ${agent.accent} border-t-2`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] tabular-nums text-zinc-400">{agent.code}</span>
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] tracking-widest ${
                  live ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="mt-1.5 text-xs font-semibold text-zinc-50">{agent.name}</p>
            <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">{agent.focus}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
