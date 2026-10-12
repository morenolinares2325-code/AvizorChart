"""
Cálculo de indicadores técnicos.
Funciones puras: reciben un DataFrame OHLCV, devuelven una Serie o un valor.
"""

import pandas as pd
import numpy as np


# =============================================================================
# MEDIAS MÓVILES
# =============================================================================

def sma(serie, periodo):
    """Simple Moving Average."""
    return serie.rolling(window=periodo).mean()


def ema(serie, periodo):
    """Exponential Moving Average."""
    return serie.ewm(span=periodo, adjust=False).mean()


def wma(serie, periodo):
    """Weighted Moving Average."""
    pesos = np.arange(1, periodo + 1)
    return serie.rolling(window=periodo).apply(
        lambda x: np.dot(x, pesos) / pesos.sum(), raw=True
    )


def hma(serie, periodo):
    """Hull Moving Average."""
    mitad = int(periodo / 2)
    raiz = int(np.sqrt(periodo))
    wma_mitad = wma(serie, mitad)
    wma_full = wma(serie, periodo)
    return wma(2 * wma_mitad - wma_full, raiz)


# =============================================================================
# MOMENTUM & OSCILADORES
# =============================================================================

def rsi(serie, periodo=14):
    """Relative Strength Index."""
    delta = serie.diff()
    ganancia = delta.where(delta > 0, 0).rolling(window=periodo).mean()
    perdida = -delta.where(delta < 0, 0).rolling(window=periodo).mean()
    rs = ganancia / perdida
    return 100 - (100 / (1 + rs))


def macd(serie, rapida=12, lenta=26, señal=9):
    """MACD: devuelve (macd_line, signal_line, histograma)."""
    ema_rapida = ema(serie, rapida)
    ema_lenta = ema(serie, lenta)
    macd_line = ema_rapida - ema_lenta
    signal_line = ema(macd_line, señal)
    histograma = macd_line - signal_line
    return macd_line, signal_line, histograma


def stochastic(df, k_period=14, d_period=3):
    """Stochastic Oscillator: devuelve (%K, %D)."""
    low_min = df["Low"].rolling(window=k_period).min()
    high_max = df["High"].rolling(window=k_period).max()
    k = 100 * (df["Close"] - low_min) / (high_max - low_min)
    d = k.rolling(window=d_period).mean()
    return k, d


def williams_r(df, periodo=14):
    """Williams %R."""
    high_max = df["High"].rolling(window=periodo).max()
    low_min = df["Low"].rolling(window=periodo).min()
    return -100 * (high_max - df["Close"]) / (high_max - low_min)


def cci(df, periodo=20):
    """Commodity Channel Index."""
    tp = (df["High"] + df["Low"] + df["Close"]) / 3
    sma_tp = tp.rolling(window=periodo).mean()
    mad = tp.rolling(window=periodo).apply(
        lambda x: np.abs(x - x.mean()).mean(), raw=True
    )
    return (tp - sma_tp) / (0.015 * mad)


# =============================================================================
# VOLATILIDAD
# =============================================================================

def true_range(df):
    """True Range."""
    high_low = df["High"] - df["Low"]
    high_close = (df["High"] - df["Close"].shift(1)).abs()
    low_close = (df["Low"] - df["Close"].shift(1)).abs()
    return pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)


def atr(df, periodo=14):
    """Average True Range."""
    return true_range(df).rolling(window=periodo).mean()


def bollinger_bands(serie, periodo=20, desviaciones=2.0):
    """Bollinger Bands: devuelve (banda_superior, banda_media, banda_inferior)."""
    banda_media = sma(serie, periodo)
    std = serie.rolling(window=periodo).std()
    banda_superior = banda_media + (std * desviaciones)
    banda_inferior = banda_media - (std * desviaciones)
    return banda_superior, banda_media, banda_inferior


# =============================================================================
# TENDENCIA
# =============================================================================

def supertrend(df, periodo=10, multiplicador=3.0):
    """
    Supertrend: devuelve (direccion, banda_activa, atr_serie).
    direccion: 1 = alcista, -1 = bajista.
    """
    high, low, close = df["High"], df["Low"], df["Close"]
    atr_serie = atr(df, periodo)
    hl2 = (high + low) / 2

    banda_superior = hl2 + (multiplicador * atr_serie)
    banda_inferior = hl2 - (multiplicador * atr_serie)

    direccion = pd.Series(index=df.index, dtype=int)
    banda_activa = pd.Series(index=df.index, dtype=float)

    for i in range(1, len(df)):
        if close.iloc[i] > banda_superior.iloc[i - 1]:
            direccion.iloc[i] = 1
        elif close.iloc[i] < banda_inferior.iloc[i - 1]:
            direccion.iloc[i] = -1
        else:
            direccion.iloc[i] = direccion.iloc[i - 1] if not pd.isna(direccion.iloc[i - 1]) else 1

        banda_activa.iloc[i] = (
            banda_inferior.iloc[i] if direccion.iloc[i] == 1 else banda_superior.iloc[i]
        )

    return direccion, banda_activa, atr_serie


