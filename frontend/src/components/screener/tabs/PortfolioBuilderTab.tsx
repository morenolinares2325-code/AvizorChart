"use client";

import { useMemo, useState } from "react";
import { ScreenerResultsTable } from "@/components/screener/ScreenerResultsTable";
import { ScreenerScanShell } from "@/components/screener/ScreenerScanShell";
import { ScoreCell, hudPanelClass } from "@/components/screener/screenerUi";
import { useScreenerScan } from "@/hooks/useScreenerScan";
import {
  EQUITY_UNIVERSE,
  SECTORS,
  estimateBasketVolatility,
  estimatePairCorrelation,
  type SectorName,
  type UniverseAsset,
} from "@/lib/mockScreenerData";
import { basketPassesPortfolioGuards } from "@/lib/screenerEngine";

interface PortfolioBuilderTabProps {
  dispatched: string[];
  onDispatch: (tickers: string[]) => void;
}

const DEFAULT_WEIGHTS: Record<SectorName, number> = {
  Tecnología: 30,
  Consumo: 15,
  Salud: 15,
  Financiero: 15,
  Industrial: 10,
  Energía: 15,
};

function pickHoldings(
  weights: Record<SectorName, number>,
  eligible: UniverseAsset[],
): { asset: UniverseAsset; weight: number }[] {
  const picks: { asset: UniverseAsset; weight: number }[] = [];
  for (const sector of SECTORS) {
    const weight = weights[sector];
    if (weight <= 0) {
      continue;
    }
    const ranked = eligible
      .filter((asset) => asset.sector === sector)
      .sort((a, b) => b.score - a.score);
    const top = ranked[0];
    if (top) {
      picks.push({ asset: top, weight });
    }
  }
  return picks;
}

export function PortfolioBuilderTab({ dispatched, onDispatch }: PortfolioBuilderTabProps) {
  const scan = useScreenerScan(EQUITY_UNIVERSE, "portfolio");
  const [weights, setWeights] = useState<Record<SectorName, number>>(DEFAULT_WEIGHTS);

  const holdings = useMemo(() => pickHoldings(weights, scan.ranked), [weights, scan.ranked]);
  const total = SECTORS.reduce((sum, sector) => sum + weights[sector], 0);
  const vol = useMemo(() => estimateBasketVolatility(holdings), [holdings]);
  const guards = useMemo(
    () => basketPassesPortfolioGuards(holdings, scan.applied),
    [holdings, scan.applied],
  );

  return (
    <ScreenerScanShell
      variant="portfolio"
      filters={scan.draft}
      onFiltersChange={scan.setDraft}
      scanning={scan.scanning}
      onScan={scan.runScan}
      timeframe={scan.applied.timeframe}
      resultCount={scan.ranked.length}
      dispatched={dispatched}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className={`${hudPanelClass} p-5`}>
          <h2 className="text-sm font-semibold text-zinc-100">Ponderación por sectores</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Total asignado:{" "}
            <span className={total === 100 ? "text-bull" : "text-amber-400"}>{total}%</span>
          </p>
          <div className="mt-4 space-y-4">
            {SECTORS.map((sector) => (
              <label key={sector} className="block text-sm text-zinc-300">
                <span className="flex justify-between">
                  <span>{sector}</span>
                  <span className="font-mono text-xs text-zinc-400">{weights[sector]}%</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={5}
                  value={weights[sector]}
                  onChange={(event) =>
                    setWeights((current) => ({
                      ...current,
                      [sector]: Number(event.target.value),
                    }))
                  }
                  className="mt-1 w-full accent-emerald-500"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <GuardChip ok={guards.volOk} label={`Vol ${vol.toFixed(1)}%`} />
            <GuardChip ok={guards.corrOk} label="Corr. cruzada" />
            <GuardChip ok={guards.sectorsOk} label="Diversificación" />
          </div>
          <div className={`${hudPanelClass} p-5`}>
            <h2 className="text-sm font-semibold text-zinc-100">Cesta filtrada</h2>
            <ul className="mt-4 divide-y divide-zinc-800">
              {holdings.map((item) => (
                <li key={item.asset.ticker} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="font-mono text-sm font-semibold text-zinc-100">
                      {item.asset.ticker}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {item.asset.sector} · {item.asset.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ScoreCell score={item.asset.score} />
                    <span className="w-10 text-right font-mono text-sm text-zinc-200">
                      {item.weight}%
                    </span>
                  </div>
                </li>
              ))}
              {holdings.length === 0 ? (
                <li className="py-4 text-sm text-zinc-500">
                  Relaja filtros o pondera más sectores con candidatos pre-detonación.
                </li>
              ) : null}
            </ul>
          </div>
          <div className={`${hudPanelClass} overflow-x-auto`}>
            <table className="min-w-full text-center text-xs">
              <thead className="bg-zinc-950 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-2 py-2 text-left">Corr.</th>
                  {holdings.map((item) => (
                    <th key={item.asset.ticker} className="px-2 py-2 font-mono">
                      {item.asset.ticker}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holdings.map((row) => (
                  <tr key={row.asset.ticker} className="border-t border-zinc-800 bg-zinc-900">
                    <td className="px-2 py-2 text-left font-mono text-zinc-300">
                      {row.asset.ticker}
                    </td>
                    {holdings.map((col) => {
                      const value = estimatePairCorrelation(row.asset, col.asset);
                      return (
                        <td
                          key={col.asset.ticker}
                          className={`px-2 py-2 font-mono tabular-nums ${
                            value >= 0.6 ? "text-bear" : value <= 0 ? "text-bull" : "text-zinc-300"
                          }`}
                        >
                          {value.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <ScreenerResultsTable
        rows={scan.ranked}
        selected={scan.selected}
        onToggle={scan.toggle}
        onToggleAll={scan.toggleAll}
        onDispatch={onDispatch}
        scanning={scan.scanning}
        emptyLabel="Relaja filtros o pondera más sectores con candidatos pre-detonación."
        cupo={scan.cupo}
        onMarkTop={scan.markTop}
      />
    </ScreenerScanShell>
  );
}

function GuardChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`rounded-md border px-2 py-2 font-medium ${
        ok ? "border-bull/30 bg-bull/10 text-bull" : "border-bear/30 bg-bear/10 text-bear"
      }`}
    >
      {ok ? "OK" : "ALERTA"} · {label}
    </div>
  );
}
