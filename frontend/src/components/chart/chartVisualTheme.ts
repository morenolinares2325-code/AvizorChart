export type BackgroundMode = "solid" | "vertical" | "horizontal" | "radial";
export type CrosshairStyle = "solid" | "dashed" | "hidden";

export interface ChartVisualTheme {
  bull: string;
  bear: string;
  outlineBull: string;
  outlineBear: string;
  wickBull: string;
  wickBear: string;
  grid: string;
  axis: string;
  volumeBull: string;
  volumeBear: string;
  background: string;
  backgroundTo: string;
  backgroundMode: BackgroundMode;
  ema20: string;
  ema50: string;
  ema200: string;
  neon: number;
  candleBorder: number;
  candleSharpness: number;
  wickWidth: number;
  gridWidth: number;
  gridHorizontal: boolean;
  gridVertical: boolean;
  bidAsk: boolean;
  bidColor: string;
  askColor: string;
  crosshair: CrosshairStyle;
  crosshairColor: string;
  watermarkTicker: boolean;
  watermarkChange: boolean;
  uiText: string;
  uiMuted: string;
  uiAccent: string;
  chromeTop: string;
  chromePanel: string;
  chromeBorder: string;
  chromeMenu: string;
}

export const DEFAULT_CHART_THEME: ChartVisualTheme = {
  bull: "#22c55e",
  bear: "#ef4444",
  outlineBull: "#16a34a",
  outlineBear: "#dc2626",
  wickBull: "#86efac",
  wickBear: "#fca5a5",
  grid: "#1F1F2E",
  axis: "#a1a1aa",
  volumeBull: "rgba(34,197,94,0.32)",
  volumeBear: "rgba(239,68,68,0.32)",
  background: "#050508",
  backgroundTo: "#0A0F1D",
  backgroundMode: "solid",
  ema20: "#38bdf8",
  ema50: "#a78bfa",
  ema200: "#f59e0b",
  neon: 0,
  candleBorder: 1,
  candleSharpness: 3,
  wickWidth: 1,
  gridWidth: 1,
  gridHorizontal: true,
  gridVertical: false,
  bidAsk: false,
  bidColor: "#22c55e",
  askColor: "#ef4444",
  crosshair: "solid",
  crosshairColor: "#52525b",
  watermarkTicker: true,
  watermarkChange: true,
  uiText: "#e4e4e7",
  uiMuted: "#71717a",
  uiAccent: "#00FF66",
  chromeTop: "#050508",
  chromePanel: "#0A0A0F",
  chromeBorder: "#1F1F2E",
  chromeMenu: "#0A0A0F",
};

export const BACKGROUND_PRESETS = [
  {
    id: "deep",
    label: "Oscuro profundo",
    background: "#050508",
    backgroundTo: "#0A0F1D",
    backgroundMode: "vertical" as const,
  },
  {
    id: "midnight",
    label: "Azul medianoche",
    background: "#070B14",
    backgroundTo: "#0A0F1D",
    backgroundMode: "vertical" as const,
  },
  {
    id: "radial",
    label: "Radial terminal",
    background: "#14301f",
    backgroundTo: "#050508",
    backgroundMode: "radial" as const,
  },
  {
    id: "carbon",
    label: "Negro carbón",
    background: "#050508",
    backgroundTo: "#050508",
    backgroundMode: "solid" as const,
  },
  {
    id: "ember",
    label: "Carbón ámbar",
    background: "#1A1208",
    backgroundTo: "#050508",
    backgroundMode: "radial" as const,
  },
] as const;

const STORAGE_KEY = "avizor.chart.theme.v2";

export function loadChartTheme(): ChartVisualTheme {
  if (typeof window === "undefined") {
    return DEFAULT_CHART_THEME;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem("avizor.chart.theme.v1");
    if (!raw) {
      return DEFAULT_CHART_THEME;
    }
    const parsed = JSON.parse(raw) as Partial<ChartVisualTheme>;
    return normalizeChartTheme({ ...DEFAULT_CHART_THEME, ...parsed });
  } catch {
    return DEFAULT_CHART_THEME;
  }
}

export function saveChartTheme(theme: ChartVisualTheme): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
}

