export const INDICATOR_GROUPS = [
  {
    id: "trend",
    label: "Tendencia",
    items: [
      { id: "ema20", label: "EMA 20" },
      { id: "ema50", label: "EMA 50" },
      { id: "ema200", label: "EMA 200" },
      { id: "vwap", label: "VWAP" },
    ],
  },
  {
    id: "osc",
    label: "Osciladores",
    items: [
      { id: "rsi", label: "RSI 14" },
      { id: "macd", label: "MACD" },
    ],
  },
  {
    id: "vol",
    label: "Volatilidad",
    items: [
      { id: "bb", label: "Bollinger (20,2)" },
      { id: "atr", label: "ATR 14" },
    ],
  },
] as const;

export const DRAWING_TOOLS = [
  { id: "channel", label: "Canales" },
  { id: "triangle", label: "Triángulos de compresión" },
  { id: "sr", label: "Soporte / Resistencia" },
  { id: "fibonacci", label: "Fibonacci" },
] as const;

export type IndicatorId = (typeof INDICATOR_GROUPS)[number]["items"][number]["id"];
export type DrawingId = (typeof DRAWING_TOOLS)[number]["id"];

export const QUICK_TICKERS = ["NVDA", "AAPL", "SPY", "QQQ", "MSFT", "TSLA", "BTC-USD"] as const;

export const INTERVALS = [
  { id: "1m", label: "1m" },
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "30m", label: "30m" },
  { id: "1h", label: "1h" },
  { id: "4h", label: "4h" },
  { id: "12h", label: "12h" },
  { id: "1d", label: "1d" },
  { id: "1s", label: "1s" },
  { id: "1w", label: "1w" },
] as const;
