"use client";

import { ExternalLink } from "lucide-react";
import { NewsImpactBlock } from "@/components/news/NewsImpactBlock";
import { formatNewsTime, type NewsArticle } from "@/lib/newsApi";

interface NewsArticleDetailProps {
  article: NewsArticle | null;
  loading: boolean;
}

export function NewsArticleDetail({ article, loading }: NewsArticleDetailProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3 p-4">
        <div className="h-24 rounded border border-zinc-800 bg-zinc-950" />
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-5/6 rounded bg-zinc-800" />
        <div className="h-3 w-2/3 rounded bg-zinc-800" />
      </div>
    );
  }

  if (!article) {
    return <p className="p-6 font-mono text-xs text-zinc-500">Selecciona un teletipo para ver el detalle.</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <NewsImpactBlock article={article} />
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {article.source} · {formatNewsTime(article.published)}
        </p>
        <h1 className="mt-2 text-xl font-semibold leading-snug text-zinc-50">{article.title}</h1>
      </header>
      <p className="text-sm leading-relaxed text-zinc-300">
        {article.summary || "Esta fuente no adjunta resumen. Abre el artículo original para el texto completo."}
      </p>
      <a
        href={article.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-3 py-1.5 font-mono text-[11px] text-emerald-300 hover:border-emerald-500/40"
      >
        Abrir fuente original
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
