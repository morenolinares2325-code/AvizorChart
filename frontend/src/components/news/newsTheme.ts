export const NEWS_SOURCES_FILTER = ["Todas", "CNBC", "Yahoo Finance", "MarketWatch"] as const;
export const NEWS_IMPACT_FILTER = [
  { id: "all", label: "Todos" },
  { id: "high", label: "Alto Impacto" },
  { id: "medium", label: "Medio" },
  { id: "low", label: "Bajo" },
] as const;

export type NewsSourceFilter = (typeof NEWS_SOURCES_FILTER)[number];
export type NewsImpactFilter = (typeof NEWS_IMPACT_FILTER)[number]["id"];

export const LIVE_CHANNELS = [
  {
    id: "bloomberg",
    label: "Bloomberg",
    title: "Bloomberg Originals LIVE",
    videoId: "OlUMDZchivQ",
  },
  {
    id: "cnbc",
    label: "CNBC",
    title: "CNBC 24/7",
    videoId: "9NyxcX3rhQs",
  },
  {
    id: "yahoo",
    label: "Yahoo",
    title: "Yahoo Finance 24/7",
    videoId: "KQp-e_XQnDE",
  },
  {
    id: "sky",
    label: "Sky News",
    title: "Sky News Live",
    videoId: "cY-6Ari01EE",
  },
  {
    id: "cna",
    label: "CNA",
    title: "CNA 24/7 Asia",
    videoId: "-PWMxjBgr0k",
  },
  {
    id: "dw",
    label: "DW",
    title: "DW News Live",
    videoId: "LuKwFajn37U",
  },
  {
    id: "abc",
    label: "ABC",
    title: "ABC News Australia",
    videoId: "vOTiJkg1voo",
  },
  {
    id: "bbg-tv",
    label: "BBG TV",
    title: "Bloomberg Television",
    videoId: "iyOq8DhaMYw",
  },
] as const;

export type LiveChannelId = (typeof LIVE_CHANNELS)[number]["id"];

export function liveEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
}
