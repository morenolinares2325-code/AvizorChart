"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Braces, Play, Save, Trash2 } from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import { adaptScript, type AdaptResult } from "@/lib/scriptAdapter";
import {
  loadSavedScripts,
  newScriptId,
  removeSavedScript,
  upsertSavedScript,
  type SavedScript,
} from "@/lib/scriptLibrary";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Tab = "ide" | "adapter";

const NATIVE_LANG = "TypeScript";
const NATIVE_EXT = ".ts";

const TS_SAMPLE = `import { overlay, ema, sma, close } from "@avizor/chart";

export const name = "EMA Ribbon";

overlay(ema(close, 21), { color: "#00FF66", width: 1.4, title: "EMA rápida" });
overlay(sma(close, 50), { color: "#00E5FF", width: 1.4, title: "SMA lenta" });

export default { name };
`;

const PINE_SAMPLE = `//@version=5
indicator("EMA Ribbon", overlay=true)
len = input.int(21, "Periodo")
fast = ta.ema(close, len)
slow = ta.sma(close, 50)
plot(fast, color=color.lime, title="EMA rápida")
plot(slow, color=color.aqua, title="SMA lenta")
`;

const MQL_SAMPLE = `//+------------------------------------------------------------------+
//| EMA MT5                                                           |
//+------------------------------------------------------------------+
#property indicator_chart_window
#property indicator_buffers 1
double ema[];
int OnInit() {
   SetIndexBuffer(0, ema, INDICATOR_DATA);
   return(INIT_SUCCEEDED);
}
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   ArraySetAsSeries(ema, true);
   for(int i=0; i<rates_total; i++)
      ema[i] = iMA(_Symbol, PERIOD_CURRENT, 21, 0, MODE_EMA, PRICE_CLOSE);
   return(rates_total);
}
`;

