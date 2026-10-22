"use client";

import { Copy, Trash2 } from "lucide-react";
import { DRAW_PALETTE, STROKE_PRESETS } from "@/components/chart/chartDrawTools";

interface ChartDrawPropsMenuProps {
  color: string;
  strokeWidth: number;
  onColor: (color: string) => void;
  onWidth: (width: number) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function strokeActive(current: number, width: number): boolean {
  return Math.abs(current - width) < 0.4;
}

export function ChartDrawPropsMenu({
  color,
  strokeWidth,
  onColor,
  onWidth,
  onDuplicate,
  onDelete,
}: ChartDrawPropsMenuProps) {
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-md border border-[#1F1F2E] bg-[#0A0A0F]/95 px-3 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-1" role="group" aria-label="Grosor">
        {STROKE_PRESETS.map((item) => {
          const on = strokeActive(strokeWidth, item.width);
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label} (${item.width}px)`}
              onClick={() => onWidth(item.width)}
              className={`flex h-8 w-8 items-center justify-center rounded border ${
                on ? "border-white bg-[#1F1F2E]" : "border-[#1F1F2E] hover:border-zinc-500"
              }`}
            >
              <span className="block w-4 rounded-full bg-zinc-200" style={{ height: `${item.width}px` }} />
            </button>
          );
        })}
      </div>

      <span className="h-6 w-px bg-[#1F1F2E]" />

      <div className="flex items-center gap-1.5" role="group" aria-label="Color">
        {DRAW_PALETTE.map((item) => {
          const on = color.toUpperCase() === item.color;
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onColor(item.color)}
              className={`h-6 w-6 rounded-full border-2 ${on ? "border-white" : "border-[#1F1F2E]"}`}
              style={{ background: item.color }}
            />
          );
        })}
      </div>

      <span className="h-6 w-px bg-[#1F1F2E]" />

      <button
        type="button"
        title="Duplicar"
        onClick={onDuplicate}
        className="flex h-8 w-8 items-center justify-center rounded border border-[#1F1F2E] text-zinc-400 hover:text-white"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        title="Eliminar"
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded border border-[#1F1F2E] text-zinc-400 hover:text-[#FF3366]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
