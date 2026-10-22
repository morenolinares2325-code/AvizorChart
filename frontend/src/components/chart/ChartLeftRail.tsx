"use client";

import {
  CircleHelp,
  Crosshair,
  Fan,
  LocateFixed,
  Lock,
  Magnet,
  Minus,
  Paintbrush,
  Spline,
  Star,
  Target,
  Trash2,
  Type,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import { SectionLabel } from "@/components/chart/chartChrome";
import { DrawToolGlyph } from "@/components/chart/chartDrawGlyphs";
import {
  DRAW_GROUPS,
  groupForTool,
  type DrawGroupId,
  type DrawToolId,
} from "@/components/chart/chartDrawTools";

const FAV_KEY = "avizor.chart.favs.v1";

const GROUP_ICONS: Record<DrawGroupId, LucideIcon> = {
  cursor: Crosshair,
  trend: Minus,
  fib: Spline,
  gann: Fan,
  shapes: Paintbrush,
  waves: Waves,
  text: Type,
  forecast: Target,
  magnet: Magnet,
  lock: Lock,
};

function readFavs(): Set<DrawToolId> {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? new Set(parsed.filter((id): id is DrawToolId => typeof id === "string")) : new Set();
  } catch {
    return new Set();
  }
}

interface ChartLeftRailProps {
  tool: DrawToolId;
  magnet: boolean;
  locked: boolean;
  openGroup: DrawGroupId | null;
  onOpenGroup: (id: DrawGroupId | null) => void;
  onTool: (id: DrawToolId) => void;
  onToggleMagnet: () => void;
  onToggleLock: () => void;
  onClear: () => void;
  onCenter: () => void;
}

export function ChartLeftRail({
  tool,
  magnet,
  locked,
  openGroup,
  onOpenGroup,
  onTool,
  onToggleMagnet,
  onToggleLock,
  onClear,
  onCenter,
}: ChartLeftRailProps) {
  const railRef = useRef<HTMLElement>(null);
  const activeGroup = groupForTool(tool);
  const [favs, setFavs] = useState<Set<DrawToolId>>(new Set());

  useEffect(() => {
    setFavs(readFavs());
  }, []);

  useEffect(() => {
    function onDoc(event: Event) {
      if (!railRef.current?.contains(event.target as Node)) {
        onOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onOpenGroup]);

  function toggleFav(id: DrawToolId, event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFavs((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(next)));
      return next;
    });
  }

  return (
    <aside
      ref={railRef}
      data-chrome="rail"
      className="relative z-30 flex w-11 shrink-0 flex-col items-center gap-0.5 border-r border-[#1F1F2E] bg-[#050508] py-2"
    >
      {DRAW_GROUPS.map((group) => {
        const Icon = GROUP_ICONS[group.id];
        const selected =
          group.id === "magnet"
            ? magnet
            : group.id === "lock"
              ? locked
              : activeGroup === group.id;
        const open = openGroup === group.id;

        return (
          <div key={group.id} className="relative">
            <button
              type="button"
              title={group.title}
              onClick={() => {
                if (group.id === "cursor") {
                  onTool("cursor");
                  onOpenGroup(null);
                  return;
                }
                if (group.id === "magnet") {
                  onToggleMagnet();
                  return;
                }
                if (group.id === "lock") {
                  onToggleLock();
                  return;
                }
                onOpenGroup(open ? null : group.id);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                selected || open
                  ? "bg-[#00FF66]/10 text-[#00FF66] shadow-[inset_0_0_0_1px_rgba(0,255,102,0.32)]"
                  : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
              }`}
            >
              <Icon className="h-[17px] w-[17px]" />
            </button>
            {group.id === "cursor" ? (
              <button
                type="button"
                title="Centrar gráfico"
                aria-label="Centrar gráfico"
                onClick={onCenter}
                className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md border border-[#00FF66]/30 text-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.12)] hover:bg-[#00FF66]/10"
              >
                <LocateFixed className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </button>
            ) : null}

            {group.flyout && open ? (
              <div
                data-chrome="menu"
                className={`absolute left-[calc(100%+6px)] z-40 max-h-[min(72vh,560px)] w-[22.5rem] overflow-y-auto rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1.5 ${
                  group.id === "forecast" || group.id === "text" || group.id === "waves" ? "bottom-0" : "top-0"
                }`}
              >
                {group.sections.map((section, index) => (
                  <div key={section.title} className={index > 0 ? "mt-0.5 border-t border-[#1F1F2E]/80" : ""}>
                    <SectionLabel>{section.title}</SectionLabel>
                    <ul>
                      {section.tools.map((item) => {
                        const on = tool === item.id;
                        const starred = favs.has(item.id);
                        return (
                          <li key={item.id}>
                            <div
                              className={`group flex w-full items-center gap-1 px-1.5 py-0.5 ${
                                on ? "bg-[#00FF66]/10" : "hover:bg-white/[0.035]"
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  onTool(item.id);
                                  onOpenGroup(null);
                                }}
                                className={`flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1.5 text-left text-[13px] leading-tight tracking-tight transition ${
                                  on ? "text-white" : "text-zinc-200 group-hover:text-[#00FF66]"
                                }`}
                              >
                                <DrawToolGlyph id={item.id} active={on} />
                                {item.label}
                              </button>
                              <button
                                type="button"
                                title={starred ? "Quitar de favoritos" : "Añadir a favoritos"}
                                onClick={(event) => toggleFav(item.id, event)}
                                className="rounded p-1 text-zinc-600 hover:text-[#FFD700]"
                              >
                                <Star className={`h-3.5 w-3.5 ${starred ? "fill-[#FFD700] text-[#FFD700]" : ""}`} />
                              </button>
                              <span
                                title={item.hint}
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1F1F2E] text-[10px] text-zinc-500"
                              >
                                <CircleHelp className="h-3 w-3" />
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        title="Eliminar dibujos"
        onClick={onClear}
        className="mt-auto flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.75} />
      </button>
    </aside>
  );
}
