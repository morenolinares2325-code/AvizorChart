export type BackgroundMode = "solid" | "vertical" | "horizontal" | "radial";
export type CrosshairStyle = "solid" | "dashed" | "hidden";

export type ChartScheme = "dark" | "light";

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
  scheme: ChartScheme;
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
  scheme: "dark",
};

export const LIGHT_CHROME: Pick<
  ChartVisualTheme,
  | "uiText"
  | "uiMuted"
  | "uiAccent"
  | "chromeTop"
  | "chromePanel"
  | "chromeBorder"
  | "chromeMenu"
> = {
  uiText: "#18181b",
  uiMuted: "#3f3f46",
  uiAccent: "#166534",
  chromeTop: "#ffffff",
  chromePanel: "#f4f4f5",
  chromeBorder: "#d4d4d8",
  chromeMenu: "#ffffff",
};

export const DARK_CHROME: typeof LIGHT_CHROME = {
  uiText: DEFAULT_CHART_THEME.uiText,
  uiMuted: DEFAULT_CHART_THEME.uiMuted,
  uiAccent: DEFAULT_CHART_THEME.uiAccent,
  chromeTop: DEFAULT_CHART_THEME.chromeTop,
  chromePanel: DEFAULT_CHART_THEME.chromePanel,
  chromeBorder: DEFAULT_CHART_THEME.chromeBorder,
  chromeMenu: DEFAULT_CHART_THEME.chromeMenu,
};

export const LIGHT_CANVAS: Pick<
  ChartVisualTheme,
  | "grid"
  | "axis"
  | "background"
  | "backgroundTo"
  | "backgroundMode"
  | "volumeBull"
  | "volumeBear"
  | "crosshairColor"
> = {
  grid: "#d4d4d8",
  axis: "#18181b",
  background: "#ffffff",
  backgroundTo: "#eef2f7",
  backgroundMode: "solid",
  volumeBull: "rgba(22,163,74,0.18)",
  volumeBear: "rgba(220,38,38,0.18)",
  crosshairColor: "#3f3f46",
};

export const LIGHT_SCHEME: typeof LIGHT_CHROME & typeof LIGHT_CANVAS = {
  ...LIGHT_CHROME,
  ...LIGHT_CANVAS,
};

const SCHEME_KEY = "avizor.chart.scheme";

export function loadChartScheme(): ChartScheme {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.localStorage.getItem(SCHEME_KEY) === "light" ? "light" : "dark";
}

export function saveChartScheme(scheme: ChartScheme): void {
  window.localStorage.setItem(SCHEME_KEY, scheme);
}

export function applyChartScheme(theme: ChartVisualTheme, scheme: ChartScheme = theme.scheme): ChartVisualTheme {
  return { ...theme, scheme: scheme === "light" ? "light" : "dark" };
}

export function canvasDefaultsForScheme(scheme: ChartScheme): typeof LIGHT_CANVAS {
  if (scheme === "light") {
    return LIGHT_CANVAS;
  }
  return {
    grid: DEFAULT_CHART_THEME.grid,
    axis: DEFAULT_CHART_THEME.axis,
    background: DEFAULT_CHART_THEME.background,
    backgroundTo: DEFAULT_CHART_THEME.backgroundTo,
    backgroundMode: DEFAULT_CHART_THEME.backgroundMode,
    volumeBull: DEFAULT_CHART_THEME.volumeBull,
    volumeBear: DEFAULT_CHART_THEME.volumeBear,
    crosshairColor: DEFAULT_CHART_THEME.crosshairColor,
  };
}

