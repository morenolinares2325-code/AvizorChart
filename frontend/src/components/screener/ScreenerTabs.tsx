"use client";

import { SCREENER_TABS, type ScreenerTabId } from "@/lib/mockScreenerData";

interface ScreenerTabsProps {
  active: ScreenerTabId;
  onChange: (id: ScreenerTabId) => void;
}

export function ScreenerTabs({ active, onChange }: ScreenerTabsProps) {
  return (
    <div className="border-b border-zinc-800/80 bg-zinc-950/40 p-2 backdrop-blur-md">
      <div
        className="flex min-w-max gap-1 overflow-x-auto rounded-full border border-zinc-800/80 bg-zinc-900/60 p-1"
        role="tablist"
        aria-label="Modos del screener"
      >
        {SCREENER_TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onChange(tab.id)}
              className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm transition-all ${
                selected
                  ? "bg-zinc-950 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "text-zinc-400 hover:bg-zinc-950/50 hover:text-zinc-200"
              }`}
            >
              {tab.label}
              {selected ? (
                <span className="absolute inset-x-5 bottom-1 h-[2px] rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.25)]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
