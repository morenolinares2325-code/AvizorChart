"use client";

import Link from "next/link";
import { CandlestickChart } from "lucide-react";
import { newsBias, primaryChartSymbol, toChartSymbol, type NewsArticle } from "@/lib/newsApi";

const sentimentStyle: Record<NewsArticle["sentiment"], string> = {
  Bullish: "border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66]",
  Bearish: "border-red-500/40 bg-red-500/10 text-red-400",
  Neutral: "border-zinc-600 bg-zinc-800 text-zinc-300",
};

const barStyle: Record<NewsArticle["sentiment"], string> = {
  Bullish: "bg-[#00FF66]",
  Bearish: "bg-red-500",
  Neutral: "bg-zinc-500",
};

const impactLabel: Record<NewsArticle["impact"], string> = {
  high: "Alto impacto",
  medium: "Impacto medio",
  low: "Impacto bajo",
};

export function NewsImpactBlock({ article }: { article: NewsArticle }) {
  const chartSymbol = primaryChartSymbol(article);
  const bias = newsBias(article);
  return (
    <section
      className={`rounded-lg border bg-black p-3 ${
        bias.side === "buy"
          ? "border-[#00FF66]/40"
          : bias.side === "sell"
            ? "border-[#FF3366]/40"
            : "border-[#1F1F2E]"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        Evaluación de impacto y sesgo
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold ${
            bias.side === "buy"
              ? "border-[#00FF66]/40 bg-[#00FF66]/10 text-[#00FF66]"
              : bias.side === "sell"
                ? "border-[#FF3366]/40 bg-[#FF3366]/10 text-[#FF3366]"
                : sentimentStyle[article.sentiment]
          }`}
        >
          {bias.label} · fuerza {bias.force}
        </span>
        <span className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${sentimentStyle[article.sentiment]}`}>
          {article.sentiment}
        </span>
        <span
          className={`font-mono text-[11px] ${
            article.impact === "high" ? "text-red-400" : article.impact === "medium" ? "text-amber-300" : "text-zinc-400"
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
              href={`/grafico?symbol=${encodeURIComponent(toChartSymbol(ticker))}`}
              className="rounded border border-[#00FF66]/20 bg-[#050508] px-1.5 py-0.5 font-mono text-[11px] text-[#00FF66] hover:border-[#00FF66]/50"
            >
              {ticker}
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 font-mono text-[10px] text-zinc-600">Sin tickers detectados</p>
      )}
      {chartSymbol ? (
        <Link
          href={`/grafico?symbol=${encodeURIComponent(chartSymbol)}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded border border-[#00FF66]/35 bg-[#00FF66]/10 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#00FF66] transition hover:bg-[#00FF66]/20"
        >
          <CandlestickChart className="h-3.5 w-3.5" aria-hidden />
          Analizar en Mega Gráfico
        </Link>
      ) : null}
    </section>
  );
}
