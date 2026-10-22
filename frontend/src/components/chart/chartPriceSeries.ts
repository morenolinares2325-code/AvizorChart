import type { SeriesOption } from "echarts";
import { priceBarsForType, type ChartPriceType } from "@/components/chart/chartPriceTypes";
import { neonAmount, type ChartVisualTheme } from "@/components/chart/chartVisualTheme";

export function formatPrice(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return value.toFixed(2);
  }
  if (abs >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(4);
}

function lastPriceMark(theme: ChartVisualTheme, lastClose: number, lastUp: boolean): SeriesOption["markLine"] {
  return {
    silent: true,
    symbol: "none",
    animation: false,
    label: {
      show: true,
      position: "end",
      formatter: (item: { name?: string }) => {
        const name = item.name;
        if (name === "Bid") return `Bid ${formatPrice(lastClose * 0.9994)}`;
        if (name === "Ask") return `Ask ${formatPrice(lastClose * 1.0006)}`;
        return formatPrice(lastClose);
      },
      color: "#050508",
      backgroundColor: lastUp ? theme.bull : theme.bear,
      padding: [3, 6],
      fontSize: 11,
      fontWeight: 650,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      borderRadius: 3,
    },
    lineStyle: { color: lastUp ? theme.bull : theme.bear, width: 1, type: "solid" },
    data: [
      { name: "Last", yAxis: lastClose },
      ...(theme.bidAsk
        ? [
            {
              name: "Bid",
              yAxis: lastClose * 0.9994,
              lineStyle: { color: theme.bidColor, type: "dashed" as const, width: 1 },
              label: { color: "#050508", backgroundColor: theme.bidColor },
            },
            {
              name: "Ask",
              yAxis: lastClose * 1.0006,
              lineStyle: { color: theme.askColor, type: "dashed" as const, width: 1 },
              label: { color: "#050508", backgroundColor: theme.askColor },
            },
          ]
        : []),
    ],
  };
}

