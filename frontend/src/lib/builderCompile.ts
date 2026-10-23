import {
  newBuiltId,
  type BuiltIndicator,
  type BuilderMethod,
  type BuilderPane,
  type BuilderSignalSpec,
  type BuilderSource,
} from "@/components/chart/chartIndicatorBuilder";
import type { BuilderEChartsPayload } from "@/lib/builderApi";
import { detectLanguage } from "@/lib/scriptAdapter";

export interface CompileIssue {
  line?: number;
  message: string;
}

export interface CompileSuccess {
  ok: true;
  name: string;
  plots: BuiltIndicator[];
  avizor: string;
  echarts: BuilderEChartsPayload;
  issues: CompileIssue[];
}

export interface CompileFailure {
  ok: false;
  issues: CompileIssue[];
}

export type CompileResult = CompileSuccess | CompileFailure;

const RAW_FN = new Set(["close", "open", "high", "low", "hl2", "hlc3", "volume", "raw"]);
const METHOD_ALIAS: Record<string, BuilderMethod> = {
  ema: "ema",
  sma: "sma",
  rsi: "rsi",
  atr: "atr",
  roc: "roc",
  stddev: "stddev",
  bbupper: "bb_upper",
  bblower: "bb_lower",
  macd: "macd",
  macdsignal: "macd_signal",
  macdhist: "macd_hist",
};

export function compileBuilderTypeScript(source: string, nameHint = ""): CompileResult {
  const issues = checkShape(source);
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  const language = detectLanguage(source);
  if (language === "pine" || language === "mql5") {
    return {
      ok: false,
      issues: [
        {
          message:
            "Este código no es TypeScript de Avizor. Carga una plantilla maestra o pégalo solo si ya está en overlay()/signalBuy().",
        },
      ],
    };
  }

  const name =
    nameHint.trim() ||
    pickString(source, /export\s+const\s+name\s*=\s*("([^"]+)"|'([^']+)')/) ||
    "Indicador";
  const plots: BuiltIndicator[] = [];
  plots.push(...parseSeriesCalls(source));
  plots.push(...parseSignalCalls(source, "signalBuy", "buy"));
  plots.push(...parseSignalCalls(source, "signalSell", "sell"));

  if (plots.length === 0) {
    return {
      ok: false,
      issues: [
        {
          message:
            "No hay overlay(), pane(), signalBuy() ni signalSell() válidos. No se aplicó ninguna plantilla genérica.",
        },
      ],
    };
  }

  return {
    ok: true,
    name,
    plots,
    avizor: source,
    echarts: echartsFromPlots(plots, source),
    issues: [],
  };
}

function checkShape(source: string): CompileIssue[] {
  const issues: CompileIssue[] = [];
  if (!source.trim()) {
    return [{ message: "El editor está vacío." }];
  }
  const pairs: Record<string, string> = { "(": ")", "{": "}", "[": "]" };
  const open = new Set(Object.keys(pairs));
  const stack: Array<{ ch: string; line: number }> = [];
  let quote = "";
  let line = 1;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "\n") {
      line += 1;
    }
    if (quote) {
      if (ch === quote && source[i - 1] !== "\\") {
        quote = "";
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (open.has(ch)) {
      stack.push({ ch, line });
      continue;
    }
    if (ch === ")" || ch === "}" || ch === "]") {
      const last = stack.pop();
      if (!last || pairs[last.ch] !== ch) {
        issues.push({ line, message: `Símbolo '${ch}' sin pareja en la línea ${line}.` });
      }
    }
  }
  if (quote) {
    issues.push({ message: "Hay una cadena de texto sin cerrar." });
  }
  for (const item of stack) {
    issues.push({ line: item.line, message: `'${item.ch}' sin cerrar (línea ${item.line}).` });
  }
  return issues;
}

function parseSeriesCalls(source: string): BuiltIndicator[] {
  const plots: BuiltIndicator[] = [];
  const re =
    /\b(overlay|pane)\s*\(\s*(ema|sma|rsi|atr|roc|stddev|bbUpper|bbLower|macdSignal|macdHist|macd|raw|close|open|high|low|hl2|hlc3|volume)\s*(?:\(\s*(close|open|high|low|hl2|hlc3|volume)\s*,\s*(\d+)\s*\))?\s*,\s*\{([^}]*)\}/gi;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(source))) {
    const pane: BuilderPane = hit[1] === "pane" ? "pane" : "overlay";
    const head = hit[2].toLowerCase();
    const method: BuilderMethod = METHOD_ALIAS[head] ?? (RAW_FN.has(head) ? "raw" : "ema");
    const sourceId = asSource(hit[3] || (RAW_FN.has(head) ? head : "close"));
    const period = Number(hit[4]) || (method === "raw" ? 1 : 14);
    const meta = hit[5];
    const styleRaw = pickString(meta, /style\s*:\s*("([^"]+)"|'([^']+)')/) || meta.match(/style\s*:\s*(bar|hist|line)/i)?.[1];
    plots.push({
      id: newBuiltId(),
      name: pickString(meta, /title\s*:\s*("([^"]+)"|'([^']+)')/) || `${method.toUpperCase()} ${period}`,
      enabled: true,
      source: sourceId,
      method,
      period,
      color: pickString(meta, /color\s*:\s*("([^"]+)"|'([^']+)')/) || nextColor(plots.length),
      color2: pickString(meta, /color2\s*:\s*("([^"]+)"|'([^']+)')/) || undefined,
      width: Number(meta.match(/width\s*:\s*([\d.]+)/)?.[1] ?? 1.4),
      pane,
      style: styleRaw === "bar" || styleRaw === "hist" ? styleRaw : method === "macd_hist" ? "hist" : "line",
      fill: pickString(meta, /fill\s*:\s*("([^"]+)"|'([^']+)')/) || undefined,
      group: pickString(meta, /group\s*:\s*("([^"]+)"|'([^']+)')/) || undefined,
    });
  }
  return plots;
}

