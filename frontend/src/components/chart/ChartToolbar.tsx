"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  INDICATOR_GROUPS,
  INTERVALS,
  QUICK_TICKERS,
  type IndicatorId,
} from "@/components/chart/chartTypes";
import { searchUniverse } from "@/lib/mockScreenerData";
import { parseChartInterval, type ChartInterval } from "@/lib/marketApi";

interface ChartToolbarProps {
  ticker: string;
  onTicker: (ticker: string) => void;
  interval: ChartInterval;
  onInterval: (interval: ChartInterval) => void;
  indicators: Set<IndicatorId>;
  onToggleIndicator: (id: IndicatorId) => void;
}

export function ChartToolbar({
  ticker,
  onTicker,
  interval,
  onInterval,
  indicators,
  onToggleIndicator,
}: ChartToolbarProps) {
  const [query, setQuery] = useState(ticker);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const presetIds = INTERVALS.map((item) => item.id);
  const isCustomInterval = !presetIds.includes(interval as (typeof INTERVALS)[number]["id"]);

  useEffect(() => {
    setQuery(ticker);
  }, [ticker]);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) {
        setOpenSuggest(false);
        setMenuOpen(false);
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
      className="flex h-11 shrink-0 items-center gap-3 border-b border-zinc-800/80 bg-[#08090d] px-3"
    >
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          submitTicker(query);
        }}
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpenSuggest(true);
          }}
          onFocus={() => setOpenSuggest(true)}
          className="h-8 w-28 rounded border border-zinc-800 bg-zinc-950 pl-8 pr-2 font-mono text-xs text-zinc-100 outline-none focus:border-emerald-500/50"
          placeholder="Ticker"
        />
        {openSuggest && suggestions.length > 0 ? (
          <ul className="absolute z-30 mt-1 w-56 overflow-hidden rounded border border-zinc-800 bg-zinc-950 shadow-lg">
            {suggestions.map((item) => (
              <li key={item.ticker}>
                <button
                  type="button"
                  onClick={() => submitTicker(item.ticker)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs hover:bg-zinc-900"
                >
                  <span className="font-mono text-zinc-100">{item.ticker}</span>
                  <span className="truncate pl-2 text-[10px] text-zinc-500">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <div className="flex min-w-0 flex-1 items-center">
        <div className="flex h-8 min-w-0 items-center overflow-x-auto rounded border border-zinc-800 p-0.5">
          {INTERVALS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onInterval(item.id)}
              className={`shrink-0 rounded px-2 font-mono text-[11px] ${
                interval === item.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomOpen((open) => !open);
              setCustomDraft(isCustomInterval ? interval : "");
              setCustomError(null);
            }}
            className={`shrink-0 rounded px-2 font-mono text-[11px] ${
              isCustomInterval || customOpen
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {isCustomInterval ? interval : "Custom"}
          </button>
        </div>
        {customOpen ? (
          <form
            className="ml-2 flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = parseChartInterval(customDraft);
              if (!parsed) {
                setCustomError("Usa 30m, 2h, 3d, 1w…");
                return;
              }
              onInterval(parsed);
              setCustomOpen(false);
              setCustomError(null);
            }}
          >
            <input
              value={customDraft}
              onChange={(event) => {
                setCustomDraft(event.target.value);
                setCustomError(null);
              }}
              className="h-8 w-20 rounded border border-zinc-800 bg-zinc-950 px-2 font-mono text-[11px] text-zinc-100 outline-none focus:border-emerald-500/50"
              placeholder="45m"
              autoFocus
            />
            <button
              type="submit"
              className="h-8 rounded border border-zinc-800 px-2 font-mono text-[11px] text-zinc-300 hover:text-white"
            >
              OK
            </button>
            {customError ? <span className="text-[10px] text-red-400">{customError}</span> : null}
          </form>
        ) : null}
      </div>

      <div className="ml-auto">
        <Dropdown
          open={menuOpen}
          onToggle={() => setMenuOpen((open) => !open)}
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          label="Indicadores Técnicos"
        >
          {INDICATOR_GROUPS.map((group) => (
            <div key={group.id} className="px-2 py-1.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                {group.label}
              </p>
              {group.items.map((item) => (
                <label key={item.id} className="flex items-center gap-2 py-0.5 text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={indicators.has(item.id)}
                    onChange={() => onToggleIndicator(item.id)}
                    className="accent-emerald-500"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          ))}
        </Dropdown>
      </div>
    </div>
  );
}

function Dropdown({
  open,
  onToggle,
  icon,
  label,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2.5 text-[11px] font-semibold text-zinc-300 hover:text-zinc-100"
      >
        {icon}
        {label}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-56 rounded border border-zinc-800 bg-zinc-950 py-1 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}
