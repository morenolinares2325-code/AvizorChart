import { API_BASE } from "@/lib/marketApi";

export type NewsSource = "CNBC" | "Yahoo Finance" | "MarketWatch" | "Investing";
export type NewsSentiment = "Bullish" | "Bearish" | "Neutral";
export type NewsImpact = "high" | "medium" | "low";
export type NewsCategory = "macro" | "earnings" | "general";

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
  category: NewsCategory;
}

export const NEWS_SOURCES: NewsSource[] = ["CNBC", "Yahoo Finance", "MarketWatch", "Investing"];

const CHART_ALIAS: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  EURUSD: "EURUSD=X",
  GBPUSD: "GBPUSD=X",
  USDJPY: "USDJPY=X",
  SPX: "^GSPC",
  NDX: "^IXIC",
};

export function toChartSymbol(ticker: string): string {
  const key = ticker.trim().toUpperCase();
  return CHART_ALIAS[key] ?? key;
}

export function primaryChartSymbol(article: NewsArticle): string | null {
  const ticker = article.tickers[0];
  return ticker ? toChartSymbol(ticker) : null;
}

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
  if (value === "CNBC" || value === "Yahoo Finance" || value === "MarketWatch" || value === "Investing") {
    return value;
  }
  if (value === "Yahoo" || value === "yahoo" || value === "YahooFinance") {
    return "Yahoo Finance";
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

function asCategory(value: unknown): NewsCategory {
  if (value === "macro" || value === "earnings" || value === "general") {
    return value;
  }
  return "general";
}

function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function spreadScore(article: Pick<NewsArticle, "id" | "title" | "sentiment" | "score">): number {
  const seed = hashSeed(`${article.id}|${article.title}|${article.sentiment}`);
  if (article.sentiment === "Neutral") {
    return 28 + (seed % 37);
  }
  const intensity = Math.max(54, Math.min(96, article.score || 62));
  const mixed = Math.round(intensity * 0.28 + (56 + (seed % 40)) * 0.72);
  return Math.max(54, Math.min(97, mixed));
}

function uniquifyConsecutiveScores(articles: NewsArticle[]): NewsArticle[] {
  const next: NewsArticle[] = [];
  const recent = new Set<number>();
  for (const article of articles) {
    let score = spreadScore(article);
    let step = 1;
    while ((recent.has(score) || next.some((item, index) => index >= next.length - 4 && item.score === score)) && step < 24) {
      const sign = step % 2 === 0 ? 1 : -1;
      const lo = article.sentiment === "Neutral" ? 28 : 54;
      const hi = article.sentiment === "Neutral" ? 64 : 97;
      score = Math.min(hi, Math.max(lo, score + sign * Math.ceil(step / 2)));
      step += 1;
    }
    recent.add(score);
    if (recent.size > 6) {
      const first = recent.values().next().value;
      if (typeof first === "number") {
        recent.delete(first);
      }
    }
    next.push({ ...article, score });
  }
  return next;
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
    category: asCategory(raw.category),
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
  return uniquifyConsecutiveScores(
    sortNewsNewestFirst(
      list
        .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
        .map((item, index) => normalizeArticle(item, index)),
    ),
  );
}

export function newsPublishedTs(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortNewsNewestFirst(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((left, right) => newsPublishedTs(right.published) - newsPublishedTs(left.published));
}

export type NewsBias = "buy" | "sell" | "wait";

export function newsBias(article: NewsArticle): { side: NewsBias; label: string; force: number } {
  const force = Math.max(1, Math.min(99, Math.round(article.score)));
  if (article.sentiment === "Bullish") {
    return { side: "buy", label: "BUY", force };
  }
  if (article.sentiment === "Bearish") {
    return { side: "sell", label: "SELL", force };
  }
  return { side: "wait", label: "WAIT", force };
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
