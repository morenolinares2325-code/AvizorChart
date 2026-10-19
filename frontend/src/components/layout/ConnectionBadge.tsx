interface ConnectionBadgeProps {
  connected?: boolean;
}

export function ConnectionBadge({ connected = true }: ConnectionBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        connected
          ? "border-bull/30 bg-bull/10 text-bull"
          : "border-bear/30 bg-bear/10 text-bear"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-bull animate-pulse" : "bg-bear"}`}
        aria-hidden
      />
      {connected ? "Live" : "Reconectando"}
    </span>
  );
}
