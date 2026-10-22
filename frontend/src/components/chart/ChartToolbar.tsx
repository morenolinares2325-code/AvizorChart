"use client";

import { Bell, Braces, Search } from "lucide-react";
import Link from "next/link";
import { ChartLayoutMenu } from "@/components/chart/ChartLayoutMenu";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChartAgentDesk } from "@/components/chart/ChartAgentDesk";
import { ChartAutoSRMenu, type AutoSROptions } from "@/components/chart/ChartAutoSRMenu";
import { ChartIndicatorsMenu } from "@/components/chart/ChartIndicatorsMenu";
import { ChartPatternsMenu } from "@/components/chart/ChartPatternsMenu";
import { ChartStyleMenu } from "@/components/chart/ChartStyleMenu";
import { ChartTimeframeMenu } from "@/components/chart/ChartTimeframeMenu";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import { ChartWatchlistsMenu } from "@/components/chart/ChartWatchlistsMenu";
import type { AgentBrief, AutoPatternId } from "@/components/chart/chartAutoPatterns";
import type { SavedScript } from "@/lib/scriptLibrary";
import type { IndicatorSettingsMap, IndicatorStyle } from "@/components/chart/chartIndicatorSettings";
import { INTERVALS, QUICK_TICKERS, type IndicatorId, type SplitMode, type WatchlistId } from "@/components/chart/chartTypes";
import { searchUniverse } from "@/lib/mockScreenerData";
import { parseChartInterval, type CandlePayload, type ChartInterval } from "@/lib/marketApi";

interface ChartToolbarProps {
  ticker: string;
  onTicker: (ticker: string) => void;
  interval: ChartInterval;
  onInterval: (interval: ChartInterval) => void;
  chartType: ChartPriceType;
  onChartType: (type: ChartPriceType) => void;
  indicators: Set<IndicatorId>;
  onToggleIndicator: (id: IndicatorId) => void;
  indicatorSettings: IndicatorSettingsMap;
  onPatchIndicatorSettings: (id: IndicatorId, patch: Partial<IndicatorStyle>) => void;
  savedScripts: SavedScript[];
  scriptIds: Set<string>;
  onToggleScript: (id: string) => void;
  quote: CandlePayload | null;
  assetName?: string;
  autoSR: AutoSROptions;
  onAutoSR: (next: AutoSROptions) => void;
  agentBrief: AgentBrief | null;
  autoPatterns: Set<AutoPatternId>;
  onTogglePattern: (id: AutoPatternId) => void;
  watchlist: WatchlistId;
  onWatchlist: (id: WatchlistId) => void;
  split: SplitMode;
  onSplit: (mode: SplitMode) => void;
  onUndock: () => void;
}

function fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) {
    return n.toFixed(2);
  }
  if (abs >= 1) {
    return n.toFixed(2);
  }
  return n.toFixed(4);
}

