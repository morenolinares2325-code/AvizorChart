export interface ChartPatternHit {
  pattern: string;
  confidence: number;
}

export interface ChartPatternPayload {
  pivots: Array<[number, number, string]>;
  supports: number[];
  resistances: number[];
  patterns: ChartPatternHit[];
}

export interface PatternMarkLine {
  yAxis: number;
  name: string;
  lineStyle: { color: string; type: "dashed" | "solid"; width: number; opacity?: number };
  label: {
    show: boolean;
    formatter: string;
    position: "end";
    color: string;
    fontSize: number;
    fontFamily: string;
  };
}

export interface PatternMarkAreaPair {
  yAxis: number;
  itemStyle?: { color: string };
  name?: string;
}

export interface ChartPatternPrimitives {
  markLines: PatternMarkLine[];
  markAreas: Array<[PatternMarkAreaPair, PatternMarkAreaPair]>;
  labels: string[];
}

/**
 * Extrae etiquetas de patrones del backend. Los niveles S/R no se pintan
 * aquí: Auto S/R es un control explícito del usuario.
 */
export function buildChartPatternPrimitives(backendData: ChartPatternPayload | null | undefined): ChartPatternPrimitives {
  const markLines: PatternMarkLine[] = [];
  const markAreas: Array<[PatternMarkAreaPair, PatternMarkAreaPair]> = [];
  const labels: string[] = [];

  if (!backendData) {
    return { markLines, markAreas, labels };
  }

  const patterns = Array.isArray(backendData.patterns) ? backendData.patterns : [];
  for (const hit of patterns) {
    const name = String(hit.pattern ?? "").trim();
    if (!name) {
      continue;
    }
    const confidence = Number.isFinite(hit.confidence) ? Math.round(hit.confidence * 100) : 0;
    labels.push(confidence > 0 ? `${name} · ${confidence}%` : name);
  }

  return { markLines, markAreas, labels };
}
