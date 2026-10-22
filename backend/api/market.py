import re
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
import pandas as pd
import yfinance as yf

router = APIRouter(prefix="/api/market", tags=["Mercado"])

INTERVAL_RE = re.compile(r"^(\d+)(s|m|h|d|w)$")
NATIVE_MINUTE_INTERVALS = {
    1: "1m",
    2: "2m",
    5: "5m",
    15: "15m",
    30: "30m",
    60: "1h",
    90: "90m",
}
PERIOD_BY_SOURCE = {
    "1m": "5d",
    "2m": "5d",
    "5m": "1mo",
    "15m": "1mo",
    "30m": "1mo",
    "90m": "1mo",
    "1h": "2y",
    "1d": "5y",
    "1wk": "max",
    "1mo": "max",
}
YF_PERIOD_CAP = {
    "1m": "7d",
    "2m": "60d",
    "5m": "60d",
    "15m": "60d",
    "30m": "60d",
    "90m": "60d",
    "1h": "2y",
}
PERIOD_RANK = {
    "1d": 1,
    "5d": 2,
    "7d": 3,
    "1mo": 4,
    "60d": 5,
    "3mo": 6,
    "6mo": 7,
    "ytd": 7,
    "1y": 8,
    "2y": 9,
    "5y": 10,
    "10y": 11,
    "max": 12,
}
ALLOWED_PERIODS = set(PERIOD_RANK)


def _sanitize_ticker(raw: str) -> str:
    ticker = raw.strip().upper()
    if not ticker or len(ticker) > 16:
        raise HTTPException(status_code=400, detail="Ticker inválido.")
    allowed = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-^=_/")
    if any(char not in allowed for char in ticker):
        raise HTTPException(status_code=400, detail="Ticker contiene caracteres no permitidos.")
    return ticker


def _flatten_ohlcv(df: pd.DataFrame) -> pd.DataFrame:
    if isinstance(df.columns, pd.MultiIndex):
        df = df.copy()
        df.columns = df.columns.get_level_values(0)
    required = ["Open", "High", "Low", "Close"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"La respuesta de mercado no incluye columnas OHLCV: {', '.join(missing)}.",
        )
    if "Volume" not in df.columns:
        df["Volume"] = 0
    return df.dropna(subset=required)


def _resolve_interval(raw: str) -> tuple[str, str, Optional[str], bool]:
    match = INTERVAL_RE.match(raw)
    if not match:
        raise HTTPException(
            status_code=400,
            detail="Intervalo inválido. Usa p.ej. 1m, 15m, 4h, 1d, 1w o un valor personalizado como 45m.",
        )

    amount = int(match.group(1))
    unit = match.group(2)
    if amount < 1 or amount > 365:
        raise HTTPException(status_code=400, detail="El intervalo personalizado está fuera de rango (1–365).")

    if unit == "s":
        raise HTTPException(
            status_code=400,
            detail="Yahoo Finance no publica velas de segundos. El mínimo disponible es 1m.",
        )

    if unit == "w":
        source = "1wk"
        rule = None if amount == 1 else f"{amount}W"
        return source, PERIOD_BY_SOURCE[source], rule, False

    if unit == "d":
        source = "1d"
        rule = None if amount == 1 else f"{amount}D"
        period = "5y" if amount == 1 else "max"
        return source, period, rule, False

    total_minutes = amount * 60 if unit == "h" else amount
    if total_minutes < 1:
        raise HTTPException(status_code=400, detail="El intervalo mínimo es 1m.")

    source = "1m"
    for minutes, label in sorted(NATIVE_MINUTE_INTERVALS.items(), reverse=True):
        if total_minutes % minutes == 0:
            source = label
            break

    native_minutes = next((mins for mins, label in NATIVE_MINUTE_INTERVALS.items() if label == source), 1)
    rule = None if total_minutes == native_minutes else f"{total_minutes}min"
    period = PERIOD_BY_SOURCE.get(source, "1mo")
    if source == "1h" and total_minutes >= 240:
        period = "2y"
    return source, period, rule, True


def _clamp_period(source_interval: str, requested: str) -> str:
    cap = YF_PERIOD_CAP.get(source_interval, "max")
    if requested == "ytd":
        return requested if PERIOD_RANK.get(cap, 12) >= PERIOD_RANK["6mo"] else cap
    want = PERIOD_RANK.get(requested, 8)
    limit = PERIOD_RANK.get(cap, 12)
    return requested if want <= limit else cap


