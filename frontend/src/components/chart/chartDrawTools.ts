export type DrawPoint = { x: number; y: number; cat?: number; price?: number };

export type DrawToolId =
  | "cursor"
  | "magnet"
  | "lock"
  | "trendline"
  | "ray"
  | "extension"
  | "trend_arrow"
  | "horizontal"
  | "vertical"
  | "parallel_channel"
  | "regression_channel"
  | "trend_angle"
  | "fib_retracement"
  | "fib_extension"
  | "fib_fan"
  | "fib_timezone"
  | "fib_circle"
  | "fib_spiral"
  | "gann_fan"
  | "gann_square"
  | "gann_box"
  | "rectangle"
  | "oval"
  | "triangle"
  | "brush"
  | "bezier"
  | "path"
  | "highlighter"
  | "elliott_impulse"
  | "elliott_abc"
  | "xabcd"
  | "cyclic_triangle"
  | "head_shoulders"
  | "text_note"
  | "price_comment"
  | "arrow_label"
  | "signal_icon"
  | "notes_table"
  | "pitchfork"
  | "schiff_pitchfork"
  | "linear_regression"
  | "stdev_channel"
  | "fib_expansion"
  | "fib_channel"
  | "fib_arcs"
  | "gann_fan_down"
  | "gann_grid"
  | "diamond"
  | "rising_wedge"
  | "falling_wedge"
  | "flag"
  | "cup_handle"
  | "double_top"
  | "rounding_bottom"
  | "long_position"
  | "short_position"
  | "position_forecast"
  | "bar_pattern"
  | "ghost_feed"
  | "sector"
  | "anchored_vwap"
  | "volume_profile_fixed"
  | "volume_profile_anchored"
  | "price_range"
  | "date_range"
  | "date_price_range";

export type DrawGroupId =
  | "cursor"
  | "trend"
  | "fib"
  | "gann"
  | "shapes"
  | "waves"
  | "text"
  | "forecast"
  | "magnet"
  | "lock";

export type DrawCapture = "none" | "drag" | "clicks" | "freehand";

export interface DrawToolDef {
  id: DrawToolId;
  label: string;
  hint: string;
  capture: DrawCapture;
  clicks?: number;
}

export interface DrawGroupDef {
  id: DrawGroupId;
  label: string;
  title: string;
  flyout: boolean;
  sections: { title: string; tools: DrawToolDef[] }[];
}

export interface UserDrawing {
  id: string;
  tool: DrawToolId;
  points: DrawPoint[];
  color: string;
  strokeWidth: number;
  label?: string;
  complete: boolean;
}

export const DRAW_PALETTE = [
  { id: "green", color: "#00FF66", label: "Verde Terminal" },
  { id: "cyan", color: "#00E5FF", label: "Azul Neón" },
  { id: "white", color: "#FFFFFF", label: "Blanco Puro" },
  { id: "gold", color: "#FFD700", label: "Amarillo Oro" },
  { id: "red", color: "#FF3366", label: "Rojo Alerta" },
] as const;

export const STROKE_PRESETS = [
  { id: "thin", width: 1, label: "Fino" },
  { id: "mid", width: 2, label: "Medio" },
  { id: "thick", width: 4, label: "Grueso" },
] as const;

