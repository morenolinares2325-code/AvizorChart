"use client";

import { LifeBuoy, X } from "lucide-react";
import { useState } from "react";

export function SupportWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="mb-3 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-terminal">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-zinc-100">Soporte Avizor</p>
              <p className="text-xs text-zinc-500">Asistencia técnica y operativa</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              aria-label="Cerrar soporte"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3 px-4 py-4 text-sm text-zinc-400">
            <p>
              En Fase 1 el widget queda listo para el Maestro de soporte. Mientras
              tanto puedes consultar:
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Uso de los 4 screeners cuantitativos</li>
              <li>Conectividad del backend en localhost:8000</li>
              <li>Configuración futura de API keys y MT5</li>
            </ul>
            <a
              href="mailto:soporte@avizorchart.dev"
              className="inline-flex rounded-md bg-bull px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ml-auto flex h-12 w-12 items-center justify-center rounded-full border border-bull/40 bg-zinc-900 text-bull shadow-terminal hover:bg-zinc-800"
        aria-expanded={open}
        aria-label="Abrir soporte"
      >
        <LifeBuoy className="h-5 w-5" />
      </button>
    </div>
  );
}
