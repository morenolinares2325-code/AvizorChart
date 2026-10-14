
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

from modulos.datos import descargar_ohlcv, obtener_fundamentales, obtener_universo_base
from modulos.analisis import (
    calcular_rsi,
    calcular_ema,
    calcular_macd,
    calcular_supertrend,
    ta_atr_simple,
    detectar_cruce_macd,
    detectar_cruce_supertrend,
    detectar_cruce_precio_ema,
    detectar_niveles,
    detectar_patron_geometrico,
    calcular_compresion,
    estimar_dias_hasta_ruptura,
    FIABILIDAD_PATRONES,
    EVENTOS_ALCISTAS,
    EVENTOS_BAJISTAS,
)
from modulos import agentes

router = APIRouter(prefix="/api", tags=["Screener y Agentes"])


# =============================================================================
# MODELO DE ENTRADA PARA EL BARRIDO
# =============================================================================
class ScreenerFiltros(BaseModel):
    timeframe: str = "1H"
    limite_activos: int = 15          # Cuántos tickers del universo procesar
    score_minimo: int = 50            # Puntuación mínima técnica
    solo_alcistas: bool = True         # Solo setups de compra (BUY)


# =============================================================================
# LÓGICA DE ANÁLISIS DE UN TICKER INDIVIDUAL
# =============================================================================
def procesar_analisis_ticker(ticker: str, timeframe: str = "1H"):
    df = descargar_ohlcv(ticker, timeframe=timeframe)
    if df is None or len(df) < 50:
        return None

    p_act = float(df['Close'].iloc[-1])
    rsi_serie = calcular_rsi(df, 14)
    rsi_v = float(rsi_serie.iloc[-1])
    rsi_prev = float(rsi_serie.iloc[-2])

    ema_serie = calcular_ema(df, 19)
    ema_v = float(ema_serie.iloc[-1])
    cruce_ema = detectar_cruce_precio_ema(df['Close'], ema_serie, 3)

    dir_st, atr_s, banda_st = calcular_supertrend(df, 14, 3.0)
    cruce_st = detectar_cruce_supertrend(dir_st, 3)
    atr_v = float(atr_s.iloc[-1])
    if atr_v <= 0 or np.isnan(atr_v):
        return None

    macd_l, signal_l = calcular_macd(df, 12, 26, 9)
    cruce_macd = detectar_cruce_macd(macd_l, signal_l, 3)

    media_vol20 = df['Volume'].tail(20).mean()
    vol_relativo = float(df['Volume'].iloc[-1] / media_vol20) if media_vol20 > 0 else 1.0

    sop, res, d_res, d_sop, evento_p = detectar_niveles(df, ventana=40)
    patron_geo = detectar_patron_geometrico(df, ventana=15)
    fiab_patron = FIABILIDAD_PATRONES.get(patron_geo, "—")

    senales_bull = sum([cruce_ema == "alcista", cruce_st == "alcista", cruce_macd == "alcista", evento_p in EVENTOS_ALCISTAS])
    senales_bear = sum([cruce_ema == "bajista", cruce_st == "bajista", cruce_macd == "bajista", evento_p in EVENTOS_BAJISTAS])

    dist_res_pct = ((res - p_act) / p_act) * 100 if res > p_act else 999
    dist_sop_pct = ((p_act - sop) / p_act) * 100 if sop < p_act else 999

    if senales_bull >= senales_bear:
        nivel_clave = res if res > p_act else None
        direccion_nivel = "resistencia"
        distancia_pct = dist_res_pct
        direccion = "Alcista 🟢"
        accion = "BUY"
    else:
        nivel_clave = sop if sop < p_act else None
        direccion_nivel = "soporte"
        distancia_pct = dist_sop_pct
        direccion = "Bajista 🔴"
        accion = "SELL"

    distancia_atr = (distancia_pct / 100 * p_act) / atr_v if atr_v > 0 else 999
    atr_pct = (atr_v / p_act) * 100
    factor_comp = calcular_compresion(df)

    ruptura_reciente = False
    dias_desde_ruptura = None
    if direccion_nivel == "resistencia":
        for i in range(1, 4):
            if df['Close'].iloc[-i] > res:
                ruptura_reciente = True
                dias_desde_ruptura = i - 1
                break
    else:
        for i in range(1, 4):
            if df['Close'].iloc[-i] < sop:
                ruptura_reciente = True
                dias_desde_ruptura = i - 1
                break

    if ruptura_reciente and dias_desde_ruptura is not None and dias_desde_ruptura <= 2:
        tipo_setup = "ruptura_fresca"
    elif distancia_pct < 1.0 and factor_comp < 0.75:
        tipo_setup = "inminente"
    elif distancia_pct < 3.0 and patron_geo not in ("Sin patrón claro", "Datos insuficientes"):
        tipo_setup = "patron_listo"
    else:
        tipo_setup = "vigilar"

    if tipo_setup == "ruptura_fresca":
        modalidad = "MERCADO" if distancia_atr < 0.3 else "LIMIT"
        dias_estimados = "ya roto"
        estado_visual = "🔥 ROMPIENDO AHORA" if dias_desde_ruptura == 0 else "🎯 RECIÉN ROTO"
    elif tipo_setup == "inminente":
        modalidad = "STOP"
        dias_estimados = estimar_dias_hasta_ruptura(distancia_pct, atr_pct, factor_comp)
        estado_visual = "⏳ INMINENTE"
    else:
        modalidad = "VIGILAR"
        dias_estimados = estimar_dias_hasta_ruptura(distancia_pct, atr_pct, factor_comp)
        estado_visual = "👀 VIGILAR"

    # Score cuantitativo
    score = 50
    if tipo_setup == "ruptura_fresca": score += 25
    elif tipo_setup == "inminente": score += 20
    if distancia_pct < 1.0: score += 15
    if fiab_patron == "Alta": score += 10
    score = min(100, score)

    # Parámetros de gestión y riesgo
    sl = p_act - (atr_v * 1.5) if accion == "BUY" else p_act + (atr_v * 1.5)
    tp1 = p_act + (atr_v * 2.0) if accion == "BUY" else p_act - (atr_v * 2.0)
    tp2 = p_act + (atr_v * 3.5) if accion == "BUY" else p_act - (atr_v * 3.5)
    riesgo_u = abs(p_act - sl)
    ratio_rb = abs(tp1 - p_act) / riesgo_u if riesgo_u > 0 else 1.0

    return {
        "ticker": ticker,
        "precio": round(p_act, 2),
        "direccion": direccion,
        "accion": accion,
        "score": score,
        "tipo_setup": tipo_setup,
        "estado_visual": estado_visual,
        "modalidad": modalidad,
        "nivel_clave": round(nivel_clave, 2) if nivel_clave else round(p_act, 2),
        "distancia_pct": round(distancia_pct, 2) if distancia_pct != 999 else 0.0,
        "distancia_atr": round(distancia_atr, 2) if distancia_atr != 999 else 0.0,
        "dias_estimados": dias_estimados,
        "atr": round(atr_v, 2),
        "rsi": round(rsi_v, 1),
        "patron": patron_geo,
        "fiabilidad": fiab_patron,
        "cruce_ema": cruce_ema or "neutro",
        "cruce_supertrend": cruce_st or "neutro",
        "cruce_macd": cruce_macd or "neutro",
        "vol_relativo": round(vol_relativo, 2),
        "ejecucion": {
            "entrada": round(p_act, 2),
            "sl": round(sl, 2),
            "tp1": round(tp1, 2),
            "tp2": round(tp2, 2),
            "ratio_rb": round(ratio_rb, 2)
        }
    }


