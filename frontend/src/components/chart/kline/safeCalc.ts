import { LineType, registerIndicator, type IndicatorTemplate, type KLineData } from "klinecharts";

const TAG = "[Avizor][KLine]";

export function logKline(level: "info" | "warn" | "error", ...args: unknown[]): void {
  const write = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
  write(TAG, ...args);
}

export function sanitizeIndicatorName(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
  const token = cleaned.slice(0, 72) || "BUILT";
  return token.startsWith("AVIZOR_") ? token : `AVIZOR_${token}`;
}

export function completeIndicatorStyles(color: string, size = 1.3) {
  const dashedValue = [4, 3];
  const line = { color, size, style: LineType.Solid, dashedValue, smooth: false };
  return {
    lines: [line, { ...line }, { ...line }, { ...line }, { ...line }],
    bars: [
      {
        style: "fill",
        borderStyle: LineType.Solid,
        borderDashedValue: dashedValue,
        upColor: color,
        downColor: color,
        noChangeColor: color,
      },
    ],
    circles: [{ style: LineType.Solid, dashedValue, color }],
  };
}

function emptyRow(keys: string[]): Record<string, null> {
  const row: Record<string, null> = {};
  for (const key of keys) {
    row[key || "v"] = null;
  }
  return row;
}

function finiteOrNull(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export function wrapIndicatorCalc(
  name: string,
  keys: string[],
  calc: (dataList: KLineData[]) => unknown,
): (dataList: KLineData[]) => Array<Record<string, number | null>> {
  const figureKeys = keys.length > 0 ? keys : ["v"];
  return (dataList) => {
    const fallback = dataList.map(() => emptyRow(figureKeys));
    try {
      const raw = calc(dataList);
      if (!Array.isArray(raw)) {
        logKline("warn", "calc no devolvió un array; fallback nulo", name, typeof raw);
        return fallback;
      }
      return dataList.map((_, index) => {
        const item = raw[index];
        const row: Record<string, number | null> = {};
        for (const key of figureKeys) {
          const source = item && typeof item === "object" ? (item as Record<string, unknown>)[key] : undefined;
          row[key] = finiteOrNull(source);
        }
        return row;
      });
    } catch (err) {
      logKline("error", "excepción en calc (el gráfico sigue con fallback nulo)", name, err);
      return fallback;
    }
  };
}

export function safeRegisterIndicator(template: IndicatorTemplate): boolean {
  const keys = (template.figures ?? []).map((figure) => figure.key || "v");
  const figures = (template.figures ?? [{ key: "v", title: "v: ", type: "line" }]).map((figure) => ({
    ...figure,
    key: figure.key || "v",
    type: figure.type === "bar" ? "bar" : "line",
  }));
  try {
    const original = template.calc;
    registerIndicator({
      ...template,
      figures,
      calc: (dataList) =>
        wrapIndicatorCalc(template.name, keys, () => {
          if (typeof original !== "function") {
            return dataList.map(() => emptyRow(keys));
          }
          return original(dataList, template as never);
        })(dataList),
    });
    logKline("info", "registerIndicator OK", template.name, { keys, figures: figures.length });
    return true;
  } catch (err) {
    logKline("error", "registerIndicator falló", template.name, err);
    return false;
  }
}
