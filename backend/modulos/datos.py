import io
import time
from datetime import datetime
import pandas as pd
import requests
import yfinance as yf

def parametros_descarga(timeframe: str):
    mapeo = {
        "1H": ("3mo", "1h", None),
        "2H": ("3mo", "1h", 2),
        "3H": ("3mo", "1h", 3),
        "4H": ("3mo", "1h", 4),
        "1D": ("1y", "1d", None),
        "1S": ("5y", "1wk", None)
    }
    return mapeo.get(timeframe, ("1y", "1d", None))

def resamplear_a_xh(df_1h: pd.DataFrame, horas: int) -> pd.DataFrame:
    return df_1h.copy().resample(f"{horas}h").agg({
        'Open': 'first',
        'High': 'max',
        'Low': 'min',
        'Close': 'last',
        'Volume': 'sum'
    }).dropna()

def descargar_ohlcv(ticker: str, timeframe: str = "1H"):
    periodo, intervalo, horas = parametros_descarga(timeframe)
    try:
        df = yf.download(ticker, period=periodo, interval=intervalo, progress=False, auto_adjust=True)
        if df is None or len(df) == 0:
            return None
        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df = df.dropna()
        if len(df) == 0:
            return None
        if horas is not None:
            df = resamplear_a_xh(df, horas)
        return df
    except Exception:
        return None

def es_ticker_valido(t: str) -> bool:
    if not t.replace("-", "").isalpha(): 
        return False
    if not (1 <= len(t) <= 6): 
        return False
    if "-" in t:
        partes = t.split("-")
        if len(partes) == 2 and 1 <= len(partes[1]) <= 2: 
            return False
    return True

def obtener_universo_base():
    """Descarga el universo de activos combinando S&P 500, Nasdaq-100 y NYSE."""
    tickers = set()
    headers = {"User-Agent": "Mozilla/5.0"}
    
    # 1. S&P 500
    try:
        r = requests.get("https://en.wikipedia.org/wiki/List_of_S%26P_500_companies", headers=headers, timeout=12)
        df_sp = pd.read_html(io.StringIO(r.text))[0]
        col = "Symbol" if "Symbol" in df_sp.columns else df_sp.columns[0]
        tickers.update(df_sp[col].astype(str).str.strip().str.replace(".", "-", regex=False).tolist())
    except Exception:
        pass
        
    # 2. Nasdaq-100
    try:
        r2 = requests.get("https://en.wikipedia.org/wiki/Nasdaq-100", headers=headers, timeout=12)
        for t in pd.read_html(io.StringIO(r2.text)):
            for col_n in ["Ticker", "Symbol"]:
                if col_n in t.columns and len(t) > 50:
                    tickers.update(t[col_n].astype(str).str.strip().str.replace(".", "-", regex=False).tolist())
                    break
    except Exception:
        pass

    # 3. NYSE
    try:
        r3 = requests.get("https://datahub.io/core/nyse-other-listings/r/nyse-listed.csv", timeout=20)
        if r3.status_code == 200:
            df_nyse = pd.read_csv(io.StringIO(r3.text))
            col_sym = "ACT Symbol" if "ACT Symbol" in df_nyse.columns else df_nyse.columns[1]
            tickers.update(df_nyse[col_sym].astype(str).str.strip().str.replace(".", "-", regex=False).tolist())
    except Exception:
        pass
        
    return sorted({t for t in tickers if es_ticker_valido(t)})

def obtener_fundamentales(ticker: str) -> dict:
    try:
        info = yf.Ticker(ticker).info
        g = lambda k, d=None: info.get(k, d)
        
        def ts_a_fecha(ts):
            try:
                if ts is None: return "N/D"
                return datetime.utcfromtimestamp(int(ts)).strftime("%Y-%m-%d")
            except Exception:
                return "N/D"
                
        return {
            "sector": g("sector", "N/D"),
            "industry": g("industry", "N/D"),
            "per": g("trailingPE"),
            "forward_pe": g("forwardPE"),
            "roe": g("returnOnEquity"),
            "margen_neto": g("profitMargins"),

"margen_bruto": g("grossMargins"),
            "deuda_equity": g("debtToEquity"),
            "market_cap": g("marketCap"),
            "volumen_medio": g("averageVolume"),
            "recomendacion": g("recommendationKey", "none"),
            "crecimiento_ventas": g("revenueGrowth"),
            "crecimiento_beneficios": g("earningsGrowth"),
            "pb": g("priceToBook"),
            "dividendo_yield": g("dividendYield"),
            "flujo_caja_libre": g("freeCashflow"),
            "current_ratio": g("currentRatio"),
            "beta": g("beta"),
            "earnings_date": ts_a_fecha(g("earningsTimestamp") or g("earningsTimestampStart")),
            "ex_dividend_date": ts_a_fecha(g("exDividendDate")),
            "dividend_date": ts_a_fecha(g("dividendDate")),
            "pais": g("country", "N/D"),
            "held_insiders": g("heldPercentInsiders"),
            "held_institutions": g("heldPercentInstitutions"),
            "short_ratio": g("shortRatio"),
            "short_pct_float": g("shortPercentOfFloat"),
            "recommendation_mean": g("recommendationMean"),
            "num_analysts": g("numberOfAnalystOpinions"),
            "target_mean_price": g("targetMeanPrice"),
            "target_high_price": g("targetHighPrice"),
            "target_low_price": g("targetLowPrice"),
            "current_price": g("currentPrice")
        }
    except Exception:
        return {}