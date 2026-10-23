import { computeBuiltSeries, type BuiltIndicator } from "@/components/chart/chartIndicatorBuilder";
import { indicatorStyle, type IndicatorSettingsMap } from "@/components/chart/chartIndicatorSettings";
import type { IndicatorId } from "@/components/chart/chartTypes";
import {
  completeIndicatorStyles,
  logKline,
  safeRegisterIndicator,
  sanitizeIndicatorName,
  wrapIndicatorCalc,
} from "@/components/chart/kline/safeCalc";
import {
  adLineSeries,
  adxSeries,
  anchoredVwap,
  atrSeries,
  cmfSeries,
  donchian,
  keltner,
  mfiSeries,
  stdDevSeries,
  stochRsiSeries,
  supertrendSeries,
  volumePressure,
  vwapSeries,
  type OhlcBar,
} from "@/lib/chartMath";
import { IndicatorSeries, type Chart, type IndicatorTemplate, type KLineData } from "klinecharts";

type Tracked = { paneId: string; name: string };

let registered = false;
const builtNames = new Set<string>();

function ohlc(dataList: KLineData[]): { values: OhlcBar[]; volumes: number[]; closes: number[] } {
  const values: OhlcBar[] = dataList.map((item) => {
    const open = Number(item?.open);
    const close = Number(item?.close);
    const low = Number(item?.low);
    const high = Number(item?.high);
    return [
      Number.isFinite(open) ? open : 0,
      Number.isFinite(close) ? close : 0,
      Number.isFinite(low) ? low : 0,
      Number.isFinite(high) ? high : 0,
    ];
  });
  const volumes = dataList.map((item) => {
    const volume = Number(item?.volume);
    return Number.isFinite(volume) ? volume : 0;
  });
  return { values, volumes, closes: values.map((bar) => bar[1]) };
}

function lineTemplate(name: string, key: string, calc: (dataList: KLineData[]) => (number | null)[]): IndicatorTemplate {
  return {
    name,
    shortName: name.replace("AVIZOR_", ""),
    series: IndicatorSeries.Price,
    figures: [{ key, title: `${key}: `, type: "line" }],
    calc: wrapIndicatorCalc(name, [key], (dataList) => calc(dataList).map((value) => ({ [key]: value }))),
  };
}

function paneTemplate(
  name: string,
  key: string,
  calc: (dataList: KLineData[]) => (number | null)[],
  bounds?: { minValue?: number; maxValue?: number },
): IndicatorTemplate {
  return {
    name,
    shortName: name.replace("AVIZOR_", ""),
    series: IndicatorSeries.Normal,
    minValue: bounds?.minValue,
    maxValue: bounds?.maxValue,
    figures: [{ key, title: `${key}: `, type: "line" }],
    calc: wrapIndicatorCalc(name, [key], (dataList) => calc(dataList).map((value) => ({ [key]: value }))),
  };
}

export function ensureKlineIndicators(): void {
  if (registered) {
    return;
  }
  registered = true;
  const templates: IndicatorTemplate[] = [
    lineTemplate("AVIZOR_VWAP", "vwap", (list) => {
      const { values, volumes } = ohlc(list);
      return vwapSeries(values, volumes);
    }),
    lineTemplate("AVIZOR_AVWAP", "avwap", (list) => {
      const { values, volumes } = ohlc(list);
      return anchoredVwap(values, volumes);
    }),
    lineTemplate("AVIZOR_ST", "st", (list) => supertrendSeries(ohlc(list).values).line),
    paneTemplate("AVIZOR_ATR", "atr", (list) => atrSeries(ohlc(list).values)),
    paneTemplate("AVIZOR_STDDEV", "std", (list) => stdDevSeries(ohlc(list).closes)),
    paneTemplate(
      "AVIZOR_MFI",
      "mfi",
      (list) => {
        const { values, volumes } = ohlc(list);
        return mfiSeries(values, volumes);
      },
      { minValue: 0, maxValue: 100 },
    ),
    paneTemplate(
      "AVIZOR_CMF",
      "cmf",
      (list) => {
        const { values, volumes } = ohlc(list);
        return cmfSeries(values, volumes);
      },
      { minValue: -1, maxValue: 1 },
    ),
    paneTemplate("AVIZOR_AD", "ad", (list) => {
      const { values, volumes } = ohlc(list);
      return adLineSeries(values, volumes);
    }),
    paneTemplate("AVIZOR_VP", "vp", (list) => {
      const { values, volumes } = ohlc(list);
      return volumePressure(values, volumes);
    }),
    paneTemplate("AVIZOR_STOCH_RSI", "srsi", (list) => stochRsiSeries(ohlc(list).closes), { minValue: 0, maxValue: 100 }),
    {
      name: "AVIZOR_KELTNER",
      shortName: "Keltner",
      series: IndicatorSeries.Price,
      figures: [
        { key: "mid", title: "mid: ", type: "line" },
        { key: "up", title: "up: ", type: "line" },
        { key: "dn", title: "dn: ", type: "line" },
      ],
      calc: wrapIndicatorCalc("AVIZOR_KELTNER", ["mid", "up", "dn"], (dataList) => {
        const band = keltner(ohlc(dataList).values);
        return band.mid.map((mid, index) => ({ mid, up: band.upper[index], dn: band.lower[index] }));
      }),
    },
    {
      name: "AVIZOR_DONCHIAN",
      shortName: "Donchian",
      series: IndicatorSeries.Price,
      figures: [
        { key: "up", title: "up: ", type: "line" },
        { key: "dn", title: "dn: ", type: "line" },
      ],
      calc: wrapIndicatorCalc("AVIZOR_DONCHIAN", ["up", "dn"], (dataList) => {
        const band = donchian(ohlc(dataList).values);
        return band.upper.map((up, index) => ({ up, dn: band.lower[index] }));
      }),
    },
    {
      name: "AVIZOR_ADX",
      shortName: "ADX",
      series: IndicatorSeries.Normal,
      minValue: 0,
      maxValue: 100,
      figures: [
        { key: "adx", title: "ADX: ", type: "line" },
        { key: "pdi", title: "+DI: ", type: "line" },
        { key: "mdi", title: "-DI: ", type: "line" },
      ],
      calc: wrapIndicatorCalc("AVIZOR_ADX", ["adx", "pdi", "mdi"], (dataList) => {
        const series = adxSeries(ohlc(dataList).values);
        return series.adx.map((adx, index) => ({ adx, pdi: series.plus[index], mdi: series.minus[index] }));
      }),
    },
  ];
  for (const template of templates) {
    safeRegisterIndicator(template);
  }
}

