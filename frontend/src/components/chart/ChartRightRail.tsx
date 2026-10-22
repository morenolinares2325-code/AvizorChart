"use client";

import { Bell, Landmark, Layers, MessageSquare, Palette, Settings, Star, ScrollText, Tv } from "lucide-react";
import type { RightUtilId } from "@/components/chart/chartTypes";
import { RIGHT_UTIL_TOOLS } from "@/components/chart/chartTypes";

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
}

export function ChartRightRail({ active, onActive }: ChartRightRailProps) {
  return (
    <aside data-chrome="rail" className="flex w-11 shrink-0 flex-col items-center gap-0.5 border-l border-[#1F1F2E] bg-[#050508] py-2">
      {RIGHT_UTIL_TOOLS.map((tool) => {
        const Icon = ICONS[tool.id];
        const on = active === tool.id;
        return (
          <button
            key={tool.id}
            type="button"
            title={tool.label}
            onClick={() => onActive(tool.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              on
                ? "bg-[#00FF66]/10 text-[#00FF66] shadow-[inset_0_0_0_1px_rgba(0,255,102,0.32)]"
                : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"
            }`}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
          </button>
        );
      })}
    </aside>
  );
}
