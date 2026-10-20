import {
  estimateBasketVolatility,
  estimatePairCorrelation,
  type CapBand,
  type ChartPattern,
  type FilterVariant,
  type SignalTiming,
  type SupertrendState,
  type Timeframe,
  type UniverseAsset,
} from "@/lib/mockScreenerData";

export type RewardRiskOption = "1:2" | "1:3" | "1:4";
export type RiskPerTradeOption = 0.5 | 1 | 1.5 | 2;
export type CupoSize = 1 | 5 | 10 | 20;

export type TechnicalKind =
  | "supertrend"
  | "squeeze"
  | "ma-cross"
  | "rsi"
  | "macd"
  | "atr"
  | "rvol"
  | "volume-pressure"
  | "stoch"
  | "williams"
  | "cci"
  | "adx";

export type FundamentalKind =
  | "market-cap"
  | "pe"
  | "peg"
  | "growth"
  | "debt-equity"
  | "fcf"
  | "op-margin"
  | "earnings-days";

export const TECHNICAL_CATALOG: { kind: TechnicalKind; label: string }[] = [
  { kind: "supertrend", label: "Supertrend" },
  { kind: "squeeze", label: "Bollinger / Keltner Squeeze" },
  { kind: "ma-cross", label: "Cruces EMA / SMA" },
  { kind: "rsi", label: "RSI" },
  { kind: "macd", label: "MACD" },
  { kind: "atr", label: "ATR / ADR%" },
  { kind: "rvol", label: "Volumen relativo (RVOL)" },
  { kind: "volume-pressure", label: "Presión / OBV / VWAP" },
  { kind: "stoch", label: "Estocástico" },
  { kind: "williams", label: "Williams %R" },
  { kind: "cci", label: "CCI" },
  { kind: "adx", label: "ADX (fuerza > 25)" },
];

export const FUNDAMENTAL_CATALOG: { kind: FundamentalKind; label: string }[] = [
  { kind: "market-cap", label: "Capitalización bursátil" },
  { kind: "pe", label: "PER actual / Forward P/E" },
  { kind: "peg", label: "PEG Ratio" },
  { kind: "growth", label: "Crecimiento EPS / Ventas YoY" },
  { kind: "debt-equity", label: "Deuda / Capital" },
  { kind: "fcf", label: "Free Cash Flow positivo" },
  { kind: "op-margin", label: "Margen operativo" },
  { kind: "earnings-days", label: "Días hasta earnings" },
];

export interface SupertrendModule {
  id: string;
  kind: "supertrend";
  atrPeriod: number;
  multiplier: number;
  state: SupertrendState;
  nearPct: number;
}

export interface SqueezeModule {
  id: string;
  kind: "squeeze";
  length: number;
  deviation: number;
  state: "on" | "fire" | "expansion";
}

export interface MaCrossModule {
  id: string;
  kind: "ma-cross";
  type: "EMA" | "SMA";
  fast: number;
  slow: number;
  condition: "cross-bars" | "proximity";
  bars: number;
  proximityPct: number;
}

export interface RsiModule {
  id: string;
  kind: "rsi";
  period: number;
  oversold: number;
  overbought: number;
  divergence: "none" | "bull" | "bear";
}

export interface MacdModule {
  id: string;
  kind: "macd";
  fast: number;
  slow: number;
  signal: number;
  condition: "hist-pos" | "hist-neg" | "zero-cross";
}

export interface AtrModule {
  id: string;
  kind: "atr";
  period: number;
  minPct: number;
}

export interface RvolModule {
  id: string;
  kind: "rvol";
  period: number;
  factor: 1.5 | 2;
}

export interface VolumePressureModule {
  id: string;
  kind: "volume-pressure";
  vwapPct: number;
  requireAccumulation: boolean;
}

export interface StochModule {
  id: string;
  kind: "stoch";
  maxK: number;
}

export interface WilliamsModule {
  id: string;
  kind: "williams";
  maxR: number;
}

export interface CciModule {
  id: string;
  kind: "cci";
  min: number;
}

export interface AdxModule {
  id: string;
  kind: "adx";
  min: number;
}

