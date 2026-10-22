"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LIVE_CHANNELS,
  isLiveChannelId,
  type LiveChannelId,
  type TvSizeMode,
} from "@/components/news/newsTheme";

const STORAGE_KEY = "avizor.livetv.v1";

interface LiveTvState {
  channel: LiveChannelId;
  playing: boolean;
  size: TvSizeMode;
}

interface LiveTvContextValue extends LiveTvState {
  setChannel: (id: LiveChannelId) => void;
  setPlaying: (value: boolean) => void;
  setSize: (size: TvSizeMode) => void;
}

const LiveTvContext = createContext<LiveTvContextValue | null>(null);

const FALLBACK: LiveTvState = {
  channel: LIVE_CHANNELS[0].id,
  playing: true,
  size: "standard",
};

function readStored(): LiveTvState {
  if (typeof window === "undefined") {
    return FALLBACK;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return FALLBACK;
    }
    const parsed = JSON.parse(raw) as Partial<LiveTvState>;
    return {
      channel: parsed.channel && isLiveChannelId(parsed.channel) ? parsed.channel : FALLBACK.channel,
      playing: parsed.playing !== false,
      size: parsed.size === "mini" || parsed.size === "theater" ? parsed.size : "standard",
    };
  } catch {
    return FALLBACK;
  }
}

export function LiveTvProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LiveTvState>(FALLBACK);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    setState(readStored());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const setChannel = useCallback((id: LiveChannelId) => {
    setState((current) => ({ ...current, channel: id, playing: true }));
  }, []);

  const setPlaying = useCallback((value: boolean) => {
    setState((current) => ({ ...current, playing: value }));
  }, []);

  const setSize = useCallback((size: TvSizeMode) => {
    setState((current) => ({ ...current, size, playing: true }));
  }, []);

  const value = useMemo(
    () => ({ ...state, setChannel, setPlaying, setSize }),
    [state, setChannel, setPlaying, setSize],
  );

  return <LiveTvContext.Provider value={value}>{children}</LiveTvContext.Provider>;
}

export function useLiveTv(): LiveTvContextValue {
  const ctx = useContext(LiveTvContext);
  if (!ctx) {
    throw new Error("useLiveTv debe usarse dentro de LiveTvProvider");
  }
  return ctx;
}
