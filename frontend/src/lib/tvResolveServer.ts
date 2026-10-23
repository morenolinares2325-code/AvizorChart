import { worldTvChannel, type WorldTvChannel } from "@/components/news/worldTvChannels";
import { type TvResolveMethod, type TvResolvePayload, youtubeThumb } from "@/lib/tvResolve";

const TTL_MS = 30 * 60 * 1000;
const MIN_DURATION_SEC = 8 * 60;
const cache = new Map<string, { at: number; payload: TvResolvePayload }>();
const handleCache = new Map<string, string>();

interface YtSearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string; liveBroadcastContent?: string };
}

interface YtVideoItem {
  id?: string;
  contentDetails?: { duration?: string };
  snippet?: { title?: string; liveBroadcastContent?: string };
}

function ytKey(): string | null {
  const key = process.env.YT_API_KEY?.trim();
  return key || null;
}

function isoDurationToSeconds(iso: string | undefined): number {
  if (!iso) {
    return 0;
  }
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return 0;
  }
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
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

async function fetchJson<T>(url: string, ms = 7000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const response = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function ytGet<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const key = ytKey();
  if (!key) {
    return null;
  }
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set("key", key);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  return fetchJson<T>(url.toString());
}

async function ytChannelIdFromHandle(handle: string | undefined): Promise<string | null> {
  const raw = handle?.replace(/^@/, "").trim();
  if (!raw) {
    return null;
  }
  const cached = handleCache.get(raw.toLowerCase());
  if (cached) {
    return cached;
  }
  const withAt = await ytGet<{ items?: { id?: string }[] }>("channels", {
    part: "id",
    forHandle: `@${raw}`,
  });
  const plain = withAt?.items?.[0]?.id
    ? withAt
    : await ytGet<{ items?: { id?: string }[] }>("channels", { part: "id", forHandle: raw });
  const id = plain?.items?.[0]?.id ?? null;
  if (id) {
    handleCache.set(raw.toLowerCase(), id);
  }
  return id;
}

async function resolveYoutubeChannelId(channel: WorldTvChannel): Promise<string | null> {
  if (channel.youtubeChannelId) {
    return channel.youtubeChannelId;
  }
  return ytChannelIdFromHandle(channel.handle);
}

function pack(
  channelId: string,
  videoId: string | null,
  isLive: boolean,
  method: TvResolveMethod,
  title?: string,
  ytChannelId?: string | null,
): TvResolvePayload {
  return {
    channelId,
    videoId,
    ytChannelId: ytChannelId ?? undefined,
    isLive,
    method,
    title,
    thumbnail: youtubeThumb(videoId) ?? undefined,
  };
}

async function stepLive(ytChannelId: string, localId: string): Promise<TvResolvePayload | null> {
  const data = await ytGet<{ items?: YtSearchItem[] }>("search", {
    part: "snippet",
    channelId: ytChannelId,
    eventType: "live",
    type: "video",
    maxResults: "1",
  });
  const item = data?.items?.[0];
  const videoId = item?.id?.videoId;
  if (!videoId) {
    return null;
  }
  return pack(localId, videoId, true, "live", item?.snippet?.title, ytChannelId);
}

async function pickLongestRecent(
  ids: string[],
  localId: string,
  method: TvResolveMethod,
  ytChannelId: string,
): Promise<TvResolvePayload | null> {
  if (ids.length === 0) {
    return null;
  }
  const data = await ytGet<{ items?: YtVideoItem[] }>("videos", {
    part: "contentDetails,snippet",
    id: ids.join(","),
  });
  const items = data?.items ?? [];
  const longEnough = items.filter((item) => isoDurationToSeconds(item.contentDetails?.duration) >= MIN_DURATION_SEC);
  const chosen = (longEnough[0] ?? items[0]) as YtVideoItem | undefined;
  const videoId = chosen?.id;
  if (!videoId) {
    return null;
  }
  const isLive = chosen?.snippet?.liveBroadcastContent === "live";
  return pack(localId, videoId, Boolean(isLive), isLive ? "live" : method, chosen?.snippet?.title, ytChannelId);
}

