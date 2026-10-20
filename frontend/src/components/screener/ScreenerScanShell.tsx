"use client";

import type { ReactNode } from "react";
import { AgentDispatcher } from "@/components/screener/AgentDispatcher";
import { FilterAccordion } from "@/components/screener/filters/FilterAccordion";
import { hudPanelClass } from "@/components/screener/screenerUi";
import type { FilterVariant } from "@/lib/mockScreenerData";
import type { ScreenerFilters } from "@/lib/screenerEngine";

interface ScreenerScanShellProps {
  variant: FilterVariant;
  filters: ScreenerFilters;
  onFiltersChange: (filters: ScreenerFilters) => void;
  scanning: boolean;
  onScan: () => void;
  timeframe: ScreenerFilters["timeframe"];
  resultCount: number;
  dispatched: string[];
  toolbar?: ReactNode;
  children: ReactNode;
}

export function ScreenerScanShell({
  variant,
  filters,
  onFiltersChange,
  scanning,
  onScan,
  timeframe,
  resultCount,
  dispatched,
  toolbar,
  children,
}: ScreenerScanShellProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <FilterAccordion
        variant={variant}
        filters={filters}
        onChange={onFiltersChange}
        scanning={scanning}
        onScan={onScan}
      />
      <div className="space-y-4">
        <p
          className={`${hudPanelClass} px-3 py-2 text-[11px] leading-relaxed text-zinc-500`}
        >
          Filosofía: no se buscan confirmaciones tardías. El motor sitúa al trader en
          compresión, pre-ruptura o en la vela exacta de detonación. Timeframe de
          trabajo: <span className="font-mono text-zinc-300">{timeframe}</span>.
          Resultados: <span className="font-mono text-zinc-300">{resultCount}</span>.
        </p>
        {toolbar}
        <AgentDispatcher dispatched={dispatched} />
        {children}
      </div>
    </div>
  );
}
