"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NewsArticleDetail } from "@/components/news/NewsArticleDetail";
import { NewsMarketSidebar } from "@/components/news/NewsMarketSidebar";
import { NewsTelexList } from "@/components/news/NewsTelexList";
import { NewsToolbar } from "@/components/news/NewsToolbar";
import { WorldTvPlayer } from "@/components/news/WorldTvPlayer";
import {
  isWorldTvChannelId,
  WORLD_TV_CHANNELS,
  type WorldTvChannelId,
} from "@/components/news/worldTvChannels";
import { type NewsDeskFilter, type NewsSourceFilter } from "@/components/news/newsTheme";
import { fetchMarketNews, sortNewsNewestFirst, type NewsArticle } from "@/lib/newsApi";

export function NewsWorkspace() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<NewsSourceFilter>("Todas");
  const [desk, setDesk] = useState<NewsDeskFilter>("all");
  const searchParams = useSearchParams();
  const [tvChannel, setTvChannel] = useState<WorldTvChannelId>(WORLD_TV_CHANNELS[0].id);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
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
      if (!silent) {
        setArticles([]);
        setSelectedId(null);
        setError(err instanceof Error ? err.message : "No se pudo cargar el feed de noticias.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load(true);
    }, 45000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const tv = searchParams.get("tv");
    if (tv && isWorldTvChannelId(tv)) {
      setTvChannel(tv);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = articles.filter((article) => {
      if (source !== "Todas" && article.source !== source) {
        return false;
      }
      if (desk === "macro" && article.category !== "macro" && article.impact !== "high") {
        return false;
      }
      if (desk === "earnings" && article.category !== "earnings") {
        return false;
      }
      if (desk === "general" && article.category !== "general") {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = `${article.title} ${article.tickers.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
    return sortNewsNewestFirst(next);
  }, [articles, query, source, desk]);

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
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      <NewsToolbar
        query={query}
        onQuery={setQuery}
        source={source}
        onSource={setSource}
        desk={desk}
        onDesk={setDesk}
        onRefresh={() => void load()}
        loading={loading}
        count={filtered.length}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        <section className="min-h-0 overflow-y-auto">
          {error && !loading ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md rounded border border-red-500/40 bg-black p-4 text-center">
                <p className="text-sm text-red-200">{error}</p>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-3 rounded border border-zinc-700 bg-black px-3 py-1.5 font-mono text-[11px] text-zinc-200 hover:text-white"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <NewsTelexList
              articles={filtered}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
            />
          )}
          <NewsArticleDetail article={selected} loading={loading} />
          <NewsMarketSidebar articles={filtered} />
        </section>
        <section className="min-h-0 overflow-hidden bg-black p-2">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#1F1F2E] bg-black p-2">
            <WorldTvPlayer channelId={tvChannel} onChannel={setTvChannel} />
          </div>
        </section>
      </div>
    </div>
  );
}