export const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export const DRAW_GROUPS: DrawGroupDef[] = [
  {
    id: "cursor",
    label: "Cursor",
    title: "Cursor",
    flyout: false,
    sections: [
      {
        title: "Navegación",
        tools: [
          {
            id: "cursor",
            label: "Cursor",
            hint: "Panorámica y lectura OHLCV",
            capture: "none",
          },
        ],
      },
    ],
  },
  {
    id: "trend",
    label: "Líneas",
    title: "Líneas y tendencia",
    flyout: true,
    sections: [
      {
        title: "Líneas y tendencia",
        tools: [
          { id: "trendline", label: "Línea de tendencia", hint: "Clic y arrastra dos puntos", capture: "drag" },
          { id: "ray", label: "Rayo", hint: "Extiende en una dirección", capture: "drag" },
          { id: "extension", label: "Línea de extensión", hint: "Extiende en ambos sentidos", capture: "drag" },
          { id: "trend_arrow", label: "Flecha de tendencia", hint: "Vector con punta", capture: "drag" },
          { id: "horizontal", label: "Línea horizontal", hint: "Bloquea el eje Y", capture: "drag" },
          { id: "vertical", label: "Línea vertical", hint: "Bloquea el eje X", capture: "drag" },
          { id: "parallel_channel", label: "Canal paralelo", hint: "Tres clics: base y ancho", capture: "clicks", clicks: 3 },
          { id: "regression_channel", label: "Canal de regresión", hint: "Tres clics sobre el tramo", capture: "clicks", clicks: 3 },
          { id: "trend_angle", label: "Línea de ángulo de tendencia", hint: "Muestra el ángulo del trazo", capture: "drag" },
          { id: "pitchfork", label: "Pitchfork de Andrews", hint: "Tres pivotes", capture: "clicks", clicks: 3 },
          { id: "schiff_pitchfork", label: "Pitchfork de Schiff", hint: "Tres pivotes desplazados", capture: "clicks", clicks: 3 },
          { id: "linear_regression", label: "Regresión lineal", hint: "Tramo de ajuste", capture: "drag" },
          { id: "stdev_channel", label: "Canal de desviación", hint: "Regresión ± σ", capture: "drag" },
        ],
      },
    ],
  },
  {
    id: "fib",
    label: "Fibonacci",
    title: "Fibonacci",
    flyout: true,
    sections: [
      {
        title: "Fibonacci",
        tools: [
          { id: "fib_retracement", label: "Retrocesos de Fibonacci", hint: "Dos puntos de swing", capture: "drag" },
          { id: "fib_extension", label: "Extensión de Fib basada en tendencia", hint: "Proyección de tramo", capture: "drag" },
          { id: "fib_fan", label: "Abanico de Fibonacci", hint: "Radios desde el origen", capture: "drag" },
          { id: "fib_timezone", label: "Zonas horarias de Fib", hint: "Intervalos temporales", capture: "drag" },
          { id: "fib_circle", label: "Círculo de Fibonacci", hint: "Arcos concéntricos", capture: "drag" },
          { id: "fib_spiral", label: "Espiral de Fibonacci", hint: "Espiral áurea", capture: "drag" },
          { id: "fib_expansion", label: "Expansión de Fibonacci", hint: "Proyección 1.272–2.618", capture: "drag" },
          { id: "fib_channel", label: "Canal de Fibonacci", hint: "Tres puntos de canal", capture: "clicks", clicks: 3 },
          { id: "fib_arcs", label: "Arcos de Fibonacci", hint: "Arcos desde el origen", capture: "drag" },
        ],
      },
    ],
  },
  {
    id: "gann",
    label: "Gann",
    title: "Gann",
    flyout: true,
    sections: [
      {
        title: "Gann",
        tools: [
          { id: "gann_fan", label: "Abanico de Gann", hint: "1x1, 1x2, 2x1", capture: "drag" },
          { id: "gann_square", label: "Cuadrado de Gann", hint: "Malla angular", capture: "drag" },
          { id: "gann_box", label: "Caja de Gann", hint: "Caja de tiempo-precio", capture: "drag" },
          { id: "gann_fan_down", label: "Abanico de Gann descendente", hint: "1x1, 1x2, 2x1 bajista", capture: "drag" },
          { id: "gann_grid", label: "Rejilla de Gann", hint: "Malla 1x1 completa", capture: "drag" },
        ],
      },
    ],
  },
  {
    id: "shapes",
    label: "Figuras",
    title: "Figuras y pinceles",
    flyout: true,
    sections: [
      {
        title: "Figuras geométricas y pinceles",
        tools: [
          { id: "rectangle", label: "Rectángulo / Zona S-R", hint: "Arrastra una zona", capture: "drag" },
          { id: "oval", label: "Círculo / Óvalo", hint: "Arrastra el radio", capture: "drag" },
          { id: "triangle", label: "Triángulo", hint: "Tres clics", capture: "clicks", clicks: 3 },
          { id: "brush", label: "Rotulador / Pincel libre", hint: "Trazo libre", capture: "freehand" },
          { id: "bezier", label: "Curva de Bezier", hint: "Cuatro puntos de control", capture: "clicks", clicks: 4 },
          { id: "path", label: "Ruta de puntos (Path)", hint: "Clics · doble clic para cerrar", capture: "clicks", clicks: 12 },
          { id: "highlighter", label: "Resaltador de zonas", hint: "Banda semitransparente", capture: "drag" },
          { id: "diamond", label: "Diamante", hint: "Cuatro vértices", capture: "clicks", clicks: 4 },
          { id: "rising_wedge", label: "Cuña alcista", hint: "Cuatro pivotes", capture: "clicks", clicks: 4 },
          { id: "falling_wedge", label: "Cuña bajista", hint: "Cuatro pivotes", capture: "clicks", clicks: 4 },
          { id: "flag", label: "Bandera / pennant", hint: "Tres puntos", capture: "clicks", clicks: 3 },
          { id: "cup_handle", label: "Taza con asa", hint: "Cinco pivotes", capture: "clicks", clicks: 5 },
          { id: "double_top", label: "Doble techo / suelo", hint: "Cuatro pivotes", capture: "clicks", clicks: 4 },
          { id: "rounding_bottom", label: "Suelo redondeado", hint: "Arrastra el arco", capture: "drag" },
        ],
      },
    ],
  },
  {
    id: "waves",
    label: "Ondas",
    title: "Elliott y armónicos",
    flyout: true,
    sections: [
      {
        title: "Ondas de Elliott y patrones armónicos",
        tools: [
          { id: "elliott_impulse", label: "Impulso de Elliott (Wave 1-5)", hint: "Seis pivotes (0 a 5)", capture: "clicks", clicks: 6 },
          { id: "elliott_abc", label: "Onda correctiva (ABC)", hint: "Cuatro pivotes", capture: "clicks", clicks: 4 },
          { id: "xabcd", label: "Patrón XABCD armónico", hint: "Cinco pivotes", capture: "clicks", clicks: 5 },
          { id: "cyclic_triangle", label: "Triángulo cíclico", hint: "Cuatro vértices", capture: "clicks", clicks: 4 },
          { id: "head_shoulders", label: "Cabeza y hombros", hint: "Siete pivotes H&S", capture: "clicks", clicks: 7 },
        ],
      },
    ],
  },
  {
    id: "text",
    label: "Texto",
    title: "Anotaciones",
    flyout: true,
    sections: [
      {
        title: "Anotaciones y texto",
        tools: [
          { id: "text_note", label: "Nota de texto flotante", hint: "Un clic para anclar", capture: "clicks", clicks: 1 },
          { id: "price_comment", label: "Comentario anclado al precio", hint: "Etiqueta en el nivel", capture: "clicks", clicks: 1 },
          { id: "arrow_label", label: "Etiqueta con flecha", hint: "Origen y destino", capture: "drag" },
          { id: "signal_icon", label: "Iconos de alerta visual", hint: "Señal de compra / venta", capture: "clicks", clicks: 1 },
          { id: "notes_table", label: "Tabla de notas", hint: "Tarjeta de bitácora", capture: "clicks", clicks: 1 },
        ],
      },
    ],
  },
  {
    id: "forecast",
    label: "Proyección",
    title: "Previsión, volumen y medidores",
    flyout: true,
    sections: [
      {
        title: "previsión",
        tools: [
          {
            id: "long_position",
            label: "Posición larga",
            hint: "Riesgo / recompensa desde la entrada",
            capture: "drag",
          },
          {
            id: "short_position",
            label: "Posición corta",
            hint: "Riesgo / recompensa bajista",
            capture: "drag",
          },
          {
            id: "position_forecast",
            label: "Previsión de la posición",
            hint: "Proyección del tramo operativo",
            capture: "drag",
          },
          {
            id: "bar_pattern",
            label: "Patrón de barras",
            hint: "Secuencia de velas de referencia",
            capture: "drag",
          },
          {
            id: "ghost_feed",
            label: "Ghost feed",
            hint: "Continuación fantasma del precio",
            capture: "drag",
          },
          {
            id: "sector",
            label: "Sector",
            hint: "Sector angular de precio-tiempo",
            capture: "drag",
          },
        ],
      },
      {
        title: "en función del volumen",
        tools: [
          {
            id: "anchored_vwap",
            label: "VWAP anclado",
            hint: "Selecciona el punto inicial de cálculo",
            capture: "drag",
          },
          {
            id: "volume_profile_fixed",
            label: "Perfil de volumen de rango fijo",
            hint: "Histograma en un rango delimitado",
            capture: "drag",
          },
          {
            id: "volume_profile_anchored",
            label: "Perfil de volumen anclado",
            hint: "Perfil desde un ancla hasta el presente",
            capture: "drag",
          },
        ],
      },
      {
        title: "medidores",
        tools: [
          {
            id: "price_range",
            label: "Rango de precios",
            hint: "Mide el recorrido vertical",
            capture: "drag",
          },
          {
            id: "date_range",
            label: "Rango de fechas",
            hint: "Mide el tramo temporal",
            capture: "drag",
          },
          {
            id: "date_price_range",
            label: "Rango de fecha y precio",
            hint: "Mide tiempo y recorrido juntos",
            capture: "drag",
          },
        ],
      },
    ],
  },
  {
    id: "magnet",
    label: "Imán",
    title: "Imán",
    flyout: false,
    sections: [],
  },
  {
    id: "lock",
    label: "Bloquear",
    title: "Bloquear dibujos",
    flyout: false,
    sections: [],
  },
];

