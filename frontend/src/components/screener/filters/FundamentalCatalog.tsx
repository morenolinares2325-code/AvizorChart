"use client";

import {
  FUNDAMENTAL_CATALOG,
  createFundamental,
  type FundamentalKind,
  type FundamentalModule,
  type ScreenerFilters,
} from "@/lib/screenerEngine";
import { AddSelect, Field, ModuleCard, inputClass } from "@/components/screener/filters/filterUi";

interface FundamentalCatalogProps {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}

export function FundamentalCatalog({ filters, patch }: FundamentalCatalogProps) {
  function add(kind: FundamentalKind) {
    if (filters.fundamentals.some((item) => item.kind === kind)) {
      return;
    }
    patch({ fundamentals: [...filters.fundamentals, createFundamental(kind)] });
  }

  function update(id: string, next: FundamentalModule) {
    patch({
      fundamentals: filters.fundamentals.map((item) => (item.id === id ? next : item)),
    });
  }

  function remove(id: string) {
    patch({ fundamentals: filters.fundamentals.filter((item) => item.id !== id) });
  }

  return (
    <div className="space-y-2">
      <AddSelect
        label="+ Añadir Métrica Fundamental"
        options={FUNDAMENTAL_CATALOG.map((item) => ({ value: item.kind, label: item.label }))}
        onPick={(value) => add(value as FundamentalKind)}
      />
      {filters.fundamentals.map((module) => (
        <FundamentalEditor
          key={module.id}
          module={module}
          onChange={(next) => update(module.id, next)}
          onRemove={() => remove(module.id)}
        />
      ))}
    </div>
  );
}

function FundamentalEditor({
  module,
  onChange,
  onRemove,
}: {
  module: FundamentalModule;
  onChange: (next: FundamentalModule) => void;
  onRemove: () => void;
}) {
  const title = FUNDAMENTAL_CATALOG.find((item) => item.kind === module.kind)?.label ?? module.kind;

  if (module.kind === "market-cap") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Banda">
          <select
            className={inputClass}
            value={module.band}
            onChange={(event) =>
              onChange({ ...module, band: event.target.value as typeof module.band })
            }
          >
            <option value="mega">Mega &gt; $200B</option>
            <option value="large">Large &gt; $10B</option>
            <option value="mid">Mid</option>
            <option value="small">Small</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "pe") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <div className="grid grid-cols-3 gap-2">
          <Field label="PER mín.">
            <input
              className={inputClass}
              type="number"
              value={module.minPe}
              onChange={(event) => onChange({ ...module, minPe: Number(event.target.value) })}
            />
          </Field>
          <Field label="PER máx.">
            <input
              className={inputClass}
              type="number"
              value={module.maxPe}
              onChange={(event) => onChange({ ...module, maxPe: Number(event.target.value) })}
            />
          </Field>
          <Field label="Fwd máx.">
            <input
              className={inputClass}
              type="number"
              value={module.maxForwardPe}
              onChange={(event) =>
                onChange({ ...module, maxForwardPe: Number(event.target.value) })
              }
            />
          </Field>
        </div>
      </ModuleCard>
    );
  }

  if (module.kind === "peg") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="PEG máximo">
          <select
            className={inputClass}
            value={module.maxPeg}
            onChange={(event) =>
              onChange({ ...module, maxPeg: Number(event.target.value) as 1 | 1.5 })
            }
          >
            <option value={1}>&lt; 1.0</option>
            <option value={1.5}>&lt; 1.5</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "growth") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="EPS / ventas YoY">
          <select
            className={inputClass}
            value={module.minYoy}
            onChange={(event) =>
              onChange({ ...module, minYoy: Number(event.target.value) as 15 | 25 })
            }
          >
            <option value={15}>&gt; 15%</option>
            <option value={25}>&gt; 25%</option>
          </select>
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "debt-equity") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="D/E máximo">
          <input
            className={inputClass}
            type="number"
            step="0.1"
            value={module.maxRatio}
            onChange={(event) => onChange({ ...module, maxRatio: Number(event.target.value) })}
          />
        </Field>
      </ModuleCard>
    );
  }

  if (module.kind === "fcf") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <p className="text-[11px] text-zinc-400">Exige Free Cash Flow positivo.</p>
      </ModuleCard>
    );
  }

  if (module.kind === "op-margin") {
    return (
      <ModuleCard title={title} onRemove={onRemove}>
        <Field label="Margen operativo mín. %">
          <input
            className={inputClass}
            type="number"
            value={module.minMargin}
            onChange={(event) => onChange({ ...module, minMargin: Number(event.target.value) })}
          />
        </Field>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard title={title} onRemove={onRemove}>
      <Field label="Mínimo de días">
        <input
          className={inputClass}
          type="number"
          value={module.minDays}
          onChange={(event) => onChange({ ...module, minDays: Number(event.target.value) })}
        />
      </Field>
    </ModuleCard>
  );
}
