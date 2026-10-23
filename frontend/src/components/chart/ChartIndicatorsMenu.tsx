"use client";

import { ChevronDown, ChevronRight, SlidersHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  INDICATOR_COLOR_FIELDS,
  INDICATOR_NUM_FIELDS,
  indicatorStyle,
  type IndicatorSettingsMap,
  type IndicatorStyle,
} from "@/components/chart/chartIndicatorSettings";
import { INDICATOR_GROUPS, type IndicatorId } from "@/components/chart/chartTypes";
import type { SavedScript } from "@/lib/scriptLibrary";

interface ChartIndicatorsMenuProps {
  open: boolean;
  onToggle: () => void;
  indicators: Set<IndicatorId>;
  onToggleIndicator: (id: IndicatorId) => void;
  settings: IndicatorSettingsMap;
  onPatchSettings: (id: IndicatorId, patch: Partial<IndicatorStyle>) => void;
  savedScripts: SavedScript[];
  scriptIds: Set<string>;
  onToggleScript: (id: string) => void;
  onRemoveScript: (id: string) => void;
}

export function ChartIndicatorsMenu({
  open,
  onToggle,
  indicators,
  onToggleIndicator,
  settings,
  onPatchSettings,
  savedScripts,
  scriptIds,
  onToggleScript,
  onRemoveScript,
}: ChartIndicatorsMenuProps) {
  const [expanded, setExpanded] = useState<string>("trend");
  const customOn = savedScripts.filter((item) => scriptIds.has(item.id)).length;
  const count = indicators.size + customOn;

  return (
    <div className="relative overflow-visible">
      <button
        type="button"
        onClick={onToggle}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] tracking-tight hover:bg-white/[0.04] ${
          count > 0 ? "text-[#00FF66]" : "text-zinc-400 hover:text-white"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />
        Indicadores
        {count > 0 ? <span className="text-[10px] text-[#00FF66]">{count}</span> : null}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div data-chrome="menu" className="fixed left-[16rem] top-[3.35rem] z-[80] max-h-[min(78vh,38rem)] w-[24rem] overflow-y-auto rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1">
          {INDICATOR_GROUPS.map((group) => {
            const shown = expanded === group.id;
            const active = group.items.filter((item) => indicators.has(item.id)).length;
            return (
              <div key={group.id} className="border-b border-[#1F1F2E] last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded((current) => (current === group.id ? "" : group.id))}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  <ChevronRight
                    className={`h-3 w-3 text-zinc-500 transition ${shown ? "rotate-90 text-[#00FF66]" : ""}`}
                  />
                  <span className="avizor-section-mark" aria-hidden />
                  <span className="avizor-section-text">{group.label}</span>
                  {active > 0 ? (
                    <span className="ml-auto font-mono text-[10px] text-[#00FF66]">{active}</span>
                  ) : null}
                </button>
                {shown
                  ? group.items.map((item) => {
                      const on = indicators.has(item.id);
                      const style = indicatorStyle(item.id, settings);
                      return (
                        <div key={item.id} className="px-3 pb-1">
                          <label
                            className={`flex cursor-pointer items-center gap-2 py-1 text-xs ${
                              on ? "text-white" : "text-zinc-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => onToggleIndicator(item.id)}
                              className="accent-[#00FF66]"
                            />
                            {item.label}
                          </label>
                          {on ? (
                            <div
                              className="mb-1 ml-5 space-y-1.5 rounded border border-[#1F1F2E] bg-[#050508] px-2 py-1.5"
                              onPointerDown={(event) => event.stopPropagation()}
                            >
                              <div className="flex flex-wrap gap-2">
                                {INDICATOR_COLOR_FIELDS[item.id].map((field) => (
                                  <label key={field.key} className="flex items-center gap-1">
                                    <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                                      {field.label}
                                    </span>
                                    <input
                                      type="color"
                                      value={hexColor(String(style[field.key] ?? "#22c55e"))}
                                      onChange={(event) =>
                                        onPatchSettings(item.id, { [field.key]: event.target.value })
                                      }
                                      className="h-5 w-7 cursor-pointer rounded border border-[#1F1F2E] bg-transparent"
                                    />
                                  </label>
                                ))}
                              </div>
                              {INDICATOR_NUM_FIELDS[item.id].length > 0 ? (
                                <div className="grid grid-cols-2 gap-1.5">
                                  {INDICATOR_NUM_FIELDS[item.id].map((field) => (
                                    <label key={field.key} className="block">
                                      <span className="mb-0.5 block font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                                        {field.label}
                                      </span>
                                      <input
                                        type="number"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        value={style[field.key] ?? ""}
                                        onChange={(event) => {
                                          const next = Number(event.target.value);
                                          if (!Number.isFinite(next)) {
                                            return;
                                          }
                                          onPatchSettings(item.id, { [field.key]: next });
                                        }}
                                        className="h-6 w-full rounded border border-[#1F1F2E] bg-[#0A0A0F] px-1.5 font-mono text-[11px] text-white outline-none focus:border-[#00FF66]/40"
                                      />
                                    </label>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  : null}
              </div>
            );
          })}
          <div className="border-b border-[#1F1F2E] last:border-b-0">
            <button
              type="button"
              onClick={() => setExpanded((current) => (current === "builder" ? "" : "builder"))}
              className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
              <ChevronRight
                className={`h-3 w-3 text-zinc-500 transition ${expanded === "builder" ? "rotate-90 text-[#00FF66]" : ""}`}
              />
              <span className="avizor-section-mark" aria-hidden />
              <span className="avizor-section-text">Builder</span>
              {customOn > 0 ? (
                <span className="ml-auto font-mono text-[10px] text-[#00FF66]">{customOn}</span>
              ) : null}
            </button>
            {expanded === "builder" ? (
              <div className="space-y-1 px-3 pb-3">
                {savedScripts.length === 0 ? (
                  <p className="py-1 font-mono text-[10px] leading-4 text-zinc-600">
                    Compila un indicador en Builder para verlo aquí y en el gráfico.
                  </p>
                ) : null}
                {savedScripts.map((script) => (
                  <div key={script.id} className="flex items-center gap-2 py-1 text-xs text-zinc-300">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scriptIds.has(script.id)}
                        onChange={() => onToggleScript(script.id)}
                        className="accent-[#00FF66]"
                      />
                      <span className="truncate">{script.name}</span>
                    </label>
                    <button
                      type="button"
                      title="Eliminar"
                      aria-label={`Eliminar ${script.name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemoveScript(script.id);
                      }}
                      className="shrink-0 p-0.5 text-zinc-600 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function hexColor(value: string): string {
  return value.startsWith("#") && value.length === 7 ? value : "#22c55e";
}
