"use client";

import { AreaChart, BarChart3, CandlestickChart, ChevronDown, CircleDot, LineChart, Square } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import { CHART_PRICE_TYPES, type ChartPriceType } from "@/components/chart/chartPriceTypes";

const TYPE_ICONS: Record<ChartPriceType, typeof CandlestickChart> = {
  candles: CandlestickChart,
  heikin: CandlestickChart,
  line: LineChart,
  area: AreaChart,
  scatter: CircleDot,
  bars: BarChart3,
  renko: Square,
};

interface ChartStyleMenuProps {
  open: boolean;
  onToggle: () => void;
  chartType: ChartPriceType;
  onChartType: (id: ChartPriceType) => void;
}

export function ChartStyleMenu({ open, onToggle, chartType, onChartType }: ChartStyleMenuProps) {
  const current = CHART_PRICE_TYPES.find((item) => item.id === chartType) ?? CHART_PRICE_TYPES[0];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        title="Tipo de gráfico"
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#1F1F2E] bg-[#0A0A0F] px-2 font-mono text-[11px] tracking-tight text-white hover:border-[#00FF66]/40"
      >
        {(() => {
          const Icon = TYPE_ICONS[current.id];
          return <Icon className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />;
        })()}
        <span className="hidden max-w-[7.5rem] truncate sm:inline">{current.label}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          data-chrome="menu"
          className="absolute left-0 top-full z-[80] mt-1 w-[17rem] rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1"
        >
          <SectionLabel>Tipo de gráfico</SectionLabel>
          {CHART_PRICE_TYPES.map((item) => {
            const Icon = TYPE_ICONS[item.id];
            return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChartType(item.id)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left ${
                chartType === item.id ? "bg-[#00FF66]/10 text-[#00FF66]" : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.7} />
              <span className="min-w-0">
                <span className="block font-mono text-[11px] tracking-tight">{item.label}</span>
                <span className="block font-mono text-[9px] text-zinc-500">{item.hint}</span>
              </span>
            </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
