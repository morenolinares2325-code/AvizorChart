"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  applyVisualPalette,
  normalizeNeon,
  NEON_MAX,
  VISUAL_PALETTES,
  type ChartVisualTheme,
  type FpsLimit,
  type PixelScale,
  type StrokeWeight,
} from "@/components/chart/chartVisualTheme";

interface ChartVisualStudioProps {
  theme: ChartVisualTheme;
  onTheme: (next: ChartVisualTheme) => void;
}

type StudioSection = "atmosphere" | "stroke" | "performance" | "candles";

export function ChartVisualStudio({ theme, onTheme }: ChartVisualStudioProps) {
  const [open, setOpen] = useState<Record<StudioSection, boolean>>({
    atmosphere: true,
    stroke: false,
    performance: false,
    candles: false,
  });

  function patch(partial: Partial<ChartVisualTheme>) {
    onTheme({ ...theme, ...partial });
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-relaxed text-zinc-400">
        Control visual del canvas. Cada cambio se aplica al instante sobre KLineChart y se guarda en este navegador.
      </p>

      <Fold
        id="atmosphere"
        title="Estilo e iluminación"
        open={open.atmosphere}
        onToggle={() => setOpen((current) => ({ ...current, atmosphere: !current.atmosphere }))}
      >
        <p className="mb-1.5 font-mono text-[9px] uppercase tracking-wide text-zinc-600">Paleta</p>
        <div className="grid grid-cols-2 gap-1.5">
          {VISUAL_PALETTES.map((item) => {
            const active = theme.paletteId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTheme(applyVisualPalette(theme, item.id))}
                className={`rounded-md border px-2 py-1.5 text-left ${
                  active ? "border-[#00FF66]/45 bg-[#00FF66]/10" : "border-[#1F1F2E] hover:border-[#00FF66]/25"
                }`}
              >
                <span className="mb-1 flex gap-1">
                  {item.swatches.map((color) => (
                    <span key={color} className="h-3 flex-1 rounded-sm" style={{ background: color }} />
                  ))}
                </span>
                <span className={`block font-mono text-[10px] ${active ? "text-[#00FF66]" : "text-zinc-200"}`}>
                  {item.label}
                </span>
                <span className="font-mono text-[9px] text-zinc-600">{item.hint}</span>
              </button>
            );
          })}
        </div>
        <Slider
          label={`Resplandor neón · ${normalizeNeon(theme.neon).toFixed(1)} / ${NEON_MAX}`}
          value={normalizeNeon(theme.neon)}
          min={0}
          max={NEON_MAX}
          step={0.1}
          onChange={(neon) => patch({ neon })}
        />
        <Slider
          label={`Gamma / brillo · ${theme.gamma.toFixed(2)}`}
          value={theme.gamma}
          min={0.7}
          max={1.6}
          step={0.02}
          onChange={(gamma) => patch({ gamma })}
        />
      </Fold>

      <Fold
        id="stroke"
        title="Trazos y nitidez"
        open={open.stroke}
        onToggle={() => setOpen((current) => ({ ...current, stroke: !current.stroke }))}
      >
        <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-zinc-600">Grosor global</p>
        <div className="flex flex-wrap gap-1">
          {(["thin", "normal", "thick"] as StrokeWeight[]).map((weight) => (
            <Chip key={weight} active={theme.strokeWeight === weight} onClick={() => patch({ strokeWeight: weight })}>
              {weight === "thin" ? "Fino" : weight === "thick" ? "Grueso" : "Normal"}
            </Chip>
          ))}
        </div>
        <Toggle
          label="Antialiasing / nitidez vectorial"
          checked={theme.antialias}
          onChange={(antialias) => patch({ antialias })}
        />
      </Fold>

      <Fold
        id="performance"
        title="Rendimiento y renderizado"
        open={open.performance}
        onToggle={() => setOpen((current) => ({ ...current, performance: !current.performance }))}
      >
        <p className="mb-1 font-mono text-[9px] uppercase tracking-wide text-zinc-600">Límite FPS</p>
        <div className="flex flex-wrap gap-1">
          {([60, 120, 0] as FpsLimit[]).map((fps) => (
            <Chip key={String(fps)} active={theme.fpsLimit === fps} onClick={() => patch({ fpsLimit: fps })}>
              {fps === 0 ? "Dinámico / VSync" : `${fps} FPS`}
            </Chip>
          ))}
        </div>
        <p className="mb-1 mt-2 font-mono text-[9px] uppercase tracking-wide text-zinc-600">Densidad de píxeles</p>
        <div className="flex flex-wrap gap-1">
          {([1, 2] as PixelScale[]).map((scale) => (
            <Chip key={scale} active={theme.pixelRatio === scale} onClick={() => patch({ pixelRatio: scale })}>
              {scale === 1 ? "1×" : "2× HiDPI / Retina"}
            </Chip>
          ))}
        </div>
        <Toggle
          label="Modo rendimiento (históricos grandes)"
          checked={theme.performanceMode}
          onChange={(performanceMode) => patch({ performanceMode, neon: performanceMode ? Math.min(theme.neon, 2) : theme.neon })}
        />
      </Fold>

      <Fold
        id="candles"
        title="Velas y mechas"
        open={open.candles}
        onToggle={() => setOpen((current) => ({ ...current, candles: !current.candles }))}
      >
        <ColorRow label="Cuerpo alcista" value={theme.bull} onChange={(bull) => patch({ bull })} />
        <ColorRow label="Cuerpo bajista" value={theme.bear} onChange={(bear) => patch({ bear })} />
        <ColorRow label="Borde alcista" value={theme.outlineBull} onChange={(outlineBull) => patch({ outlineBull })} />
        <ColorRow label="Borde bajista" value={theme.outlineBear} onChange={(outlineBear) => patch({ outlineBear })} />
        <ColorRow label="Mecha alcista" value={theme.wickBull} onChange={(wickBull) => patch({ wickBull })} />
        <ColorRow label="Mecha bajista" value={theme.wickBear} onChange={(wickBear) => patch({ wickBear })} />
      </Fold>
    </div>
  );
}

function Fold({
  title,
  open,
  onToggle,
  children,
}: {
  id: StudioSection;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const shown = open;
  return (
    <div className="rounded-md border border-[#1F1F2E] bg-[#050508]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
      >
        <ChevronRight className={`h-3 w-3 text-zinc-500 transition ${shown ? "rotate-90 text-[#00FF66]" : ""}`} />
        <span className="avizor-section-mark" aria-hidden />
        <span className="avizor-section-text">{title}</span>
      </button>
      {shown ? <div className="space-y-2 px-2 pb-2">{children}</div> : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
        active ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-[#00FF66]" />
    </label>
  );
}

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[#00FF66]"
      />
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        type="color"
        value={toHex(value)}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-10 cursor-pointer rounded border border-[#1F1F2E] bg-transparent"
      />
    </label>
  );
}

function toHex(value: string): string {
  const raw = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
    return raw.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`.toLowerCase();
  }
  const rgb = raw.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    const to = (channel: string) =>
      Math.round(Math.min(255, Math.max(0, Number(channel))))
        .toString(16)
        .padStart(2, "0");
    return `#${to(rgb[1])}${to(rgb[2])}${to(rgb[3])}`;
  }
  return "#22c55e";
}