export function buildPriceSeries(
  chartType: ChartPriceType,
  dates: string[],
  values: [number, number, number, number][],
  theme: ChartVisualTheme,
  lastClose: number,
  lastUp: boolean,
): SeriesOption {
  const glow = neonAmount(theme);
  const transformType = chartType === "heikin" || chartType === "renko" ? chartType : "candles";
  const bars = priceBarsForType(transformType, values);
  const lastBar = [...bars].reverse().find((bar): bar is [number, number, number, number] => bar != null);
  const seriesClose = lastBar ? lastBar[1] : lastClose;
  const seriesUp = lastBar ? lastBar[1] >= lastBar[0] : lastUp;
  const markLine = lastPriceMark(theme, seriesClose, seriesUp);
  const lineColor = seriesUp ? theme.bull : theme.bear;

  if (chartType === "line" || chartType === "area") {
    return {
      id: `ohlc-${chartType}`,
      name: "Precio",
      type: "line",
      xAxisIndex: 0,
      yAxisIndex: 0,
      z: 3,
      animation: false,
      showSymbol: false,
      connectNulls: true,
      data: values.map((bar) => bar[1]),
      lineStyle: { width: 1.6, color: lineColor, shadowBlur: 10 * glow, shadowColor: lineColor },
      areaStyle:
        chartType === "area"
          ? {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${lineColor}99` },
                  { offset: 1, color: `${theme.background}00` },
                ],
              },
            }
          : undefined,
      markLine,
    };
  }

  if (chartType === "scatter") {
    return {
      id: `ohlc-${chartType}`,
      name: "Precio",
      type: "scatter",
      xAxisIndex: 0,
      yAxisIndex: 0,
      z: 3,
      animation: false,
      symbol: "circle",
      symbolSize: 6,
      data: values.map((bar) => ({
        value: bar[1],
        itemStyle: { color: bar[1] >= bar[0] ? theme.bull : theme.bear },
      })),
      markLine,
    };
  }

  const renderer = chartType === "bars" ? renderOhlcBar : chartType === "renko" ? renderRenko : renderCandle;
  return {
    id: `ohlc-${chartType}`,
    name: "OHLC",
    type: "custom",
    xAxisIndex: 0,
    yAxisIndex: 0,
    z: 3,
    animation: false,
    clip: true,
    silent: false,
    renderItem: (params, api) => renderer(params, api as never, theme) as never,
    data: bars.map((bar, index) =>
      bar ? [dates[index] ?? index, bar[0], bar[1], bar[2], bar[3]] : [dates[index] ?? index, null, null, null, null],
    ),
    encode: { x: 0, y: [1, 2, 3, 4] },
    markLine,
  };
}

type RenderApi = {
  value: (dim: number) => unknown;
  coord: (point: [number, number]) => number[];
  size?: (point: [number, number]) => number[];
};

function renderOhlcBar(_params: { dataIndex: number }, api: RenderApi, theme: ChartVisualTheme) {
  const category = api.value(0);
  const open = Number(api.value(1));
  const close = Number(api.value(2));
  const low = Number(api.value(3));
  const high = Number(api.value(4));
  if (![open, close, low, high].every((value) => Number.isFinite(value))) {
    return { type: "group" as const, children: [] };
  }
  const up = close >= open;
  const x = api.coord([category as never, close])[0] ?? 0;
  const yOpen = api.coord([category as never, open])[1] ?? 0;
  const yClose = api.coord([category as never, close])[1] ?? 0;
  const yHigh = api.coord([category as never, high])[1] ?? 0;
  const yLow = api.coord([category as never, low])[1] ?? 0;
  const band = api.size?.([1, 0])?.[0] ?? 7;
  const tick = Math.max(2, band * 0.28);
  const color = up ? theme.bull : theme.bear;
  const wick = up ? theme.wickBull : theme.wickBear;
  const px = (value: number) => Math.round(value);
  return {
    type: "group" as const,
    children: [
      {
        type: "line" as const,
        shape: { x1: px(x), y1: px(yHigh), x2: px(x), y2: px(yLow) },
        style: { stroke: wick, lineWidth: Math.max(1, theme.wickWidth) },
      },
      {
        type: "line" as const,
        shape: { x1: px(x - tick), y1: px(yOpen), x2: px(x), y2: px(yOpen) },
        style: { stroke: color, lineWidth: Math.max(1.2, theme.candleBorder) },
      },
      {
        type: "line" as const,
        shape: { x1: px(x), y1: px(yClose), x2: px(x + tick), y2: px(yClose) },
        style: { stroke: color, lineWidth: Math.max(1.2, theme.candleBorder) },
      },
    ],
  };
}

function renderRenko(
  params: { dataIndex: number },
  api: RenderApi,
  theme: ChartVisualTheme,
) {
  return renderCandle(params, api, theme);
}

function renderCandle(_params: { dataIndex: number }, api: RenderApi, theme: ChartVisualTheme) {
  const category = api.value(0);
  const open = Number(api.value(1));
  const close = Number(api.value(2));
  const low = Number(api.value(3));
  const high = Number(api.value(4));
  if (![open, close, low, high].every((value) => Number.isFinite(value))) {
    return { type: "group" as const, children: [] };
  }
  const up = close >= open;
  const x = api.coord([category as never, close])[0] ?? 0;
  const yOpen = api.coord([category as never, open])[1] ?? 0;
  const yClose = api.coord([category as never, close])[1] ?? 0;
  const yHigh = api.coord([category as never, high])[1] ?? 0;
  const yLow = api.coord([category as never, low])[1] ?? 0;
  const band = api.size?.([1, 0])?.[0] ?? 7;
  const half = Math.max(1.4, band * 0.32);
  const crisp = theme.candleSharpness >= 3;
  const px = (value: number) => (crisp ? Math.round(value) : value);
  const bodyTop = Math.min(yOpen, yClose);
  const bodyH = Math.max(1, Math.abs(yClose - yOpen));
  const glow = neonAmount(theme);
  const edge = 0.62 + theme.candleSharpness * 0.095 + glow * 0.22;
  const radius = Math.max(0, 1.6 - theme.candleSharpness * 0.4);
  const bloom = up ? theme.bull : theme.bear;
  return {
    type: "group" as const,
    children: [
      {
        type: "line" as const,
        shape: { x1: px(x), y1: px(yHigh), x2: px(x), y2: px(yLow) },
        style: {
          stroke: up ? theme.wickBull : theme.wickBear,
          lineWidth: theme.wickWidth,
          lineCap: (crisp ? "butt" : "round") as CanvasLineCap,
          opacity: Math.min(1, edge),
          shadowBlur: 8 * glow,
          shadowColor: bloom,
        },
      },
      {
        type: "rect" as const,
        shape: {
          x: px(x - half),
          y: px(bodyTop),
          width: Math.max(1, px(half * 2)),
          height: Math.max(1, px(bodyH)),
          r: radius,
        },
        style: {
          fill: up ? theme.bull : theme.bear,
          stroke: up ? theme.outlineBull : theme.outlineBear,
          lineWidth: theme.candleBorder,
          lineJoin: (crisp ? "miter" : "round") as CanvasLineJoin,
          opacity: Math.min(1, edge),
          shadowBlur: 14 * glow,
          shadowColor: bloom,
        },
      },
    ],
  };
}
