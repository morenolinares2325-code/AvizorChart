"use client";

import { useState } from "react";
import { ScreenerTabs } from "@/components/screener/ScreenerTabs";
import { DirectSearchTab } from "@/components/screener/tabs/DirectSearchTab";
import { MultiAssetTab } from "@/components/screener/tabs/MultiAssetTab";
import { PortfolioBuilderTab } from "@/components/screener/tabs/PortfolioBuilderTab";
import { StockScreenerTab } from "@/components/screener/tabs/StockScreenerTab";
import type { ScreenerTabId } from "@/lib/mockScreenerData";

export function ScreenerWorkspace() {
  const [tab, setTab] = useState<ScreenerTabId>("direct");
  const [queued, setQueued] = useState<string[]>([]);

  function dispatch(tickers: string[]) {
    setQueued(tickers);
  }

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-zinc-600/30 via-zinc-800 to-zinc-950 p-[1px] shadow-terminal">
      <div className="overflow-hidden rounded-[11px] border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <ScreenerTabs active={tab} onChange={setTab} />
        <div className="p-4 md:p-5">
        {tab === "direct" ? <DirectSearchTab onSendToDesk={(ticker) => dispatch([ticker])} /> : null}
        {tab === "stocks" ? (
          <StockScreenerTab dispatched={queued} onDispatch={dispatch} />
        ) : null}
        {tab === "multi" ? (
          <MultiAssetTab dispatched={queued} onDispatch={dispatch} />
        ) : null}
        {tab === "portfolio" ? (
          <PortfolioBuilderTab dispatched={queued} onDispatch={dispatch} />
        ) : null}
        </div>
      </div>
    </div>
  );
}
