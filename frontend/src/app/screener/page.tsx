import { PageShell } from "@/components/layout/PageShell";

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8">
      <PageShell
        kicker="Sección 1"
        title="Screener cuantitativo"
        description="Cuatro buscadores: Búsqueda Directa, Ojeador de Acciones, Ojeador Multiactivo y Constructor de Carteras. Esta vista se conectará al endpoint /api/screener."
      />
    </div>
  );
}