export type TechnicalModule =
  | SupertrendModule
  | SqueezeModule
  | MaCrossModule
  | RsiModule
  | MacdModule
  | AtrModule
  | RvolModule
  | VolumePressureModule
  | StochModule
  | WilliamsModule
  | CciModule
  | AdxModule;

export interface MarketCapModule {
  id: string;
  kind: "market-cap";
  band: CapBand;
}

export interface PeModule {
  id: string;
  kind: "pe";
  minPe: number;
  maxPe: number;
  maxForwardPe: number;
}

export interface PegModule {
  id: string;
  kind: "peg";
  maxPeg: 1 | 1.5;
}

export interface GrowthModule {
  id: string;
  kind: "growth";
  minYoy: 15 | 25;
}

export interface DebtEquityModule {
  id: string;
  kind: "debt-equity";
  maxRatio: number;
}

export interface FcfModule {
  id: string;
  kind: "fcf";
}

export interface OpMarginModule {
  id: string;
  kind: "op-margin";
  minMargin: number;
}

export interface EarningsDaysModule {
  id: string;
  kind: "earnings-days";
  minDays: number;
}

export type FundamentalModule =
  | MarketCapModule
  | PeModule
  | PegModule
  | GrowthModule
  | DebtEquityModule
  | FcfModule
  | OpMarginModule
  | EarningsDaysModule;

export interface PatternModule {
  id: string;
  pattern: ChartPattern;
  timing: Exclude<SignalTiming, "idle">;
  proximityPct: number;
}

export interface ScreenerFilters {
  timeframe: Timeframe;
  minRR: RewardRiskOption;
  riskPerTradePct: RiskPerTradeOption;
  maxDrawdownPct: number;
  skipHighImpactNews: boolean;
  minPrice: string;
  maxPrice: string;
  minAtrPct: string;
  nearKeyLevel: boolean;
  technicals: TechnicalModule[];
  fundamentals: FundamentalModule[];
  patterns: PatternModule[];
  requireOpenSession: boolean;
  maxSpreadBps: string;
  minAbsBtcCorr: string;
  maxPairCorrelation: number;
  maxBasketVol: string;
  minSectors: number;
}

export const PRESET_STORAGE_KEY = "avizor.screener.filters.v2";

export const DEFAULT_SCREENER_FILTERS: ScreenerFilters = {
  timeframe: "1H",
  minRR: "1:2",
  riskPerTradePct: 2,
  maxDrawdownPct: 6,
  skipHighImpactNews: true,
  minPrice: "",
  maxPrice: "",
  minAtrPct: "",
  nearKeyLevel: false,
  technicals: [],
  fundamentals: [],
  patterns: [],
  requireOpenSession: false,
  maxSpreadBps: "",
  minAbsBtcCorr: "",
  maxPairCorrelation: 0.7,
  maxBasketVol: "35",
  minSectors: 4,
};

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTechnical(kind: TechnicalKind): TechnicalModule {
  const id = createId(kind);
  switch (kind) {
    case "supertrend":
      return { id, kind, atrPeriod: 10, multiplier: 3, state: "flip", nearPct: 1.5 };
    case "squeeze":
      return { id, kind, length: 20, deviation: 2, state: "on" };
    case "ma-cross":
      return {
        id,
        kind,
        type: "EMA",
        fast: 9,
        slow: 21,
        condition: "proximity",
        bars: 3,
        proximityPct: 1.5,
      };
    case "rsi":
      return { id, kind, period: 14, oversold: 30, overbought: 70, divergence: "none" };
    case "macd":
      return { id, kind, fast: 12, slow: 26, signal: 9, condition: "hist-pos" };
    case "atr":
      return { id, kind, period: 14, minPct: 1.5 };
    case "rvol":
      return { id, kind, period: 20, factor: 1.5 };
    case "volume-pressure":
      return { id, kind, vwapPct: 1.5, requireAccumulation: true };
    case "stoch":
      return { id, kind, maxK: 30 };
    case "williams":
      return { id, kind, maxR: -80 };
    case "cci":
      return { id, kind, min: 100 };
    default:
      return { id, kind: "adx", min: 25 };
  }
}