export function ChartToolbar({
  ticker,
  onTicker,
  interval,
  onInterval,
  chartType,
  onChartType,
  indicators,
  onToggleIndicator,
  indicatorSettings,
  onPatchIndicatorSettings,
  savedScripts,
  scriptIds,
  onToggleScript,
  quote,
  assetName,
  autoSR,
  onAutoSR,
  agentBrief,
  autoPatterns,
  onTogglePattern,
  watchlist,
  onWatchlist,
  split,
  onSplit,
  onUndock,
}: ChartToolbarProps) {
  const [query, setQuery] = useState(ticker);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [patternsOpen, setPatternsOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [tfOpen, setTfOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [srOpen, setSrOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [alertOn, setAlertOn] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const bar = useMemo(() => {
    if (!quote || quote.values.length === 0) {
      return null;
    }
    const index = quote.values.length - 1;
    const [open, close, low, high] = quote.values[index];
    const prev = quote.values[index - 1]?.[1] ?? open;
    const changePct = prev ? ((close - prev) / prev) * 100 : 0;
    return { open, close, low, high, changePct, up: close >= open };
  }, [quote]);

  const last = quote?.last ?? 0;
  const sellPx = last;
  const buyPx = last ? last * 1.0008 : 0;

  useEffect(() => {
    setQuery(ticker);
  }, [ticker]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpenSuggest(false);
        setMenuOpen(false);
        setPatternsOpen(false);
        setAgentOpen(false);
        setTfOpen(false);
        setStyleOpen(false);
        setSrOpen(false);
        setListsOpen(false);
        setSplitOpen(false);
        setCustomOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const fromUniverse = searchUniverse(query);
    const extras = QUICK_TICKERS.filter(
      (item) =>
        item.toLowerCase().includes(query.trim().toLowerCase()) &&
        !fromUniverse.some((asset) => asset.ticker === item),
    ).map((item) => ({ ticker: item, name: item }));
    return [...fromUniverse.map((asset) => ({ ticker: asset.ticker, name: asset.name })), ...extras].slice(
      0,
      8,
    );
  }, [query]);

  function submitTicker(next: string) {
    const clean = next.trim().toUpperCase();
    if (!clean) {
      return;
    }
    onTicker(clean);
    setQuery(clean);
    setOpenSuggest(false);
  }

  return (
    <div
      ref={boxRef}
      data-chrome="bar"
      className="relative z-30 flex h-[52px] shrink-0 items-center gap-1.5 overflow-visible border-b border-[#1F1F2E] bg-[#050508] pl-12 pr-2 leading-none"
    >
      <form
        className="relative shrink-0"
        onSubmit={(event) => {
          event.preventDefault();
          submitTicker(query);
        }}
      >
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenSuggest(true);
          }}
          onFocus={() => setOpenSuggest(true)}
          className="h-8 w-[4.6rem] rounded border border-[#1F1F2E] bg-[#0A0A0F] pl-7 pr-1.5 font-mono text-xs font-semibold text-white outline-none focus:border-[#00FF66]/40"
          placeholder="AAOI"
          aria-label="Ticker"
        />
        {openSuggest && suggestions.length > 0 ? (
          <ul data-chrome="menu" className="absolute z-30 mt-1 w-56 overflow-hidden rounded border border-[#1F1F2E] bg-[#0A0A0F] shadow-lg">
            {suggestions.map((item) => (
              <li key={item.ticker}>
                <button
                  type="button"
                  onClick={() => submitTicker(item.ticker)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-[#1F1F2E]"
                >
                  <span className="font-mono text-white">{item.ticker}</span>
                  <span className="truncate pl-2 text-[10px] text-zinc-500">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      {bar ? (
        <div className="hidden shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] tracking-tight lg:flex">
          {assetName && assetName !== ticker ? (
            <span className="hidden max-w-[7rem] truncate text-[10px] uppercase tracking-[0.12em] text-zinc-500 2xl:inline">{assetName}</span>
          ) : null}
          <span className="avizor-ohlc-k">O</span>
          <span className="text-white">{fmt(bar.open)}</span>
          <span className="avizor-ohlc-k">H</span>
          <span className="text-white">{fmt(bar.high)}</span>
          <span className="avizor-ohlc-k">L</span>
          <span className="text-white">{fmt(bar.low)}</span>
          <span className="avizor-ohlc-k">C</span>
          <span className={bar.up ? "text-[#00FF66]" : "text-red-500"}>{fmt(bar.close)}</span>
          <span className={bar.up ? "text-[#00FF66]" : "text-red-500"}>
            {bar.changePct >= 0 ? "+" : ""}
            {bar.changePct.toFixed(2)}%
          </span>
        </div>
      ) : null}

      <ChartTimeframeMenu
        open={tfOpen}
        onToggle={() => {
          setTfOpen((value) => !value);
          setMenuOpen(false);
          setPatternsOpen(false);
          setAgentOpen(false);
          setSrOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        interval={interval}
        onInterval={(next) => {
          onInterval(next);
          setTfOpen(false);
          setCustomOpen(false);
        }}
        customOpen={customOpen}
        customDraft={customDraft}
        customError={customError}
        onCustomOpen={() => {
          setCustomOpen(true);
          setCustomDraft(INTERVALS.some((item) => item.id === interval) ? "" : interval);
          setCustomError(null);
        }}
        onCustomDraft={(value) => {
          setCustomDraft(value);
          setCustomError(null);
        }}
        onCustomSubmit={() => {
          const parsed = parseChartInterval(customDraft);
          if (!parsed) {
            setCustomError("30m, 2h…");
            return;
          }
          onInterval(parsed);
          setCustomOpen(false);
          setTfOpen(false);
          setCustomError(null);
        }}
      />

      <ChartStyleMenu
        open={styleOpen}
        onToggle={() => {
          setStyleOpen((value) => !value);
          setTfOpen(false);
          setMenuOpen(false);
          setPatternsOpen(false);
          setAgentOpen(false);
          setSrOpen(false);
          setListsOpen(false);
        }}
        chartType={chartType}
        onChartType={(next) => {
          onChartType(next);
          setStyleOpen(false);
        }}
      />

      <div className="min-w-0 flex-1" />

      <ChartPatternsMenu
        open={patternsOpen}
        onToggle={() => {
          setPatternsOpen((value) => !value);
          setMenuOpen(false);
          setAgentOpen(false);
          setTfOpen(false);
          setSrOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        enabled={autoPatterns}
        onTogglePattern={onTogglePattern}
      />

      <ChartIndicatorsMenu
        open={menuOpen}
        onToggle={() => {
          setMenuOpen((value) => !value);
          setPatternsOpen(false);
          setAgentOpen(false);
          setTfOpen(false);
          setSrOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        indicators={indicators}
        onToggleIndicator={onToggleIndicator}
        settings={indicatorSettings}
        onPatchSettings={onPatchIndicatorSettings}
        savedScripts={savedScripts}
        scriptIds={scriptIds}
        onToggleScript={onToggleScript}
      />

      <Link
        href="/builder"
        className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] tracking-tight text-zinc-400 hover:bg-white/[0.04] hover:text-white"
        title="IDE Builder"
      >
        <Braces className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Builder</span>
      </Link>

      <ChartAutoSRMenu
        open={srOpen}
        onToggle={() => {
          setSrOpen((value) => !value);
          setTfOpen(false);
          setMenuOpen(false);
          setPatternsOpen(false);
          setAgentOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        value={autoSR}
        onChange={onAutoSR}
      />

      <ChartLayoutMenu
        open={splitOpen}
        onToggle={() => {
          setSplitOpen((value) => !value);
          setTfOpen(false);
          setMenuOpen(false);
          setPatternsOpen(false);
          setAgentOpen(false);
          setSrOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        split={split}
        onSplit={(mode) => {
          onSplit(mode);
          setSplitOpen(false);
        }}
        onUndock={onUndock}
      />

      <ChartWatchlistsMenu
        open={listsOpen}
        onToggle={() => {
          setListsOpen((value) => !value);
          setTfOpen(false);
          setMenuOpen(false);
          setPatternsOpen(false);
          setAgentOpen(false);
          setSrOpen(false);
          setStyleOpen(false);
        }}
        activeList={watchlist}
        ticker={ticker}
        onSelectList={onWatchlist}
        onTicker={onTicker}
      />
      <button
        type="button"
        onClick={() => setAlertOn((value) => !value)}
        className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-1.5 font-mono text-[11px] tracking-tight hover:bg-white/[0.04] ${
          alertOn ? "text-amber-300" : "text-zinc-400 hover:text-white"
        }`}
      >
        <Bell className="h-3.5 w-3.5" />
        <span className="hidden xl:inline">Alerta</span>
      </button>

      {last > 0 ? (
        <div className="hidden shrink-0 items-center gap-0.5 xl:flex">
          <button
            type="button"
            className="rounded-md px-1.5 py-1 font-mono text-[10px] font-semibold tracking-tight text-red-400 hover:bg-red-500/10"
            title="Venta simulada"
          >
            V {fmt(sellPx)}
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-1 font-mono text-[10px] font-semibold tracking-tight text-[#00FF66] hover:bg-[#00FF66]/10"
            title="Compra simulada"
          >
            C {fmt(buyPx)}
          </button>
        </div>
      ) : null}

      <ChartAgentDesk
        open={agentOpen}
        onToggle={() => {
          setAgentOpen((value) => !value);
          setPatternsOpen(false);
          setMenuOpen(false);
          setTfOpen(false);
          setSrOpen(false);
          setListsOpen(false);
          setStyleOpen(false);
        }}
        brief={agentBrief}
      />
    </div>
  );
}
