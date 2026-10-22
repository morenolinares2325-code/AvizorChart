import {
  normalizeBuiltIndicators,
  type BuiltIndicator,
} from "@/components/chart/chartIndicatorBuilder";
import {
  normalizeIndicatorSettings,
  type IndicatorSettingsMap,
} from "@/components/chart/chartIndicatorSettings";
import type { IndicatorId } from "@/components/chart/chartTypes";
import {
  DEFAULT_CHART_THEME,
  normalizeChartTheme,
  type ChartVisualTheme,
} from "@/components/chart/chartVisualTheme";

export interface ChartProfile {
  id: string;
  name: string;
  theme: ChartVisualTheme;
  indicators: IndicatorId[];
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  scriptIds?: string[];
}

const STORAGE_KEY = "avizor.chart.profiles.v1";

export function loadChartProfiles(): ChartProfile[] {
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
        id: String(item.id ?? crypto.randomUUID()),
        name: String(item.name ?? "Perfil"),
        theme: normalizeChartTheme({
          ...DEFAULT_CHART_THEME,
          ...(item.theme as Partial<ChartVisualTheme> | undefined),
        }),
        indicators: Array.isArray(item.indicators)
          ? item.indicators.map((id) => String(id) as IndicatorId)
          : [],
        indicatorSettings: normalizeIndicatorSettings(item.indicatorSettings),
        builtIndicators: normalizeBuiltIndicators(item.builtIndicators),
        scriptIds: Array.isArray(item.scriptIds) ? item.scriptIds.map((id) => String(id)) : [],
      }));
  } catch {
    return [];
  }
}

export function saveChartProfiles(profiles: ChartProfile[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function newProfileId(): string {
  return `pf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
