"use client";

import { useState, type ReactNode } from "react";
import {
  loadChartProfiles,
  newProfileId,
  saveChartProfiles,
  type ChartProfile,
} from "@/components/chart/chartProfiles";
import type { BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import type { IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import { WATCHLISTS, type IndicatorId, type RightUtilId, type WatchlistId } from "@/components/chart/chartTypes";
import {
  backgroundPresetsFor,
  DEFAULT_CHART_THEME,
  LIGHT_CANVAS,
  LIGHT_CHROME,
  normalizeNeon,
  saveChartTheme,
  type ChartVisualTheme,
  type CrosshairStyle,
} from "@/components/chart/chartVisualTheme";
import type { AgentBrief } from "@/components/chart/chartAutoPatterns";
import { findAsset } from "@/lib/mockScreenerData";
import { SectionLabel } from "@/components/chart/chartChrome";
import { NewsWorldTVContainer } from "@/components/news/NewsWorldTVContainer";

function hexColor(value: string): string {
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
  return "#ffffff";
}

interface ChartDockProps {
  tab: RightUtilId;
  ticker: string;
  watchlist: WatchlistId;
  onTicker: (ticker: string) => void;
  theme: ChartVisualTheme;
  onTheme: (next: ChartVisualTheme) => void;
  indicators: Set<IndicatorId>;
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  onApplyProfile: (profile: ChartProfile) => void;
  activeProfileId?: string;
  onUndock: () => void;
  agentBrief?: AgentBrief | null;
}

export function ChartDock({
  tab,
  ticker,
  watchlist,
  onTicker,
  theme,
  onTheme,
  indicators,
  indicatorSettings = {},
  builtIndicators = [],
  onApplyProfile,
  activeProfileId,
  onUndock,
  agentBrief,
}: ChartDockProps) {
  const title = labelFor(tab);
  const newsDesk = tab === "news";
  return (
    <aside
      data-chrome="panel"
      className={`flex shrink-0 flex-col border-l border-[#1F1F2E] ${newsDesk ? "w-[min(44rem,46vw)] bg-transparent" : "w-72 bg-[#0A0A0F]"}`}
    >
      <header className={`flex h-10 shrink-0 items-center justify-between border-b border-[#1F1F2E] pr-3 ${newsDesk ? "bg-black" : ""}`}>
        <SectionLabel>{title}</SectionLabel>
        <button
          type="button"
          onClick={onUndock}
          className="font-mono text-[10px] text-zinc-500 hover:text-[#00FF66]"
          title="Desanclar panel"
        >
          Desanclar
        </button>
      </header>
      <div className={`min-h-0 flex-1 ${newsDesk ? "overflow-hidden p-0" : "overflow-y-auto p-3"}`}>
        {newsDesk ? <NewsWorldTVContainer ticker={ticker} agentBrief={agentBrief} /> : null}
        {tab === "editor" || tab === "settings" ? (
          <EditorPane theme={theme} onTheme={onTheme} />
        ) : null}
        {tab === "profiles" ? (
          <ProfilesPane
            theme={theme}
            indicators={indicators}
            indicatorSettings={indicatorSettings}
            builtIndicators={builtIndicators}
            activeId={activeProfileId}
            onApply={onApplyProfile}
          />
        ) : null}
        {tab === "watchlist" ? (
          <WatchPane active={watchlist} ticker={ticker} onTicker={onTicker} />
        ) : null}
        {tab === "alerts" ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            Alertas de precio sobre {ticker}. Sin ejecución real: umbrales locales del terminal.
          </p>
        ) : null}
        {tab === "fundamentals" ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            {findAsset(ticker)?.name ?? ticker} · ficha fundamental resumida del universo Avizor.
          </p>
        ) : null}
        {tab === "chat" ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            Sala de analistas del activo. El Agente IA de la barra superior mantiene el briefing vivo.
          </p>
        ) : null}
        {tab === "orders" ? (
          <p className="text-xs leading-relaxed text-zinc-400">
            Historial simulado. Compra/venta de la barra no envía órdenes al broker.
          </p>
        ) : null}
      </div>
    </aside>
  );
}

