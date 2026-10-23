import {
  FIB_LEVELS,
  type DrawPoint,
  type DrawToolId,
  type UserDrawing,
} from "@/components/chart/chartDrawTools";

function dist(a: DrawPoint, b: DrawPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function circleFrom3(a: DrawPoint, b: DrawPoint, c: DrawPoint): { cx: number; cy: number; r: number } | null {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 0.0001) {
    return null;
  }
  const as = a.x * a.x + a.y * a.y;
  const bs = b.x * b.x + b.y * b.y;
  const cs = c.x * c.x + c.y * c.y;
  const cx = (as * (b.y - c.y) + bs * (c.y - a.y) + cs * (a.y - b.y)) / d;
  const cy = (as * (c.x - b.x) + bs * (a.x - c.x) + cs * (b.x - a.x)) / d;
  return { cx, cy, r: Math.hypot(a.x - cx, a.y - cy) };
}

function arcPath(start: DrawPoint, mid: DrawPoint, end: DrawPoint): string | null {
  const circle = circleFrom3(start, mid, end);
  if (!circle) {
    return null;
  }
  const { cx, cy, r } = circle;
  if (r < 1) {
    return null;
  }
  const a0 = Math.atan2(start.y - cy, start.x - cx);
  const a1 = Math.atan2(mid.y - cy, mid.x - cx);
  const a2 = Math.atan2(end.y - cy, end.x - cx);
  const wrap = (from: number, to: number) => {
    let delta = to - from;
    while (delta <= -Math.PI) {
      delta += Math.PI * 2;
    }
    while (delta > Math.PI) {
      delta -= Math.PI * 2;
    }
    return delta;
  };
  const total = wrap(a0, a1) + wrap(a1, a2);
  const large = Math.abs(total) > Math.PI ? 1 : 0;
  const sweep = total >= 0 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
}

