"use client";

import { Copy, Trash2 } from "lucide-react";
import { DRAW_PALETTE, STROKE_PRESETS } from "@/components/chart/chartDrawTools";

interface ChartDrawPropsMenuProps {
  color: string;
  strokeWidth: number;
  scheme?: "dark" | "light";
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
  scheme = "dark",
  onColor,
  onWidth,
  onDuplicate,
  onDelete,
}: ChartDrawPropsMenuProps) {
  const light = scheme === "light";
  return (
    <div
      data-draw-props="menu"
      className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-md border px-3 py-2"
      style={{
        borderColor: light ? "#d4d4d8" : "#3f3f46",
        background: light ? "rgba(255,255,255,0.96)" : "rgba(10,10,15,0.96)",
        boxShadow: light
          ? "0 12px 32px rgba(24,24,27,0.16)"
          : "0 12px 32px rgba(0,0,0,0.55)",
        color: light ? "#18181b" : "#e4e4e7",
      }}
    >
      <div className="flex items-center gap-1" role="group" aria-label="Grosor">
        {STROKE_PRESETS.map((item) => {
          const on = strokeActive(strokeWidth, item.width);
          return (
            <button
              key={item.id}
              type="button"
              title={`${item.label} (${item.width}px)`}
              onClick={() => onWidth(item.width)}
              className="flex h-8 w-8 items-center justify-center rounded border"
              style={{
                borderColor: on ? (light ? "#18181b" : "#f4f4f5") : light ? "#d4d4d8" : "#3f3f46",
                background: on ? (light ? "#f4f4f5" : "#27272a") : "transparent",
              }}
            >
              <span
                className="block w-4 rounded-full"
                style={{
                  height: `${item.width}px`,
                  background: light ? "#18181b" : "#e4e4e7",
                }}
              />
            </button>
          );
        })}
      </div>

      <span className="h-6 w-px" style={{ background: light ? "#d4d4d8" : "#3f3f46" }} />

      <div className="flex items-center gap-1.5" role="group" aria-label="Color">
        {DRAW_PALETTE.map((item) => {
          const on = color.trim().toUpperCase() === item.color.toUpperCase();
          return (
            <button
              key={item.id}
              type="button"
              title={item.label}
              onClick={() => onColor(item.color)}
              className="h-6 w-6 rounded-full border-2"
              style={{
                background: item.color,
                borderColor: on ? (light ? "#18181b" : "#ffffff") : light ? "#d4d4d8" : "#3f3f46",
              }}
            />
          );
        })}
      </div>

      <span className="h-6 w-px" style={{ background: light ? "#d4d4d8" : "#3f3f46" }} />

      <button
        type="button"
        title="Duplicar"
        onClick={onDuplicate}
        className="flex h-8 w-8 items-center justify-center rounded border"
        style={{
          borderColor: light ? "#d4d4d8" : "#52525b",
          color: light ? "#3f3f46" : "#e4e4e7",
        }}
      >
        <Copy className="h-3.5 w-3.5" color="currentColor" />
      </button>
      <button
        type="button"
        title="Eliminar"
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded border"
        style={{
          borderColor: light ? "#fecdd3" : "#7f1d1d",
          color: light ? "#be123c" : "#fb7185",
          background: light ? "rgba(255,228,230,0.9)" : "rgba(127,29,29,0.35)",
        }}
      >
        <Trash2 className="h-3.5 w-3.5" color="currentColor" />
      </button>
    </div>
  );
}
