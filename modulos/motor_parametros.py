"""
Motor dinámico de detección y edición de parámetros.
Detecta el tipo de indicador y renderiza los campos correspondientes.
"""

import streamlit as st


def detectar_tipo_indicador(nombre):
    """Detecta el tipo de indicador basándose en palabras clave."""
    n = nombre.lower()

    if any(x in n for x in ["rsi", "stochastic", "stoch", "cci", "williams",
                             "mfi", "tsi", "rmi", "connors", "fisher", "cmo",
                             "imi", "kdj", "wave"]):
        return "oscilador_acotado"

    if any(x in n for x in ["macd", "ppo", "trix", "kst", "schaff", "coppock",
                             "dpo", "bop"]):
        return "oscilador_central"

    if any(x in n for x in ["supertrend", "parabolic", "sar", "atr trailing",
                             "chande kroll", "chandelier", "range filter"]):
        return "trailing_stop"

    if any(x in n for x in ["sma", "ema", "wma", "dema", "tema", "hma", "vwma",
                             "alma", "kama", "zlema", "mcginley", "gmma",
                             "rainbow", "mama", "jma", "t3"]):
        return "media_movil"

    if any(x in n for x in ["keltner", "donchian", "bollinger", "std",
                             "desviacion", "bandwidth", "envelope", "starc"]):
        return "canal"

    if any(x in n for x in ["atr", "volatilidad", "natr", "true range", "adr",
                             "ulcer", "mass index", "garch", "parkinson"]):
        return "volatilidad"

    if any(x in n for x in ["volumen", "obv", "vwap", "cmf", "a/d", "eom",
                             "vpt", "nvi", "pvi", "klinger", "force", "twiggs",
                             "delta", "footprint", "open interest", "volume profile"]):
        return "volumen"

    if any(x in n for x in ["order block", "fvg", "fair value", "liquidity",
                             "bos", "choch", "cvd", "premium", "discount",
                             "supply", "demand", "sweep", "breaker", "killzone"]):
        return "smc"

    if any(x in n for x in ["gartley", "bat", "butterfly", "crab", "shark",
                             "cypher", "nen", "5-0", "ab=cd", "swan", "dragon"]):
        return "armonico"

    if any(x in n for x in ["hch", "doble", "triple", "cuña", "triangulo",
                             "triángulo", "doji", "engulfing", "hammer",
                             "morning", "evening", "soldiers", "crows",
                             "marubozu", "harami"]):
        return "patron"

    if any(x in n for x in ["avance", "mcclellan", "high-low", "percent",
                             "put/call", "yield", "vix", "dxy", "breadth"]):
        return "macro"

    if any(x in n for x in ["z-score", "skew", "kurtosis", "drawdown", "sharpe",
                             "hurst", "regression", "kalman", "fourier"]):
        return "estadistica"

    return "generico"


def render_editor_dinamico(indicador, key_idx):
    """Renderiza los campos de edición según el tipo detectado."""
    tipo = detectar_tipo_indicador(indicador)

    if tipo == "oscilador_acotado":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Periodo", 2, 100, 14, key=f"p_{key_idx}")
        with c2:
            st.number_input("Sobreventa (Compra)", 0, 50, 30, key=f"ov_{key_idx}")
        with c3:
            st.number_input("Sobrecompra (Venta)", 50, 100, 70, key=f"ob_{key_idx}")

    elif tipo == "oscilador_central":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Media Rápida", 2, 50, 12, key=f"r_{key_idx}")
        with c2:
            st.number_input("Media Lenta", 10, 120, 26, key=f"l_{key_idx}")
        with c3:
            st.number_input("Señal", 2, 30, 9, key=f"s_{key_idx}")

    elif tipo in ("media_movil", "canal"):
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Periodo / Longitud", 2, 500, 20, key=f"per_{key_idx}")
        with c2:
            st.selectbox("Condición", ["Precio Cruza Arriba", "Precio Cruza Abajo",
                                        "Precio por Encima", "Precio por Debajo"],
                          key=f"cd_{key_idx}")
        with c3:
            st.slider("Distancia Proximidad (%)", 0.1, 5.0, 1.2, 0.1, key=f"dist_{key_idx}")

    elif tipo == "trailing_stop":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Periodo ATR", 2, 50, 10, key=f"atr_p_{key_idx}")
        with c2:
            st.number_input("Multiplicador", 0.5, 8.0, 3.0, 0.5, key=f"m_{key_idx}")
        with c3:
            st.selectbox("Dirección", ["Solo Alcista", "Solo Bajista",
                                        "Cruce Reciente"], key=f"dir_{key_idx}")

    elif tipo == "volumen":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Media de Volumen", 5, 100, 20, key=f"v_per_{key_idx}")
        with c2:
            st.slider("Volumen Mínimo Relativo", 1.0, 5.0, 1.5, 0.1, key=f"v_rel_{key_idx}")
        with c3:
            st.selectbox("Anclaje VWAP", ["Sesión", "Semanal", "Mensual"],
                          key=f"anc_{key_idx}")

    elif tipo == "smc":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.selectbox("Tipo de Zona", ["Mitigación de Order Block",
                                           "Rebalanceo FVG",
                                           "Sweep de Liquidez",
                                           "Break of Structure"],
                          key=f"smc_t_{key_idx}")
        with c2:
            st.selectbox("Timeframe Origen", ["Auto", "1H", "4H", "1D"],
                          key=f"smc_tf_{key_idx}")
        with c3:
            st.slider("Tolerancia Imbalance (%)", 0.1, 2.0, 0.5, 0.1,
                      key=f"smc_tol_{key_idx}")

    elif tipo == "armonico":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.slider("Tolerancia Fibonacci (%)", 1.0, 10.0, 3.5, 0.5,
                      key=f"fib_tol_{key_idx}")
        with c2:
            st.number_input("Lookback (Velas)", 30, 300, 100, key=f"arm_lb_{key_idx}")
        with c3:
            st.selectbox("Dirección Patrón", ["Alcista (Buy)", "Bajista (Sell)",
                                               "Ambos"], key=f"arm_dir_{key_idx}")

    elif tipo == "estadistica":
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Ventana de Muestra", 10, 200, 30, key=f"est_per_{key_idx}")
        with c2:
            st.slider("Umbral Z-Score", -3.0, 3.0, 2.0, 0.1, key=f"est_z_{key_idx}")
        with c3:
            st.slider("Máximo Drawdown (%)", 5.0, 50.0, 15.0, 1.0,
                      key=f"est_dd_{key_idx}")

    else:
        c1, c2, c3 = st.columns(3)
        with c1:
            st.number_input("Periodo", 2, 200, 14, key=f"gen_p_{key_idx}")
        with c2:
            st.selectbox("Modo", ["Normal", "Sensibilidad Alta"],
                          key=f"gen_m_{key_idx}")
        with c3:
            st.slider("Umbral Filtro", 0.0, 100.0, 50.0, 1.0, key=f"gen_u_{key_idx}")
