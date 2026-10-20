import { Suspense } from "react";
import { MegaChartWorkspace } from "@/components/chart/MegaChartWorkspace";

export default function GraficoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-[#08090d] font-mono text-xs text-emerald-400">
          Inicializando Mega Gráfico…
        </div>
      }
    >
      <MegaChartWorkspace />
    </Suspense>
  );
}