export function createFundamental(kind: FundamentalKind): FundamentalModule {
  const id = createId(kind);
  switch (kind) {
    case "market-cap":
      return { id, kind, band: "mega" };
    case "pe":
      return { id, kind, minPe: 0, maxPe: 40, maxForwardPe: 35 };
    case "peg":
      return { id, kind, maxPeg: 1.5 };
    case "growth":
      return { id, kind, minYoy: 15 };
    case "debt-equity":
      return { id, kind, maxRatio: 1 };
    case "fcf":
      return { id, kind };
    case "op-margin":
      return { id, kind, minMargin: 15 };
    default:
      return { id, kind: "earnings-days", minDays: 7 };
  }
}

export function createPattern(pattern: ChartPattern): PatternModule {
  return {
    id: createId("pattern"),
    pattern,
    timing: "pre-break",
    proximityPct: 1.5,
  };
}

const TIMEFRAME_RANK: Record<Timeframe, number> = {
  "1H": 1,
  "4H": 2,
  "1D": 3,
  "1W": 4,
};

function rrFloor(option: RewardRiskOption): number {
  if (option === "1:4") {
    return 4;
  }
  if (option === "1:3") {
    return 3;
  }
  return 2;
}

function parseOptionalNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function matchesTechnical(asset: UniverseAsset, module: TechnicalModule): boolean {
  switch (module.kind) {
    case "supertrend":
      if (module.state === "near-flip") {
        return asset.supertrend === "near-flip" || asset.keyLevelDistancePct < module.nearPct;
      }
      return asset.supertrend === module.state;
    case "squeeze":
      if (module.state === "on") {
        return asset.squeeze === "ready";
      }
      if (module.state === "fire") {
        return asset.squeeze === "expanding";
      }
      return asset.squeeze === "none" && asset.rvol >= 1.2;
    case "ma-cross":
      if (module.condition === "cross-bars") {
        return asset.barsSinceMaCross <= module.bars;
      }
      if (module.fast <= 21 && module.slow <= 50) {
        return asset.emaCross === "9/21" || asset.maProximityPct < module.proximityPct;
      }
      if (module.slow >= 50) {
        return asset.emaCross === "50/200" || asset.maProximityPct < module.proximityPct;
      }
      return asset.ema19Near || asset.maProximityPct < module.proximityPct;
    case "rsi":
      if (module.divergence === "bull") {
        return asset.rsi <= module.oversold + 8 && asset.volumePressure === "buy";
      }
      if (module.divergence === "bear") {
        return asset.rsi >= module.overbought - 8 && asset.volumePressure === "sell";
      }
      return asset.rsi >= module.oversold && asset.rsi <= module.overbought;
    case "macd":
      if (module.condition === "hist-pos") {
        return asset.macdHist > 0;
      }
      if (module.condition === "hist-neg") {
        return asset.macdHist < 0;
      }
      return Math.abs(asset.macdHist) < 0.35;
    case "atr":
      return asset.atrPct >= module.minPct;
    case "rvol":
      return asset.rvol >= module.factor;
    case "volume-pressure":
      if (module.requireAccumulation && !asset.obvAccumulating) {
        return false;
      }
      return asset.vwapDistancePct <= module.vwapPct;
    case "stoch":
      return asset.stochK <= module.maxK;
    case "williams":
      return asset.williamsR <= module.maxR;
    case "cci":
      return asset.cci >= module.min;
    case "adx":
      return asset.adx >= module.min;
    default:
      return true;
  }
}

function matchesFundamental(asset: UniverseAsset, module: FundamentalModule): boolean {
  switch (module.kind) {
    case "market-cap":
      return asset.capBand === module.band;
    case "pe":
      return asset.pe >= module.minPe && asset.pe <= module.maxPe && asset.forwardPe <= module.maxForwardPe;
    case "peg":
      return asset.peg <= module.maxPeg;
    case "growth":
      return asset.epsGrowthYoy >= module.minYoy || asset.salesGrowthYoy >= module.minYoy;
    case "debt-equity":
      return asset.debtEquity < module.maxRatio;
    case "fcf":
      return asset.fcfPositive;
    case "op-margin":
      return asset.operatingMargin >= module.minMargin;
    case "earnings-days":
      return asset.daysToEarnings > module.minDays;
    default:
      return true;
  }
}

