import {
  defaultBuiltName,
  newBuiltId,
  type BuiltIndicator,
  type BuilderMethod,
  type BuilderPane,
  type BuilderSource,
} from "@/components/chart/chartIndicatorBuilder";

export type ScriptLanguage = "typescript" | "pine" | "mql5" | "avizor";

export interface AdaptResult {
  language: ScriptLanguage;
  name: string;
  avizor: string;
  plots: BuiltIndicator[];
  notes: string[];
}

const PINE_COLORS: Record<string, string> = {
  green: "#22c55e",
  lime: "#00FF66",
  red: "#ef4444",
  maroon: "#FF073A",
  blue: "#38bdf8",
  aqua: "#00E5FF",
  teal: "#14b8a6",
  orange: "#fb923c",
  yellow: "#eab308",
  purple: "#a78bfa",
  fuchsia: "#FF007F",
  white: "#e4e4e7",
  gray: "#71717a",
  silver: "#a1a1aa",
  black: "#09090b",
};

export function detectLanguage(source: string): ScriptLanguage {
  const text = source.toLowerCase();
  if (
    text.includes("oncalculate") ||
    text.includes("oninit") ||
    text.includes("#property") ||
    text.includes("indicator_buffers") ||
    text.includes("indicator_chart_window") ||
    text.includes("indicator_separate_window") ||
    text.includes("copybuffer") ||
    text.includes("enum_ma") ||
    text.includes("imaonarray") ||
    text.includes("mql4") ||
    text.includes("mql5") ||
    text.includes(".mqh") ||
    text.includes(".mq5") ||
    text.includes(".mq4") ||
    /\bima\s*\(/.test(text) ||
    /\birsi\s*\(/.test(text) ||
    /\biatr\s*\(/.test(text) ||
    /\bibands\s*\(/.test(text) ||
    /\bimacd\s*\(/.test(text)
  ) {
    return "mql5";
  }
  if (text.includes("//@version") || /\bindicator\s*\(/.test(text) || /\bta\.(ema|sma|rsi)\s*\(/.test(text)) {
    return "pine";
  }
  if (text.includes("//@avizor") || /^\s*(overlay|pane)\s+(ema|sma|rsi|atr)\s+/m.test(source)) {
    return "avizor";
  }
  return "typescript";
}

export function adaptScript(source: string, nameHint = ""): AdaptResult {
  const language = detectLanguage(source);
  const notes: string[] = [];
  if (language === "typescript") {
    const parsed = parseTypeScript(source, nameHint, notes);
    return { ...parsed, language, notes };
  }
  if (language === "avizor") {
    const parsed = parseAvizor(source, nameHint);
    return { ...parsed, language, notes };
  }
  if (language === "mql5") {
    const parsed = adaptMql(source, nameHint, notes);
    return { ...parsed, language, notes };
  }
  const parsed = adaptPine(source, nameHint, notes);
  return { ...parsed, language, notes };
}

export function plotsToTypeScript(name: string, plots: BuiltIndicator[]): string {
  const lines = [
    `import { overlay, pane, ema, sma, rsi, atr, roc, stddev, close } from "@avizor/chart";`,
    ``,
    `export const name = ${JSON.stringify(name)};`,
    ``,
  ];
  for (const plot of plots) {
    const fn = plot.pane === "pane" ? "pane" : "overlay";
    const call = plot.method === "raw" ? plot.source : `${plot.method}(${plot.source}, ${plot.period})`;
    lines.push(
      `${fn}(${call}, { color: ${JSON.stringify(plot.color)}, width: ${plot.width}, title: ${JSON.stringify(plot.name)} });`,
    );
  }
  lines.push(``);
  lines.push(`export default { name };`);
  return lines.join("\n");
}

export function plotsToAvizor(name: string, plots: BuiltIndicator[]): string {
  return plotsToTypeScript(name, plots);
}

function parseTypeScript(
  source: string,
  nameHint: string,
  notes: string[],
): Omit<AdaptResult, "language" | "notes"> {
  const named =
    nameHint.trim() ||
    pickString(source, /export\s+const\s+name\s*=\s*("([^"]+)"|'([^']+)')/) ||
    pickString(source, /name\s*:\s*("([^"]+)"|'([^']+)')/) ||
    "Indicador TypeScript";
  const plots: BuiltIndicator[] = [];
  const callRe =
    /\b(overlay|pane)\s*\(\s*(ema|sma|rsi|atr|roc|stddev|raw|close|open|high|low|hl2|hlc3|volume)\s*(?:\(\s*(\w+)\s*,\s*(\d+)\s*\))?\s*,\s*\{([^}]*)\}/gi;
  let hit: RegExpExecArray | null;
  while ((hit = callRe.exec(source))) {
    const pane: BuilderPane = hit[1] === "pane" ? "pane" : "overlay";
    const head = hit[2].toLowerCase();
    const method = asMethod(head === "close" || head === "open" ? "raw" : head);
    const sourceId = asSource(hit[3] || (method === "raw" ? head : "close"));
    const period = Number(hit[4]) || 14;
    const meta = hit[5];
    const color = parseColor(meta) || nextColor(plots.length);
    const widthMatch = meta.match(/width\s*:\s*([\d.]+)/);
    const title =
      pickString(meta, /title\s*:\s*("([^"]+)"|'([^']+)')/) ||
      defaultBuiltName(method, period, sourceId);
    plots.push({
      id: newBuiltId(),
      name: title,
      enabled: true,
      source: sourceId,
      method,
      period,
      color,
      width: widthMatch ? Number(widthMatch[1]) : 1.4,
      pane,
    });
  }

  const objRe =
    /\{\s*pane\s*:\s*["'](overlay|pane)["']\s*,\s*method\s*:\s*["'](\w+)["']\s*,\s*source\s*:\s*["'](\w+)["']\s*,\s*period\s*:\s*(\d+)[^}]*color\s*:\s*["']([^"']+)["'][^}]*(?:width\s*:\s*([\d.]+))?[^}]*(?:title\s*:\s*["']([^"']+)["'])?/gi;
  while ((hit = objRe.exec(source))) {
    const method = asMethod(hit[2]);
    const src = asSource(hit[3]);
    const period = Number(hit[4]);
    plots.push({
      id: newBuiltId(),
      name: hit[7] || defaultBuiltName(method, period, src),
      enabled: true,
      source: src,
      method,
      period,
      color: hit[5].startsWith("#") ? hit[5] : parseColor(hit[5]) || nextColor(plots.length),
      width: hit[6] ? Number(hit[6]) : 1.4,
      pane: hit[1] === "pane" ? "pane" : "overlay",
    });
  }

  if (plots.length === 0) {
    notes.push("No se detectaron overlay()/pane() en TypeScript. Plantilla EMA 21.");
    plots.push(makePlot({ method: "ema", source: "close", period: 21, pane: "overlay" }, named, "#00FF66"));
  }

  return { name: named, avizor: plotsToTypeScript(named, plots), plots };
}

function parseAvizor(source: string, nameHint: string): Omit<AdaptResult, "language" | "notes"> {
  const nameMatch = source.match(/name\s*=\s*("([^"]+)"|'([^']+)')/i);
  const name = nameHint.trim() || nameMatch?.[2] || nameMatch?.[3] || "Indicador Avizor";
  const plots: BuiltIndicator[] = [];
  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("//") || line.startsWith("#")) {
      continue;
    }
    const match = line.match(
      /^(overlay|pane)\s+(\w+)\s+(\w+)\s+(\d+(?:\.\d+)?)\s+(#[0-9a-fA-F]{6})?\s*(\d+(?:\.\d+)?)?\s*("([^"]*)")?/,
    );
    if (!match) {
      continue;
    }
    const method = asMethod(match[2]);
    const src = asSource(match[3]);
    const period = Number(match[4]);
    plots.push({
      id: newBuiltId(),
      name: match[8] || defaultBuiltName(method, period, src),
      enabled: true,
      source: src,
      method,
      period,
      color: match[5] || "#00FF66",
      width: match[6] ? Number(match[6]) : 1.4,
      pane: match[1] === "pane" ? "pane" : "overlay",
    });
  }
  return { name, avizor: plotsToAvizor(name, plots), plots };
}

function adaptPine(source: string, nameHint: string, notes: string[]): Omit<AdaptResult, "language" | "notes"> {
  const title =
    nameHint.trim() ||
    pickString(source, /(?:indicator|study)\s*\(\s*("([^"]+)"|'([^']+)')/i) ||
    "Indicador Pine";
  const inputs = collectInputs(source);
  const aliases = collectAliases(source, inputs);
  const plots: BuiltIndicator[] = [];

  const plotRe =
    /plot\s*\(\s*([^,]+?)(?:\s*,\s*(?:title\s*=\s*)?("([^"]+)"|'([^']+)')?)?[^)]*(color\s*=\s*([^,\)]+))?/gi;
  let hit: RegExpExecArray | null;
  while ((hit = plotRe.exec(source))) {
    const expr = hit[1].trim();
    const titlePlot = hit[3] || hit[4] || "";
    const color = parseColor(hit[6] ?? "") || nextColor(plots.length);
    const spec = resolveExpr(expr, aliases, inputs);
    if (!spec) {
      notes.push(`No se pudo mapear plot(${truncate(expr)}). Usa ta.ema/sma/rsi/atr/roc/stdev.`);
      continue;
    }
    plots.push(makePlot(spec, titlePlot || `${title} ${plots.length + 1}`, color));
  }

  if (plots.length === 0) {
    const fallback = Array.from(source.matchAll(/ta\.(ema|sma|rsi|atr|roc|stdev|stddev|rma|wma|mom)\s*\(([^)]*)\)/gi));
    for (const row of fallback) {
      const spec = parseCall(row[1], row[2], inputs);
      if (spec) {
        plots.push(makePlot(spec, `${title} ${plots.length + 1}`, nextColor(plots.length)));
      }
    }
  }

  if (plots.length === 0) {
    notes.push("Sin series reconocidas. Se genera un EMA 21 sobre close como plantilla.");
    plots.push(
      makePlot({ method: "ema", source: "close", period: 21, pane: "overlay" }, title, "#00FF66"),
    );
  }

  return { name: title, avizor: plotsToAvizor(title, plots), plots };
}

function adaptMql(source: string, nameHint: string, notes: string[]): Omit<AdaptResult, "language" | "notes"> {
  const cleaned = stripMqlComments(source);
  const inputs = collectMqlInputs(cleaned);
  const title =
    (nameHint.trim() && nameHint.trim() !== "EMA Ribbon" ? nameHint.trim() : "") ||
    pickString(source, /#property\s+description\s+"([^"]+)"/i) ||
    pickString(source, /#property\s+copyright\s+"([^"]+)"/i) ||
    mq5HeaderName(source) ||
    "Indicador MT5";
  const separate = /indicator_separate_window/i.test(source);
  const plots: BuiltIndicator[] = [];
  const seen = new Set<string>();

  const calls = extractCalls(cleaned, [
    "iMA",
    "iMAOnArray",
    "iRSI",
    "iATR",
    "iStdDev",
    "iMomentum",
    "iCCI",
    "iWPR",
    "iBands",
    "iMACD",
    "iStochastic",
    "iEnvelopes",
    "ExponentialMA",
    "SimpleMA",
  ]);

  for (const call of calls) {
    const specs = mqlCall(call.name, call.args, separate, inputs);
    if (specs.length === 0) {
      notes.push(`Llamada no mapeada: ${call.name}`);
      continue;
    }
    for (const spec of specs) {
      const key = `${spec.method}-${spec.source}-${spec.period}-${spec.pane}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      plots.push(makePlot(spec, `${title} ${defaultBuiltName(spec.method, spec.period, spec.source)}`, nextColor(plots.length)));
    }
  }

  if (plots.length === 0) {
    const guessed = guessMqlPlots(cleaned, inputs, separate);
    for (const spec of guessed) {
      plots.push(makePlot(spec, `${title} ${defaultBuiltName(spec.method, spec.period, spec.source)}`, nextColor(plots.length)));
    }
    if (plots.length === 0) {
      notes.push(
        "No se reconocieron iMA/iRSI/iATR/iBands/iMACD. Este MQ5 hay que reescribirlo a mano en TypeScript (overlay/ema/atr).",
      );
      return {
        name: title,
        avizor: [
          `// Conversión MQL5 fallida: ${title}`,
          `// No hay llamadas iMA / iRSI / iATR / iBands / iMACD que el adapter pueda mapear.`,
          `// Reescribe el indicador en TypeScript, por ejemplo:`,
          `import { overlay, atr, close } from "@avizor/chart";`,
          `export const name = ${JSON.stringify(title)};`,
          `overlay(atr(close, 14), { color: "#00FF66", width: 1.4, title: "ATR" });`,
        ].join("\n"),
        plots,
      };
    }
    notes.push("No había iMA directo. Se aproximó con ATR/EMA a partir de buffers e inputs del MQ5.");
  } else {
    notes.push(`Convertido desde MQL5: ${plots.length} serie${plots.length === 1 ? "" : "s"} en TypeScript.`);
  }

  return { name: title, avizor: plotsToTypeScript(title, plots), plots };
}

function guessMqlPlots(source: string, inputs: Record<string, number>, separate: boolean): PlotSpec[] {
  const period = firstMqlPeriod(inputs);
  const pane: BuilderPane = separate ? "pane" : "overlay";
  if (/supertrend|stbuffer|i?atr|atrperiod/i.test(source)) {
    return [{ method: "atr", source: "close", period: period || 10, pane }];
  }
  if (/rsi/i.test(source)) {
    return [{ method: "rsi", source: "close", period: period || 14, pane: "pane" }];
  }
  if (period) {
    return [{ method: "ema", source: "close", period, pane }];
  }
  return [];
}

function firstMqlPeriod(inputs: Record<string, number>): number {
  const preferred = Object.entries(inputs).find(([key]) => /period|len|atr|ma/i.test(key));
  if (preferred) {
    return preferred[1];
  }
  const first = Object.values(inputs)[0];
  return first && first > 1 ? first : 0;
}

interface PlotSpec {
  method: BuilderMethod;
  source: BuilderSource;
  period: number;
  pane: BuilderPane;
}

function makePlot(spec: PlotSpec, name: string, color: string): BuiltIndicator {
  return {
    id: newBuiltId(),
    name,
    enabled: true,
    source: spec.source,
    method: spec.method,
    period: spec.period,
    color,
    width: 1.4,
    pane: spec.pane,
  };
}

function collectInputs(source: string): Record<string, number> {
  const map: Record<string, number> = {};
  const re =
    /(\w+)\s*=\s*input(?:\.(?:int|float))?\s*\(\s*(-?\d+(?:\.\d+)?)/gi;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(source))) {
    map[hit[1]] = Number(hit[2]);
  }
  return map;
}

function collectAliases(source: string, inputs: Record<string, number>): Record<string, PlotSpec> {
  const map: Record<string, PlotSpec> = {};
  const re = /(\w+)\s*=\s*(?:ta\.)?(ema|sma|rsi|atr|roc|stdev|stddev|rma|wma|mom)\s*\(([^)]*)\)/gi;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(source))) {
    const spec = parseCall(hit[2], hit[3], inputs);
    if (spec) {
      map[hit[1]] = spec;
    }
  }
  return map;
}

function resolveExpr(
  expr: string,
  aliases: Record<string, PlotSpec>,
  inputs: Record<string, number>,
): PlotSpec | null {
  const clean = expr.replace(/\s+/g, "");
  if (aliases[clean]) {
    return aliases[clean];
  }
  const call = clean.match(/^(?:ta\.)?(ema|sma|rsi|atr|roc|stdev|stddev|rma|wma|mom)\((.*)\)$/i);
  if (call) {
    return parseCall(call[1], call[2], inputs);
  }
  const src = asSource(clean);
  if (src !== "close" || clean.toLowerCase() === "close") {
    return { method: "raw", source: src, period: 1, pane: "overlay" };
  }
  return null;
}

function parseCall(fn: string, argsRaw: string, inputs: Record<string, number>): PlotSpec | null {
  const method = asMethod(fn);
  const args = splitArgs(argsRaw);
  if (method === "atr") {
    return { method, source: "close", period: asNumber(args[0], inputs, 14), pane: "overlay" };
  }
  const source = asSource(args[0] ?? "close");
  const period = asNumber(args[1] ?? args[0], inputs, 14);
  const pane: BuilderPane = method === "rsi" || method === "roc" || method === "stddev" ? "pane" : "overlay";
  return { method, source, period, pane };
}

function mqlCall(fn: string, args: string[], separate: boolean, inputs: Record<string, number>): PlotSpec[] {
  const pane: BuilderPane = separate ? "pane" : "overlay";
  if (fn === "ima" || fn === "imaonarray") {
    const period = asNumber(args[2], inputs, 21);
    const mode = (args[4] ?? args[3] ?? "").toUpperCase();
    const price = args[5] ?? args[args.length - 1] ?? "PRICE_CLOSE";
    return [
      {
        method: mode.includes("SMA") ? "sma" : "ema",
        source: mqlPrice(price),
        period,
        pane,
      },
    ];
  }
  if (fn === "exponentialma") {
    return [{ method: "ema", source: "close", period: asNumber(args[1] ?? args[2], inputs, 21), pane }];
  }
  if (fn === "simplema") {
    return [{ method: "sma", source: "close", period: asNumber(args[1] ?? args[2], inputs, 21), pane }];
  }
  if (fn === "irsi") {
    return [
      {
        method: "rsi",
        source: mqlPrice(args[3] ?? "PRICE_CLOSE"),
        period: asNumber(args[2], inputs, 14),
        pane: "pane",
      },
    ];
  }
  if (fn === "iatr") {
    return [{ method: "atr", source: "close", period: asNumber(args[2], inputs, 14), pane: separate ? "pane" : "overlay" }];
  }
  if (fn === "istddev") {
    return [
      {
        method: "stddev",
        source: mqlPrice(args[5] ?? args[3] ?? "PRICE_CLOSE"),
        period: asNumber(args[2], inputs, 20),
        pane: "pane",
      },
    ];
  }
  if (fn === "imomentum") {
    return [
      {
        method: "roc",
        source: mqlPrice(args[3] ?? "PRICE_CLOSE"),
        period: asNumber(args[2], inputs, 12),
        pane: "pane",
      },
    ];
  }
  if (fn === "icci") {
    return [{ method: "sma", source: "hlc3", period: asNumber(args[2], inputs, 20), pane: "pane" }];
  }
  if (fn === "iwpr") {
    return [{ method: "roc", source: "close", period: asNumber(args[2], inputs, 14), pane: "pane" }];
  }
  if (fn === "ibands") {
    const period = asNumber(args[2], inputs, 20);
    return [
      { method: "sma", source: "close", period, pane: "overlay" },
      { method: "stddev", source: "close", period, pane: "overlay" },
    ];
  }
  if (fn === "imacd") {
    return [
      { method: "ema", source: "close", period: asNumber(args[2], inputs, 12), pane: "pane" },
      { method: "ema", source: "close", period: asNumber(args[3], inputs, 26), pane: "pane" },
    ];
  }
  if (fn === "istochastic") {
    return [{ method: "rsi", source: "close", period: asNumber(args[2], inputs, 14), pane: "pane" }];
  }
  if (fn === "ienvelopes") {
    return [{ method: "ema", source: "close", period: asNumber(args[2], inputs, 14), pane: "overlay" }];
  }
  return [];
}

function extractCalls(source: string, names: string[]): { name: string; args: string[] }[] {
  const hits: { name: string; args: string[] }[] = [];
  const lower = source.toLowerCase();
  for (const label of names) {
    const needle = label.toLowerCase();
    let from = 0;
    while (from < lower.length) {
      const at = lower.indexOf(needle, from);
      if (at < 0) {
        break;
      }
      const prev = at === 0 ? "" : lower[at - 1] ?? "";
      if (/\w/.test(prev)) {
        from = at + needle.length;
        continue;
      }
      let cursor = at + needle.length;
      while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
        cursor += 1;
      }
      if (source[cursor] !== "(") {
        from = cursor + 1;
        continue;
      }
      const inner = readParens(source, cursor);
      if (!inner) {
        from = cursor + 1;
        continue;
      }
      hits.push({ name: needle, args: splitArgs(inner.body) });
      from = inner.end;
    }
  }
  return hits;
}

