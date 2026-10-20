"use client";

import { Bot, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ChangeCell,
  PrimaryButton,
  ScoreCell,
  SqueezeBadge,
  formatPrice,
  hudPanelClass,
  primaryButtonClass,
} from "@/components/screener/screenerUi";
import { searchUniverse, type UniverseAsset } from "@/lib/mockScreenerData";

interface DirectSearchTabProps {
  onSendToDesk: (ticker: string) => void;
}

export function DirectSearchTab({ onSendToDesk }: DirectSearchTabProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UniverseAsset | null>(null);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => searchUniverse(query), [query]);

  function analyze(asset: UniverseAsset) {
    setSelected(asset);
    setQuery(asset.ticker);
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Ticker o nombre (AAPL, EURUSD, BTC, GC…)"
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2.5 pl-10 pr-24 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-bull/50"
        />
        <button
          type="button"
          onClick={() => {
            if (matches[0]) {
              analyze(matches[0]);
            }
          }}
          className={`${primaryButtonClass} absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs`}
        >
          Analizar
        </button>
        {open && matches.length > 0 ? (
          <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 shadow-terminal">
            {matches.map((asset) => (
              <li key={asset.ticker}>
                <button
                  type="button"
                  onClick={() => analyze(asset)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-zinc-800"
                >
                  <span className="font-mono font-semibold text-zinc-100">{asset.ticker}</span>
                  <span className="truncate pl-3 text-xs text-zinc-500">{asset.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {selected ? (
        <article className={`${hudPanelClass} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
                {selected.assetClass}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-50">
                {selected.ticker}{" "}
                <span className="text-base font-normal text-zinc-400">{selected.name}</span>
              </h2>
            </div>
            <ScoreCell score={selected.score} />
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Último precio</dt>
              <dd className="mt-1 font-mono text-lg text-zinc-100">{formatPrice(selected.last)}</dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Variación diaria</dt>
              <dd className="mt-1 text-lg">
                <ChangeCell value={selected.changePct} />
              </dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">RVOL</dt>
              <dd className="mt-1 font-mono text-lg text-zinc-100">{selected.rvol.toFixed(2)}</dd>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
              <dt className="text-[11px] uppercase tracking-wider text-zinc-500">Compresión</dt>
              <dd className="mt-2">
                <SqueezeBadge state={selected.squeeze} />
              </dd>
            </div>
          </dl>

          <PrimaryButton className="mt-6" onClick={() => onSendToDesk(selected.ticker)}>
            <Bot className="h-4 w-4" />
            Enviar a Mesa de Agentes
          </PrimaryButton>
        </article>
      ) : (
        <p className="text-sm text-zinc-500">
          Escribe un ticker para ver el informe mock (OHLCV, squeeze y score Avizor). En
          producción este flujo llamará a <code className="font-mono text-zinc-300">http://localhost:8000</code>.
        </p>
      )}
    </div>
  );
}
