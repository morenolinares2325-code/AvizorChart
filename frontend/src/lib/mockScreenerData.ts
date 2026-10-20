export type ScreenerTabId = "direct" | "stocks" | "multi" | "portfolio";

export type AssetClass = "equity" | "forex" | "crypto" | "index" | "metal" | "energy";

export type CapBand = "mega" | "large" | "mid" | "small";

export type SqueezeState = "ready" | "expanding" | "none";

export type EmaCross = "9/21" | "50/200" | "none";

export type MarketRegime = "risk-on" | "risk-off" | "neutral";

export type Timeframe = "1H" | "4H" | "1D" | "1W";

export type SupertrendState = "flip" | "bull" | "near-flip" | "bear";

export type SupertrendPreset = "10/3" | "14/2" | "7/3";

export type VolumePressure = "buy" | "sell" | "balanced";

export type ChartPattern =
  | "triangle-sym"
  | "triangle-asc"
  | "triangle-desc"
  | "channel"
  | "channel-up"
  | "channel-down"
  | "channel-range"
  | "wedge-up"
  | "wedge-down"
  | "wedge-exhaust"
  | "bull-flag"
  | "bear-flag"
  | "pennant"
  | "double-bottom"
  | "double-top"
  | "hns"
  | "hns-inv"
  | "wyckoff-spring"
  | "wyckoff-utad"
  | "cup-handle"
  | "none";

export type SignalTiming = "pre-break" | "exact-break" | "pullback" | "idle";

export type FilterVariant = "equity" | "multi" | "portfolio";

export type SectorName =
  | "Tecnología"
  | "Consumo"
  | "Salud"
  | "Financiero"
  | "Industrial"
  | "Energía";

export interface SessionFlags {
  ny: boolean;
  london: boolean;
  asia: boolean;
}

export interface UniverseAsset {
  ticker: string;
  name: string;
  assetClass: AssetClass;
  last: number;
  changePct: number;
  volume: number;
  rvol: number;
  score: number;
  squeeze: SqueezeState;
  emaCross: EmaCross;
  vertexDistancePct: number;
  capBand?: CapBand;
  sector?: SectorName;
  session?: SessionFlags;
  spreadBps?: number;
  regime: MarketRegime;
  volatilityPct: number;
  adrPct: number;
  atrPct: number;
  keyLevelDistancePct: number;
  supertrend: SupertrendState;
  supertrendPreset: SupertrendPreset;
  ema19Near: boolean;
  rsi: number;
  macdHist: number;
  volumePressure: VolumePressure;
  epsAccelerating: boolean;
  daysToEarnings: number;
  pattern: ChartPattern;
  timing: SignalTiming;
  setupRR: number;
  hoursToHighImpactNews: number | null;
  compatibleRiskPct: number;
  maxDrawdownOk: number;
  btcCorrelation: number;
  pe: number;
  forwardPe: number;
  peg: number;
  epsGrowthYoy: number;
  salesGrowthYoy: number;
  debtEquity: number;
  fcfPositive: boolean;
  operatingMargin: number;
  stochK: number;
  williamsR: number;
  cci: number;
  adx: number;
  vwapDistancePct: number;
  obvAccumulating: boolean;
  barsSinceMaCross: number;
  maProximityPct: number;
  setupTimeframe: Timeframe;
}

export interface ScreenerTabMeta {
  id: ScreenerTabId;
  label: string;
}

export const SCREENER_TABS: readonly ScreenerTabMeta[] = [
  { id: "direct", label: "Búsqueda Directa" },
  { id: "stocks", label: "Ojeador de Acciones (USA)" },
  { id: "multi", label: "Ojeador Multiactivo (Forex / Cripto / Metales)" },
  { id: "portfolio", label: "Constructor de Carteras" },
] as const;

export const SECTORS: readonly SectorName[] = [
  "Tecnología",
  "Consumo",
  "Salud",
  "Financiero",
  "Industrial",
  "Energía",
] as const;

const RAW_UNIVERSE: Omit<
  UniverseAsset,
  | "adrPct"
  | "atrPct"
  | "keyLevelDistancePct"
  | "supertrend"
  | "supertrendPreset"
  | "ema19Near"
  | "rsi"
  | "macdHist"
  | "volumePressure"
  | "epsAccelerating"
  | "daysToEarnings"
  | "pattern"
  | "timing"
  | "setupRR"
  | "hoursToHighImpactNews"
  | "compatibleRiskPct"
  | "maxDrawdownOk"
  | "btcCorrelation"
  | "pe"
  | "forwardPe"
  | "peg"
  | "epsGrowthYoy"
  | "salesGrowthYoy"
  | "debtEquity"
  | "fcfPositive"
  | "operatingMargin"
  | "stochK"
  | "williamsR"
  | "cci"
  | "adx"
  | "vwapDistancePct"
  | "obvAccumulating"
  | "barsSinceMaCross"
  | "maProximityPct"
  | "setupTimeframe"
