"use client";

import { Bot, CalendarDays, Newspaper, Tv } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SectionLabel } from "@/components/chart/chartChrome";
import type { AgentBrief } from "@/components/chart/chartAutoPatterns";
import { WorldTvPlayer } from "@/components/news/WorldTvPlayer";
import {
  isWorldTvChannelId,
  WORLD_TV_CHANNELS,
  WORLD_TV_DESK_KEY,
  type WorldTvChannelId,
} from "@/components/news/worldTvChannels";
import { fetchMarketNews, formatNewsTime, type NewsArticle } from "@/lib/newsApi";

type DeskTab = "intel" | "tv";

const POPOUT_NAME = "avizor-worldtv";

interface DeskState {
  tab: DeskTab;
  channel: WorldTvChannelId;
}

function readDesk(): DeskState {
  try {
    const raw = localStorage.getItem(WORLD_TV_DESK_KEY);
    if (!raw) {
      return { tab: "intel", channel: WORLD_TV_CHANNELS[0].id };
    }
    const parsed = JSON.parse(raw) as Partial<DeskState>;
    return {
      tab: parsed.tab === "tv" ? "tv" : "intel",
      channel: parsed.channel && isWorldTvChannelId(parsed.channel) ? parsed.channel : WORLD_TV_CHANNELS[0].id,
    };
  } catch {
    return { tab: "intel", channel: WORLD_TV_CHANNELS[0].id };
  }
}

function economicAgenda(now: Date): { when: string; title: string; impact: "high" | "medium" }[] {
  const day = now.getUTCDay();
  const base: { offset: number; hour: string; title: string; impact: "high" | "medium" }[] = [
    { offset: 0, hour: "12:30", title: "Datos de inflación / CPI zona referencia", impact: "high" },
    { offset: 0, hour: "14:00", title: "Inventarios de crudo EIA", impact: "medium" },
    { offset: 1, hour: "12:30", title: "Solicitudes de desempleo", impact: "medium" },
    { offset: 1, hour: "18:00", title: "FOMC / minutos o discursos de la Fed", impact: day === 3 ? "high" : "medium" },
    { offset: 2, hour: "08:00", title: "PMI manufacturero flash", impact: "high" },
    { offset: 2, hour: "12:30", title: "Nóminas / empleo o ventas minoristas", impact: "high" },
    { offset: 3, hour: "07:00", title: "PIB preliminar / confianza del consumidor", impact: "medium" },
    { offset: 4, hour: "21:30", title: "Apertura Asia · Nikkei / Hang Seng futures", impact: "medium" },
  ];
  return base.map((item) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + item.offset);
    const label = date.toLocaleDateString("es-ES", { weekday: "short", day: "2-digit", month: "short" });
    return { when: `${label} ${item.hour} UTC`, title: item.title, impact: item.impact };
  });
}

interface NewsWorldTVContainerProps {
  ticker: string;
  agentBrief?: AgentBrief | null;
}

