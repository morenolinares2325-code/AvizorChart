import type { PatternOverlay } from "@/components/chart/chartAutoPatterns";
import type { TradeChartMarker, TradeGuideLevels } from "@/components/chart/kline/trade";
import type { ChartVisualTheme } from "@/components/chart/chartVisualTheme";
import type { BuilderEChartsPayload } from "@/lib/builderApi";
import type { AutoSRDiagonal, AutoSRLevel } from "@/lib/chartMath";
import { LineType, type Chart, type OverlayCreate } from "klinecharts";

const GROUPS = ["avizor-sr", "avizor-diag", "avizor-pattern", "avizor-trade", "avizor-guide", "avizor-builder"] as const;
const DASH = [4, 3];

function clearGroups(chart: Chart): void {
  for (const groupId of GROUPS) {
    try {
      chart.removeOverlay({ groupId });
    } catch {
      /* empty */
    }
  }
}

function add(chart: Chart, overlay: OverlayCreate): void {
  try {
    chart.createOverlay(overlay, "candle_pane");
  } catch {
    /* skip invalid overlay */
  }
}

export function syncKlineOverlays(
  chart: Chart,
  autoSR: AutoSRLevel[],
  autoDiagonals: AutoSRDiagonal[],
  autoPatterns: PatternOverlay[],
  tradeGuide: TradeGuideLevels | null | undefined,
  tradeMarkers: TradeChartMarker[],
  builderVisuals: BuilderEChartsPayload | undefined,
  theme: ChartVisualTheme,
  dates: string[],
): void {
  clearGroups(chart);

  autoSR.forEach((level, index) => {
    add(chart, {
      name: "priceLine",
      id: `sr-${index}`,
      groupId: "avizor-sr",
      lock: true,
      points: [{ value: level.price }],
      extendData: level.label,
      styles: {
        line: { color: level.kind === "resistance" ? "#FF3366" : "#00FF66", size: 1, style: LineType.Dashed, dashedValue: DASH },
      },
    });
  });

  autoDiagonals.forEach((diagonal, index) => {
    const points = diagonal.line
      .map((price, dataIndex) => (price == null ? null : { dataIndex, value: price }))
      .filter((point): point is { dataIndex: number; value: number } => point !== null);
    if (points.length < 2) {
      return;
    }
    add(chart, {
      name: "segment",
      id: `diag-${index}`,
      groupId: "avizor-diag",
      lock: true,
      points: [points[0], points[points.length - 1]],
      styles: {
        line: { color: diagonal.kind === "resistance" ? "#FF3366" : "#00FF66", size: 1.4 },
      },
    });
  });

  autoPatterns.slice(0, 36).forEach((hit, index) => {
    const nodes = hit.nodes ?? [];
    for (let i = 0; i < nodes.length - 1; i += 1) {
      add(chart, {
        name: "segment",
        id: `pat-${index}-${i}`,
        groupId: "avizor-pattern",
        lock: true,
        points: [
          { dataIndex: nodes[i].i, value: nodes[i].price },
          { dataIndex: nodes[i + 1].i, value: nodes[i + 1].price },
        ],
        styles: { line: { color: hit.color, size: 1.6 } },
      });
    }
    (hit.marks ?? []).slice(0, 6).forEach((mark, markIndex) => {
      add(chart, {
        name: "simpleAnnotation",
        id: `pat-mark-${index}-${markIndex}`,
        groupId: "avizor-pattern",
        lock: true,
        points: [{ dataIndex: mark.index, value: mark.price }],
        extendData: mark.label,
        styles: { text: { color: hit.color, size: 10 } },
      });
    });
  });

  if (tradeGuide) {
    const long = tradeGuide.side === "buy";
    add(chart, {
      name: "priceLine",
      id: "guide-entry",
      groupId: "avizor-guide",
      lock: true,
      points: [{ value: tradeGuide.entry }],
      extendData: long ? "BUY" : "SELL",
      styles: { line: { color: long ? "#26A69A" : "#EF5350", size: 1.4 } },
    });
    if (tradeGuide.sl != null && Number.isFinite(tradeGuide.sl)) {
      add(chart, {
        name: "priceLine",
        id: "guide-sl",
        groupId: "avizor-guide",
        lock: true,
        points: [{ value: tradeGuide.sl }],
        extendData: "SL",
        styles: { line: { color: "#EF5350", size: 1.2, style: LineType.Dashed, dashedValue: DASH } },
      });
    }
    if (tradeGuide.tp != null && Number.isFinite(tradeGuide.tp)) {
      add(chart, {
        name: "priceLine",
        id: "guide-tp",
        groupId: "avizor-guide",
        lock: true,
        points: [{ value: tradeGuide.tp }],
        extendData: "TP",
        styles: { line: { color: "#26A69A", size: 1.2, style: LineType.Dashed, dashedValue: DASH } },
      });
    }
  }

  tradeMarkers.forEach((mark, index) => {
    const cat = dates.indexOf(mark.date);
    add(chart, {
      name: "simpleAnnotation",
      id: `trade-${index}`,
      groupId: "avizor-trade",
      lock: true,
      points: [{ dataIndex: cat >= 0 ? cat : dates.length - 1, value: mark.price }],
      extendData: mark.label,
      styles: {
        text: {
          color: mark.kind === "entry" ? (mark.side === "buy" ? "#26A69A" : "#EF5350") : mark.win ? "#22c55e" : "#EF5350",
          size: 10,
        },
      },
    });
  });

  const lines = builderVisuals?.markLines ?? [];
  lines.forEach((item, index) => {
    if (!item || typeof item !== "object" || !("yAxis" in item)) {
      return;
    }
    const yAxis = Number((item as { yAxis?: unknown }).yAxis);
    if (!Number.isFinite(yAxis)) {
      return;
    }
    add(chart, {
      name: "priceLine",
      id: `builder-${index}`,
      groupId: "avizor-builder",
      lock: true,
      points: [{ value: yAxis }],
      styles: { line: { color: theme.uiAccent, size: 1, style: LineType.Dashed, dashedValue: DASH } },
    });
  });
}