# =============================================================================
# ENDPOINT 1: ANÁLISIS DE UN TICKER INDIVIDUAL
# =============================================================================
@router.get("/analizar/{ticker}")
def analizar_ticker(ticker: str, timeframe: str = Query("1H", description="1H, 2H, 3H, 4H, 1D, 1S")):
    ticker_clean = ticker.strip().upper()
    resultado = procesar_analisis_ticker(ticker_clean, timeframe=timeframe)
    if not resultado:
        raise HTTPException(status_code=404, detail=f"No se pudieron obtener datos para {ticker_clean}")
    return resultado


# =============================================================================
# ENDPOINT 2: BARRIDO MASIVO DEL SCREENER
# =============================================================================
@router.post("/screener/barrido")
def ejecutar_screener(filtros: ScreenerFiltros):
    universo = obtener_universo_base()
    muestra = universo[:filtros.limite_activos]
    candidatas = []

    for ticker in muestra:
        try:
            res = procesar_analisis_ticker(ticker, timeframe=filtros.timeframe)
            if not res:
                continue
            if filtros.solo_alcistas and res["accion"] != "BUY":
                continue
            if res["score"] >= filtros.score_minimo:
                candidatas.append(res)
        except Exception:
            continue

    candidatas.sort(key=lambda x: x["score"], reverse=True)

    return {
        "total_escaneados": len(muestra),
        "total_candidatas": len(candidatas),
        "candidatas": candidatas
    }