def _resample_ohlcv(frame: pd.DataFrame, rule: str) -> pd.DataFrame:
    aggregated = (
        frame.resample(rule, label="left", closed="left")
        .agg(
            {
                "Open": "first",
                "High": "max",
                "Low": "min",
                "Close": "last",
                "Volume": "sum",
            }
        )
        .dropna(subset=["Open", "High", "Low", "Close"])
    )
    return aggregated


@router.get("/candles")
def get_candles(
    ticker: str = Query(..., description="Símbolo Yahoo Finance, p.ej. NVDA o BTC-USD"),
    interval: str = Query("1d", description="1m, 5m, 15m, 30m, 1h, 4h, 12h, 1d, 1w o personalizado (45m, 2h…)"),
    period: Optional[str] = Query(None, description="Periodo yfinance; si se omite, se infiere del intervalo"),
):
    symbol = _sanitize_ticker(ticker)
    interval_key = interval.strip().lower()
    source_interval, default_period, resample_rule, include_time = _resolve_interval(interval_key)

    requested_period = (period or default_period).strip().lower()
    if requested_period not in ALLOWED_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"Periodo no soportado. Usa: {', '.join(sorted(ALLOWED_PERIODS))}.",
        )
    resolved_period = _clamp_period(source_interval, requested_period)

    try:
        history = yf.Ticker(symbol).history(
            period=resolved_period,
            interval=source_interval,
            auto_adjust=True,
            actions=False,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Fallo al descargar datos de {symbol}: {exc}",
        ) from exc

    if history is None or history.empty:
        raise HTTPException(
            status_code=400,
            detail=f"No hay velas para {symbol} ({interval_key}/{resolved_period}). Comprueba el ticker.",
        )

    frame = _flatten_ohlcv(history)
    if resample_rule:
        if not isinstance(frame.index, pd.DatetimeIndex):
            frame.index = pd.to_datetime(frame.index)
        frame = _resample_ohlcv(frame, resample_rule)
    if frame.empty:
        raise HTTPException(
            status_code=400,
            detail=f"Los datos de {symbol} no contienen velas OHLCV válidas para {interval_key}.",
        )

    dates: list[str] = []
    values: list[list[float]] = []
    volumes: list[float] = []
    data: list[list[float]] = []
    candles: list[dict[str, float | int]] = []

    for stamp, row in frame.iterrows():
        ts = pd.Timestamp(stamp)
        if ts.tzinfo is not None:
            ts = ts.tz_convert("UTC").tz_localize(None)
        millis = int(ts.timestamp() * 1000)
        open_px = round(float(row["Open"]), 6)
        close_px = round(float(row["Close"]), 6)
        low_px = round(float(row["Low"]), 6)
        high_px = round(float(row["High"]), 6)
        volume = float(row["Volume"]) if pd.notna(row["Volume"]) else 0.0
        dates.append(ts.strftime("%Y-%m-%d %H:%M") if include_time else ts.strftime("%Y-%m-%d"))
        values.append([open_px, close_px, low_px, high_px])
        volumes.append(volume)
        data.append([millis, open_px, close_px, low_px, high_px, volume])
        candles.append(
            {
                "time": millis // 1000,
                "open": open_px,
                "close": close_px,
                "low": low_px,
                "high": high_px,
                "volume": volume,
            }
        )

    last_close = values[-1][1]
    prev_close = values[-2][1] if len(values) > 1 else last_close
    change_pct = ((last_close - prev_close) / prev_close) * 100 if prev_close else 0.0

    return {
        "ticker": symbol,
        "interval": interval_key,
        "period": resolved_period,
        "dates": dates,
        "values": values,
        "volumes": volumes,
        "data": data,
        "candles": candles,
        "last": last_close,
        "changePct": round(change_pct, 4),
        "count": len(values),
    }


@router.get("/history")
def get_history(
    ticker: str = Query("NVDA", description="Símbolo bursátil"),
    period: Optional[str] = Query(None, description="Periodo yfinance"),
    interval: str = Query("1d", description="Intervalo temporal"),
):
    return get_candles(ticker=ticker, interval=interval, period=period)
