"use client";

import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-md border border-zinc-800/80 bg-zinc-950/80 px-2 py-1.5 font-mono text-xs tabular-nums text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[11px] text-zinc-500">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function ModuleCard({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-zinc-500/40 via-zinc-800 to-zinc-950 p-[1px] transition-all hover:from-zinc-400/40">
      <div className="filter-card rounded-[7px] border border-zinc-800/80 bg-zinc-950/90 p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-zinc-200">{title}</p>
          <button
            type="button"
            onClick={onRemove}
            className="rounded px-1.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label={`Quitar ${title}`}
          >
            ×
          </button>
        </div>
        <div className="grid gap-2">{children}</div>
      </div>
    </div>
  );
}

export function AddSelect({
  label,
  options,
  onPick,
}: {
  label: string;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <select
      className={`${inputClass} font-sans text-emerald-400`}
      defaultValue=""
      onChange={(event) => {
        const value = event.target.value;
        if (value) {
          onPick(value);
          event.target.value = "";
        }
      }}
    >
      <option value="" disabled>
        {label}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
