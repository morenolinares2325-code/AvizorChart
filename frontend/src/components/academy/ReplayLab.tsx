"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Pause, Play, SkipForward, Square, TrendingDown, TrendingUp } from "lucide-react";
import { ChartLeftRail } from "@/components/chart/ChartLeftRail";
import { ChartPane } from "@/components/chart/ChartPane";
import { ChartToolbar } from "@/components/chart/ChartToolbar";
import { requestChartCenter, requestChartRightPad } from "@/components/chart/chartScaleInteraction";
import {
  buildAgentBrief,
  detectAutoPatterns,
  type AutoPatternId,
} from "@/components/chart/chartAutoPatterns";
import type { DrawGroupId, DrawToolId, UserDrawing } from "@/components/chart/chartDrawTools";
import type { IndicatorSettingsMap, IndicatorStyle } from "@/components/chart/chartIndicatorSettings";
import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import {
  RANGE_PRESETS,
  type DrawingId,
  type IndicatorId,
  type RangePresetId,
  type WatchlistId,
} from "@/components/chart/chartTypes";
import type { AutoSROptions } from "@/components/chart/ChartAutoSRMenu";
import {
  chromeVars,
  DEFAULT_CHART_THEME,
  normalizeChartTheme,
  saveChartScheme,
  themeForSchemeSwitch,
  type ChartScheme,
  type ChartVisualTheme,
} from "@/components/chart/chartVisualTheme";
import type { TradeChartMarker } from "@/components/chart/ChartCanvas";
import { fetchCandles, type CandlePayload, type ChartInterval } from "@/lib/marketApi";
import { findAsset } from "@/lib/mockScreenerData";
import {
  loadSavedScripts,
  plotsForScripts,
  removeSavedScript,
  dropPendingScript,
  visualsForScripts,
  type SavedScript,
} from "@/lib/scriptLibrary";
import {
  askCoach,
  emptySenseiMemory,
  idleSensei,
  localCoach,
  rememberSensei,
  type CoachRequest,
} from "@/lib/academyCoach";
import { atrPct, losingStreak, type SenseiMemory, type SenseiTone } from "@/lib/senseiBank";
import {
  hitStopOrTarget,
  REPLAY_SPEEDS,
  riskCash,
  signedPnl,
  sliceCandles,
  START_BALANCE,
  type ClosedTrade,
  type ExitReason,
  type OpenPosition,
  type OrderSide,
  type ReplaySpeed,
  type SizeUnit,
} from "@/lib/replayEngine";
import { SessionResults } from "@/components/academy/SessionResults";
import { SenseiBanner } from "@/components/academy/SenseiBanner";
import type { CSSProperties } from "react";

const EMPTY_DRAWINGS = new Set<DrawingId>();
const LAB_INDICATORS: IndicatorId[] = ["ema20", "ema50", "vol_hist"];

