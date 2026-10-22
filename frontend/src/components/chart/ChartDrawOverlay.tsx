"use client";

import type { ECharts } from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChartDrawPropsMenu } from "@/components/chart/ChartDrawPropsMenu";
import {
  colorForTool,
  cursorForTool,
  findTool,
  type DrawPoint,
  type DrawToolId,
  type UserDrawing,
} from "@/components/chart/chartDrawTools";
import { hitTestDrawing, renderDrawing } from "@/components/chart/drawGeometry";
import { beginPlotPan } from "@/components/chart/chartScaleInteraction";
import { pointerOnChart, projectPoint } from "@/components/chart/drawProjection";
import type { OhlcBar } from "@/lib/chartMath";

interface ChartDrawOverlayProps {
  tool: DrawToolId;
  magnet: boolean;
  locked: boolean;
  drawings: UserDrawing[];
  onDrawings: (next: UserDrawing[]) => void;
  chart: ECharts | null;
  viewTick: number;
  values?: OhlcBar[];
  dates?: string[];
}

function newId(): string {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function defaultLabel(tool: DrawToolId): string | undefined {
  if (tool === "text_note") {
    return "Nota";
  }
  if (tool === "price_comment") {
    return "Nivel";
  }
  if (tool === "arrow_label") {
    return "Objetivo";
  }
  if (tool === "signal_icon") {
    return "▲ BUY";
  }
  return undefined;
}

function projectDrawing(
  chart: ECharts | null,
  drawing: UserDrawing,
  width: number,
  height: number,
  dates?: string[],
): UserDrawing {
  return {
    ...drawing,
    points: drawing.points.map((point) => projectPoint(chart, point, width, height, dates)),
  };
}

export function ChartDrawOverlay({
  tool,
  magnet,
  locked,
  drawings,
  onDrawings,
  chart,
  viewTick,
  values,
  dates,
}: ChartDrawOverlayProps) {
  const [draft, setDraft] = useState<UserDrawing | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 1000, height: 600 });
  const [panTick, setPanTick] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const draftRef = useRef<UserDrawing | null>(null);
  const drawingsRef = useRef(drawings);
  const dragRef = useRef(false);
  const handleDragRef = useRef<{ id: string; index: number } | null>(null);
  const panRef = useRef<ReturnType<typeof beginPlotPan>>(null);
  const def = findTool(tool);
  const interactive = tool !== "cursor" && !locked;
  drawingsRef.current = drawings;

  function putDraft(next: UserDrawing | null) {
    draftRef.current = next;
    setDraft(next);
  }

  useEffect(() => {
    putDraft(null);
    dragRef.current = false;
  }, [tool]);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) {
      return;
    }
    const sync = () => {
      const rect = node.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }));
    };
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        putDraft(null);
        dragRef.current = false;
        handleDragRef.current = null;
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function capturePoint(event: React.PointerEvent<SVGSVGElement>): DrawPoint | null {
    return pointerOnChart(chart, event.clientX, event.clientY, magnet, values, dates);
  }

  function commit(next: UserDrawing) {
    const saved = { ...next, complete: true };
    onDrawings([...drawingsRef.current, saved]);
    putDraft(null);
    dragRef.current = false;
    setSelectedId(saved.id);
  }

  function patchSelected(partial: Partial<UserDrawing>) {
    if (!selectedId) {
      return;
    }
    onDrawings(drawingsRef.current.map((item) => (item.id === selectedId ? { ...item, ...partial } : item)));
  }

  function duplicateSelected() {
    const current = drawingsRef.current.find((item) => item.id === selectedId);
    if (!current) {
      return;
    }
    const copy: UserDrawing = {
      ...current,
      id: newId(),
      points: current.points.map((point) => ({
        ...point,
        cat: (point.cat ?? 0) + 4,
        price: point.price,
      })),
    };
    onDrawings([...drawingsRef.current, copy]);
    setSelectedId(copy.id);
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.button === 1 || event.button === 2 || event.altKey) {
      event.preventDefault();
      const session = beginPlotPan(chart, event.clientX, event.clientY, {
        onView: () => setPanTick((value) => value + 1),
      });
      if (!session) {
        return;
      }
      panRef.current = session;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }
    const point = capturePoint(event);
    if (!point) {
      return;
    }
    const selected = drawingsRef.current.find((item) => item.id === selectedId);
    const projectedSelected = selected ? projectDrawing(chart, selected, size.width, size.height, dates) : null;

    if (projectedSelected && selected && !draftRef.current) {
      const handleIndex = projectedSelected.points.findIndex(
        (anchor) => Math.hypot(anchor.x - point.x, anchor.y - point.y) <= 14,
      );
      if (handleIndex >= 0 && !locked) {
        handleDragRef.current = { id: selected.id, index: handleIndex };
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
        return;
      }
    }

    if (!draftRef.current) {
      const hit = Array.from(drawingsRef.current)
        .reverse()
        .find((item) => hitTestDrawing(projectDrawing(chart, item, size.width, size.height, dates), point));
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      setSelectedId(null);
    }

    if (tool === "cursor" || locked || !interactive || !def) {
      return;
    }
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* synthetic events may omit capture */
    }

    if (def.capture === "freehand" || def.capture === "drag") {
      setSelectedId(null);
      dragRef.current = true;
      putDraft({
        id: newId(),
        tool,
        points: def.id === "horizontal" || def.id === "vertical" ? [point] : [point, point],
        color: colorForTool(tool),
        strokeWidth: 2,
        label: defaultLabel(tool),
        complete: false,
      });
      return;
    }

    if (def.capture === "clicks") {
      const needed = def.clicks ?? 2;
      const current = draftRef.current;
      if (!current || current.tool !== tool) {
        const first: UserDrawing = {
          id: newId(),
          tool,
          points: [point],
          color: colorForTool(tool),
          strokeWidth: 2,
          label: defaultLabel(tool),
          complete: false,
        };
        if (needed <= 1) {
          commit(first);
          return;
        }
        putDraft(first);
        return;
      }
      const points = [...current.points, point];
      const next = { ...current, points };
      if ((tool === "path" && event.detail >= 2) || points.length >= needed) {
        commit(next);
        return;
      }
      putDraft(next);
    }
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (panRef.current) {
      panRef.current.move(event.clientX, event.clientY, event.shiftKey);
      return;
    }
    const handle = handleDragRef.current;
    const point = capturePoint(event);
    if (!point) {
      return;
    }
    if (handle) {
      onDrawings(
        drawingsRef.current.map((item) => {
          if (item.id !== handle.id) {
            return item;
          }
          const points = item.points.map((anchor, index) => (index === handle.index ? point : anchor));
          return { ...item, points };
        }),
      );
      return;
    }
    const current = draftRef.current;
    if (!interactive || !current || !dragRef.current) {
      return;
    }
    if (def?.capture === "freehand") {
      putDraft({ ...current, points: [...current.points, point] });
      return;
    }
    if (def?.capture === "drag") {
      if (current.tool === "horizontal" || current.tool === "vertical") {
        putDraft({ ...current, points: [point] });
        return;
      }
      putDraft({ ...current, points: [current.points[0], point] });
    }
  }

  function onPointerUp() {
    if (panRef.current) {
      panRef.current.end();
      panRef.current = null;
      return;
    }
    if (handleDragRef.current) {
      handleDragRef.current = null;
      return;
    }
    const current = draftRef.current;
    if (!interactive || !current || !def) {
      return;
    }
    if (def.capture === "drag" || def.capture === "freehand") {
      commit(current);
    }
  }

  const live = useMemo(() => {
    const source = draft ? [...drawings, draft] : drawings;
    return source.map((item) => projectDrawing(chart, item, size.width, size.height, dates));
  }, [chart, dates, draft, drawings, panTick, size.height, size.width, viewTick]);

  const hint = interactive && def ? def.hint : null;
  const selected = live.find((item) => item.id === selectedId) ?? null;

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 z-[4]"
      style={{ transform: "translateZ(0)", willChange: "transform" }}
    >
      {hint ? (
        <div className="pointer-events-none absolute left-3 top-2 rounded-md border border-[#1F1F2E] bg-[#0A0A0F]/92 px-2.5 py-1 font-mono text-[10px] tracking-wide text-zinc-300 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
          <span className="font-semibold text-white">{def?.label}</span>
          <span className="text-zinc-500"> · {hint}</span>
          {magnet ? <span className="text-[#00FF66]"> · Imán</span> : null}
        </div>
      ) : null}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{
          pointerEvents: interactive ? "auto" : "none",
          cursor: cursorForTool(tool, locked),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(event) => event.preventDefault()}
      >
        <defs>
          <marker
            id="avizor-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6.5"
            markerHeight="6.5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>
        {live.map((item) => (
          <g
            key={item.id}
            opacity={selectedId && item.id !== selectedId ? 0.55 : 1}
            dangerouslySetInnerHTML={{ __html: renderDrawing(item, size) }}
          />
        ))}
        {selected
          ? selected.points.map((anchor, index) => (
              <g key={`h-${selected.id}-${index}`}>
                <circle cx={anchor.x} cy={anchor.y} r="11" fill="rgba(0,229,255,0.16)" />
                <circle
                  cx={anchor.x}
                  cy={anchor.y}
                  r="5.2"
                  fill="#0A0A0F"
                  stroke="#00E5FF"
                  strokeWidth="1.7"
                />
              </g>
            ))
          : null}
      </svg>
      {selected && !locked && !draft ? (
        <ChartDrawPropsMenu
          color={selected.color}
          strokeWidth={selected.strokeWidth}
          onColor={(color) => patchSelected({ color })}
          onWidth={(strokeWidth) => patchSelected({ strokeWidth })}
          onDuplicate={duplicateSelected}
          onDelete={() => {
            onDrawings(drawingsRef.current.filter((item) => item.id !== selected.id));
            setSelectedId(null);
          }}
        />
      ) : null}
    </div>
  );
}
