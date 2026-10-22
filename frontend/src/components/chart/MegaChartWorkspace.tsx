"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChartDock } from "@/components/chart/ChartDock";
import { ChartLeftRail } from "@/components/chart/ChartLeftRail";
import { ChartPane } from "@/components/chart/ChartPane";
import { requestChartCenter } from "@/components/chart/chartScaleInteraction";
import { ChartRangeBar } from "@/components/chart/ChartRangeBar";
import { ChartRightRail } from "@/components/chart/ChartRightRail";
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import {
  buildAgentBrief,
  detectAutoPatterns,
  type AutoPatternId,
} from "@/components/chart/chartAutoPatterns";
import type { DrawGroupId, DrawToolId, UserDrawing } from "@/components/chart/chartDrawTools";
import {
  RANGE_PRESETS,
  type DrawingId,
  type IndicatorId,
  type RangePresetId,
  type RightUtilId,
  type SplitMode,
  type WatchlistId,
} from "@/components/chart/chartTypes";
import type { AutoSROptions } from "@/components/chart/ChartAutoSRMenu";
import type { ChartProfile } from "@/components/chart/chartProfiles";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { IndicatorSettingsMap, IndicatorStyle } from "@/components/chart/chartIndicatorSettings";
import {
  chromeVars,
  DEFAULT_CHART_THEME,
  normalizeChartTheme,
  type ChartVisualTheme,
} from "@/components/chart/chartVisualTheme";
import { parseChartInterval, type CandlePayload, type ChartInterval } from "@/lib/marketApi";
import {
  dropPendingScript,
  loadPendingScripts,
  loadSavedScripts,
  plotsForScripts,
  SCRIPTS_EVENT,
  type SavedScript,
} from "@/lib/scriptLibrary";
import { findAsset } from "@/lib/mockScreenerData";

interface ChartSlot {
  id: string;
  ticker: string;
  interval: ChartInterval;
  indicators: IndicatorId[];
  indicatorSettings: IndicatorSettingsMap;
  builtIndicators: BuiltIndicator[];
  scriptIds: string[];
  theme: ChartVisualTheme;
  profileId?: string;
  range: RangePresetId;
  chartType: ChartPriceType;
}

function toggleSet<T>(current: Set<T>, id: T): Set<T> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function asSplit(value: string | null): SplitMode {
  if (value === "2") return 2;
  if (value === "4") return 4;
  return 1;
}

function emptySlot(id: string, ticker: string, interval: ChartInterval): ChartSlot {
  return {
    id,
    ticker,
    interval,
    indicators: [],
    indicatorSettings: {},
    builtIndicators: [],
    scriptIds: [],
    theme: DEFAULT_CHART_THEME,
    range: "1y",
    chartType: "candles",
  };
}

function seedPanes(symbol: string, tf: ChartInterval, mode: SplitMode): ChartSlot[] {
  const extras = ["AAPL", "MSFT", "SPY", "TSLA"];
  const next: ChartSlot[] = [emptySlot("p0", symbol, tf)];
  while (next.length < mode) {
    next.push(emptySlot(`p${next.length}`, extras[next.length - 1] ?? symbol, tf));
  }
  return next;
}

function asDock(value: string | null): RightUtilId | null {
  const ids: RightUtilId[] = [
    "watchlist",
    "news",
    "editor",
    "profiles",
    "alerts",
    "fundamentals",
    "chat",
    "orders",
    "settings",
  ];
  return ids.find((id) => id === value) ?? null;
}