function inscribedCircle(a: DrawPoint, b: DrawPoint): { cx: number; cy: number; r: number } {
  const r = Math.min(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / 2;
  return {
    cx: a.x + Math.sign(b.x - a.x || 1) * r,
    cy: a.y + Math.sign(b.y - a.y || 1) * r,
    r: Math.max(r, 2),
  };
}

function angleDeg(a: DrawPoint, b: DrawPoint): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

function extend(a: DrawPoint, b: DrawPoint, t: number): DrawPoint {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function offsetLine(a: DrawPoint, b: DrawPoint, p: DrawPoint): [DrawPoint, DrawPoint] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const proj = ((p.x - a.x) * nx + (p.y - a.y) * ny);
  return [
    { x: a.x + nx * proj, y: a.y + ny * proj },
    { x: b.x + nx * proj, y: b.y + ny * proj },
  ];
}

function cubic(p0: DrawPoint, p1: DrawPoint, p2: DrawPoint, p3: DrawPoint): string {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

function spiralPoints(origin: DrawPoint, end: DrawPoint): DrawPoint[] {
  const r0 = dist(origin, end) || 8;
  const turns = 2.4;
  const steps = 64;
  const start = Math.atan2(end.y - origin.y, end.x - origin.x);
  const pts: DrawPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const ang = start + t * turns * Math.PI * 2;
    const r = r0 * Math.pow(1.618, t * 2 - 1);
    pts.push({ x: origin.x + Math.cos(ang) * r, y: origin.y + Math.sin(ang) * r });
  }
  return pts;
}

export function renderDrawing(
  drawing: UserDrawing,
  bounds: { width: number; height: number } = { width: 1000, height: 1000 },
  inkFill = "#050508",
): string {
  const { tool, points: pts, color, complete } = drawing;
  const { width, height } = bounds;
  if (pts.length === 0) {
    return "";
  }
  const dash = complete ? undefined : "4 3";
  const sw = drawing.strokeWidth || 1.65;
  const parts: string[] = [];
  const ink = `stroke="${color}" stroke-width="${sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

  const line = (a: DrawPoint, b: DrawPoint, extra = "") =>
    `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" ${ink} ${dash ? `stroke-dasharray="${dash}"` : ""} ${extra} />`;

  const poly = (list: DrawPoint[], close = false) => {
    const d = list.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + (close ? " Z" : "");
    return `<path d="${d}" ${ink} ${dash ? `stroke-dasharray="${dash}"` : ""} />`;
  };

  const label = (p: DrawPoint, text: string, dy = -8) => {
    const safe = text.replace(/[<>&]/g, "");
    const width = Math.min(168, Math.max(30, safe.length * 6.4 + 12));
    return `<g>
      <rect x="${p.x + 4}" y="${p.y + dy - 11}" width="${width}" height="15" rx="3" fill="${inkFill}" fill-opacity="0.84" stroke="${color}" stroke-opacity="0.38" stroke-width="0.85"/>
      <text x="${p.x + 10}" y="${p.y + dy}" fill="${color}" font-size="11" font-weight="650" letter-spacing="0.03em" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">${safe}</text>
    </g>`;
  };

  const dots = () =>
    pts
      .map(
        (p) =>
          `<circle cx="${p.x}" cy="${p.y}" r="3.2" fill="${inkFill}" stroke="${color}" stroke-width="1.2" />`,
      )
      .join("");

  const a = pts[0];
  const b = pts[1] ?? pts[0];

  switch (tool as DrawToolId) {
    case "horizontal":
      parts.push(line({ x: 0, y: a.y }, { x: width, y: a.y }));
      break;
    case "vertical":
      parts.push(line({ x: a.x, y: 0 }, { x: a.x, y: height }));
      break;
    case "ray": {
      const far = extend(a, b, 8);
      parts.push(line(a, far, `marker-end="url(#avizor-arrow)"`));
      break;
    }
    case "extension": {
      parts.push(line(extend(b, a, 6), extend(a, b, 6)));
      break;
    }
    case "trend_arrow":
      parts.push(line(a, b, `marker-end="url(#avizor-arrow)"`));
      break;
    case "trend_angle": {
      parts.push(line(a, b));
      parts.push(label(b, `${angleDeg(a, b).toFixed(1)}°`));
      break;
    }
    case "parallel_channel":
    case "regression_channel": {
      if (pts.length >= 2) {
        parts.push(line(a, b));
      }
      if (pts.length >= 3) {
        const [c, d] = offsetLine(a, b, pts[2]);
        parts.push(line(c, d));
        parts.push(
          `<polygon points="${a.x},${a.y} ${b.x},${b.y} ${d.x},${d.y} ${c.x},${c.y}" fill="${color}" fill-opacity="0.08" stroke="none" />`,
        );
      }
      break;
    }
    case "fib_retracement":
    case "fib_extension": {
      if (pts.length < 2) {
        break;
      }
      const span = b.y - a.y;
      const factor = tool === "fib_extension" ? 1.618 : 1;
      for (const level of FIB_LEVELS) {
        const y = a.y + span * level * factor;
        parts.push(line({ x: Math.min(a.x, b.x) - 20, y }, { x: Math.max(a.x, b.x) + 80, y }));
        parts.push(label({ x: Math.max(a.x, b.x), y }, `${(level * 100).toFixed(1)}%`, 3));
      }
      parts.push(line(a, b));
      break;
    }
    case "fib_fan":
    case "gann_fan": {
      if (pts.length < 2) {
        break;
      }
      const ratios = tool === "gann_fan" ? [0.25, 0.5, 1, 2, 4] : FIB_LEVELS.filter((n) => n > 0);
      for (const ratio of ratios) {
        const end = { x: b.x, y: a.y + (b.y - a.y) * ratio };
        parts.push(line(a, extend(a, end, 2.4)));
      }
      break;
    }
    case "fib_timezone": {
      if (pts.length < 2) {
        break;
      }
      const span = b.x - a.x || 24;
      for (const level of [0, 1, 1.618, 2.618, 4.236]) {
        const x = a.x + span * level;
        parts.push(line({ x, y: 8 }, { x, y: height - 8 }));
        parts.push(label({ x, y: 18 }, `${level}`));
      }
      break;
    }
    case "fib_circle": {
      if (pts.length < 2) {
        break;
      }
      const r = dist(a, b);
      for (const level of [0.382, 0.5, 0.618, 1, 1.618]) {
        parts.push(
          `<ellipse cx="${a.x}" cy="${a.y}" rx="${r * level}" ry="${r * level * 0.72}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${0.9 - level * 0.15}" />`,
        );
      }
      break;
    }
    case "fib_spiral": {
      if (pts.length < 2) {
        break;
      }
      parts.push(poly(spiralPoints(a, b)));
      break;
    }
    case "gann_square":
    case "gann_box": {
      if (pts.length < 2) {
        break;
      }
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x);
      const h = Math.abs(b.y - a.y);
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.05" stroke="${color}" stroke-width="${sw}" />`,
      );
      const cells = tool === "gann_box" ? 4 : 3;
      for (let i = 1; i < cells; i += 1) {
        parts.push(line({ x: x + (w * i) / cells, y }, { x: x + (w * i) / cells, y: y + h }));
        parts.push(line({ x, y: y + (h * i) / cells }, { x: x + w, y: y + (h * i) / cells }));
      }
      parts.push(line(a, b));
      parts.push(line({ x: a.x, y: b.y }, { x: b.x, y: a.y }));
      break;
    }
    case "rectangle":
    case "highlighter": {
      if (pts.length < 2) {
        break;
      }
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const opacity = tool === "highlighter" ? 0.18 : 0.08;
      parts.push(
        `<rect x="${x}" y="${y}" width="${Math.abs(b.x - a.x)}" height="${Math.abs(b.y - a.y)}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "oval": {
      if (pts.length < 2) {
        break;
      }
      parts.push(
        `<ellipse cx="${(a.x + b.x) / 2}" cy="${(a.y + b.y) / 2}" rx="${Math.abs(b.x - a.x) / 2}" ry="${Math.abs(b.y - a.y) / 2}" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "circle": {
      if (pts.length < 2) {
        break;
      }
      const { cx, cy, r } = inscribedCircle(a, b);
      parts.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" fill-opacity="0.05" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "circle_center":
    case "circle_filled": {
      if (pts.length < 2) {
        break;
      }
      const r = dist(a, b);
      const fill = tool === "circle_filled" ? 0.16 : 0.05;
      parts.push(
        `<circle cx="${a.x}" cy="${a.y}" r="${r}" fill="${color}" fill-opacity="${fill}" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "concentric_circles": {
      if (pts.length < 2) {
        break;
      }
      const r = dist(a, b);
      for (const level of [0.25, 0.5, 0.75, 1]) {
        parts.push(
          `<circle cx="${a.x}" cy="${a.y}" r="${r * level}" fill="none" stroke="${color}" stroke-width="${sw}" opacity="${1.02 - level * 0.22}" />`,
        );
      }
      parts.push(line(a, b));
      break;
    }
    case "circle_ring": {
      if (pts.length < 2) {
        break;
      }
      const inner = dist(a, b);
      const outer = pts[2] ? dist(a, pts[2]) : inner * 1.45;
      const r0 = Math.min(inner, outer);
      const r1 = Math.max(inner, outer);
      parts.push(
        `<path fill-rule="evenodd" d="M ${a.x + r1} ${a.y} A ${r1} ${r1} 0 1 1 ${a.x - r1} ${a.y} A ${r1} ${r1} 0 1 1 ${a.x + r1} ${a.y} M ${a.x + r0} ${a.y} A ${r0} ${r0} 0 1 0 ${a.x - r0} ${a.y} A ${r0} ${r0} 0 1 0 ${a.x + r0} ${a.y}" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "arc": {
      if (pts.length >= 3) {
        const d = arcPath(a, b, pts[2]);
        if (d) {
          parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""} />`);
        } else {
          parts.push(poly(pts));
        }
      } else if (pts.length === 2) {
        const r = dist(a, b) / 2;
        parts.push(
          `<path d="M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}" fill="none" stroke="${color}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""} />`,
        );
      }
      break;
    }
    case "triangle":
    case "cyclic_triangle":
      if (pts.length >= 2) {
        parts.push(poly(pts, pts.length >= 3));
      }
      break;
    case "brush":
    case "path":
      if (pts.length >= 2) {
        parts.push(poly(pts));
      }
      break;
    case "bezier":
      if (pts.length >= 4) {
        parts.push(
          `<path d="${cubic(pts[0], pts[1], pts[2], pts[3])}" stroke="${color}" stroke-width="${sw}" fill="none" />`,
        );
      } else if (pts.length >= 2) {
        parts.push(poly(pts));
      }
      break;
    case "elliott_impulse":
    case "elliott_abc":
    case "xabcd":
    case "head_shoulders": {
      if (pts.length >= 2) {
        parts.push(poly(pts));
      }
      const names =
        tool === "elliott_impulse"
          ? ["0", "1", "2", "3", "4", "5"]
          : tool === "elliott_abc"
            ? ["0", "A", "B", "C"]
            : tool === "xabcd"
              ? ["X", "A", "B", "C", "D"]
              : ["LS", "N", "H", "N", "RS", "BRK", "T"];
      pts.forEach((p, i) => parts.push(label(p, names[i] ?? String(i))));
      break;
    }
    case "text_note":
    case "price_comment":
    case "arrow_label":
    case "signal_icon":
    case "notes_table": {
      const text =
        drawing.label ??
        (tool === "signal_icon" ? (a.y < height / 2 ? "▲ BUY" : "▼ SELL") : tool === "notes_table" ? "Notas" : "Nota");
      if (tool === "arrow_label" && pts.length >= 2) {
        parts.push(line(a, b, `marker-end="url(#avizor-arrow)"`));
        parts.push(
          `<rect x="${b.x + 6}" y="${b.y - 16}" width="${Math.max(48, text.length * 6.2)}" height="18" rx="3" fill="${inkFill}" stroke="${color}" />`,
        );
        parts.push(`<text x="${b.x + 12}" y="${b.y - 3}" fill="${color}" font-size="10" font-family="ui-monospace, monospace">${text}</text>`);
      } else if (tool === "notes_table") {
        parts.push(
          `<rect x="${a.x}" y="${a.y}" width="132" height="58" rx="4" fill="${inkFill}" fill-opacity="0.94" stroke="${color}" />`,
        );
        parts.push(`<text x="${a.x + 8}" y="${a.y + 16}" fill="${color}" font-size="10" font-family="ui-monospace, monospace">BITÁCORA</text>`);
        parts.push(`<text x="${a.x + 8}" y="${a.y + 32}" fill="#a1a1aa" font-size="9" font-family="ui-monospace, monospace">Zona observada</text>`);
        parts.push(`<text x="${a.x + 8}" y="${a.y + 46}" fill="#71717a" font-size="9" font-family="ui-monospace, monospace">Riesgo controlado</text>`);
      } else {
        parts.push(
          `<rect x="${a.x}" y="${a.y - 16}" width="${Math.max(56, text.length * 6.4)}" height="20" rx="3" fill="${inkFill}" stroke="${color}" />`,
        );
        parts.push(`<text x="${a.x + 8}" y="${a.y - 2}" fill="${color}" font-size="10" font-family="ui-monospace, monospace">${text}</text>`);
      }
      break;
    }
    case "pitchfork":
    case "schiff_pitchfork": {
      if (pts.length >= 2) {
        parts.push(line(a, b));
      }
      if (pts.length >= 3) {
        const mid = { x: (b.x + pts[2].x) / 2, y: (b.y + pts[2].y) / 2 };
        const origin = tool === "schiff_pitchfork" ? { x: (a.x + mid.x) / 2, y: (a.y + mid.y) / 2 } : a;
        parts.push(line(origin, extend(origin, mid, 3)));
        const [p1, p2] = offsetLine(origin, mid, b);
        const [q1, q2] = offsetLine(origin, mid, pts[2]);
        parts.push(line(extend(p2, p1, 3), extend(p1, p2, 3)));
        parts.push(line(extend(q2, q1, 3), extend(q1, q2, 3)));
      }
      break;
    }
    case "linear_regression":
    case "stdev_channel":
    case "fib_channel": {
      if (pts.length >= 2) {
        parts.push(line(a, b));
        const third = pts[2] ?? { x: b.x, y: a.y + (b.y - a.y) * 0.25 };
        const [c, d] = offsetLine(a, b, third);
        parts.push(line(c, d));
        if (tool === "stdev_channel") {
          const inv = { x: a.x - (c.x - a.x), y: a.y - (c.y - a.y) };
          const [e, f] = offsetLine(a, b, inv);
          parts.push(line(e, f));
        }
      }
      break;
    }
    case "fib_expansion": {
      if (pts.length >= 2) {
        const span = b.y - a.y;
        for (const level of [0, 1, 1.272, 1.618, 2.618]) {
          const y = a.y + span * level;
          parts.push(line({ x: Math.min(a.x, b.x), y }, { x: Math.max(a.x, b.x) + 70, y }));
          parts.push(label({ x: Math.max(a.x, b.x), y }, `${level}`));
        }
      }
      break;
    }
    case "fib_arcs":
    case "rounding_bottom": {
      if (pts.length >= 2) {
        const r = dist(a, b);
        const ratios = tool === "fib_arcs" ? [0.382, 0.5, 0.618, 1] : [1];
        for (const ratio of ratios) {
          parts.push(
            `<path d="M ${a.x - r * ratio} ${a.y} A ${r * ratio} ${r * ratio * 0.55} 0 0 1 ${a.x + r * ratio} ${a.y}" fill="none" stroke="${color}" stroke-width="${sw}" />`,
          );
        }
      }
      break;
    }
    case "gann_fan_down": {
      if (pts.length >= 2) {
        for (const ratio of [0.25, 0.5, 1, 2, 4]) {
          parts.push(line(a, { x: b.x, y: a.y + Math.abs(b.y - a.y) * ratio }));
        }
      }
      break;
    }
    case "gann_grid": {
      if (pts.length >= 2) {
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.abs(b.x - a.x);
        const h = Math.abs(b.y - a.y);
        for (let i = 0; i <= 8; i += 1) {
          parts.push(line({ x: x + (w * i) / 8, y }, { x: x + (w * i) / 8, y: y + h }));
          parts.push(line({ x, y: y + (h * i) / 8 }, { x: x + w, y: y + (h * i) / 8 }));
        }
      }
      break;
    }
    case "diamond":
    case "rising_wedge":
    case "falling_wedge":
    case "flag":
    case "cup_handle":
    case "double_top":
      if (pts.length >= 2) {
        parts.push(poly(pts, tool === "diamond" && pts.length >= 4));
      }
      break;
    case "long_position":
    case "short_position":
    case "position_forecast": {
      if (pts.length < 2) {
        break;
      }
      const box = tradeBoxLayout(drawing);
      const profit = "#00FF66";
      const loss = "#FF3366";
      const side = tool === "short_position" ? "SELL" : "BUY";
      parts.push(
        `<rect x="${box.left}" y="${box.tpTop}" width="${box.width}" height="${box.tpHeight}" fill="${profit}" fill-opacity="0.18" stroke="${profit}" stroke-width="${sw}" />`,
      );
      parts.push(
        `<rect x="${box.left}" y="${box.slTop}" width="${box.width}" height="${box.slHeight}" fill="${loss}" fill-opacity="0.18" stroke="${loss}" stroke-width="${sw}" />`,
      );
      parts.push(line({ x: box.left, y: box.entry.y }, { x: box.right, y: box.entry.y }));
      parts.push(label({ x: box.right, y: box.entry.y }, `${side} ENTRY${fmtPx(box.entry.price)}`, 4));
      parts.push(label({ x: box.right, y: box.tp.y }, `TP${fmtPx(box.tp.price)} · ${box.rrLabel}`, 4));
      parts.push(label({ x: box.right, y: box.sl.y }, `SL${fmtPx(box.sl.price)}`, 4));
      if (tool === "position_forecast") {
        parts.push(line({ x: box.right, y: box.entry.y }, { x: box.right + 40, y: box.tp.y }, `stroke-dasharray="4 3"`));
      }
      break;
    }
    case "bar_pattern":
    case "ghost_feed": {
      if (pts.length < 2) {
        break;
      }
      const ghost = tool === "ghost_feed";
      const n = 6;
      const w = (b.x - a.x) / n;
      for (let i = 0; i < n; i += 1) {
        const cx = a.x + w * (i + 0.5);
        const amp = (i % 2 === 0 ? 1 : -1) * Math.abs(b.y - a.y) * (0.35 + i * 0.08);
        const open = a.y;
        const close = a.y + amp;
        parts.push(
          `<line x1="${cx}" y1="${open - amp * 0.4}" x2="${cx}" y2="${close + amp * 0.15}" stroke="${color}" stroke-width="${sw}" ${ghost ? `stroke-dasharray="3 3" opacity="0.55"` : ""} />`,
        );
        parts.push(
          `<rect x="${cx - 4}" y="${Math.min(open, close)}" width="8" height="${Math.max(3, Math.abs(close - open))}" fill="${close < open ? "#00FF66" : "#FF3366"}" fill-opacity="${ghost ? 0.35 : 0.8}" />`,
        );
      }
      break;
    }
    case "sector": {
      if (pts.length < 2) {
        break;
      }
      const r = dist(a, b);
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const p1 = { x: a.x + Math.cos(ang - 0.45) * r, y: a.y + Math.sin(ang - 0.45) * r };
      const p2 = { x: a.x + Math.cos(ang + 0.45) * r, y: a.y + Math.sin(ang + 0.45) * r };
      parts.push(
        `<path d="M ${a.x} ${a.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y} Z" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="${sw}" />`,
      );
      break;
    }
    case "anchored_vwap": {
      if (pts.length < 2) {
        break;
      }
      const steps = 18;
      const vw: DrawPoint[] = [];
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        vw.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * (b.y - a.y) * 0.12,
        });
      }
      parts.push(poly(vw));
      parts.push(label(b, "VWAP anclado"));
      break;
    }
    case "volume_profile_fixed":
    case "volume_profile_anchored": {
      if (pts.length < 2) {
        break;
      }
      const x = Math.min(a.x, b.x);
      const y = Math.min(a.y, b.y);
      const w = Math.abs(b.x - a.x) || 60;
      const h = Math.abs(b.y - a.y) || 80;
      const rows = 12;
      const rowH = h / rows;
      const poc = 5;
      for (let i = 0; i < rows; i += 1) {
        const rel = 0.25 + Math.abs(i - poc) / rows;
        const barW = w * (1 - rel);
        const fill = i === poc ? "#FFD700" : color;
        parts.push(
          `<rect x="${x}" y="${y + i * rowH}" width="${barW}" height="${Math.max(2, rowH - 1)}" fill="${fill}" fill-opacity="0.35" />`,
        );
      }
      parts.push(
        `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="${sw}" ${tool === "volume_profile_anchored" ? `stroke-dasharray="4 3"` : ""} />`,
      );
      parts.push(label({ x: x + w, y }, tool === "volume_profile_anchored" ? "VP anclado" : "VP rango fijo"));
      break;
    }
    case "price_range":
    case "date_range":
    case "date_price_range": {
      if (pts.length < 2) {
        break;
      }
      const dx = Math.abs(b.x - a.x);
      const dy = Math.abs(b.y - a.y);
      if (tool !== "date_range") {
        parts.push(line({ x: a.x, y: a.y }, { x: a.x, y: b.y }));
        parts.push(label({ x: a.x, y: (a.y + b.y) / 2 }, `${dy.toFixed(0)} px`));
      }
      if (tool !== "price_range") {
        parts.push(line({ x: a.x, y: b.y }, { x: b.x, y: b.y }));
        parts.push(label({ x: (a.x + b.x) / 2, y: b.y }, `${dx.toFixed(0)} t`));
      }
      if (tool === "date_price_range") {
        parts.push(
          `<rect x="${Math.min(a.x, b.x)}" y="${Math.min(a.y, b.y)}" width="${dx}" height="${dy}" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="${sw}" />`,
        );
      }
      break;
    }
    default:
      if (pts.length >= 2) {
        parts.push(line(a, b));
      }
  }

  if (!complete) {
    parts.push(dots());
  }
  return parts.join("");
}

