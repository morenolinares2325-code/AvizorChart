import type { WorldTvChannel } from "@/components/news/worldTvChannels";

const CACHE_KEY = "avizor.worldtv.resolve.v2";
const API_KEY_STORAGE = "avizor.youtube.apikey";
const TTL_MS = 25 * 60 * 1000;
const EMBED_HOST = "https://www.youtube-nocookie.com/embed";

export type TvResolveSource = "cache" | "manual" | "oembed" | "proxy" | "api" | "channel-live" | "none";

export interface TvResolveResult {
  videoId: string | null;
  source: TvResolveSource;
  at: number;
}

type CacheMap = Record<string, TvResolveResult>;

function readCache(): CacheMap {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CacheMap) : {};
  } catch {
    return {};
  }
}

function writeCache(map: CacheMap) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function youtubeApiKey(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(API_KEY_STORAGE)?.trim();
  return value || null;
}

function videoIdFromText(raw: string): string | null {
  const fromThumb = raw.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
  if (fromThumb) {
    return fromThumb[1];
  }
  const fromWatch = raw.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (fromWatch) {
    return fromWatch[1];
  }
  const fromJson = raw.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  if (fromJson) {
    return fromJson[1];
  }
  return null;
}

async function fetchText(url: string, ms = 4500): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), ms);
  try {
    const response = await fetch(url, { signal: ctrl.signal });
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function resolveOembed(channel: WorldTvChannel): Promise<string | null> {
  const targets = [
    channel.youtubeChannelId ? `https://www.youtube.com/channel/${channel.youtubeChannelId}/live` : null,
    channel.handle ? `https://www.youtube.com/${channel.handle.replace(/^@/, "@")}/live` : null,
    channel.videoId ? `https://www.youtube.com/watch?v=${channel.videoId}` : null,
  ].filter((item): item is string => Boolean(item));

  for (const target of targets) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(target)}`;
    const body = await fetchText(url, 4000);
    if (!body) {
      continue;
    }
    const id = videoIdFromText(body);
    if (id) {
      return id;
    }
    try {
      const parsed = JSON.parse(body) as { thumbnail_url?: string; html?: string };
      const fromFields = videoIdFromText(`${parsed.thumbnail_url ?? ""} ${parsed.html ?? ""}`);
      if (fromFields) {
        return fromFields;
      }
    } catch {
      /* not json */
    }
  }
  return null;
}

async function resolveProxy(channel: WorldTvChannel): Promise<string | null> {
  const liveUrl = channel.youtubeChannelId
    ? `https://www.youtube.com/channel/${channel.youtubeChannelId}/live`
    : channel.handle
      ? `https://www.youtube.com/${channel.handle}/live`
      : null;
  if (!liveUrl) {
    return null;
  }
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(liveUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(liveUrl)}`,
  ];
  for (const proxy of proxies) {
    const body = await fetchText(proxy, 5000);
    if (!body) {
      continue;
    }
    const id = videoIdFromText(body);
    if (id) {
      return id;
    }
  }
  return null;
}

async function resolveApi(channel: WorldTvChannel): Promise<string | null> {
  const key = youtubeApiKey();
  if (!key || !channel.youtubeChannelId) {
    return null;
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${encodeURIComponent(channel.youtubeChannelId)}&eventType=live&type=video&maxResults=1&key=${encodeURIComponent(key)}`;
  const body = await fetchText(url, 4500);
  if (!body) {
    return null;
  }
  try {
    const parsed = JSON.parse(body) as { items?: { id?: { videoId?: string } }[] };
    return parsed.items?.[0]?.id?.videoId ?? null;
  } catch {
    return null;
  }
}

export async function resolveLiveVideo(channel: WorldTvChannel): Promise<TvResolveResult> {
  const cache = readCache();
  const hit = cache[channel.id];
  if (hit && Date.now() - hit.at < TTL_MS && (hit.videoId || hit.source === "channel-live" || hit.source === "none")) {
    return hit;
  }

  const oembed = await resolveOembed(channel);
  if (oembed) {
    const next = { videoId: oembed, source: "oembed" as const, at: Date.now() };
    writeCache({ ...cache, [channel.id]: next });
    return next;
  }

  const proxy = await resolveProxy(channel);
  if (proxy) {
    const next = { videoId: proxy, source: "proxy" as const, at: Date.now() };
    writeCache({ ...cache, [channel.id]: next });
    return next;
  }

  const api = await resolveApi(channel);
  if (api) {
    const next = { videoId: api, source: "api" as const, at: Date.now() };
    writeCache({ ...cache, [channel.id]: next });
    return next;
  }

  if (channel.youtubeChannelId) {
    const next = { videoId: null, source: "channel-live" as const, at: Date.now() };
    writeCache({ ...cache, [channel.id]: next });
    return next;
  }

  if (channel.videoId) {
    const next = { videoId: channel.videoId, source: "manual" as const, at: Date.now() };
    writeCache({ ...cache, [channel.id]: next });
    return next;
  }

  const none = { videoId: null, source: "none" as const, at: Date.now() };
  writeCache({ ...cache, [channel.id]: none });
  return none;
}

export function worldTvEmbedSrc(
  channel: WorldTvChannel,
  resolved: TvResolveResult | null,
  options: { muted: boolean; origin?: string },
): string | null {
  const mute = options.muted ? 1 : 0;
  const origin = options.origin ? `&origin=${encodeURIComponent(options.origin)}` : "";
  const params = `autoplay=1&mute=${mute}&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1${origin}`;
  if (resolved?.videoId) {
    return `${EMBED_HOST}/${encodeURIComponent(resolved.videoId)}?${params}`;
  }
  if (resolved?.source === "channel-live" && channel.youtubeChannelId) {
    return `${EMBED_HOST}/live_stream?channel=${encodeURIComponent(channel.youtubeChannelId)}&${params}`;
  }
  if (channel.videoId) {
    return `${EMBED_HOST}/${encodeURIComponent(channel.videoId)}?${params}`;
  }
  if (channel.youtubeChannelId) {
    return `${EMBED_HOST}/live_stream?channel=${encodeURIComponent(channel.youtubeChannelId)}&${params}`;
  }
  return null;
}

export function ytCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}