function toggleSet<T>(current: Set<T>, id: T): Set<T> {
  const next = new Set(current);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

function fmtPx(value: number): string {
  return value >= 100 ? value.toFixed(2) : value.toFixed(4);
}

export function ReplayLab() {
  const [ticker, setTicker] = useState("NVDA");
  const [interval, setInterval] = useState<ChartInterval>("1d");
  const [range] = useState<RangePresetId>("1y");
  const [chartType, setChartType] = useState<ChartPriceType>("candles");
  const [indicators, setIndicators] = useState<IndicatorId[]>(LAB_INDICATORS);
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettingsMap>({});
  const [scriptIds, setScriptIds] = useState<string[]>([]);
  const [scriptLibrary, setScriptLibrary] = useState<SavedScript[]>([]);
  const [full, setFull] = useState<CandlePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(40);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [barOpen, setBarOpen] = useState(true);
  const [balance, setBalance] = useState(START_BALANCE);
  const [position, setPosition] = useState<OpenPosition | null>(null);
  const [trades, setTrades] = useState<ClosedTrade[]>([]);
  const [markers, setMarkers] = useState<TradeChartMarker[]>([]);
  const [qty, setQty] = useState(10);
  const [unit, setUnit] = useState<SizeUnit>("shares");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [thesisDraft, setThesisDraft] = useState("");
  const [pendingThesisId, setPendingThesisId] = useState<string | null>(null);
  const [chat, setChat] = useState<{ id: string; role: "prof" | "you"; text: string; tone?: SenseiTone }[]>([]);
  const [headline, setHeadline] = useState(
    "Hoy no busco héroes. Busco un plan, un stop y un size que no te rompa.",
  );
  const [results, setResults] = useState(false);
  const [drawTool, setDrawTool] = useState<DrawToolId>("cursor");
  const [openGroup, setOpenGroup] = useState<DrawGroupId | null>(null);
  const [magnet, setMagnet] = useState(false);
  const [locked, setLocked] = useState(false);
  const [userDrawings, setUserDrawings] = useState<UserDrawing[]>([]);
  const [autoSR, setAutoSR] = useState<AutoSROptions>({ horizontal: false, diagonal: false });
  const [autoPatterns, setAutoPatterns] = useState<Set<AutoPatternId>>(() => new Set());
  const [watchlist, setWatchlist] = useState<WatchlistId>("core");
  const [theme, setTheme] = useState<ChartVisualTheme>(() =>
    normalizeChartTheme({ ...DEFAULT_CHART_THEME, scheme: "dark" }),
  );
  const positionRef = useRef(position);
  positionRef.current = position;
  const thesisById = useRef<Record<string, string>>({});
  const memoryRef = useRef<SenseiMemory>(emptySenseiMemory());
  const pendingRef = useRef<string | null>(null);

  const visible = useMemo(() => (full ? sliceCandles(full, cursor) : null), [cursor, full]);
  const last = visible?.last ?? 0;
  const lastBar = visible?.values[visible.values.length - 1];
  const lastDate = visible?.dates[visible.dates.length - 1] ?? "";
  const floating = position ? signedPnl(position.side, position.entry, last, position.qty, position.unit) : 0;
  const equity = balance + floating;
  const risk = last ? riskCash(last, sl ? Number(sl) : null, qty, unit) : null;
  const vol = visible ? atrPct(visible.values) : 0;
  const streak = losingStreak(trades.map((item) => item.pnl));
  const assetName = useMemo(() => findAsset(ticker)?.name, [ticker]);
  const indicatorSet = useMemo(() => new Set(indicators), [indicators]);
  const patternHits = useMemo(
    () => (visible && autoPatterns.size > 0 ? detectAutoPatterns(visible.values, autoPatterns) : []),
    [autoPatterns, visible],
  );
  const agentBrief = useMemo(
    () =>
      visible
        ? buildAgentBrief(ticker, visible.values, visible.volumes, patternHits.map((item) => item.label))
        : null,
    [patternHits, ticker, visible],
  );

  useEffect(() => {
    setScriptLibrary(loadSavedScripts());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setFull(null);
    setError(null);
    setPlaying(false);
    const period = RANGE_PRESETS.find((item) => item.id === range)?.period ?? "1y";
    void fetchCandles(ticker, interval, controller.signal, period)
      .then((payload) => {
        if (controller.signal.aborted) {
          return;
        }
        setFull(payload);
        setCursor(Math.max(36, Math.floor(payload.values.length * 0.42)));
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err.message : "No se pudo cargar el histórico.");
      });
    return () => controller.abort();
  }, [interval, range, ticker]);

  const speak = useCallback((text: string, tone: SenseiTone, id?: string) => {
    const pick = { id: id ?? `line-${Date.now()}`, text, tone };
    memoryRef.current = rememberSensei(memoryRef.current, pick);
    setHeadline(text);
    setChat((current) => [...current, { id: pick.id, role: "prof", text, tone }]);
  }, []);

  const coachPayload = useCallback(
    (partial: Pick<CoachRequest, "kind"> & Partial<CoachRequest>): CoachRequest => ({
      kind: partial.kind,
      ticker,
      interval,
      side: partial.side ?? positionRef.current?.side ?? "buy",
      entry: partial.entry ?? positionRef.current?.entry ?? last,
      sl: partial.sl ?? positionRef.current?.sl ?? (sl.trim() ? Number(sl) : null),
      tp: partial.tp ?? positionRef.current?.tp ?? (tp.trim() ? Number(tp) : null),
      qty: partial.qty ?? positionRef.current?.qty ?? qty,
      unit: partial.unit ?? positionRef.current?.unit ?? unit,
      balance,
      thesis: partial.thesis ?? "",
      atrPct: vol,
      streak,
      pnl: partial.pnl,
      reason: partial.reason,
    }),
    [balance, interval, last, qty, sl, streak, ticker, tp, unit, vol],
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      if (positionRef.current || pendingRef.current) {
        return;
      }
      const pick = idleSensei(
        { ticker, interval, atrPct: vol, streak, side: positionRef.current?.side },
        memoryRef.current,
      );
      memoryRef.current = rememberSensei(memoryRef.current, pick);
      setHeadline(pick.text);
    }, 13000);
    return () => window.clearInterval(id);
  }, [interval, streak, ticker, vol]);

  const settle = useCallback(
    (open: OpenPosition, exit: number, reason: ExitReason, stamp: string) => {
      const pnl = signedPnl(open.side, open.entry, exit, open.qty, open.unit);
      const thesis = thesisById.current[open.id] ?? "";
      const closed: ClosedTrade = {
        id: open.id,
        ticker,
        side: open.side,
        qty: open.qty,
        unit: open.unit,
        entry: open.entry,
        exit,
        sl: open.sl,
        tp: open.tp,
        pnl,
        reason,
        openedAt: open.openedAt,
        closedAt: stamp,
        thesis,
      };
      setTrades((current) => [closed, ...current]);
      setBalance((value) => value + pnl);
      setPosition(null);
      setPendingThesisId((current) => {
        const next = current === open.id ? null : current;
        pendingRef.current = next;
        return next;
      });
      setMarkers((current) => [
        ...current,
        {
          date: stamp,
          price: exit,
          kind: "exit",
          side: open.side,
          win: pnl >= 0,
          label: `${pnl >= 0 ? "OUT +" : "OUT "}${fmtPx(exit)}`,
        },
      ]);
      void askCoach(
        coachPayload({
          kind: "close",
          side: open.side,
          entry: open.entry,
          sl: open.sl,
          tp: open.tp,
          qty: open.qty,
          unit: open.unit,
          thesis,
          pnl,
          reason,
        }),
        memoryRef.current,
      ).then(({ reply, pick }) => speak(reply.text, reply.tone, pick.id));
    },
    [coachPayload, speak, ticker],
  );

  const step = useCallback(() => {
    setCursor((current) => {
      if (!full || current >= full.values.length) {
        setPlaying(false);
        return current;
      }
      const next = current + 1;
      const bar = full.values[next - 1];
      const stamp = full.dates[next - 1] ?? "";
      const open = positionRef.current;
      if (open && bar) {
        const hit = hitStopOrTarget(bar, open);
        if (hit) {
          const price = hit === "sl" ? (open.sl as number) : (open.tp as number);
          window.setTimeout(() => settle(open, price, hit, stamp), 0);
        }
      }
      if (next >= full.values.length) {
        setPlaying(false);
        window.setTimeout(() => setResults(true), 80);
      }
      return next;
    });
  }, [full, settle]);

  useEffect(() => {
    if (!playing) {
      return;
    }
    const id = window.setInterval(step, Math.max(80, 900 / speed));
    return () => window.clearInterval(id);
  }, [playing, speed, step]);

  function openOrder(side: OrderSide) {
    if (!visible || position) {
      return;
    }
    const stop = sl.trim() ? Number(sl) : null;
    const take = tp.trim() ? Number(tp) : null;
    if (stop != null && !Number.isFinite(stop)) {
      return;
    }
    if (take != null && !Number.isFinite(take)) {
      return;
    }
    const id = `t-${Date.now()}`;
    const next: OpenPosition = {
      id,
      side,
      qty: Math.max(0.01, qty),
      unit,
      entry: last,
      sl: stop,
      tp: take,
      openedAt: lastDate,
      openedIndex: cursor,
    };
    setPosition(next);
    setPendingThesisId(id);
    pendingRef.current = id;
    setThesisDraft("");
    setMarkers((current) => [
      ...current,
      {
        date: lastDate,
        price: last,
        kind: "entry",
        side,
        label: `${side.toUpperCase()} ${fmtPx(last)}`,
      },
    ]);
    const pick = localCoach(
      coachPayload({
        kind: "open",
        side,
        entry: last,
        sl: stop,
        tp: take,
        thesis: "",
      }),
      memoryRef.current,
    );
    speak(pick.text, pick.tone, pick.id);
    void askCoach(
      coachPayload({
        kind: "open",
        side,
        entry: last,
        sl: stop,
        tp: take,
        thesis: "",
      }),
      memoryRef.current,
    ).then(({ reply, pick: aiPick }) => {
      if (!pendingRef.current) {
        return;
      }
      memoryRef.current = rememberSensei(memoryRef.current, aiPick);
      setHeadline(reply.text);
      setChat((current) => {
        const lastProf = [...current].reverse().findIndex((item) => item.role === "prof");
        if (lastProf < 0) {
          return [...current, { id: aiPick.id, role: "prof", text: reply.text, tone: reply.tone }];
        }
        const index = current.length - 1 - lastProf;
        return current.map((item, i) =>
          i === index ? { ...item, id: aiPick.id, text: reply.text, tone: reply.tone } : item,
        );
      });
    });
  }

  function sendReply() {
    const text = thesisDraft.trim();
    if (!text || !pendingThesisId || !position) {
      return;
    }
    setChat((current) => [...current, { id: `u-${Date.now()}`, role: "you", text }]);
    setThesisDraft("");
    thesisById.current[pendingThesisId] = text;
    setPendingThesisId(null);
    pendingRef.current = null;
    void askCoach(
      coachPayload({
        kind: "entry",
        side: position.side,
        entry: position.entry,
        sl: position.sl,
        tp: position.tp,
        qty: position.qty,
        unit: position.unit,
        thesis: text,
      }),
      memoryRef.current,
    ).then(({ reply, pick }) => speak(reply.text, reply.tone, pick.id));
  }

  function closeManual() {
    if (!position || !lastBar) {
      return;
    }
    settle(position, last, "manual", lastDate);
  }

  function endSession() {
    setPlaying(false);
    if (position && lastBar) {
      settle(position, last, "session", lastDate);
    }
    setResults(true);
  }

  function restart() {
    setBalance(START_BALANCE);
    setPosition(null);
    setTrades([]);
    setMarkers([]);
    setChat([]);
    setResults(false);
    setPendingThesisId(null);
    pendingRef.current = null;
    memoryRef.current = emptySenseiMemory();
    setHeadline("Otra sesión. Mismo oficio: plan, stop, size. Sin teatro.");
    if (full) {
      setCursor(Math.max(36, Math.floor(full.values.length * 0.42)));
    }
  }

  const tradeGuide = position
    ? { entry: position.entry, sl: position.sl, tp: position.tp, side: position.side }
    : null;

  function applyScheme(next: ChartScheme) {
    saveChartScheme(next);
    setTheme((current) => themeForSchemeSwitch(current, next));
  }

  return (
    <div
      className="avizor-terminal relative flex min-h-0 flex-1 flex-col overflow-hidden"
      data-scheme={theme.scheme}
      style={chromeVars(theme) as CSSProperties}
    >
      <SenseiBanner
        headline={headline}
        draft={thesisDraft}
        onDraft={setThesisDraft}
        onSend={sendReply}
        unlocked={Boolean(pendingThesisId)}
      />

      <ChartToolbar
        ticker={ticker}
        onTicker={(next) => {
          setTicker(next);
          setIndicators(LAB_INDICATORS);
        }}
        interval={interval}
        onInterval={setInterval}
        chartType={chartType}
        onChartType={setChartType}
        indicators={indicatorSet}
        onToggleIndicator={(id) => setIndicators(Array.from(toggleSet(indicatorSet, id)))}
        indicatorSettings={indicatorSettings}
        onPatchIndicatorSettings={(id: IndicatorId, patch: Partial<IndicatorStyle>) =>
          setIndicatorSettings((current) => ({
            ...current,
            [id]: { ...(current[id] ?? {}), ...patch },
          }))
        }
        savedScripts={scriptLibrary}
        scriptIds={new Set(scriptIds)}
        onToggleScript={(id: string) => setScriptIds(Array.from(toggleSet(new Set(scriptIds), id)))}
        onRemoveScript={(id: string) => {
          dropPendingScript(id);
          setScriptLibrary(removeSavedScript(id));
          setScriptIds((current) => current.filter((item) => item !== id));
        }}
        quote={visible}
        assetName={assetName}
        autoSR={autoSR}
        onAutoSR={setAutoSR}
        agentBrief={agentBrief}
        autoPatterns={autoPatterns}
        onTogglePattern={(id) => setAutoPatterns((current) => toggleSet(current, id))}
        watchlist={watchlist}
        onWatchlist={setWatchlist}
        split={1}
        onSplit={() => undefined}
        onUndock={() => undefined}
        labMode
        scheme={theme.scheme}
        onScheme={applyScheme}
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
          onRightPad={requestChartRightPad}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {visible ? (
            <ChartPane
              ticker={ticker}
              interval={interval}
              period={RANGE_PRESETS.find((item) => item.id === range)?.period ?? "1y"}
              indicators={indicators}
              indicatorSettings={indicatorSettings}
              builtIndicators={plotsForScripts(scriptLibrary, scriptIds)}
              builderVisuals={visualsForScripts(scriptLibrary, scriptIds)}
              drawings={EMPTY_DRAWINGS}
              autoSR={autoSR}
              autoPatterns={autoPatterns}
              theme={theme}
              drawTool={drawTool}
              magnet={magnet}
              locked={locked}
              userDrawings={userDrawings}
              onUserDrawings={setUserDrawings}
              focused
              onFocus={() => undefined}
              dataOverride={visible}
              tradeGuide={tradeGuide}
              tradeMarkers={markers}
              chartType={chartType}
            />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-500">
              {error ?? "Cargando histórico…"}
            </div>
          )}
        </div>

        <aside className="flex w-[300px] shrink-0 flex-col border-l border-[#1F1F2E] bg-[#0A0A0F]">
          <div className="border-b border-[#1F1F2E] p-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Balance</p>
            <p className="mt-1 font-mono text-3xl tabular-nums tracking-tight text-white">{equity.toFixed(2)}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-zinc-400">Cuenta simulada</p>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px]">
              <p className="text-zinc-500">
                Realizado <span className="text-zinc-200">{balance.toFixed(2)}</span>
              </p>
              <p className={floating >= 0 ? "text-emerald-400" : "text-red-400"}>
                Flotante {floating >= 0 ? "+" : ""}
                {floating.toFixed(2)}
              </p>
            </div>
            <p className="mt-2 font-mono text-[11px] text-zinc-400">
              {ticker} · {interval}
              {position ? ` · ${position.side.toUpperCase()} abierta` : ""}
            </p>
          </div>

          <div className="space-y-2 p-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block font-mono text-[10px] text-zinc-500">
                Tamaño
                <input
                  type="number"
                  min={0.01}
                  step={1}
                  value={qty}
                  onChange={(event) => setQty(Number(event.target.value) || 1)}
                  className="mt-1 h-8 w-full rounded border border-[#1F1F2E] bg-[#050508] px-2 font-mono text-[12px] text-white"
                />
              </label>
              <label className="block font-mono text-[10px] text-zinc-500">
                Unidad
                <select
                  value={unit}
                  onChange={(event) => setUnit(event.target.value as SizeUnit)}
                  className="mt-1 h-8 w-full rounded border border-[#1F1F2E] bg-[#050508] px-1 text-[11px] text-white"
                >
                  <option value="shares">Acciones</option>
                  <option value="lots">Lotes (×100)</option>
                </select>
              </label>
              <label className="block font-mono text-[10px] text-zinc-500">
                Stop Loss
                <input
                  value={sl}
                  onChange={(event) => setSl(event.target.value)}
                  placeholder="precio"
                  className="mt-1 h-8 w-full rounded border border-[#1F1F2E] bg-[#050508] px-2 font-mono text-[12px] text-white"
                />
              </label>
              <label className="block font-mono text-[10px] text-zinc-500">
                Take Profit
                <input
                  value={tp}
                  onChange={(event) => setTp(event.target.value)}
                  placeholder="precio"
                  className="mt-1 h-8 w-full rounded border border-[#1F1F2E] bg-[#050508] px-2 font-mono text-[12px] text-white"
                />
              </label>
            </div>
            {risk != null && last ? (
              <p className="font-mono text-[10px] text-zinc-500">
                Riesgo ≈ {risk.toFixed(2)} ({((risk / START_BALANCE) * 100).toFixed(2)}%)
              </p>
            ) : (
              <p className="font-mono text-[10px] text-amber-500/80">Sin SL el profesor te va a interrogar.</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!visible || Boolean(position)}
                onClick={() => openOrder("buy")}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-[#26A69A] font-mono text-[13px] font-bold tracking-[0.14em] text-black disabled:opacity-40"
              >
                <TrendingUp className="h-4 w-4" />
                BUY
              </button>
              <button
                type="button"
                disabled={!visible || Boolean(position)}
                onClick={() => openOrder("sell")}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-md bg-[#EF5350] font-mono text-[13px] font-bold tracking-[0.14em] text-white disabled:opacity-40"
              >
                <TrendingDown className="h-4 w-4" />
                SELL
              </button>
            </div>
            <button
              type="button"
              disabled={!position}
              onClick={closeManual}
              className="w-full rounded-md border border-zinc-700 py-2 font-mono text-[11px] uppercase tracking-wide text-zinc-300 disabled:opacity-40"
            >
              Cerrar posición
            </button>
            {trades[0] ? (
              <p className="font-mono text-[10px] text-zinc-500">
                Última: {trades[0].side.toUpperCase()} {trades[0].pnl >= 0 ? "+" : ""}
                {trades[0].pnl.toFixed(2)} · {trades[0].reason}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="shrink-0 border-t border-[#1F1F2E] bg-[#0A0A0F]">
        <button
          type="button"
          onClick={() => setBarOpen((value) => !value)}
          className="flex h-7 w-full items-center justify-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 hover:text-zinc-300"
        >
          Replay
          <ChevronDown className={`h-3 w-3 transition ${barOpen ? "rotate-180" : ""}`} />
        </button>
        {barOpen ? (
          <div className="flex h-12 items-center gap-2 px-3 pb-2">
            <button
              type="button"
              onClick={() => setPlaying((value) => !value)}
              disabled={!full}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#1F1F2E] text-[#00FF66] disabled:opacity-40"
              title={playing ? "Pausa" : "Play"}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={step}
              disabled={!full || playing}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#1F1F2E] text-zinc-300 disabled:opacity-40"
              title="Siguiente vela"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="flex rounded-md border border-[#1F1F2E] p-0.5">
              {REPLAY_SPEEDS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSpeed(item)}
                  className={`h-8 px-2 font-mono text-[11px] ${
                    speed === item ? "rounded bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500"
                  }`}
                >
                  {item}x
                </button>
              ))}
            </div>
            <p className="hidden font-mono text-[11px] text-zinc-500 sm:block">
              Vela {visible?.count ?? 0}/{full?.values.length ?? 0}
            </p>
            <button
              type="button"
              onClick={endSession}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-[#00FF66] px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-black"
            >
              <Square className="h-3 w-3" />
              Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>

      {results ? (
        <SessionResults trades={trades} balance={balance} onRestart={restart} onClose={() => setResults(false)} />
      ) : null}
    </div>
  );
}
