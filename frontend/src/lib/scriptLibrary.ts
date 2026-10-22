import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { ScriptLanguage } from "@/lib/scriptAdapter";

export interface SavedScript {
  id: string;
  name: string;
  language: ScriptLanguage;
  source: string;
  avizor: string;
  plots: BuiltIndicator[];
  updatedAt: number;
}

const STORAGE_KEY = "avizor.chart.scripts.v1";
const PENDING_KEY = "avizor.chart.scripts.pending";
export const SCRIPTS_EVENT = "avizor-scripts";

export function loadSavedScripts(): SavedScript[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
      .map((item) => ({
        id: String(item.id ?? newScriptId()),
        name: String(item.name ?? "Indicador"),
        language:
          item.language === "mql5" || item.language === "avizor" || item.language === "typescript"
            ? item.language
            : item.language === "pine"
              ? "pine"
              : "typescript",
        source: String(item.source ?? ""),
        avizor: String(item.avizor ?? ""),
        plots: Array.isArray(item.plots) ? (item.plots as BuiltIndicator[]) : [],
        updatedAt: Number(item.updatedAt) || Date.now(),
      }));
  } catch {
    return [];
  }
}

export function saveSavedScripts(scripts: SavedScript[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
    window.dispatchEvent(new Event(SCRIPTS_EVENT));
  } catch {
    throw new Error("No se pudo guardar el indicador en este navegador.");
  }
}

export function upsertSavedScript(script: SavedScript, library = loadSavedScripts()): SavedScript[] {
  const next = [script, ...library.filter((item) => item.id !== script.id)];
  saveSavedScripts(next);
  markPendingScript(script.id);
  return next;
}

export function loadPendingScripts(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map((id) => String(id)) : [];
  } catch {
    return [];
  }
}

export function markPendingScript(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = [id, ...loadPendingScripts().filter((item) => item !== id)];
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

export function consumePendingScripts(): string[] {
  return loadPendingScripts();
}

export function dropPendingScript(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const next = loadPendingScripts().filter((item) => item !== id);
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(next));
}

export function removeSavedScript(id: string, library = loadSavedScripts()): SavedScript[] {
  const next = library.filter((item) => item.id !== id);
  saveSavedScripts(next);
  return next;
}

export function newScriptId(): string {
  return `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function plotsForScripts(library: SavedScript[], enabledIds: string[]): BuiltIndicator[] {
  return enabledIds.flatMap((id) => {
    const script = library.find((item) => item.id === id);
    if (!script) {
      return [];
    }
    return script.plots.map((plot) => ({
      ...plot,
      id: `${id}:${plot.id}`,
      enabled: true,
    }));
  });
}
