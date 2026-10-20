"use client";

import { RefreshCw, Search } from "lucide-react";
import {
  NEWS_IMPACT_FILTER,
  NEWS_SOURCES_FILTER,
  type NewsImpactFilter,
  type NewsSourceFilter,
} from "@/components/news/newsTheme";

interface NewsToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  source: NewsSourceFilter;
  onSource: (value: NewsSourceFilter) => void;
  impact: NewsImpactFilter;
  onImpact: (value: NewsImpactFilter) => void;
  onRefresh: () => void;
  loading: boolean;
  count: number;
}

export function NewsToolbar({
  query,
  onQuery,
  source,
  onSource,
  impact,
  onImpact,
  onRefresh,
  loading,
  count,
}: NewsToolbarProps) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800/80 bg-[#08090d] px-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          className="h-8 w-44 rounded border border-zinc-800 bg-zinc-950 pl-8 pr-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-500/50 sm:w-56"
          placeholder="Título o ticker"
        />
      </div>

      <div className="hidden h-8 items-center overflow-x-auto rounded border border-zinc-800 p-0.5 md:flex">
        {NEWS_SOURCES_FILTER.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSource(item)}
            className={`shrink-0 rounded px-2 font-mono text-[11px] ${
              source === item ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {item === "Yahoo Finance" ? "Yahoo" : item}
          </button>
        ))}
      </div>

      <div className="hidden h-8 items-center overflow-x-auto rounded border border-zinc-800 p-0.5 lg:flex">
        {NEWS_IMPACT_FILTER.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onImpact(item.id)}
            className={`shrink-0 rounded px-2 font-mono text-[11px] ${
              impact === item.id
                ? item.id === "high"
                  ? "bg-red-500/20 text-red-300"
                  : "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {item.label}
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
        className="inline-flex h-8 items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2.5 font-mono text-[11px] text-zinc-300 hover:text-white disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        Actualizar
      </button>
    </div>
  );
}
