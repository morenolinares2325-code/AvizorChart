import type { DrawToolId } from "@/components/chart/chartDrawTools";

export function DrawToolGlyph({ id, active }: { id: DrawToolId; active?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#00FF66]" : "text-zinc-400"}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {glyph(id)}
    </svg>
  );
}

function glyph(id: DrawToolId) {
  switch (id) {
    case "cursor":
      return <path d="M4.5 3.5 L4.5 16 L8 12.5 L11 17.5 L13 16.5 L10 11.5 L15.5 11.5 Z" fill="currentColor" stroke="none" />;
    case "trendline":
      return <path d="M3.5 15.5 L16.5 4.5" />;
    case "ray":
      return (
        <>
          <path d="M3.5 15.5 L14 6" />
          <path d="M12.2 5.2 L16.5 4.5 L14.6 8.4" />
        </>
      );
    case "extension":
      return <path d="M2.5 14 L17.5 6" strokeDasharray="2.4 1.8" />;
    case "trend_arrow":
      return (
        <>
          <path d="M3.5 14 L15 6.5" />
          <path d="M11.8 6.2 L15.4 6.1 L13.8 9.4" />
        </>
      );
    case "horizontal":
      return <path d="M2.5 10 H17.5" />;
    case "vertical":
      return <path d="M10 2.5 V17.5" />;
    case "parallel_channel":
    case "regression_channel":
    case "stdev_channel":
    case "fib_channel":
      return (
        <>
          <path d="M3 14 L17 7" />
          <path d="M3 17 L17 10" />
        </>
      );
    case "trend_angle":
      return (
        <>
          <path d="M4 16 H16" />
          <path d="M4 16 L15 6" />
        </>
      );
    case "fib_retracement":
    case "fib_extension":
    case "fib_expansion":
      return (
        <>
          <path d="M3.5 5 H16.5" />
          <path d="M3.5 9 H16.5" opacity="0.7" />
          <path d="M3.5 12.5 H16.5" opacity="0.55" />
          <path d="M3.5 16 H16.5" />
        </>
      );
    case "fib_fan":
    case "gann_fan":
    case "gann_fan_down":
      return (
        <>
          <path d="M4 16 L16 4" />
          <path d="M4 16 L16 10" />
          <path d="M4 16 L16 16" />
        </>
      );
    case "fib_timezone":
      return (
        <>
          <path d="M5 3.5 V16.5" />
          <path d="M9 3.5 V16.5" />
          <path d="M14 3.5 V16.5" />
        </>
      );
    case "fib_circle":
    case "oval":
      return <ellipse cx="10" cy="10" rx="6.5" ry="4.6" />;
    case "fib_spiral":
      return <path d="M10 10 C10 7 13 7 13 10 C13 14 6 14 6 10 C6 5 15 4.5 15 10" />;
    case "fib_arcs":
      return (
        <>
          <path d="M4 16 A8 8 0 0 1 16 16" />
          <path d="M6 16 A6 6 0 0 1 14 16" />
        </>
      );
    case "gann_square":
    case "gann_box":
    case "gann_grid":
    case "rectangle":
    case "notes_table":
      return <rect x="4" y="5" width="12" height="10" rx="1.2" />;
    case "triangle":
    case "cyclic_triangle":
      return <path d="M10 4.5 L16.5 15.5 H3.5 Z" />;
    case "diamond":
      return <path d="M10 3.8 L16.2 10 L10 16.2 L3.8 10 Z" />;
    case "brush":
    case "path":
      return <path d="M4 14 C7 8, 9 13, 12 7 C14 12, 16 9, 16.5 6" />;
    case "bezier":
      return <path d="M3.5 15 C7 4, 13 16, 16.5 6" />;
    case "highlighter":
      return <path d="M4 13 H16" strokeWidth="4" opacity="0.45" />;
    case "elliott_impulse":
      return <path d="M3.5 14 L6 8 L8.5 12 L12 4.5 L14.5 9 L16.5 6" />;
    case "elliott_abc":
      return <path d="M4 14 L8 6 L12 12 L16 5" />;
    case "xabcd":
      return <path d="M4 15 L7 6 L11 12 L14 5 L16.5 11" />;
    case "head_shoulders":
      return <path d="M3.5 14 L6 9 L8 12 L10 5 L12 12 L14 9 L16.5 14" />;
    case "text_note":
    case "price_comment":
      return (
        <>
          <path d="M5 5 H15 V13 H9 L5 16.5 V5 Z" />
          <path d="M8 8 H12 M8 10.5 H11" />
        </>
      );
    case "arrow_label":
      return (
        <>
          <rect x="3.5" y="6" width="9" height="8" rx="1.2" />
          <path d="M12.5 10 H17 M14.8 7.8 L17.2 10 L14.8 12.2" />
        </>
      );
    case "signal_icon":
      return <path d="M10 4 L16 15 H4 Z" fill="currentColor" stroke="none" />;
    case "pitchfork":
    case "schiff_pitchfork":
      return (
        <>
          <path d="M4 15 L10 5 L16 15" />
          <path d="M10 5 V16.5" />
        </>
      );
    case "linear_regression":
      return (
        <>
          <path d="M4 14 L16 6" />
          <circle cx="6" cy="12.5" r="1" fill="currentColor" stroke="none" />
          <circle cx="10" cy="10" r="1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="7.5" r="1" fill="currentColor" stroke="none" />
        </>
      );
    case "rising_wedge":
      return <path d="M4 15 L16 8 M4 12 L16 7" />;
    case "falling_wedge":
      return <path d="M4 6 L16 12 M4 8 L16 16" />;
    case "flag":
      return (
        <>
          <path d="M5 16 L8 8" />
          <path d="M8 8 L16 6 L15 11 L8 11 Z" />
        </>
      );
    case "cup_handle":
      return <path d="M3.5 8 C5 15, 15 15, 16 8 C16.5 11, 18 11, 17 8" />;
    case "double_top":
      return <path d="M3 14 L6 6 L10 12 L14 6 L17 14" />;
    case "rounding_bottom":
      return <path d="M3.5 8 C5 16, 15 16, 16.5 8" />;
    case "long_position":
    case "short_position":
    case "position_forecast":
      return (
        <>
          <rect x="5" y="4" width="10" height="5.5" rx="0.8" opacity="0.85" />
          <rect x="5" y="10.5" width="10" height="5.5" rx="0.8" opacity="0.4" />
        </>
      );
    case "bar_pattern":
    case "ghost_feed":
      return (
        <>
          <path d="M6 5 V15 M10 7 V14 M14 4 V16" />
          <rect x="5" y="8" width="2" height="4" fill="currentColor" stroke="none" />
          <rect x="9" y="9" width="2" height="3" fill="currentColor" stroke="none" />
          <rect x="13" y="7" width="2" height="5" fill="currentColor" stroke="none" />
        </>
      );
    case "sector":
      return <path d="M10 10 L16 7 A7 7 0 0 1 15 15 Z" />;
    case "anchored_vwap":
      return <path d="M3.5 13 C7 13, 8 7, 12 7 C15 7, 16 11, 16.5 11" />;
    case "volume_profile_fixed":
    case "volume_profile_anchored":
      return (
        <>
          <path d="M4 5 H12 M4 8 H15 M4 11 H10 M4 14 H13" strokeWidth="2.2" />
        </>
      );
    case "price_range":
      return (
        <>
          <path d="M6 5 V15" />
          <path d="M4.5 5 H7.5 M4.5 15 H7.5" />
        </>
      );
    case "date_range":
      return (
        <>
          <path d="M5 6 H15" />
          <path d="M5 4.5 V7.5 M15 4.5 V7.5" />
        </>
      );
    case "date_price_range":
      return <rect x="5" y="5" width="10" height="10" rx="1" strokeDasharray="2 1.5" />;
    default:
      return <path d="M4 14 L16 6" />;
  }
}
