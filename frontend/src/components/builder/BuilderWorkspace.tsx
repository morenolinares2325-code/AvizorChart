"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import { transpileOnServer, type BuilderEChartsPayload } from "@/lib/builderApi";
import { compileBuilderTypeScript } from "@/lib/builderCompile";
import { BUILDER_SAMPLES, BUILDER_TABS, type BuilderLangTab } from "@/lib/builderLanguages";
import { emitKlineIndicatorSource, parseKlineRegister, validateKlineSource } from "@/lib/klineIndicatorSource";
import { adaptScript, type ScriptLanguage } from "@/lib/scriptAdapter";
import { loadSavedScripts, newScriptId, upsertSavedScript } from "@/lib/scriptLibrary";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type StatusKind = "idle" | "busy" | "ok" | "error";

function tabToLanguage(tab: BuilderLangTab): ScriptLanguage {
  if (tab === "kline") return "typescript";
  return tab;
}

export function BuilderWorkspace() {
  const router = useRouter();
  const [tab, setTab] = useState<BuilderLangTab>("kline");
  const [name, setName] = useState("Indicador");
  const [source, setSource] = useState(BUILDER_SAMPLES.kline);
  const [translated, setTranslated] = useState("// El registerIndicator nativo aparece aquí.");
  const [plots, setPlots] = useState<BuiltIndicator[]>([]);
  const [visuals, setVisuals] = useState<BuilderEChartsPayload | undefined>();
  const [libraryCount, setLibraryCount] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: StatusKind; text: string }>({
    kind: "idle",
    text: "Pega el origen a la izquierda. La traducción KLineChart se genera a la derecha.",
  });
  const sourceRef = useRef(source);
  const nameRef = useRef(name);
  const tabRef = useRef(tab);
  sourceRef.current = source;
  nameRef.current = name;
  tabRef.current = tab;

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
        "editorWidget.background": "#0A0A0F",
      },
    });
    monaco.editor.setTheme("avizor-dark");
  };

  const translate = useCallback(async (opts?: { silent?: boolean }) => {
    const raw = sourceRef.current;
    const label = nameRef.current;
    const currentTab = tabRef.current;
    if (!raw.trim()) {
      setTranslated("// Editor de origen vacío.");
      setPlots([]);
      if (!opts?.silent) {
        setStatus({ kind: "error", text: "El editor de origen está vacío." });
      }
      return null;
    }
    if (!opts?.silent) {
      setStatus({ kind: "busy", text: "Traduciendo y validando…" });
    }
    try {
      const { kline, nextPlots, nextVisuals, language } = await buildKlineOutput(raw, label, currentTab);
      setTranslated(kline);
      setPlots(nextPlots);
      setVisuals(nextVisuals);
      const check = validateKlineSource(kline);
      if (!check.ok) {
        if (!opts?.silent) {
          setStatus({ kind: "error", text: check.error });
        }
        return null;
      }
      if (nextPlots.length === 0) {
        if (!opts?.silent) {
          setStatus({
            kind: "error",
            text: "No hay series, nubes ni señales reconocidas en el origen.",
          });
        }
        return null;
      }
      if (!opts?.silent) {
        setStatus({
          kind: "ok",
          text: "[OK] Indicador compilado y registrado con éxito en KLineChart",
        });
      }
      return { kline, nextPlots, nextVisuals, language };
    } catch (err) {
      const text = err instanceof Error ? err.message : "Error de compilación.";
      if (!opts?.silent) {
        setStatus({ kind: "error", text });
        setTranslated(`// Error de sintaxis\n// ${text}`);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void translate({ silent: true });
    }, 420);
    return () => window.clearTimeout(handle);
  }, [source, name, tab, translate]);

  async function onCompileSaveAdd() {
    const result = await translate();
    if (!result) {
      return;
    }
    try {
      const check = validateKlineSource(result.kline);
      if (!check.ok) {
        setStatus({ kind: "error", text: check.error });
        return;
      }
      const script = {
        id: activeId ?? newScriptId(),
        name: nameRef.current.trim() || result.nextPlots[0]?.name || "Indicador",
        language: result.language,
        source: sourceRef.current,
        avizor: result.kline,
        plots: result.nextPlots,
        echarts: result.nextVisuals,
        updatedAt: Date.now(),
      };
      upsertSavedScript(script);
      setActiveId(script.id);
      setLibraryCount(loadSavedScripts().length);
      setStatus({
        kind: "ok",
        text: "[OK] Indicador compilado y registrado con éxito en KLineChart",
      });
      router.push("/grafico");
    } catch (err) {
      setStatus({
        kind: "error",
        text: err instanceof Error ? err.message : "No se pudo guardar el indicador.",
      });
    }
  }

  const monacoLang = BUILDER_TABS.find((item) => item.id === tab)?.monaco ?? "plaintext";
  const tone =
    status.kind === "ok"
      ? "text-[#00FF66]"
      : status.kind === "error"
        ? "text-red-400"
        : status.kind === "busy"
          ? "text-cyan-300"
          : "text-zinc-500";

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      <header className="pointer-events-none flex shrink-0 flex-col gap-2 border-b border-[#1F1F2E] bg-[#0A0A0F]/80 px-12 py-3 backdrop-blur-md">
        <div className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex h-9 rounded-md border border-[#1F1F2E] p-0.5">
            {BUILDER_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id);
                  setSource(BUILDER_SAMPLES[item.id]);
                  setTranslated("// Traduciendo…");
                }}
                className={`inline-flex items-center gap-1.5 rounded px-3 font-mono text-[11px] ${
                  tab === item.id ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {item.label}
                <span className="hidden text-[9px] uppercase tracking-wider text-zinc-600 lg:inline">{item.hint}</span>
              </button>
            ))}
          </div>
          <label className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-[#1F1F2E] bg-black/40 px-3 py-1.5">
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Nombre del indicador
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mi indicador"
              className="h-6 min-w-0 flex-1 bg-transparent font-mono text-[13px] text-white outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void onCompileSaveAdd()}
            disabled={status.kind === "busy"}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#00FF66]/50 bg-[#00FF66]/15 px-4 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-[#00FF66] hover:bg-[#00FF66]/25 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            Compilar, Guardar y Añadir al Gráfico
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <section className="flex min-h-0 flex-col border-r border-[#1F1F2E]">
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#1F1F2E] px-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Origen · {tabLabel(tab)}</p>
            <p className="font-mono text-[10px] text-zinc-600">Pega el código aquí</p>
          </div>
          <div className="min-h-0 flex-1">
            <Monaco
              height="100%"
              language={monacoLang}
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
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-[#1F1F2E] px-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Destino · registerIndicator
            </p>
            <p className="font-mono text-[10px] text-zinc-600">{libraryCount} en biblioteca</p>
          </div>
          <div className="min-h-0 flex-1">
            <Monaco
              height="100%"
              language="typescript"
              theme="avizor-dark"
              value={translated}
              options={{
                readOnly: true,
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
      </div>

      <footer className="flex h-24 shrink-0 flex-col border-t border-[#1F1F2E] bg-black">
        <div className="flex h-7 items-center justify-between border-b border-[#1F1F2E] px-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Consola de compilación</p>
          <p className="font-mono text-[10px] text-zinc-600">try / catch · validación de sintaxis</p>
        </div>
        <pre className={`min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-5 ${tone}`}>
          {status.kind === "ok" ? "[OK] Indicador compilado y registrado con éxito en KLineChart" : status.text}
        </pre>
      </footer>
    </div>
  );
}

function tabLabel(tab: BuilderLangTab): string {
  return BUILDER_TABS.find((item) => item.id === tab)?.label ?? tab;
}

async function buildKlineOutput(
  source: string,
  name: string,
  tab: BuilderLangTab,
): Promise<{
  kline: string;
  nextPlots: BuiltIndicator[];
  nextVisuals: BuilderEChartsPayload;
  language: ScriptLanguage;
}> {
  const language = tabToLanguage(tab);
  if (tab === "kline") {
    const compiled = compileBuilderTypeScript(source, name);
    const fromRegister = parseKlineRegister(source, name);
    const nextPlots = compiled.ok ? compiled.plots : fromRegister;
    const kline = compiled.ok ? emitKlineIndicatorSource(name || compiled.name, compiled.plots) : source;
    const check = validateKlineSource(kline);
    if (!check.ok) {
      throw new Error(check.error);
    }
    if (nextPlots.length === 0) {
      throw new Error("No hay series en el TypeScript nativo (registerIndicator / overlay).");
    }
    return {
      kline,
      nextPlots,
      nextVisuals: compiled.ok ? compiled.echarts : { markLines: [], markAreas: [], markPoints: [], graphic: [], primitives: [] },
      language: "typescript",
    };
  }

  if (tab === "ctrader") {
    const adapted = adaptScript(source, name, "ctrader");
    if (adapted.plots.length === 0) {
      throw new Error(adapted.notes[0] || "cTrader: no se reconocieron medias, RSI o ATR.");
    }
    const kline = emitKlineIndicatorSource(name || adapted.name, adapted.plots);
    const check = validateKlineSource(kline);
    if (!check.ok) {
      throw new Error(check.error);
    }
    return {
      kline,
      nextPlots: adapted.plots,
      nextVisuals: { markLines: [], markAreas: [], markPoints: [], graphic: [], primitives: [] },
      language: "ctrader",
    };
  }

  try {
    const server = await transpileOnServer(source, name, language);
    const adapted = adaptScript(source, name, language);
    const nextPlots = mergeBuilderPlots(adapted.plots, server.plots);
    if (nextPlots.length > 0) {
      const kline = emitKlineIndicatorSource(name || server.name || adapted.name, nextPlots);
      const check = validateKlineSource(kline);
      if (!check.ok) {
        throw new Error(check.error);
      }
      return { kline, nextPlots, nextVisuals: server.echarts, language: server.language };
    }
  } catch (err) {
    const adapted = adaptScript(source, name, language);
    if (adapted.plots.length > 0) {
      const kline = emitKlineIndicatorSource(name || adapted.name, adapted.plots);
      const check = validateKlineSource(kline);
      if (!check.ok) {
        throw new Error(check.error);
      }
      return {
        kline,
        nextPlots: adapted.plots,
        nextVisuals: { markLines: [], markAreas: [], markPoints: [], graphic: [], primitives: [] },
        language,
      };
    }
    throw err instanceof Error ? err : new Error("Fallo al traducir el origen.");
  }

  const adapted = adaptScript(source, name, language);
  if (adapted.plots.length === 0) {
    throw new Error(adapted.notes[0] || "Sin series reconocidas en el origen.");
  }
  const kline = emitKlineIndicatorSource(name || adapted.name, adapted.plots);
  const check = validateKlineSource(kline);
  if (!check.ok) {
    throw new Error(check.error);
  }
  return {
    kline,
    nextPlots: adapted.plots,
    nextVisuals: { markLines: [], markAreas: [], markPoints: [], graphic: [], primitives: [] },
    language,
  };
}

function mergeBuilderPlots(primary: BuiltIndicator[], secondary: BuiltIndicator[]): BuiltIndicator[] {
  const out: BuiltIndicator[] = [];
  const seen = new Set<string>();
  for (const plot of [...primary, ...secondary]) {
    const key = `${plot.method}:${plot.source}:${plot.period}:${plot.pane}:${plot.name}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(plot);
  }
  const lines = out.filter((plot) => plot.method !== "signal_buy" && plot.method !== "signal_sell");
  return lines.length > 0 ? [...lines, ...out.filter((plot) => plot.method === "signal_buy" || plot.method === "signal_sell")] : out;
}
