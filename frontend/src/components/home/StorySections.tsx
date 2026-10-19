import {
  Activity,
  Bot,
  Layers3,
  Radio,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Triangle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface FeatureCard {
  title: string;
  body: string;
  icon: LucideIcon;
}

const DETECTION: FeatureCard[] = [
  {
    title: "Pre-rupturas geométricas",
    body: "Precio a menos de 1.5% del vértice de triángulos, canales y cuñas de compresión.",
    icon: Triangle,
  },
  {
    title: "Squeezes listos",
    body: "Bandas de Bollinger dentro de Keltner: aviso de explosión inminente de volatilidad.",
    icon: Zap,
  },
  {
    title: "Cruces de EMAs",
    body: "Proximidad a EMA 9/21, EMA 19 y cruces de medio/largo plazo 50/200.",
    icon: Activity,
  },
  {
    title: "Giros de Supertrend",
    body: "Cambio de régimen detectado en la vela de detonación, no en el follow-through.",
    icon: ScanLine,
  },
];

const SCREENERS: FeatureCard[] = [
  {
    title: "Búsqueda Directa",
    body: "Ticker predictivo, OHLCV reciente y transferencia automática a la Mesa de Agentes.",
    icon: ScanLine,
  },
  {
    title: "Ojeador de Acciones",
    body: "Filtros de riesgo, score 0-100 y algoritmos de anticipación sobre el universo USA.",
    icon: Activity,
  },
  {
    title: "Ojeador Multiactivo",
    body: "Forex, cripto, índices y metales con sesiones, spreads y correlaciones.",
    icon: Radio,
  },
  {
    title: "Constructor de Carteras",
    body: "Sectores, correlaciones cruzadas y ponderaciones según perfil de volatilidad.",
    icon: Layers3,
  },
];

const EXECUTION: FeatureCard[] = [
  {
    title: "1. Telegram",
    body: "Informe completo BUY/SELL, entrada, SL, TP y ratio R:B en canal o bot privado.",
    icon: Radio,
  },
  {
    title: "2. Semi-automático",
    body: "Posición dimensionada y tarjeta de orden con confirmación en un clic.",
    icon: ShieldAlert,
  },
  {
    title: "3. Automático 100%",
    body: "Despacho autónomo a MT5 o APIs institucionales (IBKR, Alpaca, OANDA).",
    icon: Zap,
  },
];

function CardGrid({
  items,
  columns = "xl:grid-cols-4",
}: {
  items: FeatureCard[];
  columns?: string;
}) {
  return (
    <div className={`mt-8 grid gap-4 md:grid-cols-2 ${columns}`}>
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-terminal transition-colors hover:border-zinc-700"
        >
          <item.icon className="h-5 w-5 text-bull" aria-hidden />
          <h3 className="mt-4 text-base font-semibold text-zinc-100">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function StorySections() {
  return (
    <>
      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Motor de anticipación
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50">
            Detección técnica anticipada, no alertas tardías
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
            El backend evalúa compresión, curvatura de medias y flujos de volumen
            para posicionarte en acumulación o en la vela exacta de detonación.
          </p>
          <CardGrid items={DETECTION} />
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-zinc-900/30">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Cribado cuantitativo
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
            Los 4 Screeners
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
            De la consulta de un ticker al barrido de universos y a la
            construcción de carteras sectoriales, todo con score y envío a
            deliberación.
          </p>
          <CardGrid items={SCREENERS} />
        </div>
      </section>

      <section className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-20 lg:grid-cols-2">
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-terminal">
            <Bot className="h-6 w-6 text-bull" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
              Mesa de Agentes IA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Ocho especialistas deliberan sobre el activo hasta el consenso
              operativo: dirección, tipo de orden, invalidación y ratio
              riesgo-beneficio. La sala se alimenta del screener y del motor
              técnico, no de ruido social.
            </p>
          </article>
          <article className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-terminal">
            <Sparkles className="h-6 w-6 text-bull" aria-hidden />
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-50">
              Mega Gráfico con Apache ECharts
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Velas OHLCV nativas, volumen diferenciado, dibujo profesional e
              Indicator Builder sin código. Visualización exclusiva con Apache
              ECharts, sin widgets de terceros.
            </p>
          </article>
        </div>
      </section>

      <section className="bg-zinc-900/30">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Embudo de ejecución
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
            Tres niveles, un mismo dictamen
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Eliges el grado de automatización. El cálculo de riesgo y el
            bracket SL/TP se mantienen en todos los canales.
          </p>
          <CardGrid items={EXECUTION} columns="xl:grid-cols-3" />
        </div>
      </section>
    </>
  );
}