function readParens(source: string, openIndex: number): { body: string; end: number } | null {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return { body: source.slice(openIndex + 1, i), end: i + 1 };
      }
    }
  }
  return null;
}

function collectMqlInputs(source: string): Record<string, number> {
  const map: Record<string, number> = {};
  const re = /(?:s?input\s+(?:group\s+"[^"]*"\s+)?)?(?:const\s+)?(?:int|uint|double|short)\s+(\w+)\s*=\s*(-?\d+(?:\.\d+)?)/gi;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(source))) {
    map[hit[1]] = Number(hit[2]);
  }
  const def = /#define\s+(\w+)\s+(-?\d+(?:\.\d+)?)/g;
  while ((hit = def.exec(source))) {
    map[hit[1]] = Number(hit[2]);
  }
  return map;
}

function stripMqlComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/.*$/gm, " ");
}

function mq5HeaderName(source: string): string | null {
  const hit = source.match(/\/\/\|\s*([^*\n|]+?)\s*(?:\.mq[45])?\s*\|/);
  const label = hit?.[1]?.trim();
  if (!label || /copyright|expert|script/i.test(label)) {
    return null;
  }
  return label;
}

function mqlPrice(value: string): BuilderSource {
  const token = value.toUpperCase();
  if (token.includes("OPEN")) return "open";
  if (token.includes("HIGH")) return "high";
  if (token.includes("LOW") && !token.includes("HL")) return "low";
  if (token.includes("TYPICAL") || token.includes("HLCC")) return "hlc3";
  if (token.includes("MEDIAN") || token.includes("HL2")) return "hl2";
  return "close";
}