export function BuilderWorkspace() {
  const [tab, setTab] = useState<Tab>("adapter");
  const [library, setLibrary] = useState<SavedScript[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("Indicador");
  const [source, setSource] = useState(TS_SAMPLE);
  const [adapterIn, setAdapterIn] = useState("");
  const [preview, setPreview] = useState("// Pega Pine o MQL5 a la izquierda y pulsa Convertir.");
  const [adapted, setAdapted] = useState<AdaptResult | null>(null);
  const [adaptMessage, setAdaptMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [result, setResult] = useState<AdaptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const streamRef = useRef(0);
  const adapterRef = useRef("");
  adapterRef.current = adapterIn;

  useEffect(() => {
    setLibrary(loadSavedScripts());
  }, []);

  async function reveal(text: string) {
    const token = ++streamRef.current;
    const lines = text.split("\n");
    let out = "";
    for (const line of lines) {
      if (token !== streamRef.current) {
        return;
      }
      out += `${out ? "\n" : ""}${line}`;
      setPreview(out);
      await new Promise((resolve) => window.setTimeout(resolve, 18));
    }
  }

  const compileTs = useCallback((raw: string, label: string) => {
    try {
      const next = adaptScript(raw, label);
      setResult(next);
      setError(null);
      return next;
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo compilar.";
      setError(message);
      return null;
    }
  }, []);

  function loadScript(script: SavedScript) {
    setActiveId(script.id);
    setName(script.name);
    setSource(script.avizor || script.source);
    setResult({
      language: "typescript",
      name: script.name,
      avizor: script.avizor,
      plots: script.plots,
      notes: [],
    });
    setTab("ide");
  }

  async function onAdapt() {
    const raw = adapterRef.current;
    if (!raw.trim()) {
      const text = "Pega el código Pine o MT5 a la izquierda y pulsa Convertir.";
      setError(text);
      setAdaptMessage({ ok: false, text });
      setPreview(`// ${text}`);
      return;
    }
    setBusy(true);
    setError(null);
    setAdaptMessage({ ok: true, text: "Convirtiendo a TypeScript de AvizorChart…" });
    setPreview("// Detectando Pine / MQL5…\n// Generando overlay() / pane()…");
    try {
      const compiled = adaptScript(raw, name);
      setAdapted(compiled);
      setResult(compiled);
      setSource(compiled.avizor);
      if (compiled.name && compiled.name !== "EMA Ribbon") {
        setName(compiled.name);
      }
      await reveal(compiled.avizor);
      if (compiled.plots.length === 0) {
        const text =
          compiled.notes[0] ||
          "No se reconocieron series. Revisa el TypeScript generado a la derecha.";
        setError(text);
        setAdaptMessage({ ok: false, text });
        return;
      }
      setAdaptMessage({
        ok: true,
        text: `${compiled.language.toUpperCase()} → TypeScript · ${compiled.plots.length} serie${
          compiled.plots.length === 1 ? "" : "s"
        }. Pulsa Guardar para el gráfico.`,
      });
    } catch (err) {
      const text = err instanceof Error ? err.message : "Error inesperado al convertir.";
      setError(text);
      setAdaptMessage({ ok: false, text });
      setPreview(`// Error\n// ${text}`);
    } finally {
      setBusy(false);
    }
  }

  function onCompile() {
    if (tab === "adapter") {
      void onAdapt();
      return;
    }
    compileTs(source, name);
  }

  function onSave() {
    const compiled = adapted ?? result ?? compileTs(tab === "adapter" ? adapterRef.current || source : source, name);
    if (!compiled || compiled.plots.length === 0) {
      const text = "Convierte el Pine/MT5 o compila el TypeScript con al menos una serie antes de guardar.";
      setError(text);
      setAdaptMessage({ ok: false, text });
      return;
    }
    try {
      const script: SavedScript = {
        id: activeId ?? newScriptId(),
        name: name.trim() || compiled.name,
        language: "typescript",
        source: compiled.avizor,
        avizor: compiled.avizor,
        plots: compiled.plots,
        updatedAt: Date.now(),
      };
      setLibrary(upsertSavedScript(script));
      setActiveId(script.id);
      setResult(compiled);
      setAdapted(compiled);
      setSource(compiled.avizor);
      const text = `Guardado “${script.name}”. Ábrelo en Mega Gráfico → Indicadores → Builder.`;
      setError(null);
      setAdaptMessage({ ok: true, text });
    } catch (err) {
      const text = err instanceof Error ? err.message : "No se pudo guardar el indicador.";
      setError(text);
      setAdaptMessage({ ok: false, text });
    }
  }

  const onMount: OnMount = (editor, monaco) => {
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#050508]">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800/80 pl-12 pr-3">
        <Braces className="h-3.5 w-3.5 text-[#00FF66]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Builder IDE</p>
        <div className="flex h-8 rounded border border-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => setTab("ide")}
            className={`rounded px-2 font-mono text-[10px] uppercase tracking-wide ${
              tab === "ide" ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-white"
            }`}
          >
            Editor · TypeScript
          </button>
          <button
            type="button"
            onClick={() => setTab("adapter")}
            className={`rounded px-2 font-mono text-[10px] uppercase tracking-wide ${
              tab === "adapter" ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-white"
            }`}
          >
            Adapter Pine & MT5
          </button>
        </div>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre del indicador"
          className="ml-2 h-8 w-52 rounded border border-[#1F1F2E] bg-[#0A0A0F] px-2 font-mono text-[11px] text-white outline-none focus:border-[#00FF66]/40"
        />
        <button
          type="button"
          onClick={() => onCompile()}
          className="inline-flex h-8 items-center gap-1 rounded border border-[#1F1F2E] px-2 font-mono text-[10px] uppercase tracking-wide text-zinc-300 hover:text-white"
        >
          <Play className="h-3 w-3" />
          {busy ? "Convirtiendo…" : tab === "adapter" ? "Convertir" : "Compilar"}
        </button>
        <button
          type="button"
          onClick={() => onSave()}
          className="inline-flex h-8 items-center gap-1 rounded border border-[#00FF66]/30 px-2 font-mono text-[10px] uppercase tracking-wide text-[#00FF66]"
        >
          <Save className="h-3 w-3" />
          Guardar
        </button>
        <Link
          href="/grafico"
          className="ml-auto font-mono text-[10px] uppercase tracking-wide text-zinc-500 hover:text-[#00FF66]"
        >
          Abrir Mega Gráfico
        </Link>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-[#1F1F2E] bg-[#0A0A0F]">
          <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Biblioteca
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {library.length === 0 ? (
              <p className="px-1 text-[11px] text-zinc-600">Aún no hay indicadores guardados.</p>
            ) : (
              <ul className="space-y-1">
                {library.map((script) => (
                  <li key={script.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => loadScript(script)}
                      className={`min-w-0 flex-1 rounded border px-2 py-1.5 text-left ${
                        activeId === script.id
                          ? "border-[#00FF66]/40 text-[#00FF66]"
                          : "border-[#1F1F2E] text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span className="block truncate font-mono text-[11px]">{script.name}</span>
                      <span className="font-mono text-[9px] uppercase text-zinc-600">
                        {script.plots.length} series
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLibrary(removeSavedScript(script.id));
                        if (activeId === script.id) {
                          setActiveId(null);
                        }
                      }}
                      className="p-1 text-zinc-600 hover:text-red-400"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1 border-t border-[#1F1F2E] p-2">
            <button
              type="button"
              onClick={() => {
                setActiveId(null);
                setName("EMA Ribbon");
                setSource(TS_SAMPLE);
                setTab("ide");
              }}
              className="w-full text-left font-mono text-[10px] text-[#00FF66] hover:text-white"
            >
              Plantilla TypeScript
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveId(null);
                setName("EMA Ribbon");
                setAdapterIn(PINE_SAMPLE);
                setPreview("// Pulsa Convertir para generar el TypeScript.");
                setTab("adapter");
              }}
              className="w-full text-left font-mono text-[10px] text-zinc-500 hover:text-white"
            >
              Plantilla Pine
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveId(null);
                setName("EMA MT5");
                setAdapterIn(MQL_SAMPLE);
                setPreview("// Pulsa Convertir para generar el TypeScript.");
                setTab("adapter");
              }}
              className="w-full text-left font-mono text-[10px] text-zinc-500 hover:text-white"
            >
              Plantilla MQL5
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {tab === "ide" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-[#1F1F2E] px-3 py-1.5">
                <span className="rounded border border-[#00FF66]/35 bg-[#00FF66]/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#00FF66]">
                  {NATIVE_LANG} {NATIVE_EXT}
                </span>
                <p className="font-mono text-[10px] text-zinc-500">
                  Lenguaje nativo del Mega Gráfico. Pine y MQL5 se convierten a la derecha.
                </p>
              </div>
              <div className="min-h-0 flex-1">
                <Monaco
                  height="100%"
                  language="typescript"
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
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-2">
              <div className="flex min-h-0 flex-col border-r border-[#1F1F2E]">
                <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  Pegar Pine o MQL5
                </p>
                <textarea
                  value={adapterIn}
                  onChange={(event) => setAdapterIn(event.target.value)}
                  placeholder="Pega aquí el indicator() de Pine o el OnCalculate de MT5…"
                  className="min-h-0 flex-1 resize-none bg-[#050508] p-3 font-mono text-[12px] text-zinc-200 outline-none"
                />
                <div className="flex flex-wrap items-center gap-2 border-t border-[#1F1F2E] p-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onAdapt()}
                    className="rounded border border-[#00FF66]/30 bg-[#00FF66]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#00FF66] disabled:opacity-50"
                  >
                    {busy ? "Convirtiendo…" : "Convertir a TypeScript"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSave()}
                    className="rounded border border-[#00FF66]/30 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-[#00FF66]"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdapterIn(MQL_SAMPLE)}
                    className="font-mono text-[10px] uppercase tracking-wide text-zinc-500 hover:text-white"
                  >
                    Ejemplo MT5
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdapterIn(PINE_SAMPLE)}
                    className="font-mono text-[10px] uppercase tracking-wide text-zinc-500 hover:text-white"
                  >
                    Ejemplo Pine
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 flex-col">
                <p className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                  TypeScript AvizorChart · se genera aquí
                </p>
                {adaptMessage ? (
                  <p
                    className={`border-b px-3 py-2 font-mono text-[11px] ${
                      adaptMessage.ok
                        ? "border-[#00FF66]/20 bg-[#00FF66]/10 text-[#00FF66]"
                        : "border-red-500/20 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {adaptMessage.text}
                  </p>
                ) : (
                  <p className="border-b border-[#1F1F2E] px-3 py-2 font-mono text-[11px] text-zinc-600">
                    Al convertir, el código de la plataforma aparece aquí línea a línea.
                  </p>
                )}
                <pre className="min-h-0 flex-1 overflow-auto whitespace-pre-wrap p-3 font-mono text-[12px] text-[#00FF66]/90">
                  {preview}
                </pre>
              </div>
            </div>
          )}
          <footer className="shrink-0 border-t border-[#1F1F2E] px-3 py-2">
            {error ? <p className="font-mono text-[11px] text-red-300">{error}</p> : null}
            {!error && result ? (
              <p className="font-mono text-[11px] text-zinc-400">
                {result.language.toUpperCase()} → TypeScript · {result.plots.length} series.
                {result.notes.length > 0 ? ` ${result.notes.join(" ")}` : ""}
              </p>
            ) : null}
            {!error && !result ? (
              <p className="font-mono text-[11px] text-zinc-600">
                Convierte Pine/MT5 a TypeScript ({NATIVE_EXT}) y guarda para Indicadores → Builder.
              </p>
            ) : null}
          </footer>
        </section>
      </div>
    </div>
  );
}
