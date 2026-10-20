"use client";

import type { ReactNode } from "react";
import { Send } from "lucide-react";
import {
  ActionLink,
  ChangeCell,
  PrimaryButton,
  ScoreBar,
  SqueezeBadge,
  SupertrendBadge,
  TimingBadge,
  formatPrice,
  hudPanelClass,
  thClass,
} from "@/components/screener/screenerUi";
import { patternLabel, type UniverseAsset } from "@/lib/mockScreenerData";
import type { CupoSize } from "@/lib/screenerEngine";

interface ScreenerResultsTableProps {
  rows: UniverseAsset[];
  selected: string[];
  onToggle: (ticker: string) => void;
  onToggleAll: () => void;
  onDispatch: (tickers: string[]) => void;
  scanning: boolean;
  emptyLabel: string;
  cupo: CupoSize;
  onMarkTop: (cupo: CupoSize) => void;
  extraHead?: ReactNode;
  extraCell?: (asset: UniverseAsset) => ReactNode;
}

export function ScreenerResultsTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  onDispatch,
  scanning,
  emptyLabel,
  cupo,
  onMarkTop,
  extraHead,
  extraCell,
}: ScreenerResultsTableProps) {
  const allChecked = rows.length > 0 && selected.length === rows.length;
  const extraCount = extraHead ? 1 : 0;

  return (
    <div className={`${hudPanelClass} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-3 py-2.5">
        <p className="font-mono text-xs tabular-nums text-zinc-300">
          Seleccionadas:{" "}
          <span className="text-emerald-400">{selected.length}</span> activos
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] uppercase tracking-wider text-zinc-500">
            Marcar top
            <select
              value={cupo}
              onChange={(event) => onMarkTop(Number(event.target.value) as CupoSize)}
              className="ml-2 rounded-md border border-zinc-800/80 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-100"
            >
              <option value={1}>Top 1</option>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
            </select>
          </label>
          <PrimaryButton
            disabled={selected.length === 0}
            onClick={() => onDispatch(selected)}
            className="px-3 py-1.5 text-xs"
          >
            <Send className="h-3.5 w-3.5" />
            Transferir seleccionadas a la Mesa de Analistas ({selected.length})
          </PrimaryButton>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        {scanning ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-400">
              Escaneando universo…
            </p>
          </div>
        ) : null}
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950/90">
            <tr>
              <th className={`${thClass} w-10`}>
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={onToggleAll}
                  aria-label="Seleccionar todas"
                  className="accent-emerald-500"
                />
              </th>
              <th className={thClass}>Score Avizor (0-100)</th>
              <th className={thClass}>Ticker</th>
              <th className={thClass}>Precio</th>
              <th className={thClass}>Cambio</th>
              {extraHead}
              <th className={thClass}>Squeeze</th>
              <th className={thClass}>Supertrend</th>
              <th className={thClass}>Figura</th>
              <th className={thClass}>Timing</th>
              <th className={thClass}>R:B</th>
              <th className={thClass}>Gráfico</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => {
              const checked = selected.includes(asset.ticker);
              return (
                <tr
                  key={asset.ticker}
                  className={`border-t border-zinc-800/80 transition-all hover:bg-zinc-900/60 ${
                    checked ? "bg-emerald-950/20" : "bg-zinc-950/40"
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggle(asset.ticker)}
                      aria-label={`Seleccionar ${asset.ticker}`}
                      className="accent-emerald-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ScoreBar score={asset.score} />
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-mono font-semibold tabular-nums text-zinc-100">
                      {asset.ticker}
                    </p>
                    <p className="text-[11px] text-zinc-500">{asset.name}</p>
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-200">
                    {formatPrice(asset.last)}
                  </td>
                  <td className="px-3 py-2">
                    <ChangeCell value={asset.changePct} />
                  </td>
                  {extraCell ? extraCell(asset) : null}
                  <td className="px-3 py-2">
                    <SqueezeBadge state={asset.squeeze} />
                  </td>
                  <td className="px-3 py-2">
                    <SupertrendBadge state={asset.supertrend} />
                  </td>
                  <td className="px-3 py-2 text-[11px] text-zinc-400">
                    {patternLabel(asset.pattern)}
                  </td>
                  <td className="px-3 py-2">
                    <TimingBadge timing={asset.timing} />
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-zinc-300">
                    1:{asset.setupRR.toFixed(1)}
                  </td>
                  <td className="px-3 py-2">
                    <ActionLink href={`/grafico?symbol=${asset.ticker}`} label="Gráfico" />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && !scanning ? (
              <tr>
                <td colSpan={11 + extraCount} className="px-3 py-8 text-center text-zinc-500">
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
