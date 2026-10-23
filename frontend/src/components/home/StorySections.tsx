import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CandlestickChart,
  GraduationCap,
  Layers3,
  Play,
  Radio,
  Rss,
  ScanLine,
  Triangle,
  Users,
  Volume2,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { LIVE_CHANNELS } from "@/components/news/newsTheme";

const cardClass =
  "group rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-6 shadow-terminal transition duration-200 hover:-translate-y-0.5 hover:border-bull/35 hover:bg-zinc-900";

function SectionKicker({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-bull">{children}</p>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
      {children}
    </h2>
  );
}

function SectionLead({ children }: { children: string }) {
  return (
    <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-[15px]">{children}</p>
  );
}

const SCREEN_CARDS: { title: string; body: string; icon: LucideIcon; tag: string }[] = [
  {
    title: "Pre-ruptura geométrica",
    body: "Precio a menos de 1.5% del vértice de triángulos, canales y cuñas. El cribado marca la vela de detonación, no el follow-through.",
    icon: Triangle,
    tag: "Técnico",
  },
  {
    title: "Squeeze de volatilidad",
    body: "Bandas de Bollinger dentro de Keltner: compresión lista para expandirse. Filtro cuantitativo sobre el universo USA y multiactivo.",
    icon: Zap,
    tag: "Técnico",
  },
  {
    title: "Volumen de ruptura",
    body: "Clústeres de volumen relativo, desequilibrio de flujo y confirmación de absorción antes de cruzar el nivel clave.",
    icon: Volume2,
    tag: "Volumen",
  },
  {
    title: "Cruces y régimen",
    body: "Proximidad a EMA 9/21, 50/200 y giros de Supertrend evaluados en el mismo barrido que el score Avizor 0–100.",
    icon: Activity,
    tag: "Técnico",
  },
];

const ASSET_PREVIEWS = [
  {
    symbol: "^GSPC",
    label: "S&P 500",
    venue: "Índices · yfinance",
    last: "5 842.10",
    change: "+0.42%",
    bars: [38, 42, 40, 48, 46, 52, 49, 58, 55, 62],
    up: true,
  },
  {
    symbol: "^IXIC",
    label: "Nasdaq",
    venue: "Índices · yfinance",
    last: "18 421.55",
    change: "+0.71%",
    bars: [30, 34, 33, 41, 39, 47, 52, 50, 61, 66],
    up: true,
  },
  {
    symbol: "EURUSD=X",
    label: "EUR/USD",
    venue: "Forex · yfinance",
    last: "1.0864",
    change: "−0.18%",
    bars: [58, 55, 57, 50, 52, 46, 44, 48, 42, 40],
    up: false,
  },
  {
    symbol: "BTC-USD",
    label: "Bitcoin",
    venue: "Cripto · yfinance",
    last: "67 420",
    change: "+1.24%",
    bars: [28, 36, 32, 44, 41, 49, 47, 56, 53, 64],
    up: true,
  },
] as const;

const SENTIMENT_SAMPLES = [
  {
    source: "CNBC",
    title: "Fed: el mercado reprecifica el sendero de tipos",
    impact: "Alto",
    bias: "Bearish",
  },
  {
    source: "Yahoo Finance",
    title: "Semis: flujo institucional hacia NVDA y AVGO",
    impact: "Alto",
    bias: "Bullish",
  },
  {
    source: "MarketWatch",
    title: "Dólar: rango de medio plazo tras el NFP",
    impact: "Medio",
    bias: "Neutral",
  },
] as const;