function parseSignalCalls(source: string, fn: "signalBuy" | "signalSell", side: "buy" | "sell"): BuiltIndicator[] {
  const plots: BuiltIndicator[] = [];
  const needle = `${fn}(`;
  let from = 0;
  while (from < source.length) {
    const start = source.indexOf(needle, from);
    if (start < 0) {
      break;
    }
    const open = start + needle.length - 1;
    const close = matchingParen(source, open);
    if (close < 0) {
      break;
    }
    const inner = source.slice(open + 1, close);
    const spec = parseObjectLiteral(inner);
    const opts = parseObjectLiteral(inner.slice(inner.lastIndexOf("{")));
    const signal: BuilderSignalSpec = {
      side,
      bb: spec.bb === "upper" || spec.bb === "lower" ? spec.bb : undefined,
      bbPeriod: num(spec.bbPeriod),
      bbMult: num(spec.bbMult),
      rsiPeriod: num(spec.rsiPeriod),
      rsiOp: spec.rsiOp === ">" || spec.rsiOp === "<" ? spec.rsiOp : undefined,
      rsiValue: num(spec.rsiValue),
      stochPeriod: num(spec.stochPeriod),
      stochOp: spec.stochOp === ">" || spec.stochOp === "<" ? spec.stochOp : undefined,
      stochValue: num(spec.stochValue),
      crossFast: num(spec.crossFast),
      crossSlow: num(spec.crossSlow),
      crossMethod: spec.crossMethod === "sma" ? "sma" : spec.crossMethod === "ema" ? "ema" : undefined,
    };
    plots.push({
      id: newBuiltId(),
      name: String(opts.title ?? (side === "buy" ? "BUY" : "SELL")),
      enabled: true,
      source: side === "buy" ? "low" : "high",
      method: side === "buy" ? "signal_buy" : "signal_sell",
      period: 1,
      color: String(opts.color ?? (side === "buy" ? "#00FF66" : "#FF3366")),
      width: 1.4,
      pane: "overlay",
      signal,
    });
    from = close + 1;
  }
  return plots;
}

function parseObjectLiteral(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  const re = /(\w+)\s*:\s*("([^"]*)"|'([^']*)'|-?\d+(?:\.\d+)?|\w+)/g;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(raw))) {
    map[hit[1]] = hit[3] ?? hit[4] ?? hit[2];
  }
  return map;
}

function matchingParen(source: string, openIndex: number): number {
  let depth = 0;
  let quote = "";
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === quote && source[i - 1] !== "\\") {
        quote = "";
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
}

function echartsFromPlots(plots: BuiltIndicator[], source: string): BuilderEChartsPayload {
  const primitives = plots
    .filter((item) => item.method === "signal_buy" || item.method === "signal_sell")
    .map((item) => ({
      type: item.method,
      name: item.name,
      color: item.color,
      source: item.signal,
    }));
  const markLines: unknown[] = [];
  const markAreas: unknown[] = [];
  const lineRe = /markLine\s*\(\s*\{([^}]*)\}\s*\)/g;
  let hit: RegExpExecArray | null;
  while ((hit = lineRe.exec(source))) {
    const meta = parseObjectLiteral(hit[1]);
    const y = num(meta.y);
    if (y == null) {
      continue;
    }
    markLines.push({
      name: meta.name ?? "Nivel",
      yAxis: y,
      pane: meta.pane === "pane" ? "pane" : "overlay",
      lineStyle: { color: meta.color ?? "#78909C", type: meta.style ?? "dashed", width: 1 },
      label: { formatter: meta.name ?? "", fontSize: 9, color: meta.color ?? "#78909C" },
    });
  }
  const areaRe = /markArea\s*\(\s*\{([^}]*)\}\s*\)/g;
  while ((hit = areaRe.exec(source))) {
    const meta = parseObjectLiteral(hit[1]);
    const y0 = num(meta.y0);
    const y1 = num(meta.y1);
    if (y0 == null || y1 == null) {
      continue;
    }
    markAreas.push([
      {
        name: meta.name ?? "Zona",
        yAxis: y0,
        pane: meta.pane === "pane" ? "pane" : "overlay",
        itemStyle: { color: meta.color ?? "rgba(38,166,154,0.10)" },
      },
      { yAxis: y1 },
    ]);
  }
  return { markLines, markAreas, markPoints: [], graphic: [], primitives };
}

function pickString(source: string, re: RegExp): string | null {
  const hit = source.match(re);
  return hit?.[2] || hit?.[3] || hit?.[1] || null;
}

function num(value: string | undefined): number | undefined {
  if (value == null) {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function asSource(value: string): BuilderSource {
  const token = value.toLowerCase();
  if (token === "open" || token === "high" || token === "low" || token === "hl2" || token === "hlc3" || token === "volume") {
    return token;
  }
  return "close";
}

function nextColor(index: number): string {
  return ["#2962FF", "#26A69A", "#FF6D00", "#AB47BC", "#26C6DA", "#EF5350"][index % 6];
}
