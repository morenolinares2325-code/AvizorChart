import Link from "next/link";
import { ArrowRight, CandlestickChart, ScanSearch } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-zinc-800">
      <div className="market-grid absolute inset-0 opacity-40" />
      <div className="market-glow absolute inset-0" />
      <div className="relative mx-auto max-w-[1600px] px-4 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bull">
          Detección técnica anticipada
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl">
          Anticípate al Mercado Antes de la Ruptura
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
          AvizorChart monitoriza compresión, proximidad geométrica y flujos de
          volumen para situarte en la vela de detonación, no después del
          movimiento. Cribado cuantitativo, Mesa de Agentes IA y ejecución en
          tres niveles, con la ergonomía de un terminal profesional.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/screener"
            className="inline-flex items-center gap-2 rounded-md bg-bull px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
          >
            <ScanSearch className="h-4 w-4" aria-hidden />
            Abrir Screener Cuantitativo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/grafico"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800"
          >
            <CandlestickChart className="h-4 w-4" aria-hidden />
            Explorar Mega Gráfico
          </Link>
        </div>
      </div>
    </section>
  );
}
