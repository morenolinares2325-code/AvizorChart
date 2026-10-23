import type { ChartPriceType } from "@/components/chart/chartPriceTypes";
import { candleTypeFor } from "@/components/chart/kline/data";
import type { ChartVisualTheme } from "@/components/chart/chartVisualTheme";
import { CandleType, LineType, TooltipShowRule, TooltipShowType, YAxisPosition, type DeepPartial, type Styles } from "klinecharts";

export function klineStyles(theme: ChartVisualTheme, chartType: ChartPriceType = "candles"): DeepPartial<Styles> {
  const light = theme.scheme === "light";
  const candleKind = candleTypeFor(chartType);
  const candleType =
    candleKind === "ohlc" ? CandleType.Ohlc : candleKind === "area" ? CandleType.Area : CandleType.CandleSolid;
  const hair = theme.crosshair === "dashed" ? LineType.Dashed : LineType.Solid;
  const dashedValue = [4, 3];
  return {
    grid: {
      show: theme.gridHorizontal || theme.gridVertical,
      horizontal: {
        show: theme.gridHorizontal,
        color: theme.grid,
        size: theme.gridWidth,
        style: LineType.Dashed,
        dashedValue,
      },
      vertical: {
        show: theme.gridVertical,
        color: theme.grid,
        size: theme.gridWidth,
        style: LineType.Dashed,
        dashedValue,
      },
    },
    candle: {
      type: candleType,
      bar: {
        upColor: theme.bull,
        downColor: theme.bear,
        upBorderColor: theme.outlineBull,
        downBorderColor: theme.outlineBear,
        upWickColor: theme.wickBull,
        downWickColor: theme.wickBear,
      },
      area: {
        lineSize: 1.6,
        lineColor: theme.bull,
        value: "close",
        backgroundColor: [
          { offset: 0, color: theme.bull },
          { offset: 1, color: `${theme.background}00` },
        ],
      },
      priceMark: {
        show: true,
        high: { show: false },
        low: { show: false },
        last: {
          show: true,
          upColor: theme.bull,
          downColor: theme.bear,
          noChangeColor: theme.axis,
          line: {
            show: true,
            style: LineType.Dashed,
            dashedValue,
            size: 1,
          },
        },
      },
      tooltip: {
        showRule: TooltipShowRule.FollowCross,
        showType: TooltipShowType.Standard,
        text: {
          size: 11,
          color: theme.uiText,
          family: "ui-monospace, SFMono-Regular, Menlo, monospace",
        },
      },
    },
    indicator: {
      tooltip: {
        text: {
          size: 10,
          color: theme.uiMuted,
          family: "ui-monospace, SFMono-Regular, Menlo, monospace",
        },
      },
    },
    xAxis: {
      axisLine: { color: theme.grid },
      tickLine: { show: false },
      tickText: {
        color: theme.axis,
        size: 11,
        family: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
    },
    yAxis: {
      position: YAxisPosition.Right,
      axisLine: { color: theme.grid, show: true },
      tickLine: { show: false },
      tickText: {
        color: theme.axis,
        size: 11,
        family: "ui-monospace, SFMono-Regular, Menlo, monospace",
      },
    },
    separator: {
      color: theme.grid,
      size: 1,
    },
    crosshair: {
      show: theme.crosshair !== "hidden",
      horizontal: {
        line: {
          color: theme.crosshairColor,
          style: hair,
          dashedValue,
        },
        text: {
          color: light ? "#050508" : "#fafafa",
          backgroundColor: theme.crosshairColor,
        },
      },
      vertical: {
        line: {
          color: theme.crosshairColor,
          style: hair,
          dashedValue,
        },
        text: {
          color: light ? "#050508" : "#fafafa",
          backgroundColor: theme.crosshairColor,
        },
      },
    },
  };
}
