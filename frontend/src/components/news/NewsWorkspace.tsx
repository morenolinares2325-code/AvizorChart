"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NewsArticleDetail } from "@/components/news/NewsArticleDetail";
import { NewsFloatingTv, NewsLiveTv } from "@/components/news/NewsLiveTv";
import { NewsMarketSidebar } from "@/components/news/NewsMarketSidebar";
import { NewsTelexList } from "@/components/news/NewsTelexList";
import { NewsToolbar } from "@/components/news/NewsToolbar";
import type { LiveChannelId, NewsImpactFilter, NewsSourceFilter } from "@/components/news/newsTheme";
import { fetchMarketNews, type NewsArticle } from "@/lib/newsApi";

export function NewsWorkspace() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceFilter>("Todas");
  const [impact, setImpact] = useState<NewsImpactFilter>("all");
  const [channel, setChannel] = useState<LiveChannelId>("bloomberg");
  const [playing, setPlaying] = useState(true);
  const [floating, setFloating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchMarketNews();
      setArticles(payload);
      setSelectedId((current) => {
        if (current && payload.some((item) => item.id === current)) {
          return current;
        }
        return payload[0]?.id ?? null;
      });
    } catch (err) {
      setArticles([]);
      setSelectedId(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar el feed de noticias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles.filter((article) => {
      if (source !== "Todas" && article.source !== source) {
        return false;
      }
      if (impact !== "all" && article.impact !== impact) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${article.title} ${article.tickers.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [articles, query, source, impact]);

  useEffect(() => {
    if (filtered.length === 0) {
      return;
    }
    if (!filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08090d]">
      <NewsToolbar
        query={query}
        onQuery={setQuery}
        source={source}
        onSource={setSource}
        impact={impact}
        onImpact={setImpact}
        onRefresh={() => void load()}
        loading={loading}
        count={filtered.length}
      />

      {error && !loading ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md rounded border border-red-500/30 bg-red-950/30 p-4 text-center">
            <p className="text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-3 rounded border border-zinc-700 px-3 py-1.5 font-mono text-[11px] text-zinc-200 hover:text-white"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[32%_45%_23%]">
          <section className="min-h-0 overflow-y-auto border-zinc-800/80 lg:border-r">
            <NewsTelexList
              articles={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
            />
          </section>
          <section className="min-h-0 overflow-y-auto border-zinc-800/80 lg:border-r">
            <NewsArticleDetail article={selected} loading={loading} />
          </section>
          <aside className="min-h-0 overflow-y-auto">
            <NewsLiveTv
              channel={channel}
              onChannel={setChannel}
              playing={playing}
              onPlaying={setPlaying}
              floating={floating}
              onFloating={setFloating}
            />
            <NewsMarketSidebar articles={filtered} />
          </aside>
        </div>
      )}

      {floating && playing ? (
        <NewsFloatingTv
          channel={channel}
          playing={playing}
          onDock={() => setFloating(false)}
          onStop={() => {
            setFloating(false);
            setPlaying(false);
          }}
        />
      ) : null}
    </div>
  );
}