function distToSeg(p: DrawPoint, a: DrawPoint, b: DrawPoint): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = dx * dx + dy * dy;
  if (len === 0) {
    return dist(p, a);
  }
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return dist(p, { x: a.x + dx * t, y: a.y + dy * t });
}

function fmtPx(value: number | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }
  return ` ${value >= 100 ? value.toFixed(2) : value.toFixed(4)}`;
}

export function tradeBoxLayout(drawing: UserDrawing): {
  entry: DrawPoint;
  sl: DrawPoint;
  tp: DrawPoint;
  left: number;
  right: number;
  width: number;
  tpTop: number;
  tpHeight: number;
  slTop: number;
  slHeight: number;
  rrLabel: string;
} {
  const [entry, slRaw] = drawing.points;
  const long = drawing.tool !== "short_position";
  const sl = slRaw ?? entry;
  const left = Math.min(entry.x, sl.x);
  const right = Math.max(entry.x, sl.x, drawing.points[2]?.x ?? sl.x);
  const width = Math.max(36, right - left);
  const riskY = sl.y - entry.y || (long ? 28 : -28);
  const autoTp: DrawPoint = {
    x: right,
    y: entry.y - 2 * riskY,
    cat: sl.cat,
    price:
      entry.price != null && sl.price != null
        ? entry.price + 2 * (entry.price - sl.price)
        : undefined,
  };
  const tp = drawing.points[2] ? { ...drawing.points[2], x: right } : autoTp;
  const risk = entry.price != null && sl.price != null ? Math.abs(entry.price - sl.price) : Math.abs(riskY);
  const reward =
    entry.price != null && tp.price != null ? Math.abs(tp.price - entry.price) : Math.abs(tp.y - entry.y);
  const rr = risk > 1e-9 ? reward / risk : 2;
  return {
    entry,
    sl: { ...sl, x: right },
    tp,
    left,
    right,
    width,
    tpTop: Math.min(entry.y, tp.y),
    tpHeight: Math.max(4, Math.abs(tp.y - entry.y)),
    slTop: Math.min(entry.y, sl.y),
    slHeight: Math.max(4, Math.abs(sl.y - entry.y)),
    rrLabel: `R ${rr.toFixed(1)}`,
  };
}

