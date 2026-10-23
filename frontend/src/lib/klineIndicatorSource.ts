import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import { newBuiltId } from "@/components/chart/chartIndicatorBuilder";

const MATH = `function sourceOf(bar, src) {
  if (src === "open") return bar.open;
  if (src === "high") return bar.high;
  if (src === "low") return bar.low;
  if (src === "hl2") return (bar.high + bar.low) / 2;
  if (src === "hlc3") return (bar.high + bar.low + bar.close) / 3;
  if (src === "volume") return bar.volume ?? 0;
  return bar.close;
}
function sma(values, period) {
  return values.map((_, i) => {
    if (i + 1 < period) return null;
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += values[j];
    return sum / period;
  });
}
function ema(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev = null;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    prev = prev == null ? value : prev + k * (value - prev);
    out.push(i + 1 < period ? null : prev);
  }
  return out;
}
function rsi(values, period) {
  const out = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < values.length; i += 1) {
    if (i === 0) {
      out.push(null);
      continue;
    }
    const delta = values[i] - values[i - 1];
    const gain = Math.max(delta, 0);
    const loss = Math.max(-delta, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
      }
      out.push(i < period ? null : avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
      continue;
    }
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return out;
}
function atr(dataList, period) {
  const tr = dataList.map((bar, i) => {
    if (i === 0) return bar.high - bar.low;
    const prev = dataList[i - 1].close;
    return Math.max(bar.high - bar.low, Math.abs(bar.high - prev), Math.abs(bar.low - prev));
  });
  return sma(tr, period);
}
function roc(values, period) {
  return values.map((value, i) => {
    const prev = values[i - period];
    if (prev == null || prev === 0) return null;
    return ((value - prev) / prev) * 100;
  });
}
function stdev(values, period) {
  return values.map((_, i) => {
    if (i + 1 < period) return null;
    const slice = values.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const varSum = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    return Math.sqrt(varSum);
  });
}
`;

function safeIdent(name: string, fallback: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const token = cleaned || fallback;
  return /^[A-Za-z]/.test(token) ? token : `I_${token}`;
}

function figureKey(plot: BuiltIndicator, index: number): string {
  if (plot.method === "signal_buy") return `sig_buy_${index}`;
  if (plot.method === "signal_sell") return `sig_sell_${index}`;
  return `s_${safeIdent(plot.name, "plot").toLowerCase()}_${index}`;
}

function figureType(plot: BuiltIndicator): "line" | "bar" {
  if (plot.style === "hist" || plot.style === "bar") return "bar";
  return "line";
}

function seriesEnum(plots: BuiltIndicator[]): "IndicatorSeries.Price" | "IndicatorSeries.Normal" {
  return plots.every((plot) => plot.pane === "pane") ? "IndicatorSeries.Normal" : "IndicatorSeries.Price";
}

function methodCall(plot: BuiltIndicator, index: number): string {
  const key = figureKey(plot, index);
  const src = JSON.stringify(plot.source);
  const period = plot.period || 14;
  if (plot.method === "signal_buy" || plot.method === "signal_sell") {
    const cmp = plot.method === "signal_buy" ? "bar.close > bar.open" : "bar.close < bar.open";
    const px = plot.method === "signal_buy" ? "low" : "high";
    return `    const ${key} = dataList.map((bar, i) => (i > 0 && ${cmp} ? bar.${px} : null));`;
  }
  if (plot.method === "raw") {
    return `    const ${key} = dataList.map((bar) => sourceOf(bar, ${src}));`;
  }
  if (plot.method === "atr") {
    return `    const ${key} = atr(dataList, ${period});`;
  }
  if (plot.method === "rsi") {
    return `    const ${key} = rsi(dataList.map((bar) => sourceOf(bar, ${src})), ${period});`;
  }
  if (plot.method === "roc") {
    return `    const ${key} = roc(dataList.map((bar) => sourceOf(bar, ${src})), ${period});`;
  }
  if (plot.method === "stddev") {
    return `    const ${key} = stdev(dataList.map((bar) => sourceOf(bar, ${src})), ${period});`;
  }
  if (plot.method === "ema" || plot.method === "bb_upper" || plot.method === "macd" || plot.method === "macd_signal") {
    return `    const ${key} = ema(dataList.map((bar) => sourceOf(bar, ${src})), ${period});`;
  }
  if (plot.method === "macd_hist") {
    return `    const ${key} = dataList.map((bar) => sourceOf(bar, ${src}));`;
  }
  return `    const ${key} = sma(dataList.map((bar) => sourceOf(bar, ${src})), ${period});`;
}

export function emitKlineIndicatorSource(name: string, plots: BuiltIndicator[]): string {
  const title = name.trim() || "Indicador";
  const ident = safeIdent(title, "Custom");
  if (plots.length === 0) {
    return `import { registerIndicator, IndicatorSeries, LineType } from "klinecharts";\n\n// Sin series reconocidas. Ajusta el origen y vuelve a traducir.\n`;
  }
  const overlay = plots.filter((plot) => plot.pane !== "pane");
  const pane = plots.filter((plot) => plot.pane === "pane");
  const chunks = [];
  if (overlay.length > 0) {
    chunks.push(emitBlock(`${ident}_OVERLAY`, title, overlay));
  }
  if (pane.length > 0) {
    chunks.push(emitBlock(`${ident}_PANE`, `${title} pane`, pane));
  }
  return [
    `import { registerIndicator, IndicatorSeries, LineType } from "klinecharts";`,
    ``,
    MATH.trim(),
    ``,
    ...chunks,
  ].join("\n");
}

