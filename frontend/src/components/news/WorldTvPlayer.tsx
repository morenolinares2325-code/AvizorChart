"use client";

import { ExternalLink, Radio, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SectionLabel } from "@/components/chart/chartChrome";
import {
  WORLD_TV_CHANNELS,
  WORLD_TV_REGIONS,
  WORLD_TV_REGION_LABEL,
  worldTvChannel,
  type WorldTvChannelId,
  type WorldTvRegionId,
} from "@/components/news/worldTvChannels";
import { resolveLiveVideo, worldTvEmbedSrc, ytCommand, type TvResolveResult } from "@/lib/tvEngine";
import { IFRAME_ALLOW } from "@/components/news/newsTheme";

interface WorldTvPlayerProps {
  channelId: WorldTvChannelId;
  onChannel: (id: WorldTvChannelId) => void;
  detached?: boolean;
  onDetach?: () => void;
}

export function WorldTvPlayer({ channelId, onChannel, detached = false, onDetach }: WorldTvPlayerProps) {
  const channel = worldTvChannel(channelId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [region, setRegion] = useState<WorldTvRegionId>(channel.region);
  const [resolved, setResolved] = useState<TvResolveResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(70);
  const [failed, setFailed] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : undefined;
  const src = useMemo(
    () => worldTvEmbedSrc(channel, resolved, { muted, origin }),
    [channel, resolved, muted, origin],
  );

  useEffect(() => {
    setRegion(channel.region);
  }, [channel.region]);

  useEffect(() => {
    let live = true;
    setBusy(true);
    setFailed(false);
    void resolveLiveVideo(channel).then((result) => {
      if (!live) {
        return;
      }
      setResolved(result);
      setBusy(false);
      setFailed(result.source === "none" && !channel.videoId && !channel.youtubeChannelId);
    });
    return () => {
      live = false;
    };
  }, [channel]);

  useEffect(() => {
    const node = iframeRef.current;
    if (!node || muted) {
      return;
    }
    ytCommand(node, "unMute");
    ytCommand(node, "setVolume", [volume]);
  }, [muted, volume, src]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const raw = typeof event.data === "string" ? event.data : "";
      if (!raw.includes("onError") && !raw.includes("\"info\":150") && !raw.includes("\"info\":101") && !raw.includes("\"info\":100")) {
        return;
      }
      let code: number | null = null;
      try {
        const parsed = JSON.parse(raw) as { event?: string; info?: number };
        if (parsed.event === "onError" && typeof parsed.info === "number") {
          code = parsed.info;
        }
      } catch {
        return;
      }
      if (code === null) {
        return;
      }
      if (resolved?.source !== "channel-live" && channel.youtubeChannelId) {
        setResolved({ videoId: null, source: "channel-live", at: Date.now() });
        setFailed(false);
        return;
      }
      setFailed(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [channel.youtubeChannelId, resolved?.source]);

  const regionChannels = WORLD_TV_CHANNELS.filter((item) => item.region === region);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative overflow-hidden rounded-md border border-[#1F1F2E] bg-black">
        <div className="flex items-center justify-between gap-2 border-b border-[#1F1F2E] bg-[#050508] px-2 py-1.5">
          <p className="flex min-w-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#00FF66]">
            <Radio className="h-3 w-3 shrink-0" />
            <span className="truncate">{channel.title}</span>
          </p>
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
        </div>

        <div className="relative aspect-video w-full bg-black">
          {detached ? (
            <Fallback
              title="Señal desanclada"
              hint="El streaming está en una ventana flotante. El Mega Gráfico permanece maximizado."
            />
          ) : failed || !src ? (
            <Fallback
              title="Directo no disponible"
              hint="El canal está pausado, fuera de aire o bloqueado. Prueba otra emisora de la región."
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`${channel.id}-${muted ? "m" : "u"}-${resolved?.videoId ?? resolved?.source}`}
              src={src}
              title={channel.title}
              className="h-full w-full"
              allow={IFRAME_ALLOW}
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              onLoad={() => {
                ytCommand(iframeRef.current, "addEventListener", ["onError"]);
                if (!muted) {
                  ytCommand(iframeRef.current, "unMute");
                  ytCommand(iframeRef.current, "setVolume", [volume]);
                }
              }}
            />
          )}
          {busy && !detached ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/55 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              Resolviendo señal…
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-2 border-t border-[#1F1F2E] bg-[#050508] px-2 py-1.5">
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            className="rounded p-1 text-zinc-400 hover:text-white"
            title={muted ? "Activar sonido" : "Silenciar"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            disabled={muted || detached}
            onChange={(event) => {
              const next = Number(event.target.value);
              setVolume(next);
              setMuted(false);
              ytCommand(iframeRef.current, "unMute");
              ytCommand(iframeRef.current, "setVolume", [next]);
            }}
            className="h-1 w-full accent-[#00FF66]"
            aria-label="Volumen"
          />
          <span className="w-8 text-right font-mono text-[10px] text-zinc-500">{muted ? "MUTE" : volume}</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-2">
        <SectionLabel>Regiones</SectionLabel>
        <div className="flex flex-wrap gap-1 px-2 pb-2">
          {WORLD_TV_REGIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRegion(item.id)}
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-tight ${
                region === item.id
                  ? "bg-[#00FF66]/15 text-[#00FF66]"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="px-3 pb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
          {WORLD_TV_REGION_LABEL[region]} · {regionChannels.length} emisoras
        </p>
        <ul className="space-y-0.5 px-1 pb-3">
          {regionChannels.map((item) => {
            const on = item.id === channelId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChannel(item.id)}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left ${
                    on ? "bg-[#00FF66]/10 text-[#00FF66]" : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="truncate text-[12px] tracking-tight">{item.label}</span>
                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-zinc-600">Live</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Fallback({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-[radial-gradient(ellipse_at_center,rgba(0,255,102,0.08),transparent_65%)] px-4 text-center">
      <Radio className="h-6 w-6 text-[#00FF66]/70" />
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-200">{title}</p>
      <p className="max-w-[16rem] text-[11px] leading-relaxed text-zinc-500">{hint}</p>
    </div>
  );
}