export function tradeBoxHandles(drawing: UserDrawing): DrawPoint[] {
  const box = tradeBoxLayout(drawing);
  return [
    { ...box.entry, x: box.left, y: box.entry.y },
    { ...box.sl, x: box.right, y: box.sl.y },
    { ...box.tp, x: box.right, y: box.tp.y },
    { ...box.entry, x: box.right, y: box.entry.y },
  ];
}

export function applyTradeBoxHandle(drawing: UserDrawing, handleIndex: number, point: DrawPoint): UserDrawing {
  const box = tradeBoxLayout(drawing);
  const entry = { ...box.entry };
  const sl = { ...box.sl };
  const tp = { ...box.tp };
  if (handleIndex === 0) {
    entry.y = point.y;
    entry.price = point.price;
    entry.cat = point.cat ?? entry.cat;
    entry.x = Math.min(point.x, box.right - 24);
  } else if (handleIndex === 1) {
    sl.y = point.y;
    sl.price = point.price;
    sl.cat = point.cat ?? sl.cat;
    sl.x = Math.max(point.x, box.left + 24);
  } else if (handleIndex === 2) {
    tp.y = point.y;
    tp.price = point.price;
    tp.cat = point.cat ?? tp.cat;
    tp.x = box.right;
  } else {
    sl.x = Math.max(point.x, box.left + 24);
    sl.cat = point.cat ?? sl.cat;
    tp.x = sl.x;
    tp.cat = sl.cat;
  }
  return { ...drawing, points: [entry, sl, tp] };
}

