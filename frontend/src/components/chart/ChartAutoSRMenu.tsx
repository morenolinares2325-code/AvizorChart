"use client";

import { ChevronDown, Sparkles } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";

export interface AutoSROptions {
  horizontal: boolean;
  diagonal: boolean;
}

interface ChartAutoSRMenuProps {
  open: boolean;
  onToggle: () => void;
  value: AutoSROptions;
  onChange: (next: AutoSROptions) => void;
}

export function ChartAutoSRMenu({ open, onToggle, value, onChange }: ChartAutoSRMenuProps) {
  const active = value.horizontal || value.diagonal;
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-mono text-[11px] tracking-tight hover:bg-white/[0.04] ${
          active ? "text-[#FFD700]" : "text-zinc-400 hover:text-white"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="hidden xl:inline">Auto S/R</span>
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div data-chrome="menu" className="absolute right-0 top-full z-[80] mt-1 w-56 rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1.5">
          <SectionLabel>Automatización S/R</SectionLabel>
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={value.horizontal}
              onChange={() => onChange({ ...value, horizontal: !value.horizontal })}
              className="accent-[#00FF66]"
            />
            Niveles horizontales
          </label>
          <label className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={value.diagonal}
              onChange={() => onChange({ ...value, diagonal: !value.diagonal })}
              className="accent-[#00FF66]"
            />
            Líneas diagonales (pivotes)
          </label>
        </div>
      ) : null}
    </div>
  );
}
