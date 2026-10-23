export type BuilderLangTab = "kline" | "pine" | "mql5" | "ctrader";

export const BUILDER_TABS: { id: BuilderLangTab; label: string; hint: string; monaco: string }[] = [
  { id: "kline", label: "TypeScript / KLineChart", hint: "Nativo", monaco: "typescript" },
  { id: "pine", label: "Pine Script v6", hint: "TradingView", monaco: "plaintext" },
  { id: "mql5", label: "MQL5", hint: "MetaTrader", monaco: "cpp" },
  { id: "ctrader", label: "cTrader", hint: "cAlgo C#", monaco: "csharp" },
];

export const BUILDER_SAMPLES: Record<BuilderLangTab, string> = {
  kline: `import { registerIndicator, IndicatorSeries, LineType } from "klinecharts";

registerIndicator({
  name: "AVIZOR_CUSTOM_EMA",
  shortName: "EMA 21",
  series: IndicatorSeries.Price,
  figures: [
    { key: "ema", title: "EMA: ", type: "line" },
  ],
  calc: (dataList) => {
    const period = 21;
    const k = 2 / (period + 1);
    let prev = null;
    return dataList.map((bar, i) => {
      const ema = prev == null ? bar.close : prev + k * (bar.close - prev);
      prev = ema;
      return { ema: i + 1 < period ? null : ema };
    });
  },
  styles: {
    lines: [{ color: "#00FF66", size: 1.4, style: LineType.Solid, dashedValue: [4, 3] }],
  },
});
`,
  pine: `//@version=6
indicator("EMA Ribbon", overlay=true)
len = input.int(21, "Periodo")
fast = ta.ema(close, len)
slow = ta.sma(close, 50)
plot(fast, color=color.lime, title="EMA rápida")
plot(slow, color=color.aqua, title="SMA lenta")
fill(fast, slow, color=color.new(color.teal, 85), title="Nube")
buy = ta.crossover(fast, slow)
plotshape(buy, style=shape.triangleup, location=location.belowbar, color=color.lime, title="BUY")
`,
  mql5: `//+------------------------------------------------------------------+
#property indicator_chart_window
#property indicator_buffers 1
input int maPeriod = 21;
int OnCalculate(const int rates_total, const int prev_calculated,
                const datetime &time[], const double &open[],
                const double &high[], const double &low[],
                const double &close[], const long &tick_volume[],
                const long &volume[], const int &spread[])
{
   for(int i = 0; i < rates_total; i++)
      iMA(_Symbol, PERIOD_CURRENT, maPeriod, 0, MODE_EMA, PRICE_CLOSE);
   return(rates_total);
}
`,
  ctrader: `using cAlgo.API;
using cAlgo.API.Indicators;

namespace cAlgo.Indicators
{
    [Indicator(IsOverlay = true, TimeZone = TimeZones.UTC, AccessRights = AccessRights.None)]
    public class EmaRibbon : Indicator
    {
        [Parameter("Period", DefaultValue = 21)]
        public int Period { get; set; }

        [Output("EMA", LineColor = "Lime")]
        public IndicatorDataSeries Ema { get; set; }

        private ExponentialMovingAverage _ema;

        protected override void Initialize()
        {
            _ema = Indicators.ExponentialMovingAverage(Bars.ClosePrices, Period);
        }

        public override void Calculate(int index)
        {
            Ema[index] = _ema.Result[index];
        }
    }
}
`,
};
