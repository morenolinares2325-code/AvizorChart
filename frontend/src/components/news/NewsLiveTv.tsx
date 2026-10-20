"use client";

import { PictureInPicture2, Radio, Square } from "lucide-react";
import { LIVE_CHANNELS, liveEmbedSrc, type LiveChannelId } from "@/components/news/newsTheme";

interface NewsLiveTvProps {
  channel: LiveChannelId;
  onChannel: (id: LiveChannelId) => void;
  playing: boolean;
  onPlaying: (value: boolean) => void;
  floating: boolean;
  onFloating: (value: boolean) => void;
  compact?: boolean;
}

export function NewsLiveTv({
  channel,
  onChannel,
  playing,
  onPlaying,
  floating,
  onFloating,
  compact = false,
}: NewsLiveTvProps) {
  const current = LIVE_CHANNELS.find((item) => item.id === channel) ?? LIVE_CHANNELS[0];
  const src = liveEmbedSrc(current.videoId);

  return (
    <section className={compact ? "" : "border-b border-zinc-800/80 p-2"}>
      <div className="mb-2 flex items-center gap-1">
        <Radio className="h-3.5 w-3.5 text-red-400" />
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">TV financiera</p>
      </div>
      <select
        value={channel}
        onChange={(event) => {
          onChannel(event.target.value as LiveChannelId);
          onPlaying(true);
        }}
        className="mb-1.5 h-7 w-full rounded border border-zinc-800 bg-zinc-950 px-1.5 font-mono text-[11px] text-zinc-200 outline-none focus:border-red-500/50"
      >
        {LIVE_CHANNELS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <div className="flex max-h-14 flex-wrap gap-1 overflow-y-auto">
        {LIVE_CHANNELS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onChannel(item.id);
              onPlaying(true);
            }}
            className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
              channel === item.id ? "bg-red-500/15 text-red-300" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPlaying(!playing)}
          className="rounded px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-200"
        >
          {playing ? (
            <span className="inline-flex items-center gap-1">
              <Square className="h-3 w-3" /> Ocultar
            </span>
          ) : (
            "Reanudar"
          )}
        </button>
        <button
          type="button"
          onClick={() => onFloating(!floating)}
          className="rounded px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-200"
          title="Ventana flotante"
        >
          <PictureInPicture2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {!floating ? (
        <div className="mt-2 aspect-video overflow-hidden rounded border border-zinc-800 bg-black">
          {playing ? (
            <iframe
              key={`${channel}-dock`}
              src={src}
              title={current.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              Señal en pausa
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 rounded border border-dashed border-zinc-800 px-2 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          Señal en ventana flotante
        </p>
      )}
    </section>
  );
}

export function NewsFloatingTv({
  channel,
  playing,
  onDock,
  onStop,
}: {
  channel: LiveChannelId;
  playing: boolean;
  onDock: () => void;
  onStop: () => void;
}) {
  const current = LIVE_CHANNELS.find((item) => item.id === channel) ?? LIVE_CHANNELS[0];
  if (!playing) {
    return null;
  }
  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 overflow-hidden rounded border border-zinc-700 bg-black shadow-2xl">
      <div className="flex items-center justify-between bg-zinc-950 px-2 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-red-300">{current.title}</span>
        <div className="flex gap-1">
          <button type="button" onClick={onDock} className="px-1 font-mono text-[10px] text-zinc-400 hover:text-white">
            Anclar
          </button>
          <button type="button" onClick={onStop} className="px-1 font-mono text-[10px] text-zinc-400 hover:text-white">
            Cerrar
          </button>
        </div>
      </div>
      <iframe
        key={`${channel}-float`}
        src={liveEmbedSrc(current.videoId)}
        title={current.title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
