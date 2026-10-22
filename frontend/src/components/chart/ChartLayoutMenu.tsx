"use client";

import { AppWindow, Columns2, Grid2x2, Square } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import type { SplitMode } from "@/components/chart/chartTypes";

interface ChartLayoutMenuProps {
  open: boolean;
  onToggle: () => void;
  split: SplitMode;
  onSplit: (mode: SplitMode) => void;
  onUndock: () => void;
}

export function ChartLayoutMenu({ open, onToggle, split, onSplit, onUndock }: ChartLayoutMenuProps) {
  return (
    <div className="relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-mono text-[11px] tracking-tight hover:bg-white/[0.04] ${
          split > 1 ? "text-[#00FF66]" : "text-zinc-400 hover:text-white"
        }`}
        title="Multiventana / Split screen"
      >
        {split === 4 ? <Grid2x2 className="h-3.5 w-3.5" /> : <Columns2 className="h-3.5 w-3.5" />}
        <span className="hidden xl:inline">Split</span>
      </button>
      {open ? (
        <div data-chrome="menu" className="absolute right-0 top-full z-[80] mt-1 w-52 rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1">
          <SectionLabel>Multiventana</SectionLabel>
          <ModeButton icon={Square} label="1 gráfico" active={split === 1} onClick={() => onSplit(1)} />
          <ModeButton icon={Columns2} label="2 gráficos" active={split === 2} onClick={() => onSplit(2)} />
          <ModeButton icon={Grid2x2} label="4 gráficos" active={split === 4} onClick={() => onSplit(4)} />
        </div>
      ) : null}
      <button
        type="button"
        onClick={onUndock}
        className="ml-0.5 inline-flex h-8 items-center gap-1.5 rounded-md px-1.5 font-mono text-[11px] tracking-tight text-zinc-400 hover:bg-white/[0.04] hover:text-white"
        title="Desanclar ventana flotante"
      >
        <AppWindow className="h-3.5 w-3.5" />
        <span className="hidden 2xl:inline">Desanclar</span>
      </button>
    </div>
  );
}

function ModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Square;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[11px] ${
        active ? "text-[#00FF66]" : "text-zinc-300 hover:bg-[#1F1F2E] hover:text-white"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
