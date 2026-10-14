import numpy as np
import pandas as pd
from scipy.signal import find_peaks

FIABILIDAD_PATRONES = {
    "Cuña Descendente 📐 (alcista)": "Alta",
    "Cuña Ascendente 📐 (bajista)": "Alta",
    "Bandera Alcista 🏁": "Alta",
    "Bandera Bajista 🏳️": "Alta",
    "Canal Alcista 📈": "Media",
    "Canal Bajista 📉": "Media",
    "Triángulo Simétrico 🔺": "Media",
    "Doble Suelo 📈W": "Baja",
    "Doble Techo 📉M": "Baja",
    "Sin patrón claro": "—",
    "Datos insuficientes": "—"
}

EVENTOS_ALCISTAS = {"Ruptura Resistencia 🚀", "Rebote Soporte 📈"}
EVENTOS_BAJISTAS = {"Ruptura Soporte 🔻", "Rechazo en Resistencia 🔻"}


def calcular_rsi(df: pd.DataFrame, period: int = 14) -> pd.Series:
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))


def calcular_ema(df: pd.DataFrame, period: int = 19) -> pd.Series:
    return df['Close'].ewm(span=period, adjust=False).mean()


def calcular_macd(df: pd.DataFrame, rapida: int = 12, lenta: int = 26, senal: int = 9):
    exp1 = df['Close'].ewm(span=rapida, adjust=False).mean()
    exp2 = df['Close'].ewm(span=lenta, adjust=False).mean()
    macd = exp1 - exp2
    return macd, macd.ewm(span=senal, adjust=False).mean()


def calcular_supertrend(df: pd.DataFrame, period: int = 14, multiplier: float = 3.0):
    high, low, close = df['High'], df['Low'], df['Close']
    tr = pd.concat([high - low, (high - close.shift(1)).abs(), (low - close.shift(1)).abs()], axis=1).max(axis=1)
    atr = tr.rolling(period).mean()
    hl2 = (high + low) / 2
    upperband = hl2 + (multiplier * atr)
    lowerband = hl2 - (multiplier * atr)
    
    direction = pd.Series(index=df.index, dtype=int)
    banda_activa = pd.Series(index=df.index, dtype=float)
    
    for i in range(1, len(df)):
        if close.iloc[i] > upperband.iloc[i - 1]:
            direction.iloc[i] = 1
        elif close.iloc[i] < lowerband.iloc[i - 1]:
            direction.iloc[i] = -1
        else:
            direction.iloc[i] = direction.iloc[i - 1] if not np.isnan(direction.iloc[i - 1]) else 1
            
        banda_activa.iloc[i] = lowerband.iloc[i] if direction.iloc[i] == 1 else upperband.iloc[i]
        
    return direction, atr, banda_activa