const NEON_COLOR_KEYS = [
  "bull",
  "bear",
  "outlineBull",
  "outlineBear",
  "wickBull",
  "wickBear",
  "grid",
  "axis",
  "volumeBull",
  "volumeBear",
  "background",
  "backgroundTo",
  "backgroundMode",
  "ema20",
  "ema50",
  "ema200",
  "bidColor",
  "askColor",
  "crosshairColor",
  "uiText",
  "uiMuted",
  "uiAccent",
  "chromeTop",
  "chromePanel",
  "chromeBorder",
  "chromeMenu",
] as const;

export const NEON_PALETTE: Pick<ChartVisualTheme, (typeof NEON_COLOR_KEYS)[number]> = {
  bull: "#00FF66",
  bear: "#FF007F",
  outlineBull: "#39FF14",
  outlineBear: "#FF073A",
  wickBull: "#7CFFB2",
  wickBear: "#FF6EC7",
  grid: "#10221A",
  axis: "#9AFFC7",
  volumeBull: "rgba(0,255,102,0.38)",
  volumeBear: "rgba(255,0,127,0.38)",
  background: "#0B1220",
  backgroundTo: "#000000",
  backgroundMode: "radial",
  ema20: "#00F5FF",
  ema50: "#DFFF00",
  ema200: "#BF00FF",
  bidColor: "#00FF66",
  askColor: "#FF007F",
  crosshairColor: "#00FF66",
  uiText: "#D7FFE8",
  uiMuted: "#7CFFB2",
  uiAccent: "#00FF66",
  chromeTop: "#04140C",
  chromePanel: "#071A12",
  chromeBorder: "#0F3D28",
  chromeMenu: "#05110C",
};

export const NEON_MAX = 4;

export function normalizeNeon(value: unknown): number {
  if (value === true) {
    return NEON_MAX;
  }
  if (value === false || value == null) {
    return 0;
  }
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return 0;
  }
  return Math.min(NEON_MAX, Math.max(0, next));
}

export function normalizeChartTheme(theme: ChartVisualTheme): ChartVisualTheme {
  const extra = theme as ChartVisualTheme & { neonRestore?: Partial<ChartVisualTheme> };
  const restore = extra.neonRestore;
  const rawNeon: unknown = extra.neon;
  const wasFlag = rawNeon === true;
  const base: ChartVisualTheme = restore
    ? { ...theme, ...restore }
    : wasFlag
      ? {
          ...theme,
          ...Object.fromEntries(NEON_COLOR_KEYS.map((key) => [key, DEFAULT_CHART_THEME[key]])) as Pick<
            ChartVisualTheme,
            (typeof NEON_COLOR_KEYS)[number]
          >,
        }
      : theme;
  return { ...base, neon: wasFlag ? NEON_MAX : normalizeNeon(rawNeon) };
}

export function neonAmount(theme: ChartVisualTheme): number {
  return normalizeNeon(theme.neon) / NEON_MAX;
}