>[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corp.",
    assetClass: "equity",
    last: 131.28,
    changePct: 2.14,
    volume: 412_500_000,
    rvol: 1.82,
    score: 91,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.8,
    capBand: "mega",
    sector: "Tecnología",
    regime: "risk-on",
    volatilityPct: 38,
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    assetClass: "equity",
    last: 228.62,
    changePct: 0.41,
    volume: 52_300_000,
    rvol: 0.94,
    score: 74,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.4,
    capBand: "mega",
    sector: "Tecnología",
    regime: "neutral",
    volatilityPct: 22,
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    assetClass: "equity",
    last: 418.77,
    changePct: -0.36,
    volume: 21_800_000,
    rvol: 1.12,
    score: 81,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 1.1,
    capBand: "mega",
    sector: "Tecnología",
    regime: "risk-on",
    volatilityPct: 20,
  },
  {
    ticker: "AMZN",
    name: "Amazon.com Inc.",
    assetClass: "equity",
    last: 187.45,
    changePct: 1.05,
    volume: 38_900_000,
    rvol: 1.33,
    score: 79,
    squeeze: "expanding",
    emaCross: "none",
    vertexDistancePct: 1.4,
    capBand: "mega",
    sector: "Consumo",
    regime: "risk-on",
    volatilityPct: 28,
  },
  {
    ticker: "GOOGL",
    name: "Alphabet Inc.",
    assetClass: "equity",
    last: 166.08,
    changePct: 0.72,
    volume: 24_100_000,
    rvol: 1.08,
    score: 77,
    squeeze: "none",
    emaCross: "9/21",
    vertexDistancePct: 1.9,
    capBand: "mega",
    sector: "Tecnología",
    regime: "neutral",
    volatilityPct: 24,
  },
  {
    ticker: "META",
    name: "Meta Platforms",
    assetClass: "equity",
    last: 572.31,
    changePct: -1.22,
    volume: 18_400_000,
    rvol: 1.47,
    score: 68,
    squeeze: "ready",
    emaCross: "50/200",
    vertexDistancePct: 0.9,
    capBand: "mega",
    sector: "Tecnología",
    regime: "risk-off",
    volatilityPct: 32,
  },
  {
    ticker: "TSLA",
    name: "Tesla Inc.",
    assetClass: "equity",
    last: 248.98,
    changePct: 3.41,
    volume: 96_200_000,
    rvol: 2.11,
    score: 64,
    squeeze: "expanding",
    emaCross: "none",
    vertexDistancePct: 2.8,
    capBand: "large",
    sector: "Consumo",
    regime: "risk-on",
    volatilityPct: 52,
  },
  {
    ticker: "JPM",
    name: "JPMorgan Chase",
    assetClass: "equity",
    last: 223.14,
    changePct: 0.18,
    volume: 9_700_000,
    rvol: 0.88,
    score: 71,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 3.1,
    capBand: "mega",
    sector: "Financiero",
    regime: "neutral",
    volatilityPct: 18,
  },
  {
    ticker: "GS",
    name: "Goldman Sachs",
    assetClass: "equity",
    last: 512.6,
    changePct: -0.54,
    volume: 2_400_000,
    rvol: 1.21,
    score: 69,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 1.3,
    capBand: "large",
    sector: "Financiero",
    regime: "neutral",
    volatilityPct: 26,
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil",
    assetClass: "equity",
    last: 119.42,
    changePct: 0.96,
    volume: 14_600_000,
    rvol: 1.29,
    score: 73,
    squeeze: "ready",
    emaCross: "none",
    vertexDistancePct: 1.2,
    capBand: "mega",
    sector: "Energía",
    regime: "risk-off",
    volatilityPct: 21,
  },
  {
    ticker: "CVX",
    name: "Chevron Corp.",
    assetClass: "equity",
    last: 148.77,
    changePct: 0.63,
    volume: 7_800_000,
    rvol: 1.05,
    score: 66,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.2,
    capBand: "large",
    sector: "Energía",
    regime: "risk-off",
    volatilityPct: 19,
  },
  {
    ticker: "UNH",
    name: "UnitedHealth",
    assetClass: "equity",
    last: 562.4,
    changePct: -0.81,
    volume: 3_200_000,
    rvol: 1.16,
    score: 70,
    squeeze: "none",
    emaCross: "9/21",
    vertexDistancePct: 1.6,
    capBand: "mega",
    sector: "Salud",
    regime: "neutral",
    volatilityPct: 17,
  },
  {
    ticker: "LLY",
    name: "Eli Lilly",
    assetClass: "equity",
    last: 884.15,
    changePct: 1.48,
    volume: 4_100_000,
    rvol: 1.58,
    score: 86,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.7,
    capBand: "mega",
    sector: "Salud",
    regime: "risk-on",
    volatilityPct: 29,
  },
  {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    assetClass: "equity",
    last: 163.22,
    changePct: 0.12,
    volume: 6_500_000,
    rvol: 0.79,
    score: 61,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 3.6,
    capBand: "mega",
    sector: "Salud",
    regime: "neutral",
    volatilityPct: 14,
  },
  {
    ticker: "CAT",
    name: "Caterpillar Inc.",
    assetClass: "equity",
    last: 392.08,
    changePct: 0.88,
    volume: 2_900_000,
    rvol: 1.37,
    score: 78,
    squeeze: "ready",
    emaCross: "50/200",
    vertexDistancePct: 1.0,
    capBand: "large",
    sector: "Industrial",
    regime: "risk-on",
    volatilityPct: 25,
  },
  {
    ticker: "GE",
    name: "GE Aerospace",
    assetClass: "equity",
    last: 189.54,
    changePct: 1.27,
    volume: 5_600_000,
    rvol: 1.44,
    score: 82,
    squeeze: "expanding",
    emaCross: "9/21",
    vertexDistancePct: 1.5,
    capBand: "large",
    sector: "Industrial",
    regime: "risk-on",
    volatilityPct: 27,
  },
  {
    ticker: "WMT",
    name: "Walmart Inc.",
    assetClass: "equity",
    last: 81.36,
    changePct: 0.22,
    volume: 16_200_000,
    rvol: 0.91,
    score: 67,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.7,
    capBand: "mega",
    sector: "Consumo",
    regime: "neutral",
    volatilityPct: 16,
  },
  {
    ticker: "SOFI",
    name: "SoFi Technologies",
    assetClass: "equity",
    last: 12.84,
    changePct: 4.12,
    volume: 58_400_000,
    rvol: 2.34,
    score: 58,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.6,
    capBand: "mid",
    sector: "Financiero",
    regime: "risk-on",
    volatilityPct: 48,
  },
  {
    ticker: "SMCI",
    name: "Super Micro Computer",
    assetClass: "equity",
    last: 46.71,
    changePct: -2.08,
    volume: 41_000_000,
    rvol: 1.91,
    score: 55,
    squeeze: "expanding",
    emaCross: "none",
    vertexDistancePct: 1.8,
    capBand: "mid",
    sector: "Tecnología",
    regime: "risk-off",
    volatilityPct: 61,
  },
  {
    ticker: "EURUSD",
    name: "Euro / Dólar",
    assetClass: "forex",
    last: 1.0842,
    changePct: 0.09,
    volume: 0,
    rvol: 1.04,
    score: 72,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.9,
    session: { ny: true, london: true, asia: false },
    spreadBps: 0.8,
    regime: "neutral",
    volatilityPct: 8,
  },
  {
    ticker: "GBPUSD",
    name: "Libra / Dólar",
    assetClass: "forex",
    last: 1.3048,
    changePct: -0.14,
    volume: 0,
    rvol: 1.19,
    score: 65,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 1.7,
    session: { ny: true, london: true, asia: false },
    spreadBps: 1.1,
    regime: "risk-off",
    volatilityPct: 9,
  },
  {
    ticker: "USDJPY",
    name: "Dólar / Yen",
    assetClass: "forex",
    last: 149.72,
    changePct: -0.22,
    volume: 0,
    rvol: 1.27,
    score: 80,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.5,
    session: { ny: true, london: false, asia: true },
    spreadBps: 0.9,
    regime: "risk-off",
    volatilityPct: 11,
  },
  {
    ticker: "AUDUSD",
    name: "Dólar australiano / Dólar",
    assetClass: "forex",
    last: 0.6621,
    changePct: 0.31,
    volume: 0,
    rvol: 1.08,
    score: 63,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 2.1,
    session: { ny: false, london: true, asia: true },
    spreadBps: 1.4,
    regime: "risk-on",
    volatilityPct: 10,
  },
  {
    ticker: "USDCAD",
    name: "Dólar / Dólar canadiense",
    assetClass: "forex",
    last: 1.3684,
    changePct: 0.06,
    volume: 0,
    rvol: 0.87,
    score: 59,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.9,
    session: { ny: true, london: true, asia: false },
    spreadBps: 1.2,
    regime: "neutral",
    volatilityPct: 7,
  },
  {
    ticker: "USDCHF",
    name: "Dólar / Franco suizo",
    assetClass: "forex",
    last: 0.8615,
    changePct: -0.08,
    volume: 0,
    rvol: 0.92,
    score: 61,
    squeeze: "ready",
    emaCross: "none",
    vertexDistancePct: 1.4,
    session: { ny: true, london: true, asia: false },
    spreadBps: 1.3,
    regime: "risk-off",
    volatilityPct: 8,
  },
  {
    ticker: "NZDUSD",
    name: "Dólar neozelandés / Dólar",
    assetClass: "forex",
    last: 0.6018,
    changePct: 0.44,
    volume: 0,
    rvol: 1.15,
    score: 57,
    squeeze: "expanding",
    emaCross: "9/21",
    vertexDistancePct: 1.2,
    session: { ny: false, london: true, asia: true },
    spreadBps: 1.8,
    regime: "risk-on",
    volatilityPct: 12,
  },
  {
    ticker: "EURGBP",
    name: "Euro / Libra",
    assetClass: "forex",
    last: 0.8312,
    changePct: 0.11,
    volume: 0,
    rvol: 0.99,
    score: 60,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 2.0,
    session: { ny: false, london: true, asia: false },
    spreadBps: 1.6,
    regime: "neutral",
    volatilityPct: 6,
  },
  {
    ticker: "BTC",
    name: "Bitcoin",
    assetClass: "crypto",
    last: 67410,
    changePct: 1.14,
    volume: 28_400_000_000,
    rvol: 1.41,
    score: 84,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 1.1,
    session: { ny: true, london: true, asia: true },
    spreadBps: 4.2,
    regime: "risk-on",
    volatilityPct: 48,
  },
  {
    ticker: "ETH",
    name: "Ethereum",
    assetClass: "crypto",
    last: 2648.3,
    changePct: 0.88,
    volume: 14_200_000_000,
    rvol: 1.26,
    score: 76,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 1.8,
    session: { ny: true, london: true, asia: true },
    spreadBps: 5.1,
    regime: "risk-on",
    volatilityPct: 54,
  },
  {
    ticker: "SOL",
    name: "Solana",
    assetClass: "crypto",
    last: 168.42,
    changePct: 2.67,
    volume: 3_900_000_000,
    rvol: 1.88,
    score: 71,
    squeeze: "expanding",
    emaCross: "9/21",
    vertexDistancePct: 0.8,
    session: { ny: true, london: true, asia: true },
    spreadBps: 7.4,
    regime: "risk-on",
    volatilityPct: 72,
  },
  {
    ticker: "XRP",
    name: "Ripple",
    assetClass: "crypto",
    last: 0.542,
    changePct: -0.73,
    volume: 1_600_000_000,
    rvol: 1.09,
    score: 54,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 3.2,
    session: { ny: true, london: true, asia: true },
    spreadBps: 8.8,
    regime: "neutral",
    volatilityPct: 58,
  },
  {
    ticker: "ADA",
    name: "Cardano",
    assetClass: "crypto",
    last: 0.361,
    changePct: 0.52,
    volume: 420_000_000,
    rvol: 0.96,
    score: 49,
    squeeze: "ready",
    emaCross: "50/200",
    vertexDistancePct: 2.4,
    session: { ny: true, london: true, asia: true },
    spreadBps: 9.5,
    regime: "neutral",
    volatilityPct: 64,
  },
  {
    ticker: "AVAX",
    name: "Avalanche",
    assetClass: "crypto",
    last: 28.14,
    changePct: 1.91,
    volume: 510_000_000,
    rvol: 1.52,
    score: 62,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 1.3,
    session: { ny: true, london: true, asia: true },
    spreadBps: 10.2,
    regime: "risk-on",
    volatilityPct: 69,
  },
  {
    ticker: "SPX",
    name: "S&P 500",
    assetClass: "index",
    last: 5738.16,
    changePct: 0.28,
    volume: 0,
    rvol: 1.02,
    score: 75,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.0,
    session: { ny: true, london: false, asia: false },
    spreadBps: 0.4,
    regime: "risk-on",
    volatilityPct: 14,
  },
  {
    ticker: "NDX",
    name: "Nasdaq 100",
    assetClass: "index",
    last: 20091.44,
    changePct: -0.17,
    volume: 0,
    rvol: 1.11,
    score: 73,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 1.2,
    session: { ny: true, london: false, asia: false },
    spreadBps: 0.5,
    regime: "risk-on",
    volatilityPct: 18,
  },
  {
    ticker: "DJI",
    name: "Dow Jones",
    assetClass: "index",
    last: 42184.31,
    changePct: 0.42,
    volume: 0,
    rvol: 0.95,
    score: 69,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 2.6,
    session: { ny: true, london: false, asia: false },
    spreadBps: 0.6,
    regime: "neutral",
    volatilityPct: 13,
  },
  {
    ticker: "DAX",
    name: "DAX 40",
    assetClass: "index",
    last: 19402.1,
    changePct: 0.19,
    volume: 0,
    rvol: 0.89,
    score: 64,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 1.9,
    session: { ny: false, london: true, asia: false },
    spreadBps: 0.9,
    regime: "neutral",
    volatilityPct: 16,
  },
  {
    ticker: "NKY",
    name: "Nikkei 225",
    assetClass: "index",
    last: 38921.0,
    changePct: -0.51,
    volume: 0,
    rvol: 1.07,
    score: 58,
    squeeze: "expanding",
    emaCross: "9/21",
    vertexDistancePct: 1.4,
    session: { ny: false, london: false, asia: true },
    spreadBps: 1.1,
    regime: "risk-off",
    volatilityPct: 17,
  },
  {
    ticker: "STOXX",
    name: "EuroStoxx 50",
    assetClass: "index",
    last: 4988.4,
    changePct: 0.23,
    volume: 0,
    rvol: 0.93,
    score: 62,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 2.3,
    session: { ny: false, london: true, asia: false },
    spreadBps: 0.8,
    regime: "neutral",
    volatilityPct: 15,
  },
  {
    ticker: "GC",
    name: "Oro (Gold)",
    assetClass: "metal",
    last: 2674.8,
    changePct: 0.64,
    volume: 0,
    rvol: 1.22,
    score: 83,
    squeeze: "ready",
    emaCross: "9/21",
    vertexDistancePct: 0.6,
    session: { ny: true, london: true, asia: true },
    spreadBps: 2.1,
    regime: "risk-off",
    volatilityPct: 16,
  },
  {
    ticker: "SI",
    name: "Plata (Silver)",
    assetClass: "metal",
    last: 31.48,
    changePct: 1.08,
    volume: 0,
    rvol: 1.35,
    score: 77,
    squeeze: "ready",
    emaCross: "50/200",
    vertexDistancePct: 1.0,
    session: { ny: true, london: true, asia: true },
    spreadBps: 3.4,
    regime: "risk-off",
    volatilityPct: 24,
  },
  {
    ticker: "CL",
    name: "Petróleo WTI",
    assetClass: "energy",
    last: 71.32,
    changePct: -0.38,
    volume: 0,
    rvol: 1.17,
    score: 68,
    squeeze: "none",
    emaCross: "none",
    vertexDistancePct: 1.9,
    session: { ny: true, london: true, asia: false },
    spreadBps: 2.8,
    regime: "neutral",
    volatilityPct: 28,
  },
  {
    ticker: "BZ",
    name: "Petróleo Brent",
    assetClass: "energy",
    last: 74.91,
    changePct: -0.21,
    volume: 0,
    rvol: 1.09,
    score: 66,
    squeeze: "none",
    emaCross: "50/200",
    vertexDistancePct: 2.1,
    session: { ny: true, london: true, asia: false },
    spreadBps: 3.0,
    regime: "neutral",
    volatilityPct: 26,
  },
  {
    ticker: "NG",
    name: "Gas Natural",
    assetClass: "energy",
    last: 2.84,
    changePct: 2.22,
    volume: 0,
    rvol: 1.73,
    score: 52,
    squeeze: "expanding",
    emaCross: "9/21",
    vertexDistancePct: 1.5,
    session: { ny: true, london: false, asia: false },
    spreadBps: 6.5,
    regime: "risk-on",
    volatilityPct: 44,
  },
];