def ta_atr_simple(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high, low, close = df['High'], df['Low'], df['Close']
    tr = pd.concat([high - low, (high - close.shift(1)).abs(), (low - close.shift(1)).abs()], axis=1).max(axis=1)
    return tr.rolling(period).mean()


def detectar_cruce_macd(macd_l: pd.Series, signal_l: pd.Series, ventana: int = 3, confirmar: bool = True):
    diff = macd_l - signal_l
    fin = len(diff) - 1 if confirmar else len(diff)
    inicio = max(1, fin - ventana)
    ultimo = None
    for i in range(inicio, fin):
        if diff.iloc[i - 1] <= 0 and diff.iloc[i] > 0:
            ultimo = "alcista"
        elif diff.iloc[i - 1] >= 0 and diff.iloc[i] < 0:
            ultimo = "bajista"
    return ultimo


def detectar_cruce_supertrend(direction: pd.Series, ventana: int = 3, confirmar: bool = True):
    fin = len(direction) - 1 if confirmar else len(direction)
    inicio = max(1, fin - ventana)
    ultimo = None
    for i in range(inicio, fin):
        if direction.iloc[i - 1] == -1 and direction.iloc[i] == 1:
            ultimo = "alcista"
        elif direction.iloc[i - 1] == 1 and direction.iloc[i] == -1:
            ultimo = "bajista"
    return ultimo


def detectar_cruce_precio_ema(precio_serie: pd.Series, ema_serie: pd.Series, ventana: int = 3, confirmar: bool = True):
    fin = len(precio_serie) - 1 if confirmar else len(precio_serie)
    inicio = max(1, fin - ventana)
    ultimo = None
    for i in range(inicio, fin):
        if precio_serie.iloc[i - 1] <= ema_serie.iloc[i - 1] and precio_serie.iloc[i] > ema_serie.iloc[i]:
            ultimo = "alcista"
        elif precio_serie.iloc[i - 1] >= ema_serie.iloc[i - 1] and precio_serie.iloc[i] < ema_serie.iloc[i]:
            ultimo = "bajista"
    return ultimo


def detectar_niveles(df: pd.DataFrame, ventana: int = 40, umbral_pct: float = 2.0):
    precios = df['Close'].tail(ventana).values
    if len(precios) < 6:
        p_act = precios[-1]
        return p_act * 0.95, p_act * 1.05, 5.0, 5.0, "Consolidación"
        
    peaks, _ = find_peaks(precios, distance=3)
    troughs, _ = find_peaks(-precios, distance=3)
    
    if len(peaks) == 0 or len(troughs) == 0:
        p_act = precios[-1]
        return p_act * 0.95, p_act * 1.05, 5.0, 5.0, "Consolidación"
        
    res, sop, p_act = precios[peaks[-1]], precios[troughs[-1]], precios[-1]
    dist_res = ((res - p_act) / p_act) * 100
    dist_sop = ((p_act - sop) / p_act) * 100
    momentum_reciente = precios[-1] - precios[-6]
    
    evento = "Consolidación"
    if abs(dist_res) <= umbral_pct:
        evento = "Ruptura Resistencia 🚀" if momentum_reciente > 0 else "Rechazo en Resistencia 🔻"
    elif abs(dist_sop) <= umbral_pct:
        evento = "Rebote Soporte 📈" if momentum_reciente >= 0 else "Ruptura Soporte 🔻"
        
    return sop, res, round(dist_res, 1), round(dist_sop, 1), evento


def _pendientes_ventana(ventana_actual):
    max_local, _ = find_peaks(ventana_actual, distance=2)
    min_local, _ = find_peaks(-ventana_actual, distance=2)
    p_altos = np.polyfit(max_local, ventana_actual[max_local], 1)[0] if len(max_local) >= 2 else None
    p_bajos = np.polyfit(min_local, ventana_actual[min_local], 1)[0] if len(min_local) >= 2 else None
    return p_altos, p_bajos, max_local, min_local


def detectar_patron_geometrico(df: pd.DataFrame, ventana: int = 15, impulso_min: float = 0.08):
    if len(df) < ventana + 10:
        return "Datos insuficientes"
        
    cierre = df['Close'].values
    ventana_actual = cierre[-ventana:]
    
    max_local, _ = find_peaks(ventana_actual, distance=2)
    min_local, _ = find_peaks(-ventana_actual, distance=2)
    
    if len(max_local) >= 2:
        p1, p2 = ventana_actual[max_local[-2]], ventana_actual[max_local[-1]]
        if abs(p1 - p2) / ((p1 + p2) / 2) * 100 <= 1.5:
            return "Doble Techo 📉M"
            
    if len(min_local) >= 2:
        t1, t2 = ventana_actual[min_local[-2]], ventana_actual[min_local[-1]]
        if abs(t1 - t2) / ((t1 + t2) / 2) * 100 <= 1.5:
            return "Doble Suelo 📈W"
            
    p_altos, p_bajos, _, _ = _pendientes_ventana(ventana_actual)
    rango_inicio = ventana_actual[:5].max() - ventana_actual[:5].min()
    rango_final = ventana_actual[-5:].max() - ventana_actual[-5:].min()
    contraccion = rango_final < rango_inicio * 0.7
    
    if p_altos is not None and p_bajos is not None:
        if contraccion:
            if p_altos < 0 and p_bajos > 0:
                return "Triángulo Simétrico 🔺"
            if p_altos > 0 and p_bajos > 0:
                return "Cuña Ascendente 📐 (bajista)"
            if p_altos < 0 and p_bajos < 0:
                return "Cuña Descendente 📐 (alcista)"
        else:
            if p_altos > 0 and p_bajos > 0 and abs(p_altos - p_bajos) < abs(p_altos) * 0.4:
                return "Canal Alcista 📈"
            if p_altos < 0 and p_bajos < 0 and abs(p_altos - p_bajos) < abs(p_altos) * 0.4:
                return "Canal Bajista 📉"
            
    tramo_previo = cierre[-(ventana + 10):-ventana]
    if len(tramo_previo) > 0:
        variacion_previa = (tramo_previo[-1] - tramo_previo[0]) / tramo_previo[0]
        amplitud_canal = (ventana_actual.max() - ventana_actual.min()) / ventana_actual.mean()
        if variacion_previa >= impulso_min and amplitud_canal < 0.08:
            return "Bandera Alcista 🏁"
        if variacion_previa <= -impulso_min and amplitud_canal < 0.08:
            return "Bandera Bajista 🏳️"
        
    return "Sin patrón claro"


def calcular_compresion(df: pd.DataFrame) -> float:
    try:
        atr_actual = float(ta_atr_simple(df, 14).iloc[-1])
        atr_medio = float(ta_atr_simple(df, 50).iloc[-1])
        if atr_medio <= 0:
            return 1.0
        return max(0.5, min(1.5, atr_actual / atr_medio))
    except Exception:
        return 1.0


def estimar_dias_hasta_ruptura(distancia_pct: float, atr_pct: float, factor_compresion: float) -> str:
    if atr_pct <= 0:
        return "—"
    dias = (distancia_pct / atr_pct) * factor_compresion
    if dias <= 0.3:
        return "hoy"
    if dias <= 1.2:
        return "mañana"
    if dias <= 3.5:
        return "2-3 días"
    if dias <= 5.5:
        return "4-5 días"
    if dias <= 8:
        return "una semana"
    return "más de una semana"
