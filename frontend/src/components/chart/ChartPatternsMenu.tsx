"use client";

import { Bot, ChevronDown } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import { AUTO_PATTERN_GROUPS, type AutoPatternId } from "@/components/chart/chartAutoPatterns";

interface ChartPatternsMenuProps {
  open: boolean;
  onToggle: () => void;
  enabled: Set<AutoPatternId>;
  onTogglePattern: (id: AutoPatternId) => void;
}

export function ChartPatternsMenu({ open, onToggle, enabled, onTogglePattern }: ChartPatternsMenuProps) {
  const count = enabled.size;
  return (
    <div className="relative overflow-visible">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] tracking-tight hover:bg-white/[0.04] ${
          count > 0 ? "text-[#00FF66]" : "text-zinc-400 hover:text-white"
        }`}
      >
        <Bot className="h-3.5 w-3.5" strokeWidth={1.75} />
        Patrones Auto
        {count > 0 ? <span className="text-[10px] text-[#00FF66]">{count}</span> : null}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div data-chrome="menu" className="fixed left-14 top-[3.35rem] z-[80] max-h-[min(70vh,28rem)] w-[22rem] overflow-y-auto rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1.5">
          {AUTO_PATTERN_GROUPS.map((group) => (
            <div key={group.id} className="py-0.5">
              <SectionLabel>{group.label}</SectionLabel>
              {group.items.map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center gap-2 px-3 py-1 text-xs tracking-tight text-zinc-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={enabled.has(item.id)}
                    onChange={() => onTogglePattern(item.id)}
                    className="accent-[#00FF66]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
