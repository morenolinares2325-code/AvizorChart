export type PortfolioKind = "acciones" | "multiactivos";

export interface UserPortfolio {
  id: string;
  name: string;
  kind: PortfolioKind;
  tickers: string[];
}

const KEY = "avizor.private.portfolios.v1";

export const DEFAULT_PORTFOLIOS: UserPortfolio[] = [
  { id: "core", name: "Cartera Core", kind: "acciones", tickers: ["NVDA", "AAPL", "MSFT", "TSLA"] },
  { id: "watch", name: "Vigilancia", kind: "acciones", tickers: ["NVDA", "AMD", "AVGO", "META"] },
  { id: "index", name: "Índices", kind: "multiactivos", tickers: ["SPY", "QQQ"] },
  { id: "crypto", name: "Cripto", kind: "multiactivos", tickers: ["BTC-USD"] },
];

export function loadUserPortfolios(): UserPortfolio[] {
  if (typeof window === "undefined") {
    return DEFAULT_PORTFOLIOS;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return DEFAULT_PORTFOLIOS;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_PORTFOLIOS;
    }
    return parsed
      .map((item) => normalizePortfolio(item))
      .filter((item): item is UserPortfolio => item != null);
  } catch {
    return DEFAULT_PORTFOLIOS;
  }
}

export function saveUserPortfolios(portfolios: UserPortfolio[]): void {
  window.localStorage.setItem(KEY, JSON.stringify(portfolios));
}

export function newPortfolio(kind: PortfolioKind = "acciones"): UserPortfolio {
  return {
    id: `p-${Date.now()}`,
    name: kind === "acciones" ? "Nueva cartera de acciones" : "Nueva cartera multiactivos",
    kind,
    tickers: [],
  };
}

function normalizePortfolio(value: unknown): UserPortfolio | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const item = value as Partial<UserPortfolio>;
  if (typeof item.id !== "string" || typeof item.name !== "string") {
    return null;
  }
  const tickers = Array.isArray(item.tickers)
    ? item.tickers.filter((ticker): ticker is string => typeof ticker === "string" && ticker.trim().length > 0)
    : [];
  return {
    id: item.id,
    name: item.name,
    kind: item.kind === "multiactivos" ? "multiactivos" : "acciones",
    tickers: Array.from(new Set(tickers.map((ticker) => ticker.trim().toUpperCase()))),
  };
}
