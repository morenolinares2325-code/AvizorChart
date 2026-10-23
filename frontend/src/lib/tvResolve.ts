export type TvResolveMethod = "live" | "recent" | "upload" | "oembed" | "manual" | "channel-live";

export interface TvResolvePayload {
  channelId: string;
  videoId: string | null;
  ytChannelId?: string | null;
  isLive: boolean;
  method: TvResolveMethod;
  title?: string;
  thumbnail?: string;
}

export function youtubeThumb(videoId: string | null | undefined): string | null {
  if (!videoId) {
    return null;
  }
  return `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
}