export function NewsWorldTVContainer({ ticker, agentBrief }: NewsWorldTVContainerProps) {
  const [tab, setTab] = useState<DeskTab>("intel");
  const [channel, setChannel] = useState<WorldTvChannelId>(WORLD_TV_CHANNELS[0].id);
  const [detached, setDetached] = useState(false);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readDesk();
    setTab(stored.tab);
    setChannel(stored.channel);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    localStorage.setItem(WORLD_TV_DESK_KEY, JSON.stringify({ tab, channel }));
  }, [tab, channel, hydrated]);

  useEffect(() => {
    let live = true;
    void fetchMarketNews()
      .then((list) => {
        if (!live) {
          return;
        }
        setArticles(list);
        setNewsError(null);
      })
      .catch((err: unknown) => {
        if (live) {
          setNewsError(err instanceof Error ? err.message : "Sin feed de noticias.");
        }
      });
    const timer = window.setInterval(() => {
      void fetchMarketNews()
        .then((list) => live && setArticles(list))
        .catch(() => undefined);
    }, 45000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data === "avizor-worldtv-closed") {
        setDetached(false);
      }
    }
    function onStorage(event: StorageEvent) {
      if (event.key !== WORLD_TV_DESK_KEY || !event.newValue) {
        return;
      }
      try {
        const parsed = JSON.parse(event.newValue) as Partial<DeskState>;
        if (parsed.channel && isWorldTvChannelId(parsed.channel)) {
          setChannel(parsed.channel);
        }
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const headlines = useMemo(() => {
    const key = ticker.replace("-USD", "").toUpperCase();
    const hit = articles.filter((item) => item.tickers.some((symbol) => symbol.includes(key) || key.includes(symbol)));
    return (hit.length > 0 ? hit : articles).slice(0, 10);
  }, [articles, ticker]);

  const agenda = useMemo(() => economicAgenda(now), [now]);

  const detach = useCallback(() => {
    const popup = window.open(
      `/tv/popout?channel=${encodeURIComponent(channel)}`,
      POPOUT_NAME,
      "popup=yes,width=960,height=560,menubar=no,toolbar=no,location=no,status=no",
    );
    if (popup) {
      setDetached(true);
      popup.focus();
    }
  }, [channel]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-[#1F1F2E] p-1.5">
        <TabButton
          active={tab === "intel"}
          icon={Newspaper}
          label="Inteligencia"
          onClick={() => setTab("intel")}
        />
        <TabButton active={tab === "tv"} icon={Tv} label="World TV" onClick={() => setTab("tv")} />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "intel" ? (
          <div className="h-full overflow-y-auto pb-3">
            <SectionLabel>Última hora · {ticker}</SectionLabel>
            <div className="space-y-2 px-3">
              {newsError ? <p className="text-[11px] text-red-300">{newsError}</p> : null}
              {headlines.length === 0 && !newsError ? (
                <p className="font-mono text-[11px] text-zinc-500">Cargando telex…</p>
              ) : null}
              {headlines.map((item) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-md border border-transparent px-0.5 py-1 hover:border-[#1F1F2E] hover:bg-white/[0.03]"
                >
                  <p className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                    {item.source} · {formatNewsTime(item.published)}
                    {item.impact === "high" ? " · HIGH" : ""}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-zinc-200">{item.title}</p>
                </a>
              ))}
            </div>

            <SectionLabel>Mesa de analistas</SectionLabel>
            <div className="mx-3 mb-3 rounded-md border border-[#1F1F2E] bg-[#050508] p-2.5">
              <div className="mb-2 flex items-center gap-1.5 text-[#00FF66]">
                <Bot className="h-3.5 w-3.5" />
                <p className="font-mono text-[10px] uppercase tracking-[0.14em]">{agentBrief?.ticker ?? ticker}</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Metric label="Tendencia" value={agentBrief?.trend ?? "—"} />
                <Metric label="Volatilidad" value={agentBrief?.volatility ?? "—"} />
              </div>
              <ul className="mt-2 space-y-1.5">
                {(agentBrief?.notes ?? ["Sin briefing: espera a que el gráfico cargue OHLCV."]).map((note) => (
                  <li key={note} className="text-[11px] leading-relaxed text-zinc-400">
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <SectionLabel>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                Calendario económico
              </span>
            </SectionLabel>
            <ul className="space-y-2 px-3">
              {agenda.map((item) => (
                <li key={`${item.when}-${item.title}`} className="flex gap-2">
                  <span
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      item.impact === "high" ? "bg-[#FF3366]" : "bg-[#FFD700]"
                    }`}
                  />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">{item.when}</p>
                    <p className="text-[12px] leading-snug text-zinc-200">{item.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col px-2 pt-2">
            <WorldTvPlayer channelId={channel} onChannel={setChannel} detached={detached} onDetach={detach} />
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Newspaper;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
        active ? "bg-[#00FF66]/12 text-[#00FF66]" : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#1F1F2E] px-2 py-1.5">
      <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="font-mono text-sm text-zinc-100">{value}</p>
    </div>
  );
}