function asMethod(value: string): BuilderMethod {
  const token = value.toLowerCase();
  if (token === "sma" || token === "wma") return "sma";
  if (token === "rsi") return "rsi";
  if (token === "atr") return "atr";
  if (token === "roc" || token === "mom") return "roc";
  if (token === "stddev" || token === "stdev") return "stddev";
  if (token === "raw" || token === "source" || token === "close") return "raw";
  return "ema";
}

function asSource(value: string): BuilderSource {
  const token = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (token === "open") return "open";
  if (token === "high") return "high";
  if (token === "low") return "low";
  if (token === "hl2" || token === "ohlc4") return "hl2";
  if (token === "hlc3" || token === "hlcc4") return "hlc3";
  if (token === "volume" || token === "vol") return "volume";
  return "close";
}

function asNumber(raw: string | undefined, inputs: Record<string, number>, fallback: number): number {
  if (!raw) return fallback;
  const token = raw.trim();
  if (inputs[token] != null) return inputs[token];
  const keyed = Object.keys(inputs).find((key) => key.toLowerCase() === token.toLowerCase());
  if (keyed) return inputs[keyed];
  const num = Number(token);
  if (Number.isFinite(num)) return num;
  const nested = token.match(/-?\d+(?:\.\d+)?/);
  return nested ? Number(nested[0]) : fallback;
}

function parseColor(raw: string): string | null {
  const hex = raw.match(/#([0-9a-fA-F]{6})/);
  if (hex) {
    return `#${hex[1]}`;
  }
  const named = raw.toLowerCase().match(/color\.([a-z]+)/);
  if (named && PINE_COLORS[named[1]]) {
    return PINE_COLORS[named[1]];
  }
  return null;
}

function nextColor(index: number): string {
  const palette = ["#00FF66", "#00E5FF", "#DFFF00", "#BF00FF", "#FF007F", "#38bdf8"];
  return palette[index % palette.length];
}

function splitArgs(raw: string): string[] {
  return raw.split(",").map((part) => part.trim()).filter(Boolean);
}

function pickString(source: string, re: RegExp): string | null {
  const hit = source.match(re);
  return hit?.[2] || hit?.[1] || hit?.[3] || null;
}

function truncate(value: string): string {
  return value.length > 48 ? `${value.slice(0, 45)}…` : value;
}
