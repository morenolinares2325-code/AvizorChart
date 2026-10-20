import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CandlestickChart, ScanSearch } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden border-b border-zinc-800">
      <Image
        src="/fondo-avizor.jpg"
        alt="AvizorChart Cuántico"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-85"
      />
      {/* Velo lateral izquierdo para facilitar la lectura del texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />
      {/* Velo vertical para suavizar bordes inferior y superior */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-zinc-950/40" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-[1600px] flex-col justify-center px-4 py-24 md:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bull">
          Detección técnica anticipada
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl">
          Anticípate al Mercado Antes de la Ruptura
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
          AvizorChart monitoriza compresión, proximidad geométrica y flujos de
          volumen para situarte en la vela de detonación, no después del
          movimiento. Cribado cuantitativo, Mesa de Agentes IA y ejecución en
          tres niveles, con la ergonomía de un terminal profesional.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/screener"
            className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_16px_rgba(34,197,94,0.2)] transition hover:from-emerald-500 hover:to-emerald-400"
          >
            <ScanSearch className="h-4 w-4" aria-hidden />
            Abrir Screener Cuantitativo
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/grafico"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700/80 bg-zinc-950/70 px-5 py-2.5 text-sm font-semibold text-zinc-100 backdrop-blur-md hover:border-zinc-500 hover:bg-zinc-900"
          >
            <CandlestickChart className="h-4 w-4" aria-hidden />
            Explorar Mega Gráfico
          </Link>
        </div>
      </div>
    </section>
  );
}