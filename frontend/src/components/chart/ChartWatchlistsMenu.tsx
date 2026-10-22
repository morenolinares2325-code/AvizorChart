"use client";

import { Briefcase, ChevronDown } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import { WATCHLISTS, type WatchlistId } from "@/components/chart/chartTypes";

interface ChartWatchlistsMenuProps {
  open: boolean;
  onToggle: () => void;
  activeList: WatchlistId;
  ticker: string;
  onSelectList: (id: WatchlistId) => void;
  onTicker: (ticker: string) => void;
}

export function ChartWatchlistsMenu({
  open,
  onToggle,
  activeList,
  ticker,
  onSelectList,
  onTicker,
}: ChartWatchlistsMenuProps) {
  const current = WATCHLISTS.find((item) => item.id === activeList) ?? WATCHLISTS[0];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 max-w-[9.5rem] items-center gap-1.5 rounded-md px-1.5 font-mono text-[11px] tracking-tight text-zinc-400 hover:bg-white/[0.04] hover:text-white"
        title="Carteras / Listas"
      >
        <Briefcase className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden truncate xl:inline">{current.name}</span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div data-chrome="menu" className="absolute right-0 top-full z-[80] mt-1 w-56 rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1">
          <SectionLabel>Carteras / Listas</SectionLabel>
          {WATCHLISTS.map((list) => (
            <div key={list.id} className="border-t border-[#1F1F2E] px-2 py-1.5">
              <button
                type="button"
                onClick={() => {
                  onSelectList(list.id);
                  onTicker(list.tickers[0]);
                  onToggle();
                }}
                className={`mb-1 font-mono text-[11px] ${
                  list.id === activeList ? "text-[#00FF66]" : "text-zinc-200 hover:text-white"
                }`}
              >
                {list.name}
              </button>
              <div className="flex flex-wrap gap-1">
                {list.tickers.map((symbol) => (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => {
                      onSelectList(list.id);
                      onTicker(symbol);
                      onToggle();
                    }}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
                      ticker === symbol
                        ? "border-[#00FF66]/50 text-[#00FF66]"
                        : "border-[#1F1F2E] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