type AnalyticsPatch = Pick<
  UniverseAsset,
  | "adrPct"
  | "atrPct"
  | "keyLevelDistancePct"
  | "supertrend"
  | "supertrendPreset"
  | "ema19Near"
  | "rsi"
  | "macdHist"
  | "volumePressure"
  | "epsAccelerating"
  | "daysToEarnings"
  | "pattern"
  | "timing"
  | "setupRR"
  | "hoursToHighImpactNews"
  | "compatibleRiskPct"
  | "maxDrawdownOk"
  | "btcCorrelation"
  | "pe"
  | "forwardPe"
  | "peg"
  | "epsGrowthYoy"
  | "salesGrowthYoy"
  | "debtEquity"
  | "fcfPositive"
  | "operatingMargin"
  | "stochK"
  | "williamsR"
  | "cci"
  | "adx"
  | "vwapDistancePct"
  | "obvAccumulating"
  | "barsSinceMaCross"
  | "maProximityPct"
  | "setupTimeframe"
>;

const ANALYTICS_DEFAULTS: AnalyticsPatch = {
  adrPct: 2.1,
  atrPct: 1.6,
  keyLevelDistancePct: 2.4,
  supertrend: "bull",
  supertrendPreset: "10/3",
  ema19Near: false,
  rsi: 52,
  macdHist: 0.1,
  volumePressure: "balanced",
  epsAccelerating: false,
  daysToEarnings: 42,
  pattern: "none",
  timing: "idle",
  setupRR: 1.8,
  hoursToHighImpactNews: 72,
  compatibleRiskPct: 1.5,
  maxDrawdownOk: 6,
  btcCorrelation: 0.12,
  pe: 24,
  forwardPe: 21,
  peg: 1.4,
  epsGrowthYoy: 11,
  salesGrowthYoy: 9,
  debtEquity: 0.55,
  fcfPositive: true,
  operatingMargin: 16,
  stochK: 52,
  williamsR: -45,
  cci: 28,
  adx: 21,
  vwapDistancePct: 0.9,
  obvAccumulating: false,
  barsSinceMaCross: 8,
  maProximityPct: 1.4,
  setupTimeframe: "1H",
};

