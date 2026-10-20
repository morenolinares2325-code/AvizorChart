"use client";

import Link from "next/link";
import type { NewsArticle } from "@/lib/newsApi";

const sentimentStyle: Record<NewsArticle["sentiment"], string> = {
  Bullish: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Bearish: "border-red-500/40 bg-red-500/10 text-red-300",
  Neutral: "border-zinc-600 bg-zinc-800 text-zinc-300",
};

const barStyle: Record<NewsArticle["sentiment"], string> = {
  Bullish: "bg-emerald-500",
  Bearish: "bg-red-500",
  Neutral: "bg-zinc-500",
};

const impactLabel: Record<NewsArticle["impact"], string> = {
  high: "Alto impacto",
  medium: "Impacto medio",
  low: "Impacto bajo",
};

export function NewsImpactBlock({ article }: { article: NewsArticle }) {
  return (
    <section className="rounded border border-zinc-800/80 bg-zinc-950/80 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Evaluación de impacto y sentimiento
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${sentimentStyle[article.sentiment]}`}
        >
          {article.sentiment}
        </span>
        <span
          className={`font-mono text-[11px] ${
            article.impact === "high" ? "text-red-400" : "text-zinc-400"
          }`}
        >
          {impactLabel[article.impact]}
        </span>
        <span className="ml-auto font-mono text-xs tabular-nums text-zinc-200">{article.score}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full ${barStyle[article.sentiment]}`}
          style={{ width: `${article.score}%` }}
        />
      </div>
      {article.tickers.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {article.tickers.map((ticker) => (
            <Link
              key={ticker}
              href={`/grafico?symbol=${ticker}`}
              className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[11px] text-emerald-300 hover:border-emerald-500/40"
            >
              ${ticker}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 font-mono text-[10px] text-zinc-600">Sin tickers detectados</p>
      )}
    </section>
  );
}
