import { ScreenerWorkspace } from "@/components/screener/ScreenerWorkspace";

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bull">
          Sección 1
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          Screener cuantitativo
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-400">
          Motor de pre-detonación: cribado en 1H–1W para situarte en compresión,
          no en la confirmación tardía. Score Avizor 0–100 y dispatch a la Mesa
          de 8 especialistas. API:{" "}
          <code className="font-mono text-zinc-300">http://localhost:8000</code>.
        </p>
      </header>
      <ScreenerWorkspace />
    </div>
  );
}