export function MegaChartWorkspace() {
  const params = useSearchParams();
  const initial = (params.get("symbol") ?? params.get("ticker") ?? "NVDA").toUpperCase();
  const initialInterval = parseChartInterval(params.get("interval") ?? "1d") ?? "1d";

  const [split, setSplit] = useState<SplitMode>(() => asSplit(params.get("split")));
  const [panes, setPanes] = useState<ChartSlot[]>(() =>
    seedPanes(initial, initialInterval, asSplit(params.get("split"))),
  );
  const [focus, setFocus] = useState(0);
  const [quote, setQuote] = useState<CandlePayload | null>(null);
  const [drawTool, setDrawTool] = useState<DrawToolId>("cursor");
  const [drawings] = useState<Set<DrawingId>>(new Set());
  const [userDrawings, setUserDrawings] = useState<UserDrawing[]>([]);
  const [openGroup, setOpenGroup] = useState<DrawGroupId | null>(null);
  const [magnet, setMagnet] = useState(false);
  const [locked, setLocked] = useState(false);
  const [rightTool, setRightTool] = useState<RightUtilId | null>(() => asDock(params.get("dock")));
  const [autoSR, setAutoSR] = useState<AutoSROptions>({ horizontal: false, diagonal: false });
  const [autoPatterns, setAutoPatterns] = useState<Set<AutoPatternId>>(() => new Set());
  const [watchlist, setWatchlist] = useState<WatchlistId>("core");
  const [scriptLibrary, setScriptLibrary] = useState<SavedScript[]>([]);
  const focusRef = useRef(0);
  focusRef.current = focus;

  useEffect(() => {
    function refresh() {
      const library = loadSavedScripts();
      setScriptLibrary(library);
      const enable = loadPendingScripts();
      if (enable.length === 0) {
        return;
      }
      setPanes((current) =>
        current.map((pane) => {
          const ids = [...pane.scriptIds];
          for (const id of enable) {
            if (library.some((script) => script.id === id) && !ids.includes(id)) {
              ids.push(id);
            }
          }
          return { ...pane, scriptIds: ids };
        }),
      );
    }
    refresh();
    window.addEventListener(SCRIPTS_EVENT, refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener(SCRIPTS_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const focused = panes[Math.min(focus, panes.length - 1)] ?? panes[0];
  const ticker = focused?.ticker ?? initial;
  const interval = focused?.interval ?? initialInterval;
  const theme = focused?.theme ?? DEFAULT_CHART_THEME;
  const range = focused?.range ?? "1y";
  const indicators = useMemo(() => new Set(focused?.indicators ?? []), [focused?.indicators]);

  const applySplit = useCallback((mode: SplitMode) => {
    setSplit(mode);
    setPanes((current) => {
      const seed = current[0] ?? { id: "p0", ticker: initial, interval: initialInterval };
      return seedPanes(seed.ticker, seed.interval, mode).map((pane, index) => ({
        ...pane,
        ...current[index],
        id: pane.id,
        ticker: current[index]?.ticker ?? pane.ticker,
        interval: current[index]?.interval ?? pane.interval,
      }));
    });
    setFocus(0);
  }, [initial, initialInterval]);

  function patchFocus(partial: Partial<ChartSlot>) {
    setPanes((current) =>
      current.map((pane, index) => (index === focus ? { ...pane, ...partial } : pane)),
    );
  }

  function undock(kind: "chart" | RightUtilId = "chart") {
    const query = new URLSearchParams({
      symbol: ticker,
      interval,
      undock: "1",
    });
    if (kind !== "chart") {
      query.set("dock", kind);
    }
    window.open(
      `/grafico?${query.toString()}`,
      `avizor-${kind}-${ticker}-${Date.now()}`,
      "popup=yes,noopener,noreferrer,width=1280,height=800",
    );
  }

  const assetName = useMemo(() => findAsset(ticker)?.name, [ticker]);
  const patternHits = useMemo(
    () => (quote && autoPatterns.size > 0 ? detectAutoPatterns(quote.values, autoPatterns) : []),
    [autoPatterns, quote],
  );
  const agentBrief = useMemo(
    () =>
      quote
        ? buildAgentBrief(
            ticker,
            quote.values,
            quote.volumes,
            patternHits.map((item) => item.label),
          )
        : null,
    [patternHits, quote, ticker],
  );

  const gridClass =
    split === 4 ? "grid-cols-2 grid-rows-2" : split === 2 ? "grid-cols-2 grid-rows-1" : "grid-cols-1 grid-rows-1";

  return (
    <div
      className="avizor-terminal flex h-full w-full flex-col overflow-hidden bg-[#050508]"
      style={chromeVars(theme) as CSSProperties}
    >
      <ChartToolbar
        ticker={ticker}
        onTicker={(next) => patchFocus({ ticker: next, indicators: [] })}
        interval={interval}
        onInterval={(next) => patchFocus({ interval: next })}
        chartType={focused?.chartType ?? "candles"}
        onChartType={(next) => setPanes((current) => current.map((pane) => ({ ...pane, chartType: next })))}
        indicators={indicators}
        onToggleIndicator={(id) =>
          patchFocus({ indicators: Array.from(toggleSet(indicators, id)) })
        }
        indicatorSettings={focused?.indicatorSettings ?? {}}
        onPatchIndicatorSettings={(id: IndicatorId, patch: Partial<IndicatorStyle>) =>
          patchFocus({
            indicatorSettings: {
              ...(focused?.indicatorSettings ?? {}),
              [id]: { ...(focused?.indicatorSettings?.[id] ?? {}), ...patch },
            },
          })
        }
        savedScripts={scriptLibrary}
        scriptIds={new Set(focused?.scriptIds ?? [])}
        onToggleScript={(id: string) => {
          const next = toggleSet(new Set(focused?.scriptIds ?? []), id);
          if (!next.has(id)) {
            dropPendingScript(id);
          }
          patchFocus({ scriptIds: Array.from(next) });
        }}
        quote={quote}
        assetName={assetName}
        autoSR={autoSR}
        onAutoSR={setAutoSR}
        agentBrief={agentBrief}
        autoPatterns={autoPatterns}
        onTogglePattern={(id) => setAutoPatterns((current) => toggleSet(current, id))}
        watchlist={watchlist}
        onWatchlist={setWatchlist}
        split={split}
        onSplit={applySplit}
        onUndock={() => undock("chart")}
      />

      <div className="flex min-h-0 flex-1">
        <ChartLeftRail
          tool={drawTool}
          magnet={magnet}
          locked={locked}
          openGroup={openGroup}
          onOpenGroup={setOpenGroup}
          onTool={setDrawTool}
          onToggleMagnet={() => setMagnet((value) => !value)}
          onToggleLock={() => setLocked((value) => !value)}
          onClear={() => setUserDrawings([])}
          onCenter={requestChartCenter}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={`grid min-h-0 min-w-0 flex-1 ${gridClass}`}>
            {panes.map((pane, index) => (
              <ChartPane
                key={pane.id}
                ticker={pane.ticker}
                interval={pane.interval}
                period={RANGE_PRESETS.find((item) => item.id === pane.range)?.period ?? "1y"}
                indicators={pane.indicators}
                indicatorSettings={pane.indicatorSettings}
                builtIndicators={[
                  ...pane.builtIndicators,
                  ...plotsForScripts(scriptLibrary, pane.scriptIds ?? []),
                ]}
                drawings={drawings}
                autoSR={autoSR}
                autoPatterns={autoPatterns}
                theme={pane.theme}
                drawTool={drawTool}
                magnet={magnet}
                locked={locked}
                userDrawings={index === focus ? userDrawings : []}
                onUserDrawings={setUserDrawings}
                focused={index === focus}
                onFocus={() => setFocus(index)}
                onQuote={setQuote}
                chartType={pane.chartType ?? "candles"}
              />
            ))}
          </div>
          <ChartRangeBar
            range={range}
            onRange={(id) => setPanes((current) => current.map((pane) => ({ ...pane, range: id })))}
          />
        </div>

        {rightTool ? (
          <ChartDock
            tab={rightTool}
            ticker={ticker}
            watchlist={watchlist}
            onTicker={(next) => patchFocus({ ticker: next, indicators: [] })}
            theme={theme}
            onTheme={(next) => patchFocus({ theme: normalizeChartTheme(next) })}
            indicators={indicators}
            indicatorSettings={focused?.indicatorSettings ?? {}}
            builtIndicators={focused?.builtIndicators ?? []}
            onApplyProfile={(profile: ChartProfile) =>
              patchFocus({
                theme: normalizeChartTheme(profile.theme),
                indicators: profile.indicators,
                indicatorSettings: profile.indicatorSettings ?? {},
                builtIndicators: profile.builtIndicators ?? [],
                scriptIds: profile.scriptIds ?? [],
                profileId: profile.id,
              })
            }
            activeProfileId={focused?.profileId}
            onUndock={() => undock(rightTool)}
            agentBrief={agentBrief}
          />
        ) : null}

        <ChartRightRail
          active={rightTool}
          onActive={(id) => setRightTool((current) => (current === id ? null : id))}
        />
      </div>
    </div>
  );
}
