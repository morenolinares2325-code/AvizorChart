export const NEWS_SOURCES_FILTER = ["Todas", "CNBC", "Yahoo Finance", "MarketWatch", "Investing"] as const;
export const NEWS_DESK_FILTER = [
  { id: "all", label: "TODOS" },
  { id: "macro", label: "Alto Impacto / Macro" },
  { id: "earnings", label: "Earnings / Corporate" },
  { id: "general", label: "General" },
] as const;

export type NewsSourceFilter = (typeof NEWS_SOURCES_FILTER)[number];
export type NewsDeskFilter = (typeof NEWS_DESK_FILTER)[number]["id"];

export const LIVE_CHANNELS = [
  {
    id: "bloomberg",
    label: "Bloomberg Markets",
    title: "Bloomberg Markets",
    region: "Global / EE.UU.",
    videoId: "OlUMDZchivQ",
  },
  {
    id: "cnbc",
    label: "CNBC International",
    title: "CNBC International",
    region: "Europa / Global",
    videoId: "9NyxcX3rhQs",
  },
  {
    id: "yahoo",
    label: "Yahoo Finance",
    title: "Yahoo Finance Live",
    region: "Wall Street / Análisis",
    videoId: "KQp-e_XQnDE",
  },
  {
    id: "bloomberg-asia",
    label: "Bloomberg Asia",
    title: "Bloomberg Asia",
    region: "Hong Kong / China",
    videoId: "f39oHo6vFLg",
  },
  {
    id: "nikkei",
    label: "Nikkei",
    title: "Nikkei / Japan Markets",
    region: "Tokio",
    youtubeChannelId: "UCyumUxW9HIh8H7Rq_UzrQLA",
  },
  {
    id: "sky",
    label: "Sky News Business",
    title: "Sky News Business",
    region: "Reino Unido / Europa",
    videoId: "cY-6Ari01EE",
  },
  {
    id: "dw",
    label: "DW Business",
    title: "DW Business",
    region: "Alemania / Zona Euro",
    videoId: "LuKwFajn37U",
  },
  {
    id: "cna",
    label: "CNA Business",
    title: "CNA Business",
    region: "Singapur / Asia-Pacífico",
    videoId: "-PWMxjBgr0k",
  },
  {
    id: "france24",
    label: "France 24 Business",
    title: "France 24 Business",
    region: "Europa",
    videoId: "Ap-UM1O9RBU",
  },
  {
    id: "arirang",
    label: "Arirang Economy",
    title: "Arirang Economy",
    region: "Corea del Sur / Seúl",
    videoId: "zvoPEgZeWkg",
  },
] as const;

export type LiveChannel = (typeof LIVE_CHANNELS)[number];
export type LiveChannelId = LiveChannel["id"];
export type TvSizeMode = "mini" | "standard" | "theater";

const EMBED_PARAMS = "autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&fs=1";

export function liveEmbedSrc(channel: LiveChannel): string {
  if ("videoId" in channel && channel.videoId) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(channel.videoId)}?${EMBED_PARAMS}`;
  }
  if ("youtubeChannelId" in channel && channel.youtubeChannelId) {
    return `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(channel.youtubeChannelId)}&${EMBED_PARAMS}`;
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(LIVE_CHANNELS[0].videoId)}?${EMBED_PARAMS}`;
}

export function isLiveChannelId(value: string): value is LiveChannelId {
  return LIVE_CHANNELS.some((item) => item.id === value);
}

export const IFRAME_ALLOW =
  "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
