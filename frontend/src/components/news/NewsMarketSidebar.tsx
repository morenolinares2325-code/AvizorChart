"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewsArticle } from "@/lib/newsApi";

function sessionStatus(now: Date, timeZone: string, openHour: number, closeHour: number): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  if (hour >= openHour && hour < closeHour) {
    return "OPEN";
  }
  return "CLOSED";
}

function clockIn(now: Date, timeZone: string): string {
  return now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  });
}

export function NewsMarketSidebar({ articles }: { articles: NewsArticle[] }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const pulse = useMemo(() => {
    const bullish = articles.filter((item) => item.sentiment === "Bullish").length;
    const bearish = articles.filter((item) => item.sentiment === "Bearish").length;
    const high = articles.filter((item) => item.impact === "high").length;
    const tickerHits = new Map<string, number>();
    for (const article of articles) {
      for (const ticker of article.tickers) {
        tickerHits.set(ticker, (tickerHits.get(ticker) ?? 0) + 1);
      }
    }
    const top = Array.from(tickerHits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const agenda = articles
      .filter((item) => item.impact === "high")
      .slice(0, 5);
    return { bullish, bearish, high, top, agenda };
  }, [articles]);

  return (
    <div className="space-y-3 p-2">
      <section className="rounded border border-[#1F1F2E] bg-black p-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Sesiones</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[11px]">
          {[
            { id: "NY", zone: "America/New_York", open: 9, close: 16 },
            { id: "LDN", zone: "Europe/London", open: 8, close: 16 },
            { id: "TYO", zone: "Asia/Tokyo", open: 9, close: 15 },
          ].map((session) => (
            <li key={session.id} className="flex items-center justify-between">
              <span className="text-zinc-400">{session.id}</span>
              <span className="tabular-nums text-zinc-200">{now ? clockIn(now, session.zone) : "--:--"}</span>
              <span
                className={
                  now && sessionStatus(now, session.zone, session.open, session.close) === "OPEN"
                    ? "text-emerald-400"
                    : "text-zinc-600"
                }
              >
                {now ? sessionStatus(now, session.zone, session.open, session.close) : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded border border-[#1F1F2E] bg-black p-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Resumen de mercado</p>
        <div className="mt-2 grid grid-cols-3 gap-1 font-mono text-center text-[11px]">
          <div className="rounded bg-emerald-500/10 py-1.5 text-emerald-300">{pulse.bullish} BULL</div>
          <div className="rounded bg-red-500/10 py-1.5 text-red-300">{pulse.bearish} BEAR</div>
          <div className="rounded bg-zinc-900 py-1.5 text-amber-300">{pulse.high} HIGH</div>
        </div>
        <ul className="mt-2 space-y-1">
          {pulse.top.length === 0 ? (
            <li className="font-mono text-[10px] text-zinc-600">Sin tickers en el feed</li>
          ) : (
            pulse.top.map(([ticker, hits]) => (
              <li key={ticker} className="flex justify-between font-mono text-[11px] text-zinc-300">
                <span>${ticker}</span>
                <span className="text-zinc-500">{hits} menciones</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded border border-[#1F1F2E] bg-black p-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Calendario / alertas</p>
        <ul className="mt-2 space-y-2">
          {pulse.agenda.length === 0 ? (
            <li className="font-mono text-[10px] text-zinc-600">Sin eventos de alto impacto en el feed.</li>
          ) : (
            pulse.agenda.map((item) => (
              <li key={item.id} className="border-l-2 border-red-500/70 pl-2">
                <p className="font-mono text-[10px] text-red-400">{item.source}</p>
                <p className="text-[11px] leading-snug text-zinc-200">{item.title}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
