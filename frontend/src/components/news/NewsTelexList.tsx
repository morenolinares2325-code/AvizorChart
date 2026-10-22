"use client";

import Link from "next/link";
import { CandlestickChart } from "lucide-react";
import { formatNewsTime, primaryChartSymbol, type NewsArticle } from "@/lib/newsApi";

interface NewsTelexListProps {
  articles: NewsArticle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const sentimentStyle: Record<NewsArticle["sentiment"], string> = {
  Bullish: "border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66]",
  Bearish: "border-red-500/40 bg-red-500/10 text-red-400",
  Neutral: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

const impactStyle: Record<NewsArticle["impact"], string> = {
  high: "border-red-500/40 bg-red-500/10 text-red-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  low: "border-zinc-700 text-zinc-500",
};

const impactLabel: Record<NewsArticle["impact"], string> = {
  high: "Alto impacto",
  medium: "Medio",
  low: "General",
};

const categoryLabel: Record<NewsArticle["category"], string> = {
  macro: "Macro",
  earnings: "Earnings",
  general: "Corporate",
};

export function NewsTelexList({ articles, selectedId, onSelect, loading }: NewsTelexListProps) {
  if (loading) {
    return (
      <ul className="space-y-2 p-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="animate-pulse rounded-lg border border-[#00FF66]/10 bg-[#0A0A0F] p-3">
            <div className="h-2 w-24 rounded bg-zinc-800" />
            <div className="mt-2 h-3 w-full rounded bg-zinc-800" />
            <div className="mt-1.5 h-3 w-2/3 rounded bg-zinc-800" />
          </li>
        ))}
      </ul>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="p-4 font-mono text-xs text-zinc-500">No hay teletipos para este filtro.</p>
    );
  }

  return (
    <ul className="space-y-2 p-2">
      {articles.map((article) => {
        const active = article.id === selectedId;
        const chartSymbol = primaryChartSymbol(article);
        return (
          <li key={article.id}>
            <article
              className={`rounded-lg border bg-[#0A0A0F] p-3 transition duration-200 ${
                active
                  ? "border-[#00FF66]/45 shadow-[0_0_24px_rgba(0,255,102,0.08)]"
                  : "border-[#00FF66]/12 hover:border-[#00FF66]/30"
              }`}
            >
              <button type="button" onClick={() => onSelect(article.id)} className="w-full text-left">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <span>{article.source}</span>
                  <span className="text-zinc-700">·</span>
                  <span>{formatNewsTime(article.published)}</span>
                  <span className="ml-auto text-zinc-600">{categoryLabel[article.category]}</span>
                </div>
                <p className={`mt-1.5 text-[13px] leading-snug ${active ? "text-zinc-50" : "text-zinc-200"}`}>
                  {article.title}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${sentimentStyle[article.sentiment]}`}
                  >
                    {article.sentiment}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${impactStyle[article.impact]}`}
                  >
                    {impactLabel[article.impact]}
                  </span>
                  {article.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      className="rounded border border-[#00FF66]/20 px-1.5 py-0.5 font-mono text-[10px] text-[#00FF66]"
                    >
                      {ticker}
                    </span>
                  ))}
                </div>
              </button>
              {chartSymbol ? (
                <Link
                  href={`/grafico?symbol=${encodeURIComponent(chartSymbol)}`}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded border border-[#00FF66]/30 bg-[#00FF66]/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#00FF66] transition hover:bg-[#00FF66]/20"
                >
                  <CandlestickChart className="h-3.5 w-3.5" aria-hidden />
                  Analizar en Mega Gráfico
                </Link>
              ) : (
                <p className="mt-2 font-mono text-[10px] text-zinc-600">Sin ticker para el gráfico</p>
              )}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