def adx(df, periodo=14):
    """Average Directional Index."""
    high, low, close = df["High"], df["Low"], df["Close"]

    plus_dm = high.diff()
    minus_dm = -low.diff()
    plus_dm = plus_dm.where((plus_dm > minus_dm) & (plus_dm > 0), 0.0)
    minus_dm = minus_dm.where((minus_dm > plus_dm) & (minus_dm > 0), 0.0)

    tr = true_range(df)
    atr_serie = tr.rolling(window=periodo).mean()

    plus_di = 100 * (plus_dm.rolling(window=periodo).mean() / atr_serie)
    minus_di = 100 * (minus_dm.rolling(window=periodo).mean() / atr_serie)

    dx = 100 * (plus_di - minus_di).abs() / (plus_di + minus_di)
    return dx.rolling(window=periodo).mean()


def aroon(df, periodo=25):
    """Aroon: devuelve (aroon_up, aroon_down)."""
    def _dias_desde_max(x):
        return len(x) - 1 - np.argmax(x)

    def _dias_desde_min(x):
        return len(x) - 1 - np.argmin(x)

    aroon_up = df["High"].rolling(window=periodo + 1).apply(_dias_desde_max, raw=True)
    aroon_down = df["Low"].rolling(window=periodo + 1).apply(_dias_desde_min, raw=True)

    aroon_up = 100 * (periodo - aroon_up) / periodo
    aroon_down = 100 * (periodo - aroon_down) / periodo
    return aroon_up, aroon_down


# =============================================================================
# VOLUMEN
# =============================================================================

def obv(df):
    """On Balance Volume."""
    direccion = np.sign(df["Close"].diff())
    return (direccion * df["Volume"]).fillna(0).cumsum()


def volumen_relativo(df, periodo=20):
    """Volumen actual / media de volumen."""
    media = df["Volume"].rolling(window=periodo).mean()
    return df["Volume"] / media


def vwap(df):
    """Volume Weighted Average Price (intradía)."""
    tp = (df["High"] + df["Low"] + df["Close"]) / 3
    return (tp * df["Volume"]).cumsum() / df["Volume"].cumsum()


# =============================================================================
# HELPERS PARA EL FILTRADO
# =============================================================================

def detectar_cruce_alcista(serie_a, serie_b, ventana=3):
    """Detecta si serie_a cruzó al alza sobre serie_b en las últimas N velas."""
    for i in range(1, ventana + 1):
        if len(serie_a) < i + 1:
            return False
        if serie_a.iloc[-i - 1] <= serie_b.iloc[-i - 1] and serie_a.iloc[-i] > serie_b.iloc[-i]:
            return True
    return False


def detectar_cruce_bajista(serie_a, serie_b, ventana=3):
    """Detecta si serie_a cruzó a la baja sobre serie_b en las últimas N velas."""
    for i in range(1, ventana + 1):
        if len(serie_a) < i + 1:
            return False
        if serie_a.iloc[-i - 1] >= serie_b.iloc[-i - 1] and serie_a.iloc[-i] < serie_b.iloc[-i]:
            return True
    return False


def calcular_compresion(df, periodo_corto=14, periodo_largo=50):
    """
    Factor de compresión: ATR corto / ATR largo.
    Menor que 1 = comprimido. Mayor que 1 = expandido.
    """
    try:
        atr_corto = atr(df, periodo_corto).iloc[-1]
        atr_largo = atr(df, periodo_largo).iloc[-1]
        if atr_largo <= 0 or pd.isna(atr_largo):
            return 1.0
        return max(0.5, min(1.5, atr_corto / atr_largo))
    except Exception:
        return 1.0


def zona_rsi(rsi_valor):
    """Devuelve la zona del RSI como string."""
    if rsi_valor is None or pd.isna(rsi_valor):
        return "—"
    if rsi_valor < 30:
        return "🟢 Sobreventa extrema"
    if 30 <= rsi_valor <= 45:
        return "🟢 Sobreventa (zona compra)"
    if 45 < rsi_valor <= 55:
        return "⚪ Neutro-bajo"
    if 55 < rsi_valor <= 70:
        return "🟡 Sobrecompra moderada"
    return "🔴 Sobrecompra extrema"
