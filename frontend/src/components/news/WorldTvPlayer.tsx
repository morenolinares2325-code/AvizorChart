"use client";

import { ExternalLink, Radio } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import {
  WORLD_TV_CHANNELS,
  channelFlag,
  worldTvChannel,
  type WorldTvChannelId,
} from "@/components/news/worldTvChannels";
import { resolveLiveVideo, worldTvEmbedSrc } from "@/lib/tvEngine";
import { IFRAME_ALLOW } from "@/components/news/newsTheme";

interface WorldTvPlayerProps {
  channelId: WorldTvChannelId;
  onChannel: (id: WorldTvChannelId) => void;
  detached?: boolean;
  onDetach?: () => void;
}

export const WorldTvPlayer = memo(function WorldTvPlayer({
  detached = false,
  onDetach,
}: WorldTvPlayerProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black">
      <header className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-md border border-[#1F1F2E] bg-black px-3 py-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00FF66]">
            <Radio className="h-3.5 w-3.5 shrink-0" />
            TV Global Trading
          </p>
          <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">
            {WORLD_TV_CHANNELS.length} emisoras · autoplay
          </p>
        </div>
        {onDetach ? (
          <button
            type="button"
            onClick={onDetach}
            title="Desanclar a ventana flotante"
            className="inline-flex h-7 items-center gap-1 rounded border border-[#00FF66]/30 px-1.5 font-mono text-[10px] text-[#00FF66] hover:bg-[#00FF66]/10"
          >
            <ExternalLink className="h-3 w-3" />
            Pop-out
          </button>
        ) : null}
      </header>

      {detached ? (
        <div className="flex min-h-0 flex-1 items-center justify-center rounded-md border border-[#1F1F2E] bg-black px-4 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
            Señal desanclada en ventana flotante
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-black pr-0.5">
          <div className="grid grid-cols-1 gap-2 bg-black sm:grid-cols-2">
            {WORLD_TV_CHANNELS.map((item) => (
              <TvStationCard key={item.id} channelId={item.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

const TvStationCard = memo(function TvStationCard({ channelId }: { channelId: string }) {
  const channel = worldTvChannel(channelId);
  const [src, setSrc] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const lockedSrc = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    void resolveLiveVideo(channel).then((result) => {
      if (!alive || lockedSrc.current) {
        return;
      }
      const next = worldTvEmbedSrc(channel, result, { muted: true, chrome: false });
      if (!next) {
        return;
      }
      lockedSrc.current = next;
      setSrc(next);
      setLive(Boolean(result.isLive || result.source === "live"));
    });
    return () => {
      alive = false;
    };
  }, [channel]);

  return (
    <article className="overflow-hidden rounded-lg border border-[#1F1F2E] bg-black">
      <div className="relative aspect-video overflow-hidden bg-black">
        {src ? (
          <FrozenYouTubeFrame src={src} title={channel.title} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <p className="rounded border border-[#1F1F2E] bg-black px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Sintonizando…
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-[#1F1F2E] bg-black px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">{channelFlag(channel)}</span>
          <span className="min-w-0 truncate text-[12px] font-medium text-zinc-100">{channel.label}</span>
          {live ? (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/45 bg-black px-1.5 py-0.5 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              EN VIVO
            </span>
          ) : null}
        </div>
        {channel.format ? (
          <p className="mt-0.5 truncate font-mono text-[9px] uppercase tracking-wide text-zinc-500">{channel.format}</p>
        ) : null}
      </div>
    </article>
  );
});

const FrozenYouTubeFrame = memo(
  function FrozenYouTubeFrame({ src, title }: { src: string; title: string }) {
    const hostRef = useRef<HTMLDivElement>(null);
    const mounted = useRef(false);

    useEffect(() => {
      const host = hostRef.current;
      if (!host || mounted.current) {
        return;
      }
      mounted.current = true;
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = title;
      iframe.allow = IFRAME_ALLOW;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      iframe.setAttribute("class", "absolute inset-0 h-full w-full border-0");
      host.appendChild(iframe);
    }, [src, title]);

    return <div ref={hostRef} className="absolute inset-0" />;
  },
  () => true,
);
