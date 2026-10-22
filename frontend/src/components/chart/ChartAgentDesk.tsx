"use client";

import Image from "next/image";
import type { AgentBrief } from "@/components/chart/chartAutoPatterns";

interface ChartAgentDeskProps {
  open: boolean;
  onToggle: () => void;
  brief: AgentBrief | null;
}

export function ChartAgentDesk({ open, onToggle, brief }: ChartAgentDeskProps) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-8 items-center gap-1.5 rounded-md border border-[#1F1F2E] bg-[#0A0A0F] pl-1 pr-2 hover:border-[#00FF66]/40"
        title="Agente IA especialista"
        aria-expanded={open}
      >
        <span className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[#1F1F2E] bg-[#050508]">
          <Image
            src="/brand/avizor-mark.png?v=3"
            alt=""
            width={16}
            height={18}
            className="h-4 w-auto object-contain brightness-0 invert"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#00FF66] shadow-[0_0_6px_#00FF66]" />
        </span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wide text-zinc-300 sm:inline">Agente</span>
        <span aria-hidden className="text-[10px] leading-none">
          🟢
        </span>
      </button>

      {open ? (
        <div data-chrome="menu" className="fixed right-12 top-[3.35rem] z-[80] w-[22rem] rounded-lg border border-[#00FF66]/25 bg-[#0A0A0F] p-3">
          <p className="avizor-section px-0 pt-0">
            <span className="avizor-section-mark" aria-hidden />
            <span className="avizor-section-text">Mesa del especialista · {brief?.ticker ?? "—"}</span>
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="Tendencia" value={brief?.trend ?? "—"} tone={brief?.trendTone} />
            <Metric label="Volatilidad" value={brief?.volatility ?? "—"} tone={brief?.volTone} />
          </div>
          <ul className="mt-2 space-y-1.5">
            {(brief?.notes ?? ["Sin datos de mercado para el briefing."]).map((note) => (
              <li key={note} className="text-[11px] leading-relaxed text-zinc-300">
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "up" | "down" | "flat" | "low" | "mid" | "high";
}) {
  const color =
    tone === "up" || tone === "low"
      ? "text-[#00FF66]"
      : tone === "down" || tone === "high"
        ? "text-[#FF3366]"
        : "text-[#FFD700]";
  return (
    <div className="rounded border border-[#1F1F2E] bg-[#050508] px-2 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`font-mono text-sm ${color}`}>{value}</p>
    </div>
  );
}