const ANALYTICS: Record<string, Partial<AnalyticsPatch>> = {
  NVDA: {
    adrPct: 4.8,
    atrPct: 3.2,
    keyLevelDistancePct: 0.5,
    supertrend: "flip",
    supertrendPreset: "10/3",
    ema19Near: true,
    rsi: 61,
    macdHist: 1.4,
    volumePressure: "buy",
    epsAccelerating: true,
    daysToEarnings: 19,
    pattern: "triangle-asc",
    timing: "pre-break",
    pe: 48,
    forwardPe: 32,
    peg: 0.9,
    epsGrowthYoy: 38,
    salesGrowthYoy: 42,
    operatingMargin: 54,
    adx: 34,
    obvAccumulating: true,
    vwapDistancePct: 0.4,
    barsSinceMaCross: 2,
    setupTimeframe: "1H",
    setupRR: 3.2,
    hoursToHighImpactNews: 48,
    compatibleRiskPct: 1,
    maxDrawdownOk: 4,
    btcCorrelation: 0.41,
  },
  AAPL: {
    adrPct: 1.9,
    atrPct: 1.4,
    keyLevelDistancePct: 1.8,
    supertrend: "bull",
    supertrendPreset: "14/2",
    ema19Near: true,
    rsi: 54,
    macdHist: 0.3,
    volumePressure: "balanced",
    epsAccelerating: true,
    daysToEarnings: 11,
    pattern: "cup-handle",
    timing: "pullback",
    setupTimeframe: "1D",
    setupRR: 2.1,
    compatibleRiskPct: 0.5,
    maxDrawdownOk: 3,
  },
  MSFT: {
    adrPct: 2.2,
    atrPct: 1.7,
    keyLevelDistancePct: 0.9,
    supertrend: "near-flip",
    ema19Near: true,
    rsi: 57,
    macdHist: 0.8,
    volumePressure: "buy",
    epsAccelerating: true,
    daysToEarnings: 22,
    pattern: "wedge-up",
    timing: "pre-break",
    setupRR: 2.8,
    compatibleRiskPct: 1,
    maxDrawdownOk: 4,
  },
  AMZN: {
    adrPct: 3.1,
    atrPct: 2.4,
    keyLevelDistancePct: 0.4,
    supertrend: "bull",
    rsi: 63,
    macdHist: 1.1,
    volumePressure: "buy",
    epsAccelerating: true,
    daysToEarnings: 8,
    pattern: "triangle-sym",
    timing: "exact-break",
    setupRR: 2.4,
    compatibleRiskPct: 1.5,
  },
  GOOGL: {
    adrPct: 2.6,
    atrPct: 1.9,
    keyLevelDistancePct: 1.2,
    supertrend: "bull",
    ema19Near: true,
    rsi: 55,
    macdHist: 0.4,
    epsAccelerating: true,
    daysToEarnings: 16,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.2,
  },
  META: {
    adrPct: 3.4,
    atrPct: 2.6,
    keyLevelDistancePct: 0.7,
    supertrend: "near-flip",
    rsi: 46,
    macdHist: -0.4,
    volumePressure: "sell",
    daysToEarnings: 5,
    pattern: "hns",
    timing: "pre-break",
    setupRR: 2.6,
    hoursToHighImpactNews: 18,
    compatibleRiskPct: 1.5,
  },
  TSLA: {
    adrPct: 6.2,
    atrPct: 4.8,
    keyLevelDistancePct: 2.1,
    supertrend: "flip",
    supertrendPreset: "7/3",
    rsi: 68,
    macdHist: 2.1,
    volumePressure: "buy",
    daysToEarnings: 27,
    pattern: "bull-flag",
    timing: "exact-break",
    setupTimeframe: "4H",
    setupRR: 1.9,
    compatibleRiskPct: 2,
    maxDrawdownOk: 8,
  },
  JPM: {
    adrPct: 1.6,
    atrPct: 1.2,
    keyLevelDistancePct: 2.8,
    supertrend: "bull",
    rsi: 51,
    macdHist: 0.1,
    daysToEarnings: 33,
    pattern: "wyckoff-spring",
    timing: "pullback",
    setupRR: 2.0,
    compatibleRiskPct: 0.5,
    maxDrawdownOk: 3,
  },
  GS: {
    adrPct: 2.4,
    atrPct: 1.8,
    keyLevelDistancePct: 1.1,
    supertrend: "near-flip",
    rsi: 48,
    macdHist: -0.2,
    daysToEarnings: 14,
    pattern: "triangle-sym",
    timing: "pre-break",
    setupRR: 2.5,
    compatibleRiskPct: 1,
  },
  XOM: {
    adrPct: 2.0,
    atrPct: 1.5,
    keyLevelDistancePct: 0.8,
    supertrend: "bull",
    rsi: 58,
    macdHist: 0.6,
    daysToEarnings: 21,
    pattern: "wedge-up",
    timing: "pre-break",
    setupRR: 2.3,
    maxDrawdownOk: 5,
  },
  CVX: {
    adrPct: 1.8,
    atrPct: 1.3,
    supertrend: "bear",
    rsi: 44,
    macdHist: -0.3,
    daysToEarnings: 25,
    pattern: "channel",
    timing: "idle",
    setupRR: 1.7,
  },
  UNH: {
    adrPct: 1.7,
    atrPct: 1.3,
    keyLevelDistancePct: 1.4,
    supertrend: "bull",
    rsi: 49,
    daysToEarnings: 9,
    pattern: "double-bottom",
    timing: "pullback",
    setupRR: 2.2,
    compatibleRiskPct: 0.5,
  },
  LLY: {
    adrPct: 3.6,
    atrPct: 2.7,
    keyLevelDistancePct: 0.4,
    supertrend: "flip",
    ema19Near: true,
    rsi: 64,
    macdHist: 1.6,
    volumePressure: "buy",
    epsAccelerating: true,
    daysToEarnings: 28,
    pattern: "triangle-asc",
    timing: "pre-break",
    setupRR: 3.4,
    compatibleRiskPct: 1,
  },
  JNJ: {
    adrPct: 1.2,
    atrPct: 0.9,
    supertrend: "bull",
    rsi: 47,
    daysToEarnings: 51,
    pattern: "none",
    timing: "idle",
    setupRR: 1.6,
    compatibleRiskPct: 0.5,
    maxDrawdownOk: 2,
  },
  CAT: {
    adrPct: 2.5,
    atrPct: 1.9,
    keyLevelDistancePct: 0.6,
    supertrend: "near-flip",
    rsi: 59,
    macdHist: 0.7,
    epsAccelerating: true,
    daysToEarnings: 17,
    pattern: "channel",
    timing: "pre-break",
    setupRR: 2.7,
  },
  GE: {
    adrPct: 2.8,
    atrPct: 2.1,
    keyLevelDistancePct: 0.5,
    supertrend: "flip",
    rsi: 60,
    macdHist: 0.9,
    volumePressure: "buy",
    epsAccelerating: true,
    daysToEarnings: 12,
    pattern: "pennant",
    timing: "exact-break",
    setupRR: 2.9,
  },
  WMT: {
    adrPct: 1.4,
    atrPct: 1.0,
    supertrend: "bull",
    rsi: 53,
    daysToEarnings: 38,
    pattern: "double-top",
    timing: "idle",
    setupRR: 1.9,
    compatibleRiskPct: 0.5,
  },
  SOFI: {
    adrPct: 5.4,
    atrPct: 4.1,
    keyLevelDistancePct: 0.3,
    supertrend: "flip",
    supertrendPreset: "7/3",
    rsi: 66,
    macdHist: 0.5,
    volumePressure: "buy",
    daysToEarnings: 6,
    pattern: "triangle-asc",
    timing: "pre-break",
    setupRR: 3.0,
    compatibleRiskPct: 2,
    maxDrawdownOk: 9,
    hoursToHighImpactNews: 10,
  },
  SMCI: {
    adrPct: 7.1,
    atrPct: 5.6,
    keyLevelDistancePct: 1.6,
    supertrend: "bear",
    rsi: 38,
    macdHist: -1.2,
    volumePressure: "sell",
    daysToEarnings: 3,
    pattern: "wedge-down",
    timing: "exact-break",
    setupRR: 1.5,
    compatibleRiskPct: 2,
    maxDrawdownOk: 10,
    hoursToHighImpactNews: 8,
  },
  EURUSD: {
    adrPct: 0.7,
    atrPct: 0.5,
    keyLevelDistancePct: 0.6,
    supertrend: "near-flip",
    rsi: 51,
    macdHist: 0.2,
    pattern: "triangle-sym",
    timing: "pre-break",
    setupRR: 2.4,
    hoursToHighImpactNews: 6,
    compatibleRiskPct: 0.5,
    maxDrawdownOk: 3,
    btcCorrelation: 0.08,
  },
  GBPUSD: {
    adrPct: 0.8,
    atrPct: 0.6,
    supertrend: "bear",
    rsi: 44,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.0,
    btcCorrelation: 0.05,
  },
  USDJPY: {
    adrPct: 0.9,
    atrPct: 0.7,
    keyLevelDistancePct: 0.3,
    supertrend: "flip",
    rsi: 58,
    macdHist: 0.4,
    pattern: "wedge-down",
    timing: "pre-break",
    setupRR: 3.1,
    hoursToHighImpactNews: 30,
    compatibleRiskPct: 1,
    btcCorrelation: -0.12,
  },
  AUDUSD: {
    adrPct: 0.9,
    atrPct: 0.7,
    supertrend: "bull",
    rsi: 56,
    pattern: "channel",
    timing: "idle",
    setupRR: 1.8,
    btcCorrelation: 0.22,
  },
  USDCAD: {
    adrPct: 0.6,
    atrPct: 0.4,
    supertrend: "bull",
    rsi: 50,
    pattern: "none",
    timing: "idle",
    setupRR: 1.6,
  },
  USDCHF: {
    adrPct: 0.6,
    atrPct: 0.5,
    supertrend: "near-flip",
    rsi: 47,
    pattern: "triangle-desc",
    timing: "pre-break",
    setupRR: 2.3,
    btcCorrelation: -0.08,
  },
  NZDUSD: {
    adrPct: 1.0,
    atrPct: 0.8,
    supertrend: "flip",
    rsi: 59,
    pattern: "wedge-up",
    timing: "exact-break",
    setupRR: 2.1,
    btcCorrelation: 0.18,
  },
  EURGBP: {
    adrPct: 0.5,
    atrPct: 0.3,
    supertrend: "bull",
    rsi: 49,
    pattern: "channel",
    timing: "idle",
    setupRR: 1.7,
  },
  BTC: {
    adrPct: 4.2,
    atrPct: 3.3,
    keyLevelDistancePct: 0.7,
    supertrend: "flip",
    rsi: 62,
    macdHist: 180,
    volumePressure: "buy",
    pattern: "triangle-asc",
    timing: "pre-break",
    setupRR: 2.9,
    compatibleRiskPct: 1.5,
    maxDrawdownOk: 8,
    btcCorrelation: 1,
    daysToEarnings: 365,
  },
  ETH: {
    adrPct: 5.1,
    atrPct: 4.0,
    keyLevelDistancePct: 1.6,
    supertrend: "bull",
    rsi: 57,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.2,
    btcCorrelation: 0.86,
    daysToEarnings: 365,
  },
  SOL: {
    adrPct: 7.4,
    atrPct: 5.8,
    keyLevelDistancePct: 0.4,
    supertrend: "flip",
    rsi: 67,
    volumePressure: "buy",
    pattern: "bear-flag",
    timing: "exact-break",
    setupRR: 2.5,
    compatibleRiskPct: 2,
    btcCorrelation: 0.74,
    daysToEarnings: 365,
  },
  XRP: {
    adrPct: 5.8,
    atrPct: 4.4,
    supertrend: "bear",
    rsi: 43,
    pattern: "double-top",
    timing: "idle",
    setupRR: 1.6,
    btcCorrelation: 0.61,
    daysToEarnings: 365,
  },
  ADA: {
    adrPct: 6.0,
    atrPct: 4.6,
    supertrend: "near-flip",
    rsi: 48,
    pattern: "triangle-sym",
    timing: "pre-break",
    setupRR: 2.0,
    btcCorrelation: 0.58,
    daysToEarnings: 365,
  },
  AVAX: {
    adrPct: 6.8,
    atrPct: 5.2,
    supertrend: "bull",
    rsi: 60,
    pattern: "channel",
    timing: "pre-break",
    setupRR: 2.4,
    btcCorrelation: 0.66,
    daysToEarnings: 365,
  },
  SPX: {
    adrPct: 1.1,
    atrPct: 0.8,
    supertrend: "bull",
    rsi: 56,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.0,
    btcCorrelation: 0.28,
    daysToEarnings: 365,
  },
  NDX: {
    adrPct: 1.4,
    atrPct: 1.1,
    keyLevelDistancePct: 0.9,
    supertrend: "near-flip",
    rsi: 53,
    pattern: "triangle-asc",
    timing: "pre-break",
    setupRR: 2.6,
    btcCorrelation: 0.35,
    daysToEarnings: 365,
  },
  DJI: {
    adrPct: 1.0,
    atrPct: 0.7,
    supertrend: "bull",
    rsi: 54,
    pattern: "none",
    timing: "idle",
    setupRR: 1.8,
    daysToEarnings: 365,
  },
  DAX: {
    adrPct: 1.3,
    atrPct: 1.0,
    supertrend: "bull",
    rsi: 52,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.1,
    daysToEarnings: 365,
  },
  NKY: {
    adrPct: 1.5,
    atrPct: 1.2,
    supertrend: "flip",
    rsi: 45,
    pattern: "wedge-down",
    timing: "exact-break",
    setupRR: 2.0,
    daysToEarnings: 365,
  },
  STOXX: {
    adrPct: 1.2,
    atrPct: 0.9,
    supertrend: "bull",
    rsi: 51,
    pattern: "none",
    timing: "idle",
    setupRR: 1.7,
    daysToEarnings: 365,
  },
  GC: {
    adrPct: 1.6,
    atrPct: 1.2,
    keyLevelDistancePct: 0.4,
    supertrend: "flip",
    rsi: 63,
    macdHist: 4.2,
    volumePressure: "buy",
    pattern: "triangle-asc",
    timing: "pre-break",
    setupRR: 3.0,
    compatibleRiskPct: 1,
    btcCorrelation: 0.18,
    daysToEarnings: 365,
  },
  SI: {
    adrPct: 2.4,
    atrPct: 1.8,
    keyLevelDistancePct: 0.7,
    supertrend: "near-flip",
    rsi: 60,
    pattern: "wedge-up",
    timing: "pre-break",
    setupRR: 2.7,
    btcCorrelation: 0.21,
    daysToEarnings: 365,
  },
  CL: {
    adrPct: 2.8,
    atrPct: 2.2,
    supertrend: "bear",
    rsi: 46,
    pattern: "channel",
    timing: "pullback",
    setupRR: 2.0,
    btcCorrelation: 0.11,
    daysToEarnings: 365,
  },
  BZ: {
    adrPct: 2.6,
    atrPct: 2.0,
    supertrend: "bear",
    rsi: 47,
    pattern: "channel",
    timing: "idle",
    setupRR: 1.9,
    daysToEarnings: 365,
  },
  NG: {
    adrPct: 5.9,
    atrPct: 4.7,
    supertrend: "flip",
    rsi: 69,
    volumePressure: "buy",
    pattern: "triangle-desc",
    timing: "exact-break",
    setupRR: 1.8,
    compatibleRiskPct: 2,
    maxDrawdownOk: 9,
    hoursToHighImpactNews: 12,
    daysToEarnings: 365,
  },
};

