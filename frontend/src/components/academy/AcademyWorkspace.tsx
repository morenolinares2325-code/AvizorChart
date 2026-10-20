"use client";

import { BookOpen, Download, Play, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ACADEMY_FILES, downloadAcademyFile } from "@/lib/academyLibrary";
import { appendSimBar, generateSimMarket } from "@/lib/simMarket";

const PracticeChart = dynamic(
  () => import("@/components/academy/PracticeChart").then((mod) => mod.PracticeChart),
  { ssr: false },
);

type Side = "long" | "short" | "flat";

interface ClosedTrade {
  id: string;
  side: "long" | "short";
  entry: number;
  exit: number;
  pnl: number;
}

export function AcademyWorkspace() {
  const [tab, setTab] = useState<"sim" | "lib">("sim");
  const [market, setMarket] = useState(() => generateSimMarket());
  const [side, setSide] = useState<Side>("flat");
  const [entry, setEntry] = useState<number | null>(null);
  const [size, setSize] = useState(100);
  const [closed, setClosed] = useState<ClosedTrade[]>([]);

  const last = market.last;
  const openPnl = useMemo(() => {
    if (side === "flat" || entry === null) {
      return 0;
    }
    const dir = side === "long" ? 1 : -1;
    return (last - entry) * dir * (size / entry);
  }, [side, entry, last, size]);

  function openTrade(next: "long" | "short") {
    setSide(next);
    setEntry(last);
  }

  function closeTrade() {
    if (side === "flat" || entry === null) {
      return;
    }
    setClosed((current) => [
      {
        id: `${Date.now()}`,
        side,
        entry,
        exit: last,
        pnl: openPnl,
      },
      ...current,
    ]);
    setSide("flat");
    setEntry(null);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08090d]">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800/80 px-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Academia</p>
        <div className="flex h-8 rounded border border-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => setTab("sim")}
            className={`rounded px-2.5 font-mono text-[11px] ${tab === "sim" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
          >
            Gráfico simulado
          </button>
          <button
            type="button"
            onClick={() => setTab("lib")}
            className={`rounded px-2.5 font-mono text-[11px] ${tab === "lib" ? "bg-zinc-800 text-white" : "text-zinc-500"}`}
          >
            Manuales y libros
          </button>
        </div>
      </header>

      {tab === "sim" ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_280px]">
          <div className="relative min-h-0">
            <PracticeChart data={market} entry={entry} side={side} />
          </div>
          <aside className="min-h-0 overflow-y-auto border-t border-zinc-800/80 p-3 lg:border-l lg:border-t-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">SIM · paper</p>
            <p className="mt-1 font-mono text-2xl tabular-nums text-zinc-50">{last.toFixed(2)}</p>
            <p className={`font-mono text-xs ${openPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {side === "flat" ? "FLAT" : `${side.toUpperCase()}  PnL ${openPnl >= 0 ? "+" : ""}${openPnl.toFixed(2)}`}
            </p>
            <label className="mt-3 block font-mono text-[10px] text-zinc-500">
              Tamaño (unidades)
              <input
                type="number"
                min={1}
                value={size}
                onChange={(event) => setSize(Number(event.target.value) || 1)}
                className="mt-1 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => openTrade("long")}
                disabled={side !== "flat"}
                className="inline-flex items-center justify-center gap-1 rounded bg-emerald-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                <TrendingUp className="h-3.5 w-3.5" /> Comprar
              </button>
              <button
                type="button"
                onClick={() => openTrade("short")}
                disabled={side !== "flat"}
                className="inline-flex items-center justify-center gap-1 rounded bg-red-600 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                <TrendingDown className="h-3.5 w-3.5" /> Vender
              </button>
              <button
                type="button"
                onClick={closeTrade}
                disabled={side === "flat"}
                className="col-span-2 rounded border border-zinc-700 py-1.5 font-mono text-[11px] text-zinc-200 disabled:opacity-40"
              >
                Cerrar
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMarket((current) => appendSimBar(current))}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded border border-zinc-800 py-1.5 font-mono text-[11px] text-zinc-300"
            >
              <Play className="h-3.5 w-3.5" /> Nueva vela
            </button>
            <button
              type="button"
              onClick={() => {
                setMarket(generateSimMarket());
                setSide("flat");
                setEntry(null);
                setClosed([]);
              }}
              className="mt-1 inline-flex w-full items-center justify-center gap-1.5 font-mono text-[11px] text-zinc-500 hover:text-zinc-200"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reiniciar simulación
            </button>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Diario</p>
            <ul className="mt-2 space-y-1.5">
              {closed.length === 0 ? (
                <li className="text-[11px] text-zinc-600">Sin operaciones cerradas.</li>
              ) : (
                closed.map((trade) => (
                  <li key={trade.id} className="flex justify-between font-mono text-[11px]">
                    <span className={trade.side === "long" ? "text-emerald-400" : "text-red-400"}>
                      {trade.side} {trade.entry.toFixed(2)}→{trade.exit.toFixed(2)}
                    </span>
                    <span className={trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {trade.pnl >= 0 ? "+" : ""}
                      {trade.pnl.toFixed(2)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="max-w-2xl text-sm text-zinc-400">
            Biblioteca interna: manuales de método, notas de lectura y checklists. Las descargas son material
            pedagógico Avizor (texto), no copias de obras con copyright.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ACADEMY_FILES.map((file) => (
              <article key={file.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  {file.title}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {file.kind} · {file.pages} · {file.size}
                </p>
                <pre className="mt-3 max-h-28 overflow-hidden whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-400">
                  {file.body.slice(0, 180)}…
                </pre>
                <button
                  type="button"
                  onClick={() => downloadAcademyFile(file)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded border border-zinc-700 px-2.5 py-1.5 font-mono text-[11px] text-zinc-200 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Descargar
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
