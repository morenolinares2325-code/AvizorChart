"use client";

import { ChevronDown, Loader2, Radar, RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { FundamentalCatalog } from "@/components/screener/filters/FundamentalCatalog";
import { PatternCatalog } from "@/components/screener/filters/PatternCatalog";
import { TechnicalCatalog } from "@/components/screener/filters/TechnicalCatalog";
import { Field, inputClass } from "@/components/screener/filters/filterUi";
import { PrimaryButton } from "@/components/screener/screenerUi";
import type { FilterVariant, Timeframe } from "@/lib/mockScreenerData";
import {
  DEFAULT_SCREENER_FILTERS,
  PRESET_STORAGE_KEY,
  type ScreenerFilters,
} from "@/lib/screenerEngine";

interface FilterAccordionProps {
  variant: FilterVariant;
  filters: ScreenerFilters;
  onChange: (next: ScreenerFilters) => void;
  scanning: boolean;
  onScan: () => void;
}

const BLOCKS = [
  { id: 1, title: "1. Cuenta, riesgo y fondeo" },
  { id: 2, title: "2. Precio, volumen y movimiento" },
  { id: 3, title: "3. Indicadores técnicos" },
  { id: 4, title: "4. Fundamentales" },
  { id: 5, title: "5. Geometría y timing" },
] as const;

export function FilterAccordion({
  variant,
  filters,
  onChange,
  scanning,
  onScan,
}: FilterAccordionProps) {
  const [open, setOpen] = useState<number[]>([1, 3, 5]);
  const [presetNote, setPresetNote] = useState<string | null>(null);

  function patch(partial: Partial<ScreenerFilters>) {
    onChange({ ...filters, ...partial });
  }

  function toggle(id: number) {
    setOpen((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function savePreset() {
    window.localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(filters));
    setPresetNote("Preset guardado");
  }

  function loadPreset() {
    const raw = window.localStorage.getItem(PRESET_STORAGE_KEY);
    if (!raw) {
      setPresetNote("No hay preset");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as ScreenerFilters;
      onChange({ ...DEFAULT_SCREENER_FILTERS, ...parsed });
      setPresetNote("Preset cargado");
    } catch {
      setPresetNote("Preset inválido");
    }
  }

  function reset() {
    onChange(DEFAULT_SCREENER_FILTERS);
    setPresetNote("Filtros reseteados");
  }

  return (
    <aside className="h-fit rounded-xl bg-gradient-to-br from-zinc-500/40 via-zinc-800 to-zinc-950 p-[1px]">
      <div className="overflow-hidden rounded-[11px] border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="border-b border-zinc-800/80 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
            Motor de pre-detonación
          </p>
          <label className="mt-2 block text-xs text-zinc-400">
            Timeframe mínimo
            <select
              value={filters.timeframe}
              onChange={(event) => patch({ timeframe: event.target.value as Timeframe })}
              className={`${inputClass} mt-1`}
            >
              <option value="1H">1H</option>
              <option value="4H">4H</option>
              <option value="1D">1D</option>
              <option value="1W">1W</option>
            </select>
          </label>
          <div className="mt-2 grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={savePreset}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:text-zinc-100"
            >
              <Save className="h-3 w-3" /> Guardar
            </button>
            <button
              type="button"
              onClick={loadPreset}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:text-zinc-100"
            >
              Cargar
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300 hover:text-zinc-100"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          </div>
          {presetNote ? <p className="mt-1 text-[10px] text-emerald-400">{presetNote}</p> : null}
        </div>

        {BLOCKS.map((block) => (
          <section key={block.id} className="border-b border-zinc-800/70 last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(block.id)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-semibold text-zinc-200 hover:bg-zinc-900/70"
            >
              {block.id === 4 && variant === "multi"
                ? "4. Correlación, spread y sesión"
                : block.title}
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-500 transition ${open.includes(block.id) ? "rotate-180" : ""}`}
              />
            </button>
            {open.includes(block.id) ? (
              <div className="space-y-3 px-3 pb-3">
                {block.id === 1 ? <BlockRisk filters={filters} patch={patch} /> : null}
                {block.id === 2 ? <BlockPrice filters={filters} patch={patch} /> : null}
                {block.id === 3 ? <TechnicalCatalog filters={filters} patch={patch} /> : null}
                {block.id === 4 && variant !== "multi" ? (
                  <FundamentalCatalog filters={filters} patch={patch} />
                ) : null}
                {block.id === 4 && variant === "multi" ? (
                  <BlockMultiSession filters={filters} patch={patch} />
                ) : null}
                {block.id === 5 ? (
                  <>
                    <PatternCatalog filters={filters} patch={patch} />
                    {variant === "portfolio" ? (
                      <PortfolioGuards filters={filters} patch={patch} />
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}

        <div className="border-t border-zinc-800/80 p-3">
          <PrimaryButton className="w-full py-2.5 text-xs" disabled={scanning} onClick={onScan}>
            {scanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            {scanning ? "Escaneando universo…" : "Ejecutar Cribado Cuantitativo"}
          </PrimaryButton>
        </div>
      </div>
    </aside>
  );
}

function BlockRisk({
  filters,
  patch,
}: {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}) {
  return (
    <>
      <Field label="R:B mínimo">
        <select
          className={inputClass}
          value={filters.minRR}
          onChange={(event) => patch({ minRR: event.target.value as ScreenerFilters["minRR"] })}
        >
          <option value="1:2">1 : 2</option>
          <option value="1:3">1 : 3</option>
          <option value="1:4">1 : 4</option>
        </select>
      </Field>
      <Field label="Riesgo máx. por trade">
        <select
          className={inputClass}
          value={filters.riskPerTradePct}
          onChange={(event) =>
            patch({
              riskPerTradePct: Number(event.target.value) as ScreenerFilters["riskPerTradePct"],
            })
          }
        >
          <option value={0.5}>0.5%</option>
          <option value={1}>1.0%</option>
          <option value={1.5}>1.5%</option>
          <option value={2}>2.0%</option>
        </select>
      </Field>
      <Field label={`Drawdown flotante máx. (${filters.maxDrawdownPct}%)`}>
        <input
          type="range"
          min={2}
          max={12}
          step={1}
          value={filters.maxDrawdownPct}
          onChange={(event) => patch({ maxDrawdownPct: Number(event.target.value) })}
          className="w-full accent-emerald-500"
        />
      </Field>
      <label className="flex items-center gap-2 text-[11px] text-zinc-300">
        <input
          type="checkbox"
          checked={filters.skipHighImpactNews}
          onChange={(event) => patch({ skipHighImpactNews: event.target.checked })}
          className="accent-emerald-500"
        />
        No operar ante noticias de alto impacto (&lt; 24h)
      </label>
    </>
  );
}

function BlockPrice({
  filters,
  patch,
}: {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Precio mín.">
          <input
            className={inputClass}
            value={filters.minPrice}
            onChange={(event) => patch({ minPrice: event.target.value })}
            placeholder="0"
          />
        </Field>
        <Field label="Precio máx.">
          <input
            className={inputClass}
            value={filters.maxPrice}
            onChange={(event) => patch({ maxPrice: event.target.value })}
            placeholder="∞"
          />
        </Field>
      </div>
      <Field label="ATR / ADR% mínimo">
        <input
          className={inputClass}
          value={filters.minAtrPct}
          onChange={(event) => patch({ minAtrPct: event.target.value })}
          placeholder="ej. 1.5"
        />
      </Field>
      <label className="flex items-center gap-2 text-[11px] text-zinc-300">
        <input
          type="checkbox"
          checked={filters.nearKeyLevel}
          onChange={(event) => patch({ nearKeyLevel: event.target.checked })}
          className="accent-emerald-500"
        />
        Proximidad a S/R o máximo 52 semanas (&lt; 1.5%)
      </label>
    </>
  );
}

function BlockMultiSession({
  filters,
  patch,
}: {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}) {
  return (
    <>
      <label className="flex items-center gap-2 text-[11px] text-zinc-300">
        <input
          type="checkbox"
          checked={filters.requireOpenSession}
          onChange={(event) => patch({ requireOpenSession: event.target.checked })}
          className="accent-emerald-500"
        />
        Solo si hay sesión abierta (NY / Londres / Tokio)
      </label>
      <Field label="Spread máximo (bps)">
        <input
          className={inputClass}
          value={filters.maxSpreadBps}
          onChange={(event) => patch({ maxSpreadBps: event.target.value })}
          placeholder="ej. 3.0"
        />
      </Field>
      <Field label="|Corr. BTC| mínima">
        <input
          className={inputClass}
          value={filters.minAbsBtcCorr}
          onChange={(event) => patch({ minAbsBtcCorr: event.target.value })}
          placeholder="ej. 0.20"
        />
      </Field>
    </>
  );
}

function PortfolioGuards({
  filters,
  patch,
}: {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}) {
  return (
    <>
      <Field label={`Corr. cruzada máx. (${filters.maxPairCorrelation.toFixed(2)})`}>
        <input
          type="range"
          min={0.3}
          max={0.9}
          step={0.05}
          value={filters.maxPairCorrelation}
          onChange={(event) => patch({ maxPairCorrelation: Number(event.target.value) })}
          className="w-full accent-emerald-500"
        />
      </Field>
      <Field label="Volatilidad máx. de cesta %">
        <input
          className={inputClass}
          value={filters.maxBasketVol}
          onChange={(event) => patch({ maxBasketVol: event.target.value })}
        />
      </Field>
      <Field label="Mínimo de sectores">
        <input
          type="number"
          min={2}
          max={6}
          className={inputClass}
          value={filters.minSectors}
          onChange={(event) => patch({ minSectors: Number(event.target.value) })}
        />
      </Field>
    </>
  );
}