export const MOCK_UNIVERSE: UniverseAsset[] = RAW_UNIVERSE.map((row) => ({
  ...ANALYTICS_DEFAULTS,
  ...row,
  ...ANALYTICS[row.ticker],
}));

export const EQUITY_UNIVERSE: UniverseAsset[] = MOCK_UNIVERSE.filter(
  (asset) => asset.assetClass === "equity",
);

export const MULTI_UNIVERSE: UniverseAsset[] = MOCK_UNIVERSE.filter((asset) =>
  ["forex", "crypto", "index", "metal", "energy"].includes(asset.assetClass),
);

export function searchUniverse(query: string): UniverseAsset[] {
  const needle = query.trim().toUpperCase();
  if (!needle) {
    return [];
  }
  return MOCK_UNIVERSE.filter(
    (asset) =>
      asset.ticker.toUpperCase().includes(needle) ||
      asset.name.toUpperCase().includes(needle),
  ).slice(0, 8);
}

export function findAsset(ticker: string): UniverseAsset | undefined {
  return MOCK_UNIVERSE.find((asset) => asset.ticker.toUpperCase() === ticker.toUpperCase());
}

export function squeezeLabel(state: SqueezeState): string {
  if (state === "ready") {
    return "Squeeze On";
  }
  if (state === "expanding") {
    return "Squeeze Fire";
  }
  return "Sin squeeze";
}