function SparkBars({ values, up }: { values: readonly number[]; up: boolean }) {
  const max = Math.max(...values);
  return (
    <div className="mt-6 flex h-16 items-end gap-1.5" aria-hidden>
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className={`w-full rounded-sm ${up ? "bg-bull/70" : "bg-bear/70"}`}
          style={{ height: `${Math.max(18, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function StorySections() {
  return (
    <>
      <section id="screener-cuantitativo" className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <SectionKicker>Sección 02 · Cribado</SectionKicker>
          <SectionTitle>Screener cuantitativo y detección de ruptura</SectionTitle>
          <SectionLead>
            Cuatro motores de barrido —técnico, volumen, patrones y fundamentales—
            sitúan el activo en acumulación o en la vela de detonación. El resultado
            viaja al Mega Gráfico y a la Mesa de Agentes sin recargar el terminal.
          </SectionLead>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {SCREEN_CARDS.map((item) => (
              <article key={item.title} className={cardClass}>
                <div className="flex items-center justify-between">
                  <item.icon className="h-5 w-5 text-bull" aria-hidden />
                  <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {item.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-100">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-emerald-500 hover:to-emerald-400"
            >
              <ScanLine className="h-4 w-4" aria-hidden />
              Abrir los 4 screeners
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-50"
            >
              <Layers3 className="h-4 w-4" aria-hidden />
              Búsqueda directa, ojeador y multiactivo
            </Link>
          </div>
        </div>
      </section>

      <section id="mega-grafico" className="border-b border-zinc-800 bg-zinc-900/25">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <SectionKicker>Sección 03 · Motor ECharts</SectionKicker>
          <SectionTitle>Mega Gráfico multiactivo</SectionTitle>
          <SectionLead>
            Velas OHLCV nativas con Apache ECharts. El backend en FastAPI consulta
            Yahoo Finance para índices, acciones, Forex y cripto; el frontend
            dibuja velas, volumen e indicadores sin widgets de terceros.
          </SectionLead>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ASSET_PREVIEWS.map((asset) => (
              <Link
                key={asset.symbol}
                href={`/grafico?symbol=${encodeURIComponent(asset.symbol)}`}
                className={`${cardClass} block`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-zinc-500">{asset.venue}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-50">
                      {asset.label}
                    </h3>
                  </div>
                  <CandlestickChart className="h-5 w-5 text-bull" aria-hidden />
                </div>
                <p className="mt-4 font-mono text-2xl tabular-nums text-zinc-50">{asset.last}</p>
                <p className={`mt-1 text-sm font-medium ${asset.up ? "text-bull" : "text-bear"}`}>
                  {asset.change}
                </p>
                <SparkBars values={asset.bars} up={asset.up} />
                <p className="mt-4 text-xs text-zinc-500 group-hover:text-zinc-300">
                  Abrir en Mega Gráfico →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="noticias" className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <SectionKicker>Sección 04 · Telex</SectionKicker>
          <SectionTitle>Noticias/TV y análisis de sentimiento local</SectionTitle>
          <SectionLead>
            El agregador RSS (CNBC, Yahoo Finance, MarketWatch e Investing) clasifica
            impacto y sesgo en el backend, sin llamadas de IA generativa. Filtros
            de macro, earnings y general, etiquetas Bullish / Bearish y salto
            directo al Mega Gráfico.
          </SectionLead>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className={`${cardClass} flex flex-col justify-between`}>
              <div>
                <Rss className="h-5 w-5 text-bull" aria-hidden />
                <h3 className="mt-4 text-xl font-semibold text-zinc-50">Motor RSS sin coste de IA</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  FastAPI parsea los feeds, extrae tickers con cashtags y asigna
                  impacto. El escritorio de noticias filtra por fuente, impacto y
                  texto. El análisis de sentimiento es local: reglas y diccionario
                  de mercado, no tokens de un LLM.
                </p>
              </div>
              <Link
                href="/noticias"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-bull hover:underline"
              >
                Abrir Noticias/TV
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>

            <div className="grid gap-3">
              {SENTIMENT_SAMPLES.map((item) => (
                <article key={item.title} className={cardClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      {item.source}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        item.impact === "Alto"
                          ? "border border-bear/40 bg-bear/10 text-bear"
                          : "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      Impacto {item.impact}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        item.bias === "Bullish"
                          ? "border border-bull/40 bg-bull/10 text-bull"
                          : item.bias === "Bearish"
                            ? "border border-bear/40 bg-bear/10 text-bear"
                            : "border border-zinc-700 text-zinc-400"
                      }`}
                    >
                      {item.bias}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-zinc-100">{item.title}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tv-en-vivo" className="border-b border-zinc-800 bg-zinc-900/25">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <SectionKicker>Sección 05 · Streaming</SectionKicker>
          <SectionTitle>TV financiera internacional en vivo</SectionTitle>
          <SectionLead>
            Diez señales bursátiles globales en el escritorio de noticias. Mini,
            estándar y teatro, con autoplay silenciado y pantalla completa nativa.
          </SectionLead>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {LIVE_CHANNELS.map((channel) => (
              <Link
                key={channel.id}
                href={`/noticias?tv=${channel.id}`}
                className={`${cardClass} overflow-hidden p-0`}
              >
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  {"videoId" in channel && channel.videoId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://i.ytimg.com/vi/${channel.videoId}/hqdefault.jpg`}
                      alt=""
                      className="h-full w-full object-cover opacity-70 transition duration-200 group-hover:scale-[1.03] group-hover:opacity-90"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-zinc-900 to-zinc-950" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-bull/40 bg-zinc-950/80 text-bull">
                      <Play className="h-4 w-4 fill-current" aria-hidden />
                    </span>
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {channel.region}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-zinc-50">{channel.label}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="academia-comunidad" className="bg-zinc-950/70 backdrop-blur-[2px]">
        <div className="mx-auto max-w-[1600px] px-4 py-20">
          <SectionKicker>Sección 06 · Ecosistema</SectionKicker>
          <SectionTitle>Academia, comunidad y marco institucional</SectionTitle>
          <SectionLead>
            Formación con gráfico simulado, foro operativo y zona privada. El
            cierre de página recoge avisos legales y el descargo de riesgo bursátil
            de AvizorChart.
          </SectionLead>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <Link href="/academia" className={`${cardClass} block`}>
              <GraduationCap className="h-5 w-5 text-bull" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-zinc-50">Academia</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Gráfico SIM para practicar compras y ventas, diario de PnL y
                descarga de manuales, notas y checklists del operador.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-bull">
                <BookOpen className="h-4 w-4" aria-hidden />
                Entrar a formación
              </p>
            </Link>
            <Link href="/comunidad" className={`${cardClass} block`}>
              <Users className="h-5 w-5 text-bull" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-zinc-50">Comunidad</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Feed estilo X, foro por mercado, embajadores y páginas amigas de
                trading. Cashtags que enlazan al Mega Gráfico.
              </p>
              <p className="mt-6 text-sm font-semibold text-bull">Abrir la sala →</p>
            </Link>
            <Link href="/perfil" className={`${cardClass} block`}>
              <Radio className="h-5 w-5 text-bull" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold text-zinc-50">Zona privada</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Cuenta, suscripción, broker & MT5, cartera, logs y automatización.
                Preparada para identidad y puente de ejecución.
              </p>
              <p className="mt-6 text-sm font-semibold text-bull">Configurar cuenta →</p>
            </Link>
          </div>
        </div>
        <Footer />
      </section>
    </>
  );
}
