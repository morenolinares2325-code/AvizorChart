"use client";

import { formatNewsTime, type NewsArticle } from "@/lib/newsApi";

interface NewsTelexListProps {
  articles: NewsArticle[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

const sentimentDot: Record<NewsArticle["sentiment"], string> = {
  Bullish: "bg-emerald-400",
  Bearish: "bg-red-400",
  Neutral: "bg-zinc-500",
};

const impactTone: Record<NewsArticle["impact"], string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-zinc-500",
};

export function NewsTelexList({ articles, selectedId, onSelect, loading }: NewsTelexListProps) {
  if (loading) {
    return (
      <ul className="space-y-2 p-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="animate-pulse rounded border border-zinc-800/60 bg-zinc-950/60 p-3">
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
    <ul className="divide-y divide-zinc-800/80">
      {articles.map((article) => {
        const active = article.id === selectedId;
        return (
          <li key={article.id}>
            <button
              type="button"
              onClick={() => onSelect(article.id)}
              className={`w-full px-3 py-2.5 text-left transition ${
                active ? "bg-emerald-500/10" : "hover:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                <span className={`h-1.5 w-1.5 rounded-full ${sentimentDot[article.sentiment]}`} />
                <span className="text-zinc-500">{article.source}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{formatNewsTime(article.published)}</span>
                <span className={`ml-auto ${impactTone[article.impact]}`}>
                  {article.impact === "high" ? "ALERTA" : article.impact}
                </span>
              </div>
              <p className={`mt-1 text-[13px] leading-snug ${active ? "text-zinc-50" : "text-zinc-200"}`}>
                {article.title}
              </p>
              {article.tickers.length > 0 ? (
                <p className="mt-1 font-mono text-[10px] text-emerald-400/80">
                  {article.tickers.map((ticker) => `$${ticker}`).join("  ")}
                </p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
