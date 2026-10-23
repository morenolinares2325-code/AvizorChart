"use client";

const SYMBOLS = [
  "NVDA",
  "AAPL",
  "MSFT",
  "TSLA",
  "AMD",
  "META",
  "AVGO",
  "AMZN",
  "GOOGL",
  "NFLX",
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "XAUUSD",
  "XAGUSD",
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "AAOI",
  "ASML",
  "TSM",
];

function columnSymbols(seed: number): string[] {
  return Array.from({ length: 16 }, (_, index) => SYMBOLS[(index * 3 + seed * 5) % SYMBOLS.length]);
}

export function TickerCascadeBackdrop() {
  const columns = Array.from({ length: 12 }, (_, index) => {
    const symbols = columnSymbols(index);
    return [...symbols, ...symbols];
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <img
        src="/fondo-avizor.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.22]"
      />
      <div className="absolute inset-0 bg-[#050508]/72" />
      <div className="absolute inset-0 flex justify-between px-1">
        {columns.map((symbols, column) => (
          <div
            key={column}
            className="avizor-cascade-col flex w-[8.3%] flex-col items-center"
            style={{
              animationDuration: `${22 + (column % 5) * 4}s`,
              animationDelay: `${-column * 2.1}s`,
              opacity: column % 3 === 0 ? 0.55 : 0.32,
            }}
          >
            {symbols.map((symbol, index) => (
              <span
                key={`${symbol}-${index}`}
                className="py-2.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-[#00FF66]"
              >
                {symbol}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/50 via-transparent to-[#050508]/80" />
    </div>
  );
}