function matchesPattern(asset: UniverseAsset, module: PatternModule): boolean {
  if (asset.pattern !== module.pattern) {
    return false;
  }
  if (asset.timing !== module.timing) {
    return false;
  }
  if (module.timing === "pre-break" && asset.vertexDistancePct >= module.proximityPct) {
    return false;
  }
  return true;
}

export function matchesScreenerFilters(
  asset: UniverseAsset,
  filters: ScreenerFilters,
  variant: FilterVariant,
): boolean {
  if (TIMEFRAME_RANK[asset.setupTimeframe] < TIMEFRAME_RANK[filters.timeframe]) {
    return false;
  }
  if (asset.setupRR < rrFloor(filters.minRR)) {
    return false;
  }
  if (asset.compatibleRiskPct > filters.riskPerTradePct) {
    return false;
  }
  if (asset.maxDrawdownOk > filters.maxDrawdownPct) {
    return false;
  }
  if (
    filters.skipHighImpactNews &&
    asset.hoursToHighImpactNews !== null &&
    asset.hoursToHighImpactNews < 24
  ) {
    return false;
  }

  const minPrice = parseOptionalNumber(filters.minPrice);
  const maxPrice = parseOptionalNumber(filters.maxPrice);
  const minAtr = parseOptionalNumber(filters.minAtrPct);
  if (minPrice !== null && asset.last < minPrice) {
    return false;
  }
  if (maxPrice !== null && asset.last > maxPrice) {
    return false;
  }
  if (minAtr !== null && asset.atrPct < minAtr) {
    return false;
  }
  if (filters.nearKeyLevel && asset.keyLevelDistancePct >= 1.5) {
    return false;
  }

  for (const module of filters.technicals) {
    if (!matchesTechnical(asset, module)) {
      return false;
    }
  }

  if (variant === "equity" || variant === "portfolio") {
    for (const module of filters.fundamentals) {
      if (!matchesFundamental(asset, module)) {
        return false;
      }
    }
  }

  if (variant === "multi") {
    if (filters.requireOpenSession && asset.session) {
      const open = asset.session.ny || asset.session.london || asset.session.asia;
      if (!open) {
        return false;
      }
    }
    const maxSpread = parseOptionalNumber(filters.maxSpreadBps);
    if (maxSpread !== null && (asset.spreadBps ?? 99) > maxSpread) {
      return false;
    }
    const minCorr = parseOptionalNumber(filters.minAbsBtcCorr);
    if (minCorr !== null && Math.abs(asset.btcCorrelation) < minCorr) {
      return false;
    }
  }

  if (filters.patterns.length > 0) {
    const anyPattern = filters.patterns.some((module) => matchesPattern(asset, module));
    if (!anyPattern) {
      return false;
    }
  }

  return true;
}

export function filterUniverse(
  universe: UniverseAsset[],
  filters: ScreenerFilters,
  variant: FilterVariant,
): UniverseAsset[] {
  return universe
    .filter((asset) => matchesScreenerFilters(asset, filters, variant))
    .sort((a, b) => b.score - a.score);
}

export function takeTopCandidates(rows: UniverseAsset[], cupo: CupoSize): UniverseAsset[] {
  return rows.slice(0, cupo);
}

export function pairCorrelationBreach(holdings: UniverseAsset[], maxPair: number): boolean {
  for (let i = 0; i < holdings.length; i += 1) {
    for (let j = i + 1; j < holdings.length; j += 1) {
      if (estimatePairCorrelation(holdings[i], holdings[j]) > maxPair) {
        return true;
      }
    }
  }
  return false;
}

export function basketPassesPortfolioGuards(
  holdings: { asset: UniverseAsset; weight: number }[],
  filters: ScreenerFilters,
): { volOk: boolean; corrOk: boolean; sectorsOk: boolean; vol: number } {
  const vol = estimateBasketVolatility(holdings);
  const maxVol = parseOptionalNumber(filters.maxBasketVol);
  const assets = holdings.map((item) => item.asset);
  const sectors = new Set(assets.map((asset) => asset.sector).filter(Boolean));
  return {
    vol,
    volOk: maxVol === null || vol <= maxVol,
    corrOk: !pairCorrelationBreach(assets, filters.maxPairCorrelation),
    sectorsOk: sectors.size >= filters.minSectors,
  };
}
