"use client";

import { RefreshCw, Search } from "lucide-react";
import {
  NEWS_DESK_FILTER,
  NEWS_SOURCES_FILTER,
  type NewsDeskFilter,
  type NewsSourceFilter,
} from "@/components/news/newsTheme";

interface NewsToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  source: NewsSourceFilter;
  onSource: (value: NewsSourceFilter) => void;
  desk: NewsDeskFilter;
  onDesk: (value: NewsDeskFilter) => void;
  onRefresh: () => void;
  loading: boolean;
  count: number;
}

const deskTone: Record<NewsDeskFilter, string> = {
  all: "bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/40",
  macro: "bg-red-500/20 text-red-300 border-red-500/40",
  earnings: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  general: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

export function NewsToolbar({
  query,
  onQuery,
  source,
  onSource,
  desk,
  onDesk,
  onRefresh,
  loading,
  count,
}: NewsToolbarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-[#00FF66]/15 bg-[#050508] pl-12 pr-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="h-8 w-40 rounded border border-[#00FF66]/20 bg-[#0A0A0F] pl-8 pr-2 font-mono text-xs text-zinc-100 outline-none focus:border-[#00FF66]/50 sm:w-52"
          placeholder="Título o ticker"
        />
      </div>

      <div className="flex h-8 min-w-0 items-center gap-1 overflow-x-auto">
        {NEWS_DESK_FILTER.map((item) => {
          const active = desk === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onDesk(item.id)}
              className={`shrink-0 rounded border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide transition ${
                active ? deskTone[item.id] : "border-transparent text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {item.id === "macro" ? "Alto Impacto / Macro" : item.id === "earnings" ? "Earnings / Corporate" : item.label}
            </button>
          );
        })}
      </div>

      <div className="hidden h-8 items-center overflow-x-auto rounded border border-[#00FF66]/15 p-0.5 md:flex">
        {NEWS_SOURCES_FILTER.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSource(item)}
            className={`shrink-0 rounded px-2 font-mono text-[11px] ${
              source === item ? "bg-[#00FF66]/10 text-[#00FF66]" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {item === "Yahoo Finance" ? "Yahoo" : item}
          </button>
        ))}
      </div>

      <p className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:block">
        {count} teletipos
      </p>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="inline-flex h-8 items-center gap-1.5 rounded border border-[#00FF66]/20 bg-[#0A0A0F] px-2.5 font-mono text-[11px] text-zinc-300 transition hover:border-[#00FF66]/40 hover:text-white disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Actualizar
      </button>
    </div>
  );
}
