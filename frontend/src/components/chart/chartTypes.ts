export const INDICATOR_GROUPS = [
  {
    id: "trend",
    label: "Tendencia",
    items: [
      { id: "ema9", label: "EMA 9" },
      { id: "ema20", label: "EMA 20" },
      { id: "ema50", label: "EMA 50" },
      { id: "ema100", label: "EMA 100" },
      { id: "ema200", label: "EMA 200" },
      { id: "sma20", label: "SMA 20" },
      { id: "sma50", label: "SMA 50" },
      { id: "sma200", label: "SMA 200" },
      { id: "vwap", label: "VWAP" },
      { id: "avwap", label: "Anchored VWAP" },
      { id: "supertrend", label: "Supertrend" },
      { id: "psar", label: "Parabolic SAR" },
    ],
  },
  {
    id: "osc",
    label: "Osciladores",
    items: [
      { id: "rsi", label: "RSI (14)" },
      { id: "macd", label: "MACD (12, 26, 9)" },
      { id: "stoch", label: "Estocástico %K / %D" },
      { id: "cci", label: "CCI" },
      { id: "roc", label: "Momento / ROC" },
      { id: "willr", label: "Williams %R" },
      { id: "adx", label: "ADX / +DI / −DI" },
      { id: "stoch_rsi", label: "Stochastic RSI" },
    ],
  },
  {
    id: "vol",
    label: "Volatilidad",
    items: [
      { id: "bb", label: "Bandas de Bollinger (20, 2)" },
      { id: "atr", label: "ATR 14" },
      { id: "stddev", label: "Desviación estándar" },
      { id: "keltner", label: "Keltner Channels" },
      { id: "donchian", label: "Donchian Channels" },
    ],
  },
  {
    id: "flow",
    label: "Volumen / Flujo",
    items: [
      { id: "vol_hist", label: "Volumen (histograma)" },
      { id: "obv", label: "OBV" },
      { id: "mfi", label: "MFI" },
      { id: "cmf", label: "Chaikin Money Flow" },
      { id: "ad_line", label: "Acumulación / Distribución" },
      { id: "vol_pressure", label: "Volume Pressure" },
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
  { id: "1d", label: "1d" },
  { id: "1s", label: "1s" },
] as const;

export const WATCHLISTS = [
  { id: "core", name: "Cartera Core", tickers: ["NVDA", "AAPL", "MSFT", "TSLA"] },
  { id: "index", name: "Índices", tickers: ["SPY", "QQQ"] },
  { id: "crypto", name: "Cripto", tickers: ["BTC-USD"] },
  { id: "watch", name: "Lista de vigilancia", tickers: ["NVDA", "AMD", "AVGO", "META"] },
] as const;

export type WatchlistId = (typeof WATCHLISTS)[number]["id"];

export const RANGE_PRESETS = [
  { id: "1d", label: "1D", period: "1d" },
  { id: "5d", label: "5D", period: "5d" },
  { id: "1mo", label: "1M", period: "1mo" },
  { id: "3mo", label: "3M", period: "3mo" },
  { id: "6mo", label: "6M", period: "6mo" },
  { id: "ytd", label: "YTD", period: "ytd" },
  { id: "1y", label: "1A", period: "1y" },
  { id: "5y", label: "5A", period: "5y" },
  { id: "max", label: "Histórico", period: "max" },
] as const;

export type RangePresetId = (typeof RANGE_PRESETS)[number]["id"];

export const RIGHT_UTIL_TOOLS = [
  { id: "watchlist", label: "Lista de vigilancia" },
  { id: "news", label: "Noticias/TV" },
  { id: "editor", label: "Editor de gráfico" },
  { id: "profiles", label: "Perfiles de gráfico" },
  { id: "alerts", label: "Alertas" },
  { id: "fundamentals", label: "Datos fundamentales" },
  { id: "chat", label: "Chat de analistas" },
  { id: "orders", label: "Historial de órdenes" },
  { id: "settings", label: "Configuración" },
] as const;

export type SplitMode = 1 | 2 | 4;

export type RightUtilId = (typeof RIGHT_UTIL_TOOLS)[number]["id"];
