"use client";

import { ScreenerResultsTable } from "@/components/screener/ScreenerResultsTable";
import { ScreenerScanShell } from "@/components/screener/ScreenerScanShell";
import { thClass } from "@/components/screener/screenerUi";
import { useScreenerScan } from "@/hooks/useScreenerScan";
import { EQUITY_UNIVERSE } from "@/lib/mockScreenerData";

interface StockScreenerTabProps {
  dispatched: string[];
  onDispatch: (tickers: string[]) => void;
}

export function StockScreenerTab({ dispatched, onDispatch }: StockScreenerTabProps) {
  const scan = useScreenerScan(EQUITY_UNIVERSE, "equity");

  return (
    <ScreenerScanShell
      variant="equity"
      filters={scan.draft}
      onFiltersChange={scan.setDraft}
      scanning={scan.scanning}
      onScan={scan.runScan}
      timeframe={scan.applied.timeframe}
      resultCount={scan.ranked.length}
      dispatched={dispatched}
    >
      <ScreenerResultsTable
        rows={scan.ranked}
        selected={scan.selected}
        onToggle={scan.toggle}
        onToggleAll={scan.toggleAll}
        onDispatch={onDispatch}
        scanning={scan.scanning}
        emptyLabel="Ningún título en fase de pre-detonación con el filtro actual."
        cupo={scan.cupo}
        onMarkTop={scan.markTop}
        extraHead={<th className={thClass}>RVOL / ATR%</th>}
        extraCell={(asset) => (
          <td className="px-3 py-2 font-mono text-xs tabular-nums text-zinc-300">
            {asset.rvol.toFixed(2)} · {asset.atrPct.toFixed(1)}%
          </td>
        )}
      />
    </ScreenerScanShell>
  );
}
