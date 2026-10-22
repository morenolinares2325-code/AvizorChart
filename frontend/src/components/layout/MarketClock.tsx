"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function formatUtcClock(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

export function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className="hidden items-center gap-1.5 font-mono text-[11px] tabular-nums text-zinc-400 lg:flex"
      aria-live="polite"
      title="Hora de sesión de mercado en UTC"
    >
      <Clock className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
      <span className="tracking-widest text-zinc-500">UTC</span>
      <span className="tabular-nums text-zinc-100">
        {now ? formatUtcClock(now) : "--:--:--"}
      </span>
    </div>
  );
}
