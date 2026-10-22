import { Suspense } from "react";
import { MegaChartWorkspace } from "@/components/chart/MegaChartWorkspace";

export default function GraficoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#050508] font-mono text-xs text-emerald-400">
          Inicializando Mega Gráfico…
        </div>
      }
    >
      <MegaChartWorkspace />
    </Suspense>
  );
}
