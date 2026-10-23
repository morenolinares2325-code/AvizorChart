"use client";

import { ChevronDown } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import { INTERVALS } from "@/components/chart/chartTypes";
import type { ChartInterval } from "@/lib/marketApi";

interface ChartTimeframeMenuProps {
  open: boolean;
  onToggle: () => void;
  interval: ChartInterval;
  onInterval: (interval: ChartInterval) => void;
  customOpen: boolean;
  customDraft: string;
  customError: string | null;
  onCustomOpen: () => void;
  onCustomDraft: (value: string) => void;
  onCustomSubmit: () => void;
}

export function ChartTimeframeMenu({
  open,
  onToggle,
  interval,
  onInterval,
  customOpen,
  customDraft,
  customError,
  onCustomOpen,
  onCustomDraft,
  onCustomSubmit,
}: ChartTimeframeMenuProps) {
  const preset = INTERVALS.find((item) => item.id === interval);
  const label = preset?.label ?? interval;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-2 font-mono text-[11px] tracking-tight text-white hover:border-[#00FF66]/40"
      >
        {label}
        <ChevronDown className={`h-3 w-3 text-zinc-300 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div data-chrome="menu" className="absolute left-0 top-full z-[80] mt-1 w-40 rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1">
          <SectionLabel>Temporalidad</SectionLabel>
          {INTERVALS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onInterval(item.id)}
              className={`flex w-full px-3 py-1.5 text-left font-mono text-[11px] ${
                interval === item.id ? "text-[#00FF66]" : "text-zinc-300 hover:bg-[#1F1F2E] hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onCustomOpen}
            className={`flex w-full px-3 py-1.5 text-left font-mono text-[11px] ${
              customOpen || !preset ? "text-[#00FF66]" : "text-zinc-300 hover:bg-[#1F1F2E] hover:text-white"
            }`}
          >
            Custom
          </button>
          {customOpen ? (
            <form
              className="flex items-center gap-1 border-t border-[#1F1F2E] px-2 py-1.5"
              onSubmit={(event) => {
                event.preventDefault();
                onCustomSubmit();
              }}
            >
              <input
                value={customDraft}
                onChange={(event) => onCustomDraft(event.target.value)}
                className="h-7 w-full rounded border border-[#1F1F2E] bg-[#050508] px-1.5 font-mono text-[11px] text-white outline-none"
                placeholder="45m"
                autoFocus
              />
              <button type="submit" className="font-mono text-[10px] text-zinc-400">
                OK
              </button>
            </form>
          ) : null}
          {customError ? <p className="px-2 pb-1 text-[10px] text-red-400">{customError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