# =============================================================================
# ENDPOINT 3: CONSULTA A LOS 8 AGENTES IA (GROQ)
# =============================================================================
@router.get("/agentes/{ticker}")
def obtener_dictamenes_agentes(ticker: str, timeframe: str = Query("1H")):
    ticker_clean = ticker.strip().upper()
    tecnico = procesar_analisis_ticker(ticker_clean, timeframe=timeframe)
    if not tecnico:
        raise HTTPException(status_code=404, detail="Error al calcular métricas técnicas del activo")

    fund = obtener_fundamentales(ticker_clean) or {}

    datos_ia = {
        "precio": tecnico["precio"],
        "tipo_setup": tecnico["tipo_setup"],
        "estado_visual": tecnico["estado_visual"],
        "nivel_clave": tecnico["nivel_clave"],
        "distancia_pct": tecnico["distancia_pct"],
        "distancia_atr": tecnico["distancia_atr"],
        "patron": tecnico["patron"],
        "fiabilidad": tecnico["fiabilidad"],
        "atr": tecnico["atr"],
        "rsi": tecnico["rsi"],
        "cruce_ema": tecnico["cruce_ema"],
        "cruce_supertrend": tecnico["cruce_supertrend"],
        "cruce_macd": tecnico["cruce_macd"],
        "sector": fund.get("sector", "N/D"),
        "per": fund.get("per", "N/D"),
        "roe": round(fund.get("roe", 0) * 100, 1) if fund.get("roe") else "N/D",
        "margen_neto": round(fund.get("margen_neto", 0) * 100, 1) if fund.get("margen_neto") else "N/D",
        "deuda": round(fund.get("deuda_equity", 0), 1) if fund.get("deuda_equity") else "N/D",
        "crec_ventas": round(fund.get("crecimiento_ventas", 0) * 100, 1) if fund.get("crecimiento_ventas") else "N/D",
        "pais": fund.get("pais", "N/D"),
        "beta": fund.get("beta", "N/D"),
        "earnings_date": fund.get("earnings_date", "N/D"),
        "dividend_date": fund.get("dividend_date", "N/D"),
        "held_institutions": f"{round(fund.get('held_institutions', 0)*100, 1)}%" if fund.get("held_institutions") else "N/D",
        "held_insiders": f"{round(fund.get('held_insiders', 0)*100, 1)}%" if fund.get("held_insiders") else "N/D",
        "short_pct_float": f"{round(fund.get('short_pct_float', 0)*100, 1)}%" if fund.get("short_pct_float") else "N/D",
        "short_ratio": fund.get("short_ratio", "N/D"),
        "recommendation_mean": fund.get("recommendation_mean", "N/D"),
        "accion": tecnico["accion"],
        "entrada": tecnico["ejecucion"]["entrada"],
        "modalidad": tecnico["modalidad"],
        "sl": tecnico["ejecucion"]["sl"],
        "tp1": tecnico["ejecucion"]["tp1"],
        "tp2": tecnico["ejecucion"]["tp2"],
        "ratio_rb": tecnico["ejecucion"]["ratio_rb"],
        "acciones": 50,
        "riesgo_max_dinero": 200,
        "nivel_entrada": tecnico["nivel_clave"],
        "distancia_entrada_pct": tecnico["distancia_pct"],
        "score": tecnico["score"]
    }

    d_david = agentes.dictamen_david(ticker_clean, datos_ia)
    d_marcus = agentes.dictamen_marcus(ticker_clean, datos_ia)
    d_elena = agentes.dictamen_elena(ticker_clean, datos_ia)
    d_arthur = agentes.dictamen_arthur(ticker_clean, datos_ia)
    d_sarah = agentes.dictamen_sarah(ticker_clean, datos_ia)
    d_viktor = agentes.dictamen_viktor(ticker_clean, datos_ia)
    d_adrian = agentes.dictamen_adrian(ticker_clean, datos_ia)

    resumen_equipo = {
        "marcus": d_marcus,
        "elena": d_elena,
        "viktor": d_viktor
    }
    d_diana = agentes.dictamen_diana(ticker_clean, datos_ia, resumen_equipo)

    return {
        "ticker": ticker_clean,
        "datos_tecnicos": tecnico,
        "dictamenes": {
            "david": {"agente": "David Chen", "rol": "Ojeador", "dictamen": d_david},
            "marcus": {"agente": "Marcus Vance", "rol": "Analista Técnico", "dictamen": d_marcus},
            "elena": {"agente": "Elena Rostova", "rol": "Fundamental", "dictamen": d_elena},
            "arthur": {"agente": "Arthur Pendelton", "rol": "Macro & Eventos", "dictamen": d_arthur},
            "sarah": {"agente": "Sarah Jenkins", "rol": "Sentimiento", "dictamen": d_sarah},
            "viktor": {"agente": "Viktor Krum", "rol": "Gestión de Riesgo", "dictamen": d_viktor},
            "adrian": {"agente": "Adriana Vega", "rol": "Seguimiento", "dictamen": d_adrian},
            "diana": {"agente": "José Moreno", "rol": "Director General", "dictamen": d_diana}
        }
    }
