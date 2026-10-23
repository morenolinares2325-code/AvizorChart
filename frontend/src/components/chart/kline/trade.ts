export interface TradeGuideLevels {
  entry: number;
  sl?: number | null;
  tp?: number | null;
  side: "buy" | "sell";
}

export interface TradeChartMarker {
  date: string;
  price: number;
  kind: "entry" | "exit";
  side: "buy" | "sell";
  win?: boolean;
  label: string;
}
