"use client";

import { useEffect, useRef } from "react";
import {
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Radio,
  RectangleHorizontal,
  Square,
} from "lucide-react";
import { useLiveTv } from "@/components/news/LiveTvContext";
import {
  IFRAME_ALLOW,
  LIVE_CHANNELS,
  liveEmbedSrc,
  type LiveChannel,
  type TvSizeMode,
} from "@/components/news/newsTheme";

function currentChannel(id: string): LiveChannel {
  return LIVE_CHANNELS.find((item) => item.id === id) ?? LIVE_CHANNELS[0];
}

function LiveIframe({ channel, frameKey }: { channel: LiveChannel; frameKey: string }) {
  return (
    <iframe
      key={frameKey}
      src={liveEmbedSrc(channel)}
      title={channel.title}
      className="h-full w-full bg-black"
      allow={IFRAME_ALLOW}
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

const SIZE_BUTTONS: { id: TvSizeMode; label: string; hint: string }[] = [
  { id: "mini", label: "Mini", hint: "Esquina flotante" },
  { id: "standard", label: "Estándar", hint: "Tarjeta de retícula" },
  { id: "theater", label: "Teatro", hint: "Pantalla completa" },
];

export function NewsLiveTv({ compact = false }: { compact?: boolean }) {
  const { channel, setChannel, playing, setPlaying, size, setSize } = useLiveTv();
  const current = currentChannel(channel);
  const docked = playing && size === "standard";

  return (
    <section className={compact ? "" : "border-b border-[#00FF66]/20 p-2"}>
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 shrink-0 text-[#00FF66]" aria-hidden />
          <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
            TV financiera · 10 señales
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-[#00FF66]/25 bg-[#0A0A0F] p-0.5">
          {SIZE_BUTTONS.map((item) => {
            const active = size === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={item.hint}
                onClick={() => setSize(item.id)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-1 font-mono text-[10px] transition ${
                  active
                    ? "bg-[#00FF66]/15 text-[#00FF66]"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.id === "mini" ? <PictureInPicture2 className="h-3 w-3" /> : null}
                {item.id === "standard" ? <RectangleHorizontal className="h-3 w-3" /> : null}
                {item.id === "theater" ? <Maximize2 className="h-3 w-3" /> : null}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <select
        value={channel}
        onChange={(event) => setChannel(event.target.value as typeof channel)}
        className="mb-1.5 h-8 w-full rounded border border-[#00FF66]/25 bg-black px-2 font-mono text-[11px] text-zinc-100 outline-none focus:border-[#00FF66]/60"
      >
        {LIVE_CHANNELS.map((item, index) => (
          <option key={item.id} value={item.id}>
            {index + 1}. {item.title} — {item.region}
          </option>
        ))}
      </select>

      <div className="flex max-h-[4.5rem] flex-wrap gap-1 overflow-y-auto">
        {LIVE_CHANNELS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setChannel(item.id)}
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] transition ${
              channel === item.id
                ? "border-[#00FF66]/40 bg-black text-[#00FF66]"
                : "border-[#1F1F2E] bg-black text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-1.5 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
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
      </div>

      {docked ? (
        <div className="mt-2 aspect-video overflow-hidden rounded border border-[#00FF66]/25 bg-black">
          <LiveIframe channel={current} frameKey={`${channel}-dock`} />
        </div>
      ) : (
        <p className="mt-2 rounded border border-dashed border-[#00FF66]/20 bg-black px-2 py-6 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          {!playing
            ? "Señal en pausa"
            : size === "mini"
              ? "Señal en esquina flotante · Mini"
              : "Señal en modo teatro"}
        </p>
      )}
    </section>
  );
}

export function NewsFloatingTv() {
  const { channel, playing, size, setSize, setPlaying } = useLiveTv();
  const current = currentChannel(channel);
  if (!playing || size !== "mini") {
    return null;
  }
  return (
    <div className="fixed bottom-4 left-4 z-[60] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[#00FF66]/35 bg-[#0A0A0F] shadow-[0_0_40px_rgba(0,255,102,0.12)]">
      <div className="flex items-center justify-between gap-2 border-b border-[#00FF66]/20 px-2 py-1">
        <span className="truncate font-mono text-[10px] uppercase tracking-wider text-[#00FF66]">
          Mini · {current.title}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setSize("standard")}
            className="px-1 font-mono text-[10px] text-zinc-400 hover:text-white"
            title="Estándar"
          >
            Anclar
          </button>
          <button
            type="button"
            onClick={() => setSize("theater")}
            className="px-1 font-mono text-[10px] text-zinc-400 hover:text-white"
            title="Teatro"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="px-1 font-mono text-[10px] text-zinc-400 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      </div>
      <div className="aspect-video bg-black">
        <LiveIframe channel={current} frameKey={`${channel}-mini`} />
      </div>
    </div>
  );
}

export function NewsTheaterTv() {
  const { channel, playing, size, setSize, setPlaying } = useLiveTv();
  const current = currentChannel(channel);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (size !== "theater" || !playing) {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      }
      return;
    }
    const node = stageRef.current;
    if (node && node.requestFullscreen) {
      void node.requestFullscreen().catch(() => undefined);
    }
  }, [size, playing]);

  if (!playing || size !== "theater") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-[70] bg-[#0A0A0F]/95 p-3 backdrop-blur-sm">
      <div
        ref={stageRef}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-[#00FF66]/30 bg-black"
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#00FF66]/20 bg-[#0A0A0F] px-3 py-2">
          <p className="truncate font-mono text-xs uppercase tracking-[0.14em] text-[#00FF66]">
            Teatro · {current.title} · {current.region}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSize("mini")}
              className="inline-flex items-center gap-1 rounded border border-[#00FF66]/25 px-2 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
            >
              <Minimize2 className="h-3 w-3" />
              Mini
            </button>
            <button
              type="button"
              onClick={() => setSize("standard")}
              className="inline-flex items-center gap-1 rounded border border-[#00FF66]/25 px-2 py-1 font-mono text-[10px] text-zinc-300 hover:text-white"
            >
              <RectangleHorizontal className="h-3 w-3" />
              Estándar
            </button>
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="rounded px-2 py-1 font-mono text-[10px] text-zinc-500 hover:text-white"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <LiveIframe channel={current} frameKey={`${channel}-theater`} />
        </div>
      </div>
    </div>
  );
}