function parseColor(value: string): [number, number, number, number] {
  const hex = value.trim();
  if (hex.startsWith("#")) {
    const raw = hex.slice(1);
    const full =
      raw.length === 3
        ? `${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
        : raw.slice(0, 6);
    return [
      Number.parseInt(full.slice(0, 2), 16) || 0,
      Number.parseInt(full.slice(2, 4), 16) || 0,
      Number.parseInt(full.slice(4, 6), 16) || 0,
      1,
    ];
  }
  const match = hex.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3]), match[4] == null ? 1 : Number(match[4])];
  }
  return [5, 5, 8, 1];
}

function toHex(channel: number): string {
  return Math.round(Math.min(255, Math.max(0, channel)))
    .toString(16)
    .padStart(2, "0");
}

export function mixColor(from: string, to: string, amount: number): string {
  if (amount <= 0) {
    return from;
  }
  if (amount >= 1) {
    return to;
  }
  const a = parseColor(from);
  const b = parseColor(to);
  const r = a[0] + (b[0] - a[0]) * amount;
  const g = a[1] + (b[1] - a[1]) * amount;
  const bl = a[2] + (b[2] - a[2]) * amount;
  const alpha = a[3] + (b[3] - a[3]) * amount;
  if (from.includes("rgba") || to.includes("rgba") || alpha < 0.999) {
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(bl)},${alpha.toFixed(3)})`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

export function applyNeonTheme(theme: ChartVisualTheme): ChartVisualTheme {
  const amount = neonAmount(theme);
  if (amount <= 0) {
    return theme;
  }
  return {
    ...theme,
    bull: mixColor(theme.bull, NEON_PALETTE.bull, amount),
    bear: mixColor(theme.bear, NEON_PALETTE.bear, amount),
    outlineBull: mixColor(theme.outlineBull, NEON_PALETTE.outlineBull, amount),
    outlineBear: mixColor(theme.outlineBear, NEON_PALETTE.outlineBear, amount),
    wickBull: mixColor(theme.wickBull, NEON_PALETTE.wickBull, amount),
    wickBear: mixColor(theme.wickBear, NEON_PALETTE.wickBear, amount),
    grid: mixColor(theme.grid, NEON_PALETTE.grid, amount),
    axis: mixColor(theme.axis, NEON_PALETTE.axis, amount),
    volumeBull: mixColor(theme.volumeBull, NEON_PALETTE.volumeBull, amount),
    volumeBear: mixColor(theme.volumeBear, NEON_PALETTE.volumeBear, amount),
    background: mixColor(theme.background, NEON_PALETTE.background, amount),
    backgroundTo: mixColor(theme.backgroundTo, NEON_PALETTE.backgroundTo, amount),
    backgroundMode: amount > 0.35 ? "radial" : theme.backgroundMode,
    ema20: mixColor(theme.ema20, NEON_PALETTE.ema20, amount),
    ema50: mixColor(theme.ema50, NEON_PALETTE.ema50, amount),
    ema200: mixColor(theme.ema200, NEON_PALETTE.ema200, amount),
    bidColor: mixColor(theme.bidColor, NEON_PALETTE.bidColor, amount),
    askColor: mixColor(theme.askColor, NEON_PALETTE.askColor, amount),
    crosshairColor: mixColor(theme.crosshairColor, NEON_PALETTE.crosshairColor, amount),
    uiText: mixColor(theme.uiText, NEON_PALETTE.uiText, amount),
    uiMuted: mixColor(theme.uiMuted, NEON_PALETTE.uiMuted, amount),
    uiAccent: mixColor(theme.uiAccent, NEON_PALETTE.uiAccent, amount),
    chromeTop: mixColor(theme.chromeTop, NEON_PALETTE.chromeTop, amount),
    chromePanel: mixColor(theme.chromePanel, NEON_PALETTE.chromePanel, amount),
    chromeBorder: mixColor(theme.chromeBorder, NEON_PALETTE.chromeBorder, amount),
    chromeMenu: mixColor(theme.chromeMenu, NEON_PALETTE.chromeMenu, amount),
  };
}

export function chromeVars(theme: ChartVisualTheme): Record<string, string> {
  const visual = applyNeonTheme(theme);
  return {
    "--avizor-text": visual.uiText,
    "--avizor-muted": visual.uiMuted,
    "--avizor-accent": visual.uiAccent,
    "--avizor-chrome": visual.chromeTop,
    "--avizor-panel": visual.chromePanel,
    "--avizor-border": visual.chromeBorder,
    "--avizor-menu": visual.chromeMenu,
  };
}

export function chartSurfaceStyle(theme: ChartVisualTheme): {
  backgroundColor: string;
  backgroundImage: string;
  backgroundSize: string;
} {
  const dots =
    theme.gridHorizontal || theme.gridVertical
      ? `radial-gradient(${theme.grid} 0.7px, transparent 0.7px)`
      : "none";
  if (theme.backgroundMode === "vertical") {
    return {
      backgroundColor: theme.backgroundTo,
      backgroundImage: `linear-gradient(180deg, ${theme.background} 0%, ${theme.backgroundTo} 100%), ${dots}`,
      backgroundSize: "auto, 18px 18px",
    };
  }
  if (theme.backgroundMode === "horizontal") {
    return {
      backgroundColor: theme.backgroundTo,
      backgroundImage: `linear-gradient(90deg, ${theme.background} 0%, ${theme.backgroundTo} 100%), ${dots}`,
      backgroundSize: "auto, 18px 18px",
    };
  }
  if (theme.backgroundMode === "radial") {
    return {
      backgroundColor: theme.backgroundTo,
      backgroundImage: `radial-gradient(ellipse at 50% 18%, ${theme.background} 0%, ${theme.backgroundTo} 72%), ${dots}`,
      backgroundSize: "auto, 18px 18px",
    };
  }
  return {
    backgroundColor: theme.background,
    backgroundImage: dots,
    backgroundSize: "18px 18px",
  };
}
