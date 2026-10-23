"use client";

import { Bell, Camera, Landmark, Layers, MessageSquare, Moon, Palette, Settings, Star, ScrollText, Sun, Tv } from "lucide-react";
import type { RightUtilId } from "@/components/chart/chartTypes";
import { RIGHT_UTIL_TOOLS } from "@/components/chart/chartTypes";
import type { ChartScheme } from "@/components/chart/chartVisualTheme";

const ICONS: Record<RightUtilId, typeof Star> = {
  watchlist: Star,
  news: Tv,
  editor: Palette,
  profiles: Layers,
  alerts: Bell,
  fundamentals: Landmark,
  chat: MessageSquare,
  orders: ScrollText,
  settings: Settings,
};

interface ChartRightRailProps {
  active: RightUtilId | null;
  onActive: (id: RightUtilId) => void;
  scheme: ChartScheme;
  onScheme: (scheme: ChartScheme) => void;
  onCapture: () => void;
}

function railBtn(on: boolean): string {
  return `flex h-8 w-8 items-center justify-center rounded-md transition ${
    on
      ? "bg-[#00FF66]/10 text-[#00FF66] shadow-[inset_0_0_0_1px_rgba(0,255,102,0.32)]"
      : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
  }`;
}

export function ChartRightRail({ active, onActive, scheme, onScheme, onCapture }: ChartRightRailProps) {
  return (
    <aside data-chrome="rail" className="flex w-11 shrink-0 flex-col items-center gap-0.5 border-l border-[#1F1F2E] bg-[#050508] py-2">
      {RIGHT_UTIL_TOOLS.map((tool) => {
        const Icon = ICONS[tool.id];
        const on = active === tool.id;
        return (
          <div key={tool.id} className="flex flex-col items-center gap-0.5">
            {tool.id === "settings" ? (
              <button
                type="button"
                title="Capturar gráfico"
                aria-label="Capturar gráfico"
                onClick={onCapture}
                className={railBtn(false)}
              >
                <Camera className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </button>
            ) : null}
            <button
              type="button"
              title={tool.label}
              onClick={() => onActive(tool.id)}
              className={railBtn(on)}
            >
              <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
            </button>
            {tool.id === "editor" ? (
              <>
                <button
                  type="button"
                  title="Panel oscuro"
                  onClick={() => onScheme("dark")}
                  className={railBtn(scheme === "dark")}
                >
                  <Moon className="h-[17px] w-[17px]" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  title="Panel claro"
                  onClick={() => onScheme("light")}
                  className={railBtn(scheme === "light")}
                >
                  <Sun className="h-[17px] w-[17px]" strokeWidth={1.75} />
                </button>
              </>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}
