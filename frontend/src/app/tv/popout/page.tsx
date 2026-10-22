"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WorldTvPlayer } from "@/components/news/WorldTvPlayer";
import {
  isWorldTvChannelId,
  WORLD_TV_CHANNELS,
  WORLD_TV_DESK_KEY,
  type WorldTvChannelId,
} from "@/components/news/worldTvChannels";

function WorldTvPopoutDesk() {
  const params = useSearchParams();
  const fromQuery = params.get("channel") ?? "";
  const [channel, setChannel] = useState<WorldTvChannelId>(
    isWorldTvChannelId(fromQuery) ? fromQuery : WORLD_TV_CHANNELS[0].id,
  );

  useEffect(() => {
    if (isWorldTvChannelId(fromQuery)) {
      setChannel(fromQuery);
    }
  }, [fromQuery]);

  useEffect(() => {
    localStorage.setItem(WORLD_TV_DESK_KEY, JSON.stringify({ tab: "tv", channel }));
  }, [channel]);

  useEffect(() => {
    function ping() {
      window.opener?.postMessage("avizor-worldtv-closed", window.location.origin);
    }
    window.addEventListener("beforeunload", ping);
    return () => window.removeEventListener("beforeunload", ping);
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-black p-2">
      <WorldTvPlayer channelId={channel} onChannel={setChannel} />
    </div>
  );
}

export default function WorldTvPopoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-black font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-500">
          Abriendo World TV…
        </div>
      }
    >
      <WorldTvPopoutDesk />
    </Suspense>
  );
}