function labelFor(tab: RightUtilId): string {
  if (tab === "news") return "Noticias/TV";
  if (tab === "editor") return "Editor de gráfico";
  if (tab === "profiles") return "Perfiles";
  if (tab === "watchlist") return "Carteras";
  if (tab === "alerts") return "Alertas";
  if (tab === "fundamentals") return "Fundamentales";
  if (tab === "chat") return "Analistas";
  if (tab === "orders") return "Órdenes";
  return "Ajustes";
}

function ProfilesPane({
  theme,
  indicators,
  indicatorSettings = {},
  builtIndicators = [],
  activeId,
  onApply,
}: {
  theme: ChartVisualTheme;
  indicators: Set<IndicatorId>;
  indicatorSettings?: IndicatorSettingsMap;
  builtIndicators?: BuiltIndicator[];
  activeId?: string;
  onApply: (profile: ChartProfile) => void;
}) {
  const [profiles, setProfiles] = useState<ChartProfile[]>(loadChartProfiles);
  const [name, setName] = useState("");

  function persist(next: ChartProfile[]) {
    setProfiles(next);
    saveChartProfiles(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-zinc-400">
        Guarda colores, mechas, fondo, grosores e indicadores del panel enfocado. En split, cada gráfico puede usar un perfil distinto.
      </p>
      <form
        className="flex gap-1"
        onSubmit={(event) => {
          event.preventDefault();
          const label = name.trim();
          if (!label) {
            return;
          }
          persist([
            {
              id: newProfileId(),
              name: label,
              theme,
              indicators: Array.from(indicators),
              indicatorSettings,
              builtIndicators,
            },
            ...profiles,
          ]);
          setName("");
        }}
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Scalping Crypto"
          className="h-8 min-w-0 flex-1 rounded border border-[#1F1F2E] bg-[#050508] px-2 font-mono text-[11px] text-white outline-none focus:border-[#00FF66]/40"
        />
        <button type="submit" className="shrink-0 font-mono text-[10px] text-[#00FF66]">
          Guardar
        </button>
      </form>
      {profiles.length === 0 ? (
        <p className="font-mono text-[11px] text-zinc-500">Aún no hay perfiles.</p>
      ) : (
        <ul className="space-y-1">
          {profiles.map((profile) => (
            <li key={profile.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onApply(profile)}
                className={`min-w-0 flex-1 rounded border px-2 py-1.5 text-left ${
                  activeId === profile.id
                    ? "border-[#00FF66]/40 text-[#00FF66]"
                    : "border-[#1F1F2E] text-zinc-200 hover:border-[#1F1F2E] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="block min-w-0 truncate font-mono text-[11px]">{profile.name}</span>
                  {profile.theme.neon > 0 ? (
                    <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.14em] text-[#00FF66]">
                      Neón
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-[9px] text-zinc-500">
                  {profile.indicators.length} indicadores
                </span>
              </button>
              <button
                type="button"
                onClick={() => persist(profiles.filter((item) => item.id !== profile.id))}
                className="px-1 font-mono text-[10px] text-zinc-600 hover:text-red-400"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditorPane({
  theme,
  onTheme,
}: {
  theme: ChartVisualTheme;
  onTheme: (next: ChartVisualTheme) => void;
}) {
  function patch(partial: Partial<ChartVisualTheme>) {
    const next = { ...theme, ...partial };
    onTheme(next);
    saveChartTheme(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-zinc-400">
        Estilos visuales del canvas. Los cambios se aplican al instante y se guardan en este navegador.
      </p>

      <Section title="Velas y mechas">
        <ColorRow label="Cuerpo alcista" value={theme.bull} onChange={(bull) => patch({ bull })} />
        <ColorRow label="Cuerpo bajista" value={theme.bear} onChange={(bear) => patch({ bear })} />
        <ColorRow label="Borde alcista" value={theme.outlineBull} onChange={(outlineBull) => patch({ outlineBull })} />
        <ColorRow label="Borde bajista" value={theme.outlineBear} onChange={(outlineBear) => patch({ outlineBear })} />
        <ColorRow label="Mecha alcista" value={theme.wickBull} onChange={(wickBull) => patch({ wickBull })} />
        <ColorRow label="Mecha bajista" value={theme.wickBear} onChange={(wickBear) => patch({ wickBear })} />
        <Slider
          label={`Grosor · ${theme.candleBorder.toFixed(1)}px`}
          value={theme.candleBorder}
          min={0.2}
          max={4}
          step={0.05}
          onChange={(value) => patch({ candleBorder: value, wickWidth: value, gridWidth: value })}
        />
        <Slider
          label={`Nitidez · ${theme.candleSharpness.toFixed(1)}`}
          value={theme.candleSharpness}
          min={1}
          max={4}
          step={0.05}
          onChange={(value) => patch({ candleSharpness: value })}
        />
        <Slider
          label={`Neón · ${normalizeNeon(theme.neon).toFixed(1)}`}
          value={normalizeNeon(theme.neon)}
          min={0}
          max={4}
          step={0.05}
          onChange={(value) => patch({ neon: value })}
        />
      </Section>

      <Section title="Fondo">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wide text-zinc-500">Colores</span>
          <div className="flex items-center gap-1">
            <input
              type="color"
              aria-label="Color de fondo"
              value={hexColor(theme.background)}
              onChange={(event) => patch({ background: event.target.value })}
              className="h-7 w-10 cursor-pointer rounded border border-[#1F1F2E] bg-transparent"
            />
            {theme.backgroundMode !== "solid" ? (
              <input
                type="color"
                aria-label="Color de fondo degradado"
                value={hexColor(theme.backgroundTo)}
                onChange={(event) => patch({ backgroundTo: event.target.value })}
                className="h-7 w-10 cursor-pointer rounded border border-[#1F1F2E] bg-transparent"
              />
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["solid", "Sólido"],
              ["vertical", "Vertical"],
              ["horizontal", "Horizontal"],
              ["radial", "Radial"],
            ] as const
          ).map(([mode, label]) => (
            <Chip key={mode} active={theme.backgroundMode === mode} onClick={() => patch({ backgroundMode: mode })}>
              {label}
            </Chip>
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-wide text-zinc-600">Presets</p>
        <div className="flex flex-wrap gap-1">
          {backgroundPresetsFor(theme.scheme).map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() =>
                patch({
                  background: preset.background,
                  backgroundTo: preset.backgroundTo,
                  backgroundMode: preset.backgroundMode,
                })
              }
              className="h-6 w-8 rounded border border-[#1F1F2E]"
              style={{
                background:
                  preset.backgroundMode === "solid"
                    ? preset.background
                    : preset.backgroundMode === "radial"
                      ? `radial-gradient(circle, ${preset.background}, ${preset.backgroundTo})`
                      : `linear-gradient(180deg, ${preset.background}, ${preset.backgroundTo})`,
              }}
            />
          ))}
        </div>
      </Section>

      <Section title="Retícula y rejilla">
        <ColorRow label="Rejilla" value={theme.grid} onChange={(grid) => patch({ grid })} />
        <ColorRow label="Eje de precios" value={theme.axis} onChange={(axis) => patch({ axis })} />
        <ColorRow
          label="Crosshair"
          value={theme.crosshairColor}
          onChange={(crosshairColor) => patch({ crosshairColor })}
        />
        <div className="flex flex-wrap gap-1">
          {(["solid", "dashed", "hidden"] as CrosshairStyle[]).map((style) => (
            <Chip key={style} active={theme.crosshair === style} onClick={() => patch({ crosshair: style })}>
              {style === "solid" ? "Sólida" : style === "dashed" ? "Punteada" : "Oculta"}
            </Chip>
          ))}
        </div>
        <Toggle
          label="Rejilla horizontal"
          checked={theme.gridHorizontal}
          onChange={(gridHorizontal) => patch({ gridHorizontal })}
        />
        <Toggle
          label="Rejilla vertical"
          checked={theme.gridVertical}
          onChange={(gridVertical) => patch({ gridVertical })}
        />
      </Section>

      <Section title="Textos y elementos externos">
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Tipografías y contenedores fuera del canvas. Se aplican al instante en barras, paneles y textos.
        </p>
        <ColorRow label="Color de las letras" value={theme.uiText} onChange={(uiText) => patch({ uiText, axis: uiText })} />
        <ColorRow label="Textos secundarios" value={theme.uiMuted} onChange={(uiMuted) => patch({ uiMuted })} />
        <ColorRow label="Acento / activo" value={theme.uiAccent} onChange={(uiAccent) => patch({ uiAccent })} />
        <ColorRow label="Barra superior" value={theme.chromeTop} onChange={(chromeTop) => patch({ chromeTop })} />
        <ColorRow label="Paneles y barra lateral" value={theme.chromePanel} onChange={(chromePanel) => patch({ chromePanel })} />
        <ColorRow label="Bordes" value={theme.chromeBorder} onChange={(chromeBorder) => patch({ chromeBorder })} />
        <ColorRow label="Menús desplegables" value={theme.chromeMenu} onChange={(chromeMenu) => patch({ chromeMenu })} />
      </Section>

      <Section title="Bid / Ask y marcas">
        <Toggle label="Líneas Bid / Ask" checked={theme.bidAsk} onChange={(bidAsk) => patch({ bidAsk })} />
        <ColorRow label="Bid" value={theme.bidColor} onChange={(bidColor) => patch({ bidColor })} />
        <ColorRow label="Ask" value={theme.askColor} onChange={(askColor) => patch({ askColor })} />
        <Toggle
          label="Marca de agua ticker"
          checked={theme.watermarkTicker}
          onChange={(watermarkTicker) => patch({ watermarkTicker })}
        />
        <Toggle
          label="Marca de agua % cambio"
          checked={theme.watermarkChange}
          onChange={(watermarkChange) => patch({ watermarkChange })}
        />
      </Section>

      <button
        type="button"
        onClick={() => {
          const next =
            theme.scheme === "light"
              ? { ...DEFAULT_CHART_THEME, ...LIGHT_CHROME, ...LIGHT_CANVAS, scheme: "light" as const }
              : DEFAULT_CHART_THEME;
          onTheme(next);
          saveChartTheme(next);
        }}
        className="font-mono text-[10px] text-zinc-500 hover:text-white"
      >
        Restaurar tema
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border border-[#1F1F2E] bg-[#050508] py-1.5">
      <SectionLabel>{title}</SectionLabel>
      <div className="px-2 pb-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
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
  min = 1,
  max = 4,
  step = 0.05,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
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
        value={hexColor(value)}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-10 cursor-pointer rounded border border-[#1F1F2E] bg-transparent"
      />
    </label>
  );
}

function WatchPane({
  active,
  ticker,
  onTicker,
}: {
  active: WatchlistId;
  ticker: string;
  onTicker: (ticker: string) => void;
}) {
  const list = WATCHLISTS.find((item) => item.id === active) ?? WATCHLISTS[0];
  return (
    <div className="flex flex-wrap gap-1">
      {list.tickers.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onTicker(symbol)}
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${
            ticker === symbol ? "border-[#00FF66]/50 text-[#00FF66]" : "border-[#1F1F2E] text-zinc-400 hover:text-white"
          }`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
