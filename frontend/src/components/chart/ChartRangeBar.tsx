"use client";

import { RANGE_PRESETS, type RangePresetId } from "@/components/chart/chartTypes";

interface ChartRangeBarProps {
  range: RangePresetId;
  onRange: (id: RangePresetId) => void;
}

export function ChartRangeBar({ range, onRange }: ChartRangeBarProps) {
  return (
    <div
      data-chrome="range"
      className="flex h-8 shrink-0 items-center gap-1 border-t border-[#1F1F2E] bg-[#050508] px-3"
    >
      {RANGE_PRESETS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onRange(item.id)}
          data-on={range === item.id}
          className="avizor-range-btn hover:text-zinc-200"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
