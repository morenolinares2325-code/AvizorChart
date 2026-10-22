import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="avizor-section">
      <span className="avizor-section-mark" aria-hidden />
      <span className="avizor-section-text">{children}</span>
    </p>
  );
}

export const TOOL_BTN =
  "inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[11px] tracking-tight transition hover:bg-white/[0.04]";

export const MENU_PANEL =
  "rounded-lg border border-[#1F1F2E] bg-[#0A0A0F] py-1 shadow-[0_18px_48px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.04)]";
