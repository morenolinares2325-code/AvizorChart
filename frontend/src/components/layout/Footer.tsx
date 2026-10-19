import Link from "next/link";

const LEGAL_LINKS = [
  { href: "#terminos", label: "Términos del Servicio" },
  { href: "#privacidad", label: "Política de Privacidad" },
  { href: "#cookies", label: "Normativa de Cookies" },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-12 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-100">
            AvizorChart.dev
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Plataforma analítica y formativa para cribado cuantitativo, detección
            técnica anticipada y orquestación de ejecución. No constituye
            asesoramiento financiero personalizado.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Legal
          </p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-zinc-100">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Soporte
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            Usa el asistente flotante o escribe a{" "}
            <a
              href="mailto:soporte@avizorchart.dev"
              className="text-bull hover:underline"
            >
              soporte@avizorchart.dev
            </a>
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-[1600px] px-4 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bear">
            Descargo de responsabilidad
          </p>
          <p className="mt-3 max-w-5xl text-xs leading-relaxed text-zinc-500">
            El trading de acciones, índices, divisas, materias primas, criptoactivos
            y productos derivados conlleva un riesgo sustancial de pérdida, incluido
            el apalancamiento, y puede no ser adecuado para todos los inversores.
            Las señales, screeners, gráficos y dictámenes de la Mesa de Agentes IA
            tienen carácter informativo y formativo. El rendimiento pasado no
            garantiza resultados futuros. AvizorChart no ejecuta ni garantiza
            operaciones salvo que el usuario configure de forma expresa un conector
            (Telegram, broker API o MetaTrader 5) bajo su propia responsabilidad.
          </p>
          <p className="mt-4 text-[11px] text-zinc-600">
            © {new Date().getFullYear()} AvizorChart.dev. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