export function timingLabel(timing: SignalTiming): string {
  if (timing === "pre-break") {
    return "Pre-ruptura";
  }
  if (timing === "exact-break") {
    return "Ruptura exacta";
  }
  if (timing === "pullback") {
    return "Pullback";
  }
  return "Inactivo";
}

export function supertrendLabel(state: SupertrendState): string {
  if (state === "flip") {
    return "Vela de giro";
  }
  if (state === "near-flip") {
    return "Proximidad al giro";
  }
  if (state === "bull") {
    return "Régimen alcista";
  }
  return "Régimen bajista";
}

export function patternLabel(pattern: ChartPattern): string {
  const labels: Record<ChartPattern, string> = {
    "triangle-sym": "Triángulo simétrico",
    "triangle-asc": "Triángulo ascendente",
    "triangle-desc": "Triángulo descendente",
    channel: "Canal paralelo",
    "channel-up": "Canal alcista",
    "channel-down": "Canal bajista",
    "channel-range": "Rango horizontal",
    "wedge-up": "Cuña alcista de continuación",
    "wedge-down": "Cuña bajista",
    "wedge-exhaust": "Cuña de agotamiento",
    "bull-flag": "Bull Flag",
    "bear-flag": "Bear Flag",
    pennant: "Banderín (Pennant)",
    "double-bottom": "Doble suelo",
    "double-top": "Doble techo",
    hns: "Cabeza y hombros",
    "hns-inv": "HCH invertido",
    "wyckoff-spring": "Wyckoff acumulación (Spring)",
    "wyckoff-utad": "Wyckoff distribución (UTAD)",
    "cup-handle": "Taza con asa",
    none: "—",
  };
  return labels[pattern];
}

