"use client";

import {
  TECHNICAL_CATALOG,
  createTechnical,
  type ScreenerFilters,
  type TechnicalKind,
  type TechnicalModule,
} from "@/lib/screenerEngine";
import { AddSelect, Field, ModuleCard, inputClass } from "@/components/screener/filters/filterUi";

interface TechnicalCatalogProps {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}

export function TechnicalCatalog({ filters, patch }: TechnicalCatalogProps) {
  function add(kind: TechnicalKind) {
    patch({ technicals: [...filters.technicals, createTechnical(kind)] });
  }

  function update(id: string, next: TechnicalModule) {
    patch({
      technicals: filters.technicals.map((item) => (item.id === id ? next : item)),
    });
  }

  function remove(id: string) {
    patch({ technicals: filters.technicals.filter((item) => item.id !== id) });
  }

  return (
    <div className="space-y-2">
      <AddSelect
        label="+ Añadir Indicador Técnico"
        options={TECHNICAL_CATALOG.map((item) => ({ value: item.kind, label: item.label }))}
        onPick={(value) => add(value as TechnicalKind)}
      />
      {filters.technicals.map((module) => (
        <TechnicalEditor
          key={module.id}
          module={module}
          onChange={(next) => update(module.id, next)}
          onRemove={() => remove(module.id)}
        />
      ))}
    </div>
  );
}

