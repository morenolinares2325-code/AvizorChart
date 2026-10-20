"use client";

import { PATTERN_GROUPS, patternLabel, type ChartPattern } from "@/lib/mockScreenerData";
import {
  createPattern,
  type PatternModule,
  type ScreenerFilters,
} from "@/lib/screenerEngine";
import { AddSelect, Field, ModuleCard, inputClass } from "@/components/screener/filters/filterUi";

interface PatternCatalogProps {
  filters: ScreenerFilters;
  patch: (partial: Partial<ScreenerFilters>) => void;
}

export function PatternCatalog({ filters, patch }: PatternCatalogProps) {
  const options = PATTERN_GROUPS.flatMap((group) =>
    group.items.map((item) => ({
      value: item,
      label: `${group.group} · ${patternLabel(item)}`,
    })),
  );

  function add(pattern: ChartPattern) {
    patch({ patterns: [...filters.patterns, createPattern(pattern)] });
  }

  function update(id: string, next: PatternModule) {
    patch({
      patterns: filters.patterns.map((item) => (item.id === id ? next : item)),
    });
  }

  function remove(id: string) {
    patch({ patterns: filters.patterns.filter((item) => item.id !== id) });
  }

  return (
    <div className="space-y-2">
      <AddSelect
        label="+ Añadir patrón geométrico"
        options={options}
        onPick={(value) => add(value as ChartPattern)}
      />
      {filters.patterns.map((module) => (
        <ModuleCard
          key={module.id}
          title={patternLabel(module.pattern)}
          onRemove={() => remove(module.id)}
        >
          <Field label="Timing">
            <select
              className={inputClass}
              value={module.timing}
              onChange={(event) =>
                update(module.id, {
                  ...module,
                  timing: event.target.value as PatternModule["timing"],
                })
              }
            >
              <option value="pre-break">Pre-ruptura (compresión activa)</option>
              <option value="exact-break">Ruptura exacta con volumen</option>
              <option value="pullback">Pullback / retesteo</option>
            </select>
          </Field>
          {module.timing === "pre-break" ? (
            <Field label="Distancia al nivel &lt; X%">
              <input
                className={inputClass}
                type="number"
                step="0.1"
                value={module.proximityPct}
                onChange={(event) =>
                  update(module.id, {
                    ...module,
                    proximityPct: Number(event.target.value),
                  })
                }
              />
            </Field>
          ) : null}
        </ModuleCard>
      ))}
    </div>
  );
}
