"""
Carga de universos de tickers.
Acciones, Forex, Índices, Metales, Cripto.
"""

import streamlit as st
import requests
import io
import pandas as pd


@st.cache_data(ttl=7 * 86400, show_spinner=False)
def cargar_universo_acciones():
    """Carga S&P 500 + Nasdaq 100 + NYSE desde Wikipedia."""
    tickers = set()
    headers = {"User-Agent": "Mozilla/5.0"}

    # S&P 500
    try:
        r = requests.get(
            "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
            headers=headers, timeout=15
        )
        df_sp = pd.read_html(io.StringIO(r.text))[0]
        col = "Symbol" if "Symbol" in df_sp.columns else df_sp.columns[0]
        tickers.update(
            df_sp[col].astype(str).str.strip().str.replace(".", "-", regex=False).tolist()
        )
    except Exception:
        pass

    # Nasdaq 100
    try:
        r2 = requests.get(
            "https://en.wikipedia.org/wiki/Nasdaq-100",
            headers=headers, timeout=15
        )
        for t in pd.read_html(io.StringIO(r2.text)):
            for col_n in ["Ticker", "Symbol"]:
                if col_n in t.columns and len(t) > 50:
                    tickers.update(
                        t[col_n].astype(str).str.strip().str.replace(".", "-", regex=False).tolist()
                    )
                    break
    except Exception:
        pass

    return sorted({t for t in tickers if es_ticker_valido(t)})


@st.cache_data(ttl=7 * 86400, show_spinner=False)
def cargar_universo_forex():
    """Pares de divisas mayores, menores y exóticos."""
    return [
        "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "AUDUSD=X",
        "NZDUSD=X", "USDCAD=X", "EURGBP=X", "EURJPY=X", "GBPJPY=X",
        "EURCHF=X", "EURAUD=X", "EURCAD=X", "EURNZD=X", "GBPAUD=X",
        "GBPCAD=X", "GBPCHF=X", "GBPNZD=X", "AUDJPY=X", "AUDCAD=X",
        "AUDCHF=X", "AUDNZD=X", "CADJPY=X", "CADCHF=X", "CHFJPY=X",
        "NZDJPY=X", "NZDCAD=X", "NZDCHF=X", "USDSEK=X", "USDNOK=X",
        "USDMXN=X", "USDZAR=X", "USDTRY=X", "USDPLN=X", "USDHUF=X",
    ]


@st.cache_data(ttl=7 * 86400, show_spinner=False)
def cargar_universo_indices():
    """Índices globales."""
    return [
        "^GSPC",    # S&P 500
        "^NDX",     # Nasdaq 100
        "^DJI",     # Dow Jones
        "^RUT",     # Russell 2000
        "^VIX",     # VIX
        "^FTSE",    # FTSE 100 (UK)
        "^GDAXI",   # DAX (Alemania)
        "^FCHI",    # CAC 40 (Francia)
        "^STOXX50E",  # Euro Stoxx 50
        "^IBEX",    # IBEX 35 (España)
        "^FTSEMIB",  # FTSE MIB (Italia)
        "^N225",    # Nikkei 225 (Japón)
        "^HSI",     # Hang Seng (Hong Kong)
        "^KS11",    # KOSPI (Corea)
        "^AXJO",    # ASX 200 (Australia)
        "^BSESN",   # BSE Sensex (India)
        "^BVSP",    # Bovespa (Brasil)
        "^MXX",     # IPC (México)
    ]


@st.cache_data(ttl=7 * 86400, show_spinner=False)
def cargar_universo_metales():
    """Metales preciosos e industriales."""
    return [
        "GC=F",   # Oro
        "SI=F",   # Plata
        "PL=F",   # Platino
        "PA=F",   # Paladio
        "HG=F",   # Cobre
        "ALI=F",  # Aluminio
        "ZN=F",   # Zinc
        "NI=F",   # Níquel
        "PB=F",   # Plomo
        "SN=F",   # Estaño
    ]


@st.cache_data(ttl=7 * 86400, show_spinner=False)
def cargar_universo_cripto():
    """Criptomonedas principales."""
    return [
        "BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD",
        "ADA-USD", "AVAX-USD", "DOT-USD", "MATIC-USD", "LINK-USD",
        "LTC-USD", "BCH-USD", "XLM-USD", "ATOM-USD", "ETC-USD",
        "FIL-USD", "APT-USD", "ARB-USD", "OP-USD", "INJ-USD",
        "NEAR-USD", "SUI-USD", "TIA-USD", "SEI-USD", "IMX-USD",
        "AAVE-USD", "MKR-USD", "CRV-USD", "UNI-USD", "SUSHI-USD",
        "DOGE-USD", "SHIB-USD", "PEPE-USD", "FLOKI-USD", "BONK-USD",
    ]


def es_ticker_valido(t):
    """Comprueba si un string parece un ticker válido."""
    if not t or not isinstance(t, str):
        return False
    t = t.strip().upper()
    if not (1 <= len(t) <= 10):
        return False
    return t.replace("-", "").replace(".", "").replace("=", "").replace("^", "").isalnum()