export function completeTradeBox(entry: DrawPoint, cursor: DrawPoint, tool: DrawToolId): DrawPoint[] {
  const long = tool !== "short_position";
  const risk = cursor.price != null && entry.price != null ? cursor.price - entry.price : 0;
  const tpPrice =
    entry.price != null && cursor.price != null
      ? entry.price + (long ? 1 : -1) * 2 * Math.abs(entry.price - cursor.price)
      : undefined;
  const riskY = cursor.y - entry.y || (long ? 28 : -28);
  const tp: DrawPoint = {
    x: cursor.x,
    y: entry.y - 2 * riskY,
    cat: cursor.cat,
    price: tpPrice ?? (entry.price != null ? entry.price - 2 * (risk || 0) : undefined),
  };
  return [entry, cursor, tp];
}

export function hitTestDrawing(drawing: UserDrawing, point: DrawPoint, tol = 18): boolean {
  const pts = drawing.points;
  if (pts.length === 0) {
    return false;
  }
  if (drawing.tool === "long_position" || drawing.tool === "short_position" || drawing.tool === "position_forecast") {
    const box = tradeBoxLayout(drawing);
    return (
      point.x >= box.left - tol &&
      point.x <= box.right + tol &&
      point.y >= Math.min(box.tpTop, box.slTop) - tol &&
      point.y <= Math.max(box.tpTop + box.tpHeight, box.slTop + box.slHeight) + tol
    );
  }
  if (drawing.tool === "horizontal") {
    return Math.abs(point.y - pts[0].y) <= tol;
  }
  if (drawing.tool === "vertical") {
    return Math.abs(point.x - pts[0].x) <= tol;
  }
  if (pts.length === 1) {
    return dist(pts[0], point) <= tol + 10;
  }
  if (
    drawing.tool === "circle" ||
    drawing.tool === "circle_center" ||
    drawing.tool === "circle_filled" ||
    drawing.tool === "concentric_circles" ||
    drawing.tool === "circle_ring" ||
    drawing.tool === "oval"
  ) {
    const origin =
      drawing.tool === "circle"
        ? inscribedCircle(pts[0], pts[1])
        : drawing.tool === "oval"
          ? {
              cx: (pts[0].x + pts[1].x) / 2,
              cy: (pts[0].y + pts[1].y) / 2,
              r: Math.max(Math.abs(pts[1].x - pts[0].x), Math.abs(pts[1].y - pts[0].y)) / 2,
            }
          : { cx: pts[0].x, cy: pts[0].y, r: dist(pts[0], pts[1]) };
    const d = Math.hypot(point.x - origin.cx, point.y - origin.cy);
    if (drawing.tool === "circle_filled") {
      return d <= origin.r + tol;
    }
    if (drawing.tool === "circle_ring" && pts[2]) {
      const inner = dist(pts[0], pts[1]);
      const outer = dist(pts[0], pts[2]);
      const lo = Math.min(inner, outer);
      const hi = Math.max(inner, outer);
      return d >= lo - tol && d <= hi + tol;
    }
    if (drawing.tool === "concentric_circles") {
      return [0.25, 0.5, 0.75, 1].some((level) => Math.abs(d - origin.r * level) <= tol);
    }
    if (drawing.tool === "oval") {
      const rx = Math.abs(pts[1].x - pts[0].x) / 2 || 1;
      const ry = Math.abs(pts[1].y - pts[0].y) / 2 || 1;
      const nx = (point.x - origin.cx) / rx;
      const ny = (point.y - origin.cy) / ry;
      return Math.abs(Math.hypot(nx, ny) - 1) <= tol / Math.min(rx, ry);
    }
    return Math.abs(d - origin.r) <= tol;
  }
  const xs = pts.map((item) => item.x);
  const ys = pts.map((item) => item.y);
  const minX = Math.min(...xs) - tol;
  const maxX = Math.max(...xs) + tol;
  const minY = Math.min(...ys) - tol;
  const maxY = Math.max(...ys) + tol;
  if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
    return false;
  }
  for (let i = 1; i < pts.length; i += 1) {
    if (distToSeg(point, pts[i - 1], pts[i]) <= tol) {
      return true;
    }
  }
  return pts.some((item) => dist(item, point) <= tol);
}
