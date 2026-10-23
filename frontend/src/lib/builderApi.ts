import { API_BASE } from "@/lib/marketApi";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { AdaptResult, ScriptLanguage } from "@/lib/scriptAdapter";

export interface BuilderEChartsPayload {
  markLines: unknown[];
  markAreas: unknown[];
  markPoints?: unknown[];
  graphic?: unknown[];
  primitives: Array<{ type?: string; name?: string; color?: string; source?: unknown }>;
}

export interface BuilderTranspileResult extends AdaptResult {
  status?: string;
  script_type?: string;
  echarts: BuilderEChartsPayload;
  orders: unknown[];
}

function asLanguage(value: unknown): ScriptLanguage {
  if (value === "mql5" || value === "pine" || value === "avizor" || value === "typescript") {
    return value;
  }
  if (value === "pinescript") {
    return "pine";
  }
  return "pine";
}

export async function transpileOnServer(source: string, name = ""): Promise<BuilderTranspileResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/builder/transpile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, name }),
    });
  } catch {
    throw new Error(
      "No hay conexión con FastAPI en http://127.0.0.1:8000. Arranca el backend para convertir Pine/MQL5.",
    );
  }
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) {
        detail = body.detail;
      }
    } catch {
      detail = (await response.text()) || detail;
    }
    throw new Error(detail);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const plots = Array.isArray(payload.plots) ? (payload.plots as BuiltIndicator[]) : [];
  const echarts = (payload.echarts as BuilderEChartsPayload | undefined) ?? {
    markLines: [],
    markAreas: [],
    markPoints: [],
    graphic: [],
    primitives: [],
  };
  return {
    status: String(payload.status ?? "success"),
    language: asLanguage(payload.language),
    name: String(payload.name ?? name ?? "Indicador"),
    avizor: String(payload.avizor ?? ""),
    plots,
    notes: Array.isArray(payload.notes) ? payload.notes.map((item) => String(item)) : [],
    script_type: payload.script_type ? String(payload.script_type) : undefined,
    echarts,
    orders: Array.isArray(payload.orders) ? payload.orders : [],
  };
}
