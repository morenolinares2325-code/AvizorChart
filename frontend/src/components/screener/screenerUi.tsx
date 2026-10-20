import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { SignalTiming, SqueezeState, SupertrendState } from "@/lib/mockScreenerData";
import { squeezeLabel, supertrendLabel, timingLabel } from "@/lib/mockScreenerData";

export const hudPanelClass =
  "rounded-xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md transition-all hover:border-zinc-700/80";

export const thClass =
  "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(34,197,94,0.18)] transition hover:from-emerald-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-40";

export function formatPrice(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  if (value >= 10) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value === 0) {
    return "—";
  }
  return value.toLocaleString("en-US");
}

export function ChangeCell({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`font-mono tabular-nums ${positive ? "text-bull" : "text-bear"}`}>
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export function ScoreCell({ score }: { score: number }) {
  return <ScoreBar score={score} />;
}

export function ScoreBar({ score }: { score: number }) {
  const bar =
    score > 75
      ? "from-emerald-500 to-emerald-400"
      : score >= 50
        ? "from-amber-500 to-amber-400"
        : "from-red-500/80 to-red-400/70";

  return (
    <div className="flex min-w-[7.5rem] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${bar}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono text-xs tabular-nums text-zinc-200">{score}</span>
    </div>
  );
}

export function SqueezeBadge({ state }: { state: SqueezeState }) {
  const live = state === "ready";
  const tone = live
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
    : state === "expanding"
      ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
      : "border-zinc-700 bg-zinc-800 text-zinc-400";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {live ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        </span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
      )}
      {squeezeLabel(state)}
    </span>
  );
}

export function TimingBadge({ timing }: { timing: SignalTiming }) {
  const tone =
    timing === "pre-break"
      ? "border-bull/30 bg-bull/10 text-bull"
      : timing === "exact-break"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
        : timing === "pullback"
          ? "border-zinc-600 bg-zinc-800 text-zinc-300"
          : "border-zinc-800 bg-zinc-950 text-zinc-600";
  return (
    <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {timingLabel(timing)}
    </span>
  );
}

export function SupertrendBadge({ state }: { state: SupertrendState }) {
  const tone =
    state === "flip" || state === "bull"
      ? "text-bull"
      : state === "near-flip"
        ? "text-amber-400"
        : "text-bear";
  return <span className={`text-[11px] font-medium ${tone}`}>{supertrendLabel(state)}</span>;
}

export function ActionLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded border border-zinc-700/80 px-2 py-1 text-[11px] font-semibold text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-zinc-50"
    >
      {label}
    </Link>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={`${primaryButtonClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
