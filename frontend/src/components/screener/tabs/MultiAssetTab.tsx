"use client";

import { useMemo, useState } from "react";
import { ScreenerResultsTable } from "@/components/screener/ScreenerResultsTable";
import { ScreenerScanShell } from "@/components/screener/ScreenerScanShell";
import { thClass } from "@/components/screener/screenerUi";
import { useScreenerScan } from "@/hooks/useScreenerScan";
import {
  MULTI_UNIVERSE,
  type AssetClass,
  type UniverseAsset,
} from "@/lib/mockScreenerData";

interface MultiAssetTabProps {
  dispatched: string[];
  onDispatch: (tickers: string[]) => void;
}

type CategoryFilter = "all" | "forex" | "crypto" | "index" | "metal";

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "forex", label: "Forex" },
  { id: "crypto", label: "Cripto" },
  { id: "index", label: "Índices" },
  { id: "metal", label: "Metales / Energía" },
];

function matchesCategory(asset: UniverseAsset, category: CategoryFilter): boolean {
  if (category === "all") {
    return true;
  }
  if (category === "metal") {
    return asset.assetClass === "metal" || asset.assetClass === "energy";
  }
  return asset.assetClass === (category as AssetClass);
}

export function MultiAssetTab({ dispatched, onDispatch }: MultiAssetTabProps) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const scoped = useMemo(
    () => MULTI_UNIVERSE.filter((asset) => matchesCategory(asset, category)),
    [category],
  );
  const scan = useScreenerScan(scoped, "multi");

  return (
    <ScreenerScanShell
      variant="multi"
      filters={scan.draft}
      onFiltersChange={scan.setDraft}
      scanning={scan.scanning}
      onScan={scan.runScan}
      timeframe={scan.applied.timeframe}
      resultCount={scan.ranked.length}
      dispatched={dispatched}
      toolbar={
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-zinc-800/80 bg-zinc-950/80 text-zinc-400 hover:border-zinc-700/80 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      }
    >
      <ScreenerResultsTable
        rows={scan.ranked}
        selected={scan.selected}
        onToggle={scan.toggle}
        onToggleAll={scan.toggleAll}
        onDispatch={onDispatch}
        scanning={scan.scanning}
        emptyLabel="Ningún activo multi cumple la tesis de pre-detonación."
        cupo={scan.cupo}
        onMarkTop={scan.markTop}
        extraHead={<th className={thClass}>Sesión / Spread</th>}
        extraCell={(asset) => (
          <td className="px-3 py-2">
            <SessionPills asset={asset} />
            <p className="mt-1 font-mono text-[10px] tabular-nums text-zinc-500">
              {asset.spreadBps?.toFixed(1) ?? "—"} bps · BTC {asset.btcCorrelation.toFixed(2)}
            </p>
          </td>
        )}
      />
    </ScreenerScanShell>
  );
}

function SessionPills({ asset }: { asset: UniverseAsset }) {
  const session = asset.session;
  if (!session) {
    return <span className="text-zinc-600">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      <SessionDot label="NY" open={session.ny} />
      <SessionDot label="LDN" open={session.london} />
      <SessionDot label="TKO" open={session.asia} />
    </div>
  );
}

function SessionDot({ label, open }: { label: string; open: boolean }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        open ? "bg-bull/15 text-bull" : "bg-zinc-800 text-zinc-500"
      }`}
    >
      {label}
    </span>
  );
}
