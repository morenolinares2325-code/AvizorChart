import type { WorldTvChannel } from "@/components/news/worldTvChannels";
import type { TvResolveMethod, TvResolvePayload } from "@/lib/tvResolve";
import { youtubeThumb } from "@/lib/tvResolve";

const EMBED_HOST = "https://www.youtube-nocookie.com/embed";

export type TvResolveSource = TvResolveMethod | "cache" | "api" | "none";

export interface TvResolveResult {
  videoId: string | null;
  ytChannelId?: string | null;
  source: TvResolveSource;
  at: number;
  isLive?: boolean;
  title?: string;
  thumbnail?: string;
}

function asPayload(raw: unknown, channelId: string): TvResolvePayload | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const item = raw as Partial<TvResolvePayload>;
  const method = item.method;
  if (
    method !== "live" &&
    method !== "recent" &&
    method !== "upload" &&
    method !== "oembed" &&
    method !== "manual" &&
    method !== "channel-live"
  ) {
    return null;
  }
  return {
    channelId: item.channelId ?? channelId,
    videoId: typeof item.videoId === "string" ? item.videoId : null,
    ytChannelId: typeof item.ytChannelId === "string" ? item.ytChannelId : null,
    isLive: Boolean(item.isLive),
    method,
    title: item.title,
    thumbnail: item.thumbnail ?? youtubeThumb(typeof item.videoId === "string" ? item.videoId : null) ?? undefined,
  };
}

function localFallback(channel: WorldTvChannel): TvResolveResult {
  if (channel.videoId) {
    return {
      videoId: channel.videoId,
      ytChannelId: channel.youtubeChannelId ?? null,
      source: "manual",
      at: Date.now(),
      isLive: false,
      thumbnail: youtubeThumb(channel.videoId) ?? undefined,
    };
  }
  return {
    videoId: null,
    ytChannelId: channel.youtubeChannelId ?? null,
    source: channel.youtubeChannelId ? "channel-live" : "none",
    at: Date.now(),
    isLive: Boolean(channel.youtubeChannelId),
  };
}

export async function resolveLiveVideo(channel: WorldTvChannel): Promise<TvResolveResult> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 18000);
  try {
    const response = await fetch(`/api/tv/resolve?channelId=${encodeURIComponent(channel.id)}`, {
      cache: "no-store",
      signal: ctrl.signal,
    });
    if (response.ok) {
      const payload = asPayload(await response.json(), channel.id);
      if (payload && (payload.videoId || payload.ytChannelId || payload.method === "channel-live" || channel.youtubeChannelId || channel.videoId)) {
        return {
          videoId: payload.videoId ?? channel.videoId ?? null,
          ytChannelId: payload.ytChannelId ?? channel.youtubeChannelId ?? null,
          source: payload.method,
          at: Date.now(),
          isLive: payload.isLive,
          title: payload.title,
          thumbnail: payload.thumbnail,
        };
      }
    }
  } catch {
    /* local fallback */
  } finally {
    window.clearTimeout(timer);
  }
  return localFallback(channel);
}

export function worldTvEmbedSrc(
  channel: WorldTvChannel,
  resolved: TvResolveResult | null,
  options: { muted: boolean; origin?: string; chrome?: boolean },
): string | null {
  const mute = options.muted ? 1 : 0;
  const origin = "";
  const live = Boolean(resolved?.isLive || resolved?.source === "live" || resolved?.source === "channel-live");
  const loop = !live && resolved?.videoId ? `&loop=1&playlist=${encodeURIComponent(resolved.videoId)}` : "";
  const chrome = options.chrome === false ? "&controls=0&disablekb=1&iv_load_policy=3" : "";
  const params = `autoplay=1&mute=${mute}&rel=0&modestbranding=1&playsinline=1&fs=1&enablejsapi=1${chrome}${loop}${origin}`;
  const ytChannel = resolved?.ytChannelId || channel.youtubeChannelId;
  if (resolved?.videoId) {
    return `${EMBED_HOST}/${encodeURIComponent(resolved.videoId)}?${params}`;
  }
  if (channel.videoId) {
    return `${EMBED_HOST}/${encodeURIComponent(channel.videoId)}?autoplay=1&mute=${mute}&rel=0&modestbranding=1&playsinline=1&fs=1&loop=1&playlist=${encodeURIComponent(channel.videoId)}${chrome}${origin}`;
  }
  if (ytChannel) {
    return `${EMBED_HOST}/live_stream?channel=${encodeURIComponent(ytChannel)}&${params}`;
  }
  return null;
}

export function ytCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}