function TechnicalEditor({
  module,
  onChange,
  onRemove,
}: {
  module: TechnicalModule;
  onChange: (next: TechnicalModule) => void;
  onRemove: () => void;
}) {
  const title = TECHNICAL_CATALOG.find((item) => item.kind === module.kind)?.label ?? module.kind;

  if (module.kind === "supertrend") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Periodo ATR">
            <input
              className={inputClass}
              type="number"
              value={module.atrPeriod}
              onChange={(event) => onChange({ ...module, atrPeriod: Number(event.target.value) })}
            />
          </Field>
          <Field label="Multiplicador">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={module.multiplier}
              onChange={(event) => onChange({ ...module, multiplier: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Estado">
          <select
            className={inputClass}
            value={module.state}
            onChange={(event) =>
              onChange({ ...module, state: event.target.value as typeof module.state })
            }
          >
            <option value="flip">Giro en vela actual</option>
            <option value="bull">Régimen alcista</option>
            <option value="bear">Régimen bajista</option>
            <option value="near-flip">Proximidad a giro</option>
          </select>
        </Field>
        {module.state === "near-flip" ? (
          <Field label="Proximidad &lt; X%">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={module.nearPct}
              onChange={(event) => onChange({ ...module, nearPct: Number(event.target.value) })}
            />
          </Field>
        ) : null}
      </ModuleCard>
    );
  }

  if (module.kind === "squeeze") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Longitud">
            <input
              className={inputClass}
              type="number"
              value={module.length}
              onChange={(event) => onChange({ ...module, length: Number(event.target.value) })}
            />
          </Field>
          <Field label="Desviación">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={module.deviation}
              onChange={(event) => onChange({ ...module, deviation: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Estado">
          <select
            className={inputClass}
            value={module.state}
            onChange={(event) =>
              onChange({ ...module, state: event.target.value as typeof module.state })
            }
          >
            <option value="on">Squeeze ON</option>
            <option value="fire">Squeeze Fire</option>
            <option value="expansion">Expansión</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "ma-cross") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Tipo">
          <select
            className={inputClass}
            value={module.type}
            onChange={(event) =>
              onChange({ ...module, type: event.target.value as "EMA" | "SMA" })
            }
          >
            <option value="EMA">EMA</option>
            <option value="SMA">SMA</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Rápido">
            <select
              className={inputClass}
              value={module.fast}
              onChange={(event) => onChange({ ...module, fast: Number(event.target.value) })}
            >
              <option value={9}>9</option>
              <option value={20}>20</option>
            </select>
          </Field>
          <Field label="Lento">
            <select
              className={inputClass}
              value={module.slow}
              onChange={(event) => onChange({ ...module, slow: Number(event.target.value) })}
            >
              <option value={21}>21</option>
              <option value={50}>50</option>
              <option value={200}>200</option>
            </select>
          </Field>
        </div>
        <Field label="Condición">
          <select
            className={inputClass}
            value={module.condition}
            onChange={(event) =>
              onChange({ ...module, condition: event.target.value as typeof module.condition })
            }
          >
            <option value="cross-bars">Cruce reciente &lt; X velas</option>
            <option value="proximity">Proximidad &lt; X%</option>
          </select>
        </Field>
        {module.condition === "cross-bars" ? (
          <Field label="Velas">
            <input
              className={inputClass}
              type="number"
              value={module.bars}
              onChange={(event) => onChange({ ...module, bars: Number(event.target.value) })}
            />
          </Field>
        ) : (
          <Field label="Proximidad %">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={module.proximityPct}
              onChange={(event) =>
                onChange({ ...module, proximityPct: Number(event.target.value) })
              }
            />
          </Field>
        )}
      </ModuleCard>
    );
  }

  if (module.kind === "rsi") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Periodo">
          <input
            className={inputClass}
            type="number"
            value={module.period}
            onChange={(event) => onChange({ ...module, period: Number(event.target.value) })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Sobreventa">
            <input
              className={inputClass}
              type="number"
              value={module.oversold}
              onChange={(event) => onChange({ ...module, oversold: Number(event.target.value) })}
            />
          </Field>
          <Field label="Sobrecompra">
            <input
              className={inputClass}
              type="number"
              value={module.overbought}
              onChange={(event) => onChange({ ...module, overbought: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Divergencia">
          <select
            className={inputClass}
            value={module.divergence}
            onChange={(event) =>
              onChange({ ...module, divergence: event.target.value as typeof module.divergence })
            }
          >
            <option value="none">Sin filtro</option>
            <option value="bull">Alcista</option>
            <option value="bear">Bajista</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "macd") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Rápida">
            <input
              className={inputClass}
              type="number"
              value={module.fast}
              onChange={(event) => onChange({ ...module, fast: Number(event.target.value) })}
            />
          </Field>
          <Field label="Lenta">
            <input
              className={inputClass}
              type="number"
              value={module.slow}
              onChange={(event) => onChange({ ...module, slow: Number(event.target.value) })}
            />
          </Field>
          <Field label="Señal">
            <input
              className={inputClass}
              type="number"
              value={module.signal}
              onChange={(event) => onChange({ ...module, signal: Number(event.target.value) })}
            />
          </Field>
        </div>
        <Field label="Condición">
          <select
            className={inputClass}
            value={module.condition}
            onChange={(event) =>
              onChange({ ...module, condition: event.target.value as typeof module.condition })
            }
          >
            <option value="hist-pos">Histograma positivo</option>
            <option value="hist-neg">Histograma negativo</option>
            <option value="zero-cross">Cruce de línea cero</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "atr") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Periodo">
            <input
              className={inputClass}
              type="number"
              value={module.period}
              onChange={(event) => onChange({ ...module, period: Number(event.target.value) })}
            />
          </Field>
          <Field label="Mín. %">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={module.minPct}
              onChange={(event) => onChange({ ...module, minPct: Number(event.target.value) })}
            />
          </Field>
        </div>
      </ModuleCard>
    );
  }

  if (module.kind === "rvol") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Periodo base">
          <input
            className={inputClass}
            type="number"
            value={module.period}
            onChange={(event) => onChange({ ...module, period: Number(event.target.value) })}
          />
        </Field>
        <Field label="Factor">
          <select
            className={inputClass}
            value={module.factor}
            onChange={(event) =>
              onChange({ ...module, factor: Number(event.target.value) as 1.5 | 2 })
            }
          >
            <option value={1.5}>&gt; 1.5x</option>
            <option value={2}>&gt; 2.0x</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "volume-pressure") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Distancia VWAP &lt; X%">
          <input
            className={inputClass}
            type="number"
            step="0.1"
            value={module.vwapPct}
            onChange={(event) => onChange({ ...module, vwapPct: Number(event.target.value) })}
          />
        </Field>
        <label className="flex items-center gap-2 text-[11px] text-zinc-300">
          <input
            type="checkbox"
            checked={module.requireAccumulation}
            onChange={(event) =>
              onChange({ ...module, requireAccumulation: event.target.checked })
            }
            className="accent-emerald-500"
          />
          Flujo institucional acumulador
        </label>
      </ModuleCard>
    );
  }

  if (module.kind === "stoch") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="%K máximo">
          <input
            className={inputClass}
            type="number"
            value={module.maxK}
            onChange={(event) => onChange({ ...module, maxK: Number(event.target.value) })}
          />
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "williams") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="%R máximo">
          <input
            className={inputClass}
            type="number"
            value={module.maxR}
            onChange={(event) => onChange({ ...module, maxR: Number(event.target.value) })}
          />
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "cci") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="CCI mínimo">
          <input
            className={inputClass}
            type="number"
            value={module.min}
            onChange={(event) => onChange({ ...module, min: Number(event.target.value) })}
          />
        </Field>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard title={title} onRemove={onRemove}>
      <Field label="ADX mínimo">
        <input
          className={inputClass}
          type="number"
          value={module.min}
          onChange={(event) => onChange({ ...module, min: Number(event.target.value) })}
        />
      </Field>
    </ModuleCard>
  );
}