function sameHex(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function isLightSurface(theme: ChartVisualTheme): boolean {
  if (theme.scheme === "light") {
    return true;
  }
  const [r, g, b] = parseColor(theme.background);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  if (luminance > 0.52) {
    return true;
  }
  const lightCanvas = canvasDefaultsForScheme("light");
  return (
    sameHex(theme.background, lightCanvas.background) ||
    sameHex(theme.backgroundTo, lightCanvas.backgroundTo)
  );
}

export function themeForSchemeSwitch(theme: ChartVisualTheme, next: ChartScheme): ChartVisualTheme {
  const current = theme.scheme === "light" ? "light" : "dark";
  const chrome = next === "light" ? LIGHT_CHROME : DARK_CHROME;
  const fromCanvas = canvasDefaultsForScheme(current);
  const usesDefaultSurface =
    sameHex(theme.background, fromCanvas.background) &&
    sameHex(theme.backgroundTo, fromCanvas.backgroundTo) &&
    theme.backgroundMode === fromCanvas.backgroundMode;
  const forceDarkCanvas = next === "dark" && isLightSurface(theme);
  return {
    ...theme,
    ...chrome,
    ...(forceDarkCanvas || usesDefaultSurface ? canvasDefaultsForScheme(next) : {}),
    scheme: next,
  };
}

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

export const LIGHT_BACKGROUND_PRESETS = [
  {
    id: "paper",
    label: "Papel",
    background: "#ffffff",
    backgroundTo: "#ffffff",
    backgroundMode: "solid" as const,
  },
  {
    id: "mist",
    label: "Niebla",
    background: "#f8fafc",
    backgroundTo: "#e2e8f0",
    backgroundMode: "vertical" as const,
  },
  {
    id: "horizon",
    label: "Horizonte",
    background: "#ffffff",
    backgroundTo: "#e8eef6",
    backgroundMode: "horizontal" as const,
  },
  {
    id: "dayRadial",
    label: "Radial claro",
    background: "#ffffff",
    backgroundTo: "#dbe4f0",
    backgroundMode: "radial" as const,
  },
  {
    id: "ivory",
    label: "Marfil",
    background: "#fffbeb",
    backgroundTo: "#f8fafc",
    backgroundMode: "vertical" as const,
  },
] as const;

export function backgroundPresetsFor(scheme: ChartScheme) {
  return scheme === "light" ? LIGHT_BACKGROUND_PRESETS : BACKGROUND_PRESETS;
}

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
  return {
    ...base,
    neon: wasFlag ? NEON_MAX : normalizeNeon(rawNeon),
    scheme: base.scheme === "light" ? "light" : "dark",
  };
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
    return applyChartScheme(theme);
  }
  const light = theme.scheme === "light";
  return applyChartScheme({
    ...theme,
    bull: mixColor(theme.bull, NEON_PALETTE.bull, amount),
    bear: mixColor(theme.bear, NEON_PALETTE.bear, amount),
    outlineBull: mixColor(theme.outlineBull, NEON_PALETTE.outlineBull, amount),
    outlineBear: mixColor(theme.outlineBear, NEON_PALETTE.outlineBear, amount),
    wickBull: mixColor(theme.wickBull, NEON_PALETTE.wickBull, amount),
    wickBear: mixColor(theme.wickBear, NEON_PALETTE.wickBear, amount),
    grid: mixColor(theme.grid, light ? theme.grid : NEON_PALETTE.grid, light ? 0 : amount),
    axis: mixColor(theme.axis, light ? theme.axis : NEON_PALETTE.axis, light ? 0 : amount),
    volumeBull: mixColor(theme.volumeBull, NEON_PALETTE.volumeBull, amount),
    volumeBear: mixColor(theme.volumeBear, NEON_PALETTE.volumeBear, amount),
    background: light ? theme.background : mixColor(theme.background, NEON_PALETTE.background, amount),
    backgroundTo: light ? theme.backgroundTo : mixColor(theme.backgroundTo, NEON_PALETTE.backgroundTo, amount),
    backgroundMode: light || amount <= 0.35 ? theme.backgroundMode : "radial",
    ema20: mixColor(theme.ema20, NEON_PALETTE.ema20, amount),
    ema50: mixColor(theme.ema50, NEON_PALETTE.ema50, amount),
    ema200: mixColor(theme.ema200, NEON_PALETTE.ema200, amount),
    bidColor: mixColor(theme.bidColor, NEON_PALETTE.bidColor, amount),
    askColor: mixColor(theme.askColor, NEON_PALETTE.askColor, amount),
    crosshairColor: mixColor(theme.crosshairColor, light ? theme.crosshairColor : NEON_PALETTE.crosshairColor, light ? 0 : amount),
  });
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
