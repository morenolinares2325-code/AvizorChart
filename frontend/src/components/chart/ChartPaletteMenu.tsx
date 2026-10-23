"use client";

import { Palette } from "lucide-react";
import { ChartVisualStudio } from "@/components/chart/ChartVisualStudio";
import { normalizeChartTheme, saveChartTheme, type ChartVisualTheme } from "@/components/chart/chartVisualTheme";

interface ChartPaletteMenuProps {
  open: boolean;
  onToggle: () => void;
  theme: ChartVisualTheme;
  onTheme: (next: ChartVisualTheme) => void;
}

export function ChartPaletteMenu({ open, onToggle, theme, onTheme }: ChartPaletteMenuProps) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        title="Paleta visual"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${
          open || theme.neon > 0
            ? "bg-[#00FF66]/10 text-[#00FF66]"
            : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <Palette className="h-3.5 w-3.5" strokeWidth={1.75} />
      </button>
      {open ? (
        <div
          data-chrome="menu"
          className="absolute right-0 top-full z-[90] mt-1 w-[22rem] max-h-[min(78vh,40rem)] overflow-y-auto rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.58)]"
        >
          <ChartVisualStudio
            theme={theme}
            onTheme={(next) => {
              const normalized = normalizeChartTheme(next);
              onTheme(normalized);
              saveChartTheme(normalized);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
