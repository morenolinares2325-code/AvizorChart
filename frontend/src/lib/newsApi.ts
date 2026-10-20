import { API_BASE } from "@/lib/marketApi";

export type NewsSource = "CNBC" | "Yahoo Finance" | "MarketWatch";
export type NewsSentiment = "Bullish" | "Bearish" | "Neutral";
export type NewsImpact = "high" | "medium" | "low";

export interface NewsArticle {
  id: string;
  source: NewsSource;
  title: string;
  summary: string;
  url: string;
  published: string;
  tickers: string[];
  sentiment: NewsSentiment;
  score: number;
  impact: NewsImpact;
}

export const NEWS_SOURCES: NewsSource[] = ["CNBC", "Yahoo Finance", "MarketWatch"];

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function asSource(value: unknown): NewsSource {
  if (value === "CNBC" || value === "Yahoo Finance" || value === "MarketWatch") {
    return value;
  }
  return "Yahoo Finance";
}

function asSentiment(value: unknown): NewsSentiment {
  if (value === "Bullish" || value === "Bearish" || value === "Neutral") {
    return value;
  }
  return "Neutral";
}

function asImpact(value: unknown): NewsImpact {
  if (value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "low";
}

function normalizeArticle(raw: Record<string, unknown>, index: number): NewsArticle {
  const title = stripHtml(String(raw.title ?? "Sin titular"));
  const url = String(raw.url ?? "#");
  const id = String(raw.id ?? url ?? `news-${index}`);
  const tickers = Array.isArray(raw.tickers)
    ? raw.tickers.map((item) => String(item).toUpperCase()).filter(Boolean)
    : [];
  const score = Number(raw.score);
  return {
    id,
    source: asSource(raw.source),
    title,
    summary: stripHtml(String(raw.summary ?? "")),
    url,
    published: String(raw.published ?? ""),
    tickers,
    sentiment: asSentiment(raw.sentiment),
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 50,
    impact: asImpact(raw.impact),
  };
}

export async function fetchMarketNews(): Promise<NewsArticle[]> {
  const response = await fetch(`${API_BASE}/api/market/news`);
  if (!response.ok) {
    let detail = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      detail = (await response.text()) || detail;
    }
    throw new Error(detail);
  }
  const payload = (await response.json()) as { articles?: unknown };
  const list = Array.isArray(payload.articles) ? payload.articles : [];
  return list
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item, index) => normalizeArticle(item, index));
}

export function formatNewsTime(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value || "—";
  }
  return new Date(parsed).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