export const TOOL_COLOR: Record<string, string> = {
  trend: "#38bdf8",
  fib: "#fbbf24",
  gann: "#fb923c",
  shapes: "#c4b5fd",
  waves: "#4ade80",
  text: "#e4e4e7",
  forecast: "#00FF66",
};

export function findTool(id: DrawToolId): DrawToolDef | null {
  for (const group of DRAW_GROUPS) {
    for (const section of group.sections) {
      const found = section.tools.find((tool) => tool.id === id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export function groupForTool(id: DrawToolId): DrawGroupId {
  for (const group of DRAW_GROUPS) {
    for (const section of group.sections) {
      if (section.tools.some((tool) => tool.id === id)) {
        return group.id;
      }
    }
  }
  return "cursor";
}

export function colorForTool(id: DrawToolId): string {
  return TOOL_COLOR[groupForTool(id)] ?? "#38bdf8";
}

export function cursorForTool(id: DrawToolId, locked: boolean): string {
  if (locked && id !== "cursor") {
    return "not-allowed";
  }
  if (id === "cursor") {
    return "crosshair";
  }
  if (id === "text_note" || id === "price_comment" || id === "notes_table") {
    return "text";
  }
  if (id === "brush" || id === "highlighter") {
    return "crosshair";
  }
  return "crosshair";
}