async function stepRecent(ytChannelId: string, localId: string): Promise<TvResolvePayload | null> {
  const data = await ytGet<{ items?: YtSearchItem[] }>("search", {
    part: "snippet",
    channelId: ytChannelId,
    order: "date",
    type: "video",
    maxResults: "8",
  });
  const ids = (data?.items ?? []).map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
  return pickLongestRecent(ids, localId, "recent", ytChannelId);
}

async function stepUploads(ytChannelId: string, localId: string): Promise<TvResolvePayload | null> {
  const channel = await ytGet<{ items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[] }>(
    "channels",
    { part: "contentDetails", id: ytChannelId },
  );
  const uploads = channel?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) {
    return null;
  }
  const items = await ytGet<{ items?: { snippet?: { resourceId?: { videoId?: string } } }[] }>("playlistItems", {
    part: "snippet",
    playlistId: uploads,
    maxResults: "6",
  });
  const ids = (items?.items ?? [])
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter((id): id is string => Boolean(id));
  return pickLongestRecent(ids, localId, "upload", ytChannelId);
}

async function stepOembed(channel: WorldTvChannel, ytChannelId: string | null): Promise<TvResolvePayload | null> {
  const targets = [
    channel.handle ? `https://www.youtube.com/${channel.handle.replace(/^@/, "@")}/live` : null,
    channel.handle ? `https://www.youtube.com/${channel.handle.replace(/^@/, "@")}` : null,
    ytChannelId ? `https://www.youtube.com/channel/${ytChannelId}` : null,
    channel.videoId ? `https://www.youtube.com/watch?v=${channel.videoId}` : null,
  ].filter((item): item is string => Boolean(item));

  for (const target of targets) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(target)}`;
    const body = await fetchJson<{ thumbnail_url?: string; html?: string; title?: string }>(url, 3500);
    if (!body) {
      continue;
    }
    const id = videoIdFromText(`${body.thumbnail_url ?? ""} ${body.html ?? ""}`);
    if (id) {
      return pack(channel.id, id, false, "oembed", body.title, ytChannelId);
    }
  }
  return null;
}

function wantsLive(channel: WorldTvChannel): boolean {
  return /directo/i.test(channel.format ?? "");
}

export async function resolveTvChannel(channelId: string): Promise<TvResolvePayload> {
  const cached = cache.get(channelId);
  if (cached && Date.now() - cached.at < TTL_MS) {
    return cached.payload;
  }

  const channel = worldTvChannel(channelId);
  let ytChannelId = await resolveYoutubeChannelId(channel);

  let live: TvResolvePayload | null = null;
  if (ytChannelId && wantsLive(channel)) {
    live = await stepLive(ytChannelId, channel.id);
  }
  if (!live && channel.handle) {
    const fromHandle = await ytChannelIdFromHandle(channel.handle);
    if (fromHandle && fromHandle !== ytChannelId) {
      ytChannelId = fromHandle;
      if (wantsLive(channel)) {
        live = await stepLive(fromHandle, channel.id);
      }
    } else if (fromHandle) {
      ytChannelId = fromHandle;
    }
  }

  const uploads = !live && ytChannelId ? await stepUploads(ytChannelId, channel.id) : null;
  const recent = !live && !uploads && ytChannelId ? await stepRecent(ytChannelId, channel.id) : null;
  const oembed = !live && !uploads && !recent ? await stepOembed(channel, ytChannelId) : null;

  const payload =
    live ??
    uploads ??
    recent ??
    oembed ??
    (channel.videoId
      ? pack(channel.id, channel.videoId, false, "manual", undefined, ytChannelId)
      : pack(channel.id, null, Boolean(ytChannelId), ytChannelId ? "channel-live" : "manual", undefined, ytChannelId));

  cache.set(channel.id, { at: Date.now(), payload });
  return payload;
}

export function hasYoutubeApiKey(): boolean {
  return Boolean(ytKey());
}