export const PATTERN_GROUPS: { group: string; items: ChartPattern[] }[] = [
  {
    group: "Triángulos",
    items: ["triangle-sym", "triangle-asc", "triangle-desc"],
  },
  {
    group: "Cuñas",
    items: ["wedge-up", "wedge-down", "wedge-exhaust"],
  },
  {
    group: "Canales",
    items: ["channel-up", "channel-down", "channel-range", "channel"],
  },
  {
    group: "Banderas",
    items: ["bull-flag", "bear-flag", "pennant"],
  },
  {
    group: "Reversión",
    items: ["double-bottom", "double-top", "hns", "hns-inv"],
  },
  {
    group: "Wyckoff / otras",
    items: ["wyckoff-spring", "wyckoff-utad", "cup-handle"],
  },
];

export type DeskAgentStatus = "IDLE" | "STANDBY";

export interface DeskAgent {
  id: number;
  code: string;
  name: string;
  focus: string;
  accent: string;
}

export const DESK_AGENTS: readonly DeskAgent[] = [
  {
    id: 1,
    code: "01",
    name: "Ojeador / Scanner",
    focus:
      "Justifica la selección del activo, la tesis de pre-ruptura/compresión y por qué superó el filtro cuantitativo.",
    accent: "border-t-emerald-400",
  },
  {
    id: 2,
    code: "02",
    name: "Analista Técnico / Gráfico",
    focus: "Geometría, niveles clave de soporte/resistencia y vela de detonación.",
    accent: "border-t-sky-400",
  },
  {
    id: 3,
    code: "03",
    name: "Analista Fundamental",
    focus: "Balances, EPS, crecimiento de ingresos y proximidad a Earnings.",
    accent: "border-t-violet-400",
  },
  {
    id: 4,
    code: "04",
    name: "Analista de Noticias & Flujos",
    focus: "Catalizadores macro, titulares de impacto y transacciones institucionales.",
    accent: "border-t-amber-400",
  },
  {
    id: 5,
    code: "05",
    name: "Analista de Sentimiento",
    focus: "Posicionamiento neto, sesgo retail vs institucional y lecturas de codicia/miedo.",
    accent: "border-t-pink-400",
  },
  {
    id: 6,
    code: "06",
    name: "Analista de Ejecución & Riesgo",
    focus: "Tipo de orden (límite/stop), dimensionamiento por riesgo de cuenta y ratio R:B.",
    accent: "border-t-cyan-400",
  },
  {
    id: 7,
    code: "07",
    name: "Analista de Seguimiento & Balance",
    focus: "Gestión de balance, trailing stop, toma parcial de beneficios y control del drawdown.",
    accent: "border-t-orange-400",
  },
  {
    id: 8,
    code: "08",
    name: "Director de Mesa",
    focus: "Dictamen consolidado, nivel de consenso operativo y aprobación de ejecución.",
    accent: "border-t-emerald-300",
  },
] as const;

export function estimatePairCorrelation(a: UniverseAsset, b: UniverseAsset): number {
  if (a.ticker === b.ticker) {
    return 1;
  }
  if (a.sector && b.sector && a.sector === b.sector) {
    return 0.74;
  }
  if (a.assetClass === b.assetClass) {
    return 0.48;
  }
  if (a.regime === b.regime) {
    return 0.32;
  }
  if (
    (a.regime === "risk-on" && b.regime === "risk-off") ||
    (a.regime === "risk-off" && b.regime === "risk-on")
  ) {
    return -0.21;
  }
  return 0.12;
}

export function estimateBasketVolatility(
  holdings: { asset: UniverseAsset; weight: number }[],
): number {
  const active = holdings.filter((item) => item.weight > 0);
  if (active.length === 0) {
    return 0;
  }
  let variance = 0;
  for (const left of active) {
    for (const right of active) {
      const corr = estimatePairCorrelation(left.asset, right.asset);
      const volL = left.asset.volatilityPct / 100;
      const volR = right.asset.volatilityPct / 100;
      variance += (left.weight / 100) * (right.weight / 100) * volL * volR * corr;
    }
  }
  return Math.sqrt(Math.max(variance, 0)) * 100;
}
