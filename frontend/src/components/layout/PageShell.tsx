interface PageShellProps {
  kicker: string;
  title: string;
  description: string;
}

export function PageShell({ kicker, title, description }: PageShellProps) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-terminal">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bull">
        {kicker}
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        {description}
      </p>
      <p className="mt-8 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
        Vista placeholder de Fase 1. El módulo operativo se conectará a la API
        en <code className="font-mono text-zinc-300">http://localhost:8000</code>.
      </p>
    </section>
  );
}