function emitBlock(id: string, title: string, plots: BuiltIndicator[]): string {
  const figures = plots.map((plot, index) => {
    const type = figureType(plot);
    const key = figureKey(plot, index);
    return `    { key: "${key}", title: ${JSON.stringify(`${plot.name}: `)}, type: "${type}" }`;
  });
  const fills = plots.filter((plot) => plot.fill);
  const fillNote =
    fills.length > 0
      ? `  // Nubes de relleno: ${fills.map((plot) => `${plot.name} (${plot.fill})`).join(", ")}`
      : plots.length >= 2
        ? `  // Nubes: usa styles.areas entre ${figureKey(plots[0], 0)} y ${figureKey(plots[1], 1)} si el origen define fill.`
        : "";
  const arrows = plots.filter((plot) => plot.method === "signal_buy" || plot.method === "signal_sell");
  const arrowNote =
    arrows.length > 0 ? `  // Señales: ${arrows.map((plot) => plot.name).join(", ")} (línea con nulos = hueco).` : "";
  const calcLines = plots.map((plot, index) => methodCall(plot, index));
  const styles = plots
    .map((plot) => {
      if (figureType(plot) === "bar") {
        return `      { color: ${JSON.stringify(plot.color)} }`;
      }
      return `      { color: ${JSON.stringify(plot.color)}, size: ${plot.width}, style: LineType.Solid, dashedValue: [4, 3] }`;
    })
    .join(",\n");
  return [
    `registerIndicator({`,
    `  name: ${JSON.stringify(`AVIZOR_${id}`.toUpperCase())},`,
    `  shortName: ${JSON.stringify(title)},`,
    `  series: ${seriesEnum(plots)},`,
    fillNote,
    arrowNote,
    `  figures: [`,
    figures.join(",\n"),
    `  ],`,
    `  calc: (dataList) => {`,
    ...calcLines,
    `    return dataList.map((_, i) => ({ ${plots.map((plot, index) => `${figureKey(plot, index)}: ${figureKey(plot, index)}[i]`).join(", ")} }));`,
    `  },`,
    `  styles: {`,
    `    lines: [`,
    styles,
    `    ],`,
    `  },`,
    `});`,
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function parseKlineRegister(source: string, nameHint = ""): BuiltIndicator[] {
  const plots: BuiltIndicator[] = [];
  const short =
    nameHint.trim() ||
    source.match(/shortName:\s*["']([^"']+)["']/)?.[1] ||
    source.match(/name:\s*["']([^"']+)["']/)?.[1] ||
    "Indicador";
  const pane: BuiltIndicator["pane"] = /IndicatorSeries\.Normal/.test(source) ? "pane" : "overlay";
  const figureRe = /\{\s*key:\s*["']([^"']+)["'][^}]*type:\s*["'](\w+)["']/g;
  let hit: RegExpExecArray | null;
  const period = Number(source.match(/const period = (\d+)/)?.[1] ?? source.match(/ema\([^,]+,\s*(\d+)/i)?.[1] ?? 21);
  while ((hit = figureRe.exec(source))) {
    const key = hit[1].toLowerCase();
    const type = hit[2];
    const method =
      key.includes("rsi")
        ? "rsi"
        : key.includes("atr")
          ? "atr"
          : key.includes("sma")
            ? "sma"
            : key.includes("buy")
              ? "signal_buy"
              : key.includes("sell")
                ? "signal_sell"
                : key.includes("roc")
                  ? "roc"
                  : /ema|macd/.test(key)
                    ? "ema"
                    : type === "circle"
                      ? "signal_buy"
                      : "sma";
    plots.push({
      id: newBuiltId(),
      name: hit[1],
      enabled: true,
      source: "close",
      method,
      period: Number.isFinite(period) ? period : 21,
      color: method === "signal_sell" ? "#FF3366" : "#00FF66",
      width: 1.4,
      pane: method === "rsi" || method === "roc" ? "pane" : pane,
      style: type === "bar" ? "hist" : "line",
    });
  }
  if (plots.length === 0 && /registerIndicator\s*\(/.test(source)) {
    plots.push({
      id: newBuiltId(),
      name: short,
      enabled: true,
      source: "close",
      method: /rsi/i.test(source) ? "rsi" : /atr/i.test(source) ? "atr" : /sma/i.test(source) ? "sma" : "ema",
      period: Number.isFinite(period) ? period : 21,
      color: "#00FF66",
      width: 1.4,
      pane: /rsi|IndicatorSeries\.Normal/i.test(source) ? "pane" : "overlay",
    });
  }
  return plots;
}

export function validateKlineSource(source: string): { ok: true } | { ok: false; error: string } {
  try {
    const stripped = source
      .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?/gm, "")
      .replace(/IndicatorSeries\.(Price|Normal|Volume)/g, '"$1"')
      .replace(/LineType\.(Solid|Dashed)/g, '"$1"');
    if (!stripped.trim()) {
      throw new Error("El código generado está vacío.");
    }
    const fn = new Function(
      "registerIndicator",
      "IndicatorSeries",
      "LineType",
      `${stripped}\nreturn true;`,
    );
    fn(
      () => "ok",
      { Price: "price", Normal: "normal", Volume: "volume" },
      { Solid: "solid", Dashed: "dashed" },
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