function registerBuiltIndicator(item: BuiltIndicator): string {
  const name = sanitizeIndicatorName(`BUILT_${item.id}`);
  if (builtNames.has(name)) {
    return name;
  }
  const ok = safeRegisterIndicator({
    name,
    shortName: item.name || "Builder",
    series: item.pane === "pane" ? IndicatorSeries.Normal : IndicatorSeries.Price,
    figures: [
      {
        key: "v",
        title: `${item.name || "Builder"}: `,
        type: item.style === "hist" || item.style === "bar" ? "bar" : "line",
      },
    ],
    calc: wrapIndicatorCalc(name, ["v"], (dataList) => {
      const { values, volumes } = ohlc(dataList);
      const series = computeBuiltSeries(item, values, volumes);
      const rows = dataList.map((_, index) => ({ v: series[index] ?? null }));
      const samples = rows.filter((row) => row.v != null).length;
      if (samples === 0) {
        logKline("warn", "calc builder sin valores finitos", name, { bars: dataList.length, method: item.method });
      }
      return rows;
    }),
  });
  if (ok) {
    builtNames.add(name);
  }
  return name;
}

export function syncKlineIndicators(
  chart: Chart,
  indicators: Set<IndicatorId>,
  settings: IndicatorSettingsMap,
  built: BuiltIndicator[],
  previous: Tracked[],
): Tracked[] {
  ensureKlineIndicators();
  for (const item of previous) {
    try {
      chart.removeIndicator(item.paneId, item.name);
    } catch (err) {
      logKline("warn", "removeIndicator", item, err);
    }
  }
  const next: Tracked[] = [];
  const overlay = (value: string | { name: string; calcParams?: number[]; shortName?: string; styles?: object }) => {
    const name = typeof value === "string" ? value : value.name;
    try {
      const paneId = chart.createIndicator(value, true, { id: "candle_pane" });
      if (paneId) {
        next.push({ paneId, name });
        logKline("info", "createIndicator overlay", name, paneId);
      } else {
        logKline("warn", "createIndicator overlay devolvió null", name);
      }
    } catch (err) {
      logKline("error", "createIndicator overlay", name, err);
    }
  };
  const pane = (value: string | { name: string; calcParams?: number[]; styles?: object }, id: string, height = 80) => {
    const name = typeof value === "string" ? value : value.name;
    try {
      const paneId = chart.createIndicator(value, false, { id, height, minHeight: 48, dragEnabled: true });
      if (paneId) {
        next.push({ paneId, name });
        logKline("info", "createIndicator pane", name, paneId);
      } else {
        logKline("warn", "createIndicator pane devolvió null", name);
      }
    } catch (err) {
      logKline("error", "createIndicator pane", name, err);
    }
  };

  const ema: Array<[IndicatorId, number]> = [
    ["ema9", 9],
    ["ema20", 20],
    ["ema50", 50],
    ["ema100", 100],
    ["ema200", 200],
  ];
  for (const [id, fallback] of ema) {
    if (!indicators.has(id)) {
      continue;
    }
    const style = indicatorStyle(id, settings);
    overlay({
      name: "EMA",
      shortName: `EMA${style.period ?? fallback}`,
      calcParams: [style.period ?? fallback],
      styles: completeIndicatorStyles(style.color, style.width),
    });
  }
  const sma: Array<[IndicatorId, number]> = [
    ["sma20", 20],
    ["sma50", 50],
    ["sma200", 200],
  ];
  for (const [id, fallback] of sma) {
    if (!indicators.has(id)) {
      continue;
    }
    const style = indicatorStyle(id, settings);
    overlay({
      name: "MA",
      shortName: `MA${style.period ?? fallback}`,
      calcParams: [style.period ?? fallback],
      styles: completeIndicatorStyles(style.color, style.width),
    });
  }
  if (indicators.has("bb")) {
    const style = indicatorStyle("bb", settings);
    overlay({
      name: "BOLL",
      calcParams: [style.period ?? 20, style.mult ?? 2],
      styles: completeIndicatorStyles(style.color, style.width),
    });
  }
  if (indicators.has("psar")) {
    const style = indicatorStyle("psar", settings);
    overlay({ name: "SAR", calcParams: [style.step ?? 0.02, style.max ?? 0.2], styles: completeIndicatorStyles(style.color) });
  }
  if (indicators.has("vwap")) {
    overlay({ name: "AVIZOR_VWAP", styles: completeIndicatorStyles(indicatorStyle("vwap", settings).color) });
  }
  if (indicators.has("avwap")) {
    overlay({ name: "AVIZOR_AVWAP", styles: completeIndicatorStyles(indicatorStyle("avwap", settings).color) });
  }
  if (indicators.has("supertrend")) {
    overlay({ name: "AVIZOR_ST", styles: completeIndicatorStyles(indicatorStyle("supertrend", settings).color) });
  }
  if (indicators.has("keltner")) {
    overlay("AVIZOR_KELTNER");
  }
  if (indicators.has("donchian")) {
    overlay("AVIZOR_DONCHIAN");
  }
  if (indicators.has("vol_hist")) {
    pane("VOL", "pane_vol", 70);
  }
  if (indicators.has("rsi")) {
    const style = indicatorStyle("rsi", settings);
    pane({ name: "RSI", calcParams: [style.period ?? 14], styles: completeIndicatorStyles(style.color, style.width) }, "pane_rsi");
  }
  if (indicators.has("macd")) {
    const style = indicatorStyle("macd", settings);
    pane({ name: "MACD", calcParams: [style.period ?? 12, style.period2 ?? 26, style.period3 ?? 9] }, "pane_macd", 90);
  }
  if (indicators.has("stoch")) {
    const style = indicatorStyle("stoch", settings);
    pane({ name: "KDJ", calcParams: [style.period ?? 14, style.period2 ?? 3, style.period2 ?? 3] }, "pane_stoch");
  }
  if (indicators.has("cci")) {
    const style = indicatorStyle("cci", settings);
    pane({ name: "CCI", calcParams: [style.period ?? 20], styles: completeIndicatorStyles(style.color) }, "pane_cci");
  }
  if (indicators.has("roc")) {
    const style = indicatorStyle("roc", settings);
    pane({ name: "ROC", calcParams: [style.period ?? 12], styles: completeIndicatorStyles(style.color) }, "pane_roc");
  }
  if (indicators.has("willr")) {
    const style = indicatorStyle("willr", settings);
    pane({ name: "WR", calcParams: [style.period ?? 14], styles: completeIndicatorStyles(style.color) }, "pane_wr");
  }
  if (indicators.has("adx")) {
    pane("AVIZOR_ADX", "pane_adx");
  }
  if (indicators.has("stoch_rsi")) {
    pane("AVIZOR_STOCH_RSI", "pane_srsi");
  }
  if (indicators.has("atr")) {
    pane("AVIZOR_ATR", "pane_atr", 64);
  }
  if (indicators.has("stddev")) {
    pane("AVIZOR_STDDEV", "pane_std", 64);
  }
  if (indicators.has("obv")) {
    pane("OBV", "pane_obv", 64);
  }
  if (indicators.has("mfi")) {
    pane("AVIZOR_MFI", "pane_mfi");
  }
  if (indicators.has("cmf")) {
    pane("AVIZOR_CMF", "pane_cmf");
  }
  if (indicators.has("ad_line")) {
    pane("AVIZOR_AD", "pane_ad");
  }
  if (indicators.has("vol_pressure")) {
    pane("AVIZOR_VP", "pane_vp");
  }

  built
    .filter((item) => item.enabled)
    .forEach((item, index) => {
      if (
        (item.method === "signal_buy" || item.method === "signal_sell") &&
        !item.signal?.crossFast &&
        !item.signal?.bb &&
        !item.signal?.rsiValue &&
        !item.signal?.stochValue
      ) {
        logKline("warn", "señal Builder sin especificación; no se inyecta (evita pane vacío)", item.name);
        return;
      }
      const name = registerBuiltIndicator(item);
      const styles = completeIndicatorStyles(item.color || "#00FF66", item.width || 1.4);
      if (item.pane === "pane") {
        pane({ name, styles }, `pane_built_${index}`, 70);
      } else {
        overlay({ name, styles });
      }
    });

  return next;
}
