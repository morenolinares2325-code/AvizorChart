import numpy as np
import pandas as pd

def calculate_zigzag(df: pd.DataFrame, deviation: float = 0.02) -> list:
    """
    Calcula los puntos de pivote (Zigzag) sin repintado en el pasado,
    basado en un porcentaje de desviación mínimo.
    """
    highs = df['High'].values
    lows = df['Low'].values
    closes = df['Close'].values
    
    pivots = [] # Lista de tuplas: (index, price, type 'HIGH'/'LOW')
    
    if len(df) < 5:
        return pivots

    last_high_idx = 0
    last_low_idx = 0
    last_high = highs[0]
    last_low = lows[0]
    
    trend = 0 # 1 para alcista, -1 para bajista

    for i in range(1, len(df)):
        if trend == 0:
            if highs[i] > last_high * (1 + deviation):
                trend = -1
                last_low_idx = i
                last_low = lows[i]
                pivots.append((last_high_idx, last_high, 'HIGH'))
            elif lows[i] < last_low * (1 - deviation):
                trend = 1
                last_high_idx = i
                last_high = highs[i]
                pivots.append((last_low_idx, last_low, 'LOW'))
        elif trend == 1: # Buscando un High
            if highs[i] > last_high:
                last_high = highs[i]
                last_high_idx = i
            elif lows[i] < last_high * (1 - deviation):
                pivots.append((last_high_idx, last_high, 'HIGH'))
                trend = -1
                last_low_idx = i
                last_low = lows[i]
        elif trend == -1: # Buscando un Low
            if lows[i] < last_low:
                last_low = lows[i]
                last_low_idx = i
            elif highs[i] > last_low * (1 + deviation):
                pivots.append((last_low_idx, last_low, 'LOW'))
                trend = 1
                last_high_idx = i
                last_high = highs[i]
                
    return pivots

def detect_chart_patterns(df: pd.DataFrame) -> dict:
    """
    Detecta patrones chartistas básicos (Soportes/Resistencias y Canales/Triángulos)
    a partir de los pivotes calculados.
    """
    pivots = calculate_zigzag(df)
    
    high_pivots = [p for p in pivots if p[2] == 'HIGH']
    low_pivots = [p for p in pivots if p[2] == 'LOW']
    
    # Análisis básico de soportes y resistencias horizontales por cercanía
    resistance_levels = [p[1] for p in high_pivots[-3:]] if len(high_pivots) >= 3 else []
    support_levels = [p[1] for p in low_pivots[-3:]] if len(low_pivots) >= 3 else []
    
    detected_patterns = []
    
    # Detección simple de triángulo o canal si hay suficientes pivotes
    if len(high_pivots) >= 2 and len(low_pivots) >= 2:
        h1, h2 = high_pivots[-2][1], high_pivots[-1][1]
        l1, l2 = low_pivots[-2][1], low_pivots[-1][1]
        
        if h2 < h1 and l2 > l1:
            detected_patterns.append({"pattern": "Triángulo Simétrico / Squeeze", "confidence": 0.85})
        elif h2 < h1 and l2 < l1:
            detected_patterns.append({"pattern": "Cuña Bajista / Canal Descendente", "confidence": 0.78})
        elif h2 > h1 and l2 > l1:
            detected_patterns.append({"pattern": "Cuña Alcista / Canal Ascendente", "confidence": 0.78})

    return {
        "pivots": [[int(idx), float(price), kind] for idx, price, kind in pivots],
        "supports": [float(level) for level in support_levels],
        "resistances": [float(level) for level in resistance_levels],
        "patterns": detected_patterns,
    }