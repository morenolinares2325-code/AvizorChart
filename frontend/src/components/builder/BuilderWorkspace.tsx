"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Save, Zap } from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import { transpileOnServer, type BuilderTranspileResult } from "@/lib/builderApi";
import { loadSavedScripts, newScriptId, upsertSavedScript } from "@/lib/scriptLibrary";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const PINE_SAMPLE = `//@version=5
indicator("EMA Ribbon", overlay=true)
len = input.int(21, "Periodo")
fast = ta.ema(close, len)
slow = ta.sma(close, 50)
plot(fast, color=color.lime, title="EMA rápida")
plot(slow, color=color.aqua, title="SMA lenta")
`;

const MQL_SAMPLE = `//+------------------------------------------------------------------+
#property indicator_chart_window
input int maPeriod = 21;
int OnCalculate(const int rates_total, const int prev_calculated,
                const datetime &time[], const double &open[],
                const double &high[], const double &low[],
                const double &close[], const long &tick_volume[],
                const long &volume[], const int &spread[])
{
   for(int i = 0; i < rates_total; i++)
      iMA(_Symbol, PERIOD_CURRENT, maPeriod, 0, MODE_EMA, PRICE_CLOSE);
   return(rates_total);
}
`;

type StatusKind = "idle" | "busy" | "ok" | "error";

export function BuilderWorkspace() {
  const [libraryCount, setLibraryCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("Indicador");
  const [source, setSource] = useState("");
  const [preview, setPreview] = useState("// El TypeScript para el Mega Gráfico aparece aquí.");
  const [compiled, setCompiled] = useState<BuilderTranspileResult | null>(null);
  const [status, setStatus] = useState<{ kind: StatusKind; text: string }>({
    kind: "idle",
    text: "Listo",
  });
  const sourceRef = useRef("");
  sourceRef.current = source;

  useEffect(() => {
    setLibraryCount(loadSavedScripts().length);
  }, []);

  const onMount: OnMount = (_editor, monaco) => {
    monaco.editor.defineTheme("avizor-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#050508",
        "editor.foreground": "#e4e4e7",
        "editorLineNumber.foreground": "#52525b",
        "editor.selectionBackground": "#00FF6622",
      },
    });
    monaco.editor.setTheme("avizor-dark");
  };

  async function onConvert() {
    const raw = sourceRef.current;
    if (!raw.trim()) {
      setStatus({ kind: "error", text: "Pega Pine o MQL5 a la izquierda." });
      return;
    }
    setStatus({ kind: "busy", text: "Convirtiendo…" });
    setPreview("// Convirtiendo…");
    try {
      const next = await transpileOnServer(raw, name);
      setCompiled(next);
      setPreview(next.avizor);
      if (next.name) {
        setName(next.name);
      }
      if (next.plots.length === 0) {
        setStatus({ kind: "error", text: next.notes[0] || "Sin series reconocidas." });
        return;
      }
      setStatus({
        kind: "ok",
        text: `${next.language.toUpperCase()} · ${next.plots.length} series. Pulsa Guardar para el gráfico.`,
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Error al convertir.";
      setCompiled(null);
      setPreview(`// Error\n// ${text}`);
      setStatus({ kind: "error", text });
    }
  }

  function onSave() {
    if (!compiled || compiled.plots.length === 0) {
      setStatus({ kind: "error", text: "Convierte primero un script con series." });
      return;
    }
    try {
      const script = {
        id: activeId ?? newScriptId(),
        name: name.trim() || compiled.name,
        language: "typescript" as const,
        source: sourceRef.current,
        avizor: compiled.avizor,
        plots: compiled.plots,
        echarts: compiled.echarts,
        updatedAt: Date.now(),
      };
      upsertSavedScript(script);
      setActiveId(script.id);
      setLibraryCount(loadSavedScripts().length);
      setStatus({ kind: "ok", text: `Guardado “${script.name}”. Mega Gráfico → Indicadores → Builder.` });
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar.",
      });
    }
  }

  const tone =
    status.kind === "ok"
      ? "border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66]"
      : status.kind === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-300"
        : status.kind === "busy"
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
          : "border-zinc-800 bg-zinc-950 text-zinc-500";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      <header className="pointer-events-none flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-[#0A0A0F]/75 backdrop-blur-md pl-12 pr-4">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          disabled={status.kind === "busy"}
          onClick={() => void onConvert()}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-[#00FF66]/40 bg-[#00FF66]/15 px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-[#00FF66] disabled:opacity-50"
        >
          <Zap className="h-4 w-4" />
          {status.kind === "busy" ? "Convirtiendo…" : "Convertir"}
        </button>
        <button
          type="button"
          onClick={() => onSave()}
          className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-600 bg-zinc-900 px-5 font-mono text-[13px] font-semibold uppercase tracking-[0.16em] text-zinc-100 hover:border-zinc-400"
        >
          <Save className="h-4 w-4" />
          Guardar
        </button>
        <span className={`ml-auto truncate rounded-full border px-3 py-1 font-mono text-[11px] ${tone}`}>
          {status.text}
        </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <section className="flex min-h-0 flex-col border-r border-[#1F1F2E]">
          <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#1F1F2E] px-3">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre"
              className="h-7 min-w-0 flex-1 bg-transparent font-mono text-[12px] text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setSource(PINE_SAMPLE)}
              className="font-mono text-[10px] uppercase tracking-wide text-zinc-600 hover:text-zinc-300"
            >
              Pine
            </button>
            <button
              type="button"
              onClick={() => setSource(MQL_SAMPLE)}
              className="font-mono text-[10px] uppercase tracking-wide text-zinc-600 hover:text-zinc-300"
            >
              MQL5
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <Monaco
              height="100%"
              language="plaintext"
              theme="avizor-dark"
              value={source}
              onChange={(value) => setSource(value ?? "")}
              onMount={onMount}
              options={{
                fontSize: 13,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
              }}
            />
          </div>
        </section>
        <section className="flex min-h-0 flex-col">
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#1F1F2E] px-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">TypeScript</p>
            <p className="font-mono text-[10px] text-zinc-600">{libraryCount} en biblioteca</p>
          </div>
          <pre className="min-h-0 flex-1 overflow-auto whitespace-pre p-4 font-mono text-[12px] leading-5 text-[#00FF66]/90">
            {preview}
          </pre>
        </section>
      </div>
    </div>
  );
}
