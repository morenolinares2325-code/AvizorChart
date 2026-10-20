"use client";

import { useEffect, useMemo, useState } from "react";
import type { FilterVariant, UniverseAsset } from "@/lib/mockScreenerData";
import {
  DEFAULT_SCREENER_FILTERS,
  filterUniverse,
  type CupoSize,
  type ScreenerFilters,
} from "@/lib/screenerEngine";

const SCAN_MS = 900;

export function useScreenerScan(universe: UniverseAsset[], variant: FilterVariant) {
  const [draft, setDraft] = useState<ScreenerFilters>(DEFAULT_SCREENER_FILTERS);
  const [applied, setApplied] = useState<ScreenerFilters>(DEFAULT_SCREENER_FILTERS);
  const [scanning, setScanning] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [cupo, setCupo] = useState<CupoSize>(5);

  const ranked = useMemo(
    () => filterUniverse(universe, applied, variant),
    [universe, applied, variant],
  );

  useEffect(() => {
    const live = new Set(ranked.map((asset) => asset.ticker));
    setSelected((current) => current.filter((ticker) => live.has(ticker)));
  }, [ranked]);

  function runScan() {
    if (scanning) {
      return;
    }
    setScanning(true);
    window.setTimeout(() => {
      setApplied(draft);
      setScanning(false);
    }, SCAN_MS);
  }

  function toggle(ticker: string) {
    setSelected((current) =>
      current.includes(ticker) ? current.filter((item) => item !== ticker) : [...current, ticker],
    );
  }

  function toggleAll() {
    if (selected.length === ranked.length && ranked.length > 0) {
      setSelected([]);
      return;
    }
    setSelected(ranked.map((asset) => asset.ticker));
  }

  function markTop(size: CupoSize) {
    setCupo(size);
    setSelected(ranked.slice(0, size).map((asset) => asset.ticker));
  }

  return {
    draft,
    setDraft,
    applied,
    ranked,
    scanning,
    runScan,
    selected,
    toggle,
    toggleAll,
    cupo,
    markTop,
    setCupo,
  };
}
