"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, CandlestickChart, Minus } from "lucide-react";
import { formatNewsTime, newsBias, primaryChartSymbol, type NewsArticle } from "@/lib/newsApi";

interface NewsTelexListProps {
  articles: NewsArticle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const impactLabel: Record<NewsArticle["impact"], string> = {
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
};

const categoryLabel: Record<NewsArticle["category"], string> = {
  macro: "Macro",
  earnings: "Earnings",
  general: "Corporate",
};

function cardTone(article: NewsArticle, active: boolean): string {
  const bias = newsBias(article);
  if (active) {
    if (bias.side === "buy") {
      return "border-[#00FF66]/55 bg-black shadow-[0_0_24px_rgba(0,255,102,0.12)]";
    }
    if (bias.side === "sell") {
      return "border-[#FF3366]/55 bg-black shadow-[0_0_24px_rgba(255,51,102,0.12)]";
    }
    return "border-[#00FF66]/45 bg-black shadow-[0_0_24px_rgba(0,255,102,0.08)]";
  }
  if (article.impact === "high" && bias.side === "buy") {
    return "border-[#00FF66]/35 bg-black hover:border-[#00FF66]/55";
  }
  if (article.impact === "high" && bias.side === "sell") {
    return "border-[#FF3366]/40 bg-black hover:border-[#FF3366]/55";
  }
  if (article.impact === "medium") {
    return "border-amber-500/35 bg-black hover:border-amber-400/50";
  }
  return "border-[#1F1F2E] bg-black hover:border-zinc-600";
}

function railTone(article: NewsArticle): string {
  const bias = newsBias(article);
  if (bias.side === "buy") {
    return "bg-[#00FF66]";
  }
  if (bias.side === "sell") {
    return "bg-[#FF3366]";
  }
  return article.impact === "high" ? "bg-amber-400" : "bg-zinc-600";
}

function BiasMark({ article }: { article: NewsArticle }) {
  const bias = newsBias(article);
  if (bias.side === "buy") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#00FF66]/40 bg-[#00FF66]/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#00FF66]">
        <ArrowUpRight className="h-3 w-3" />
        BUY · {bias.force}
      </span>
    );
  }
  if (bias.side === "sell") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-[#FF3366]/40 bg-[#FF3366]/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#FF3366]">
        <ArrowDownRight className="h-3 w-3" />
        SELL · {bias.force}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-zinc-400">
      <Minus className="h-3 w-3" />
      WAIT · {bias.force}
    </span>
  );
}

export function NewsTelexList({ articles, selectedId, onSelect, loading }: NewsTelexListProps) {
  if (loading) {
    return (
      <ul className="space-y-2 p-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="animate-pulse rounded-lg border border-[#1F1F2E] bg-black p-3">
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
        const bias = newsBias(article);
        return (
          <li key={article.id}>
            <article className={`overflow-hidden rounded-lg border transition duration-200 ${cardTone(article, active)}`}>
              <div className="flex">
                <span className={`w-1 shrink-0 ${railTone(article)}`} aria-hidden />
                <div className="min-w-0 flex-1 p-3">
                  <button type="button" onClick={() => onSelect(article.id)} className="w-full text-left">
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      <span className={active ? "text-zinc-300" : ""}>{article.source}</span>
                      <span className="text-zinc-700">·</span>
                      <span>{formatNewsTime(article.published)}</span>
                      <span className="ml-auto text-zinc-500">{categoryLabel[article.category]}</span>
                    </div>
                    <p className={`mt-1.5 text-[13px] leading-snug ${active ? "text-zinc-50" : "text-zinc-200"}`}>
                      {article.title}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <BiasMark article={article} />
                      <span
                        className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
                          article.impact === "high"
                            ? "border-red-500/40 bg-red-500/10 text-red-300"
                            : article.impact === "medium"
                              ? "border-amber-500/35 bg-amber-500/10 text-amber-300"
                              : "border-zinc-700 text-zinc-500"
                        }`}
                      >
                        Impacto {impactLabel[article.impact]}
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
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/40">
                      <div
                        className={`h-full rounded-full ${
                          bias.side === "buy" ? "bg-[#00FF66]" : bias.side === "sell" ? "bg-[#FF3366]" : "bg-zinc-500"
                        }`}
                        style={{ width: `${Math.min(100, bias.force)}%` }}
                      />
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
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
