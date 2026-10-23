from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import feedparser
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import hashlib
import re
from typing import Optional, List, Dict, Any
import math
import urllib.request

app = FastAPI(
    title="AvizorChart Pro Backend Engine",
    description="Motor de análisis bursátil, gráficos multiactivo y agregador RSS de coste cero de IA",
    version="2.5.0"
)

# -------------------------------------------------------------------------
# CONFIGURACIÓN DE CORS (Conexión sin restricciones con Next.js)
# -------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------------
# CATÁLOGO MAESTRO DE ACTIVOS FINANCIEROS
# -------------------------------------------------------------------------
ASSET_CATALOG: Dict[str, List[Dict[str, str]]] = {
    "us_equities": [
        {"symbol": "AAPL", "name": "Apple Inc.", "category": "Tecnología"},
        {"symbol": "MSFT", "name": "Microsoft Corp.", "category": "Tecnología"},
        {"symbol": "NVDA", "name": "NVIDIA Corp.", "category": "Semiconductores"},
        {"symbol": "AMZN", "name": "Amazon.com Inc.", "category": "Consumo Discrecional"},
        {"symbol": "GOOGL", "name": "Alphabet Inc.", "category": "Tecnología"},
        {"symbol": "META", "name": "Meta Platforms Inc.", "category": "Redes / Software"},
        {"symbol": "TSLA", "name": "Tesla Inc.", "category": "Automoción"},
        {"symbol": "BRK-B", "name": "Berkshire Hathaway", "category": "Financiero"},
        {"symbol": "JPM", "name": "JPMorgan Chase & Co.", "category": "Banca"},
        {"symbol": "V", "name": "Visa Inc.", "category": "Financiero"},
        {"symbol": "UNH", "name": "UnitedHealth Group", "category": "Salud"},
        {"symbol": "LLY", "name": "Eli Lilly and Co.", "category": "Farmacéutica"},
        {"symbol": "WMT", "name": "Walmart Inc.", "category": "Consumo Básico"},
        {"symbol": "XOM", "name": "Exxon Mobil Corp.", "category": "Energía"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "category": "Semiconductores"},
        {"symbol": "INTC", "name": "Intel Corp.", "category": "Semiconductores"},
        {"symbol": "PLTR", "name": "Palantir Tech", "category": "Big Data / IA"},
        {"symbol": "BABA", "name": "Alibaba Group", "category": "E-Commerce"},
        {"symbol": "DIS", "name": "Walt Disney Co.", "category": "Entretenimiento"},
        {"symbol": "NFLX", "name": "Netflix Inc.", "category": "Streaming"}
    ],
    "indices": [
        {"symbol": "^GSPC", "name": "S&P 500 (EE.UU.)", "category": "Índice Global"},
        {"symbol": "^IXIC", "name": "Nasdaq Composite", "category": "Índice Tecnológico"},
        {"symbol": "^DJI", "name": "Dow Jones Industrial", "category": "Índice Industrial"},
        {"symbol": "^RUT", "name": "Russell 2000", "category": "Small Caps"},
        {"symbol": "^IBEX", "name": "IBEX 35 (España)", "category": "Índice Europeo"},
        {"symbol": "^GDAXI", "name": "DAX 40 (Alemania)", "category": "Índice Europeo"},
        {"symbol": "^FCHI", "name": "CAC 40 (Francia)", "category": "Índice Europeo"},
        {"symbol": "^FTSE", "name": "FTSE 100 (Reino Unido)", "category": "Índice Europeo"},
        {"symbol": "^N225", "name": "Nikkei 225 (Japón)", "category": "Índice Asiático"},
        {"symbol": "^HSI", "name": "Hang Seng (Hong Kong)", "category": "Índice Asiático"},
        {"symbol": "^STOXX50E", "name": "Euro Stoxx 50", "category": "Índice Europeo"}
    ],
    "forex": [
        # Mayores
        {"symbol": "EURUSD=X", "name": "EUR / USD", "category": "Mayor"},
        {"symbol": "GBPUSD=X", "name": "GBP / USD", "category": "Mayor"},
        {"symbol": "USDJPY=X", "name": "USD / JPY", "category": "Mayor"},
        {"symbol": "AUDUSD=X", "name": "AUD / USD", "category": "Mayor"},
        {"symbol": "USDCAD=X", "name": "USD / CAD", "category": "Mayor"},
        {"symbol": "USDCHF=X", "name": "USD / CHF", "category": "Mayor"},
        {"symbol": "NZDUSD=X", "name": "NZD / USD", "category": "Mayor"},
        # Cruces Europeos
        {"symbol": "EURGBP=X", "name": "EUR / GBP", "category": "Cruce"},
        {"symbol": "EURJPY=X", "name": "EUR / JPY", "category": "Cruce"},
        {"symbol": "EURAUD=X", "name": "EUR / AUD", "category": "Cruce"},
        {"symbol": "EURCAD=X", "name": "EUR / CAD", "category": "Cruce"},
        {"symbol": "EURCHF=X", "name": "EUR / CHF", "category": "Cruce"},
        # Cruces Libra
        {"symbol": "GBPJPY=X", "name": "GBP / JPY", "category": "Cruce"},
        {"symbol": "GBPAUD=X", "name": "GBP / AUD", "category": "Cruce"},
        {"symbol": "GBPCAD=X", "name": "GBP / CAD", "category": "Cruce"},
        {"symbol": "GBPCHF=X", "name": "GBP / CHF", "category": "Cruce"},
        # Cruces Pacífico & Asia
        {"symbol": "AUDJPY=X", "name": "AUD / JPY", "category": "Cruce"},
        {"symbol": "AUDCAD=X", "name": "AUD / CAD", "category": "Cruce"},
        {"symbol": "AUDCHF=X", "name": "AUD / CHF", "category": "Cruce"},
        {"symbol": "AUDNZD=X", "name": "AUD / NZD", "category": "Cruce"},
        {"symbol": "CADJPY=X", "name": "CAD / JPY", "category": "Cruce"},
        {"symbol": "CADCHF=X", "name": "CAD / CHF", "category": "Cruce"},
        {"symbol": "CHFJPY=X", "name": "CHF / JPY", "category": "Cruce"},
        {"symbol": "NZDJPY=X", "name": "NZD / JPY", "category": "Cruce"},
        {"symbol": "NZDCAD=X", "name": "NZD / CAD", "category": "Cruce"},
        {"symbol": "NZDCHF=X", "name": "NZD / CHF", "category": "Cruce"},
        # Exóticos
        {"symbol": "USDMXN=X", "name": "USD / MXN", "category": "Exótico"},
        {"symbol": "EURSEK=X", "name": "EUR / SEK", "category": "Exótico"},
        {"symbol": "EURNOK=X", "name": "EUR / NOK", "category": "Exótico"},
        {"symbol": "USDTRY=X", "name": "USD / TRY", "category": "Exótico"}
    ],
    "crypto": [
        {"symbol": "BTC-USD", "name": "Bitcoin", "category": "Cripto"},
        {"symbol": "ETH-USD", "name": "Ethereum", "category": "Cripto"},
        {"symbol": "SOL-USD", "name": "Solana", "category": "Cripto"},
        {"symbol": "BNB-USD", "name": "Binance Coin", "category": "Cripto"},
        {"symbol": "XRP-USD", "name": "Ripple", "category": "Cripto"},
        {"symbol": "ADA-USD", "name": "Cardano", "category": "Cripto"},
        {"symbol": "DOGE-USD", "name": "Dogecoin", "category": "Cripto"},
        {"symbol": "AVAX-USD", "name": "Avalanche", "category": "Cripto"},
        {"symbol": "LINK-USD", "name": "Chainlink", "category": "Cripto"},
        {"symbol": "SUI-USD", "name": "Sui", "category": "Cripto"},
        {"symbol": "DOT-USD", "name": "Polkadot", "category": "Cripto"},
        {"symbol": "NEAR-USD", "name": "NEAR Protocol", "category": "Cripto"},
        {"symbol": "MATIC-USD", "name": "Polygon", "category": "Cripto"},
        {"symbol": "LTC-USD", "name": "Litecoin", "category": "Cripto"},
        {"symbol": "UNI-USD", "name": "Uniswap", "category": "Cripto"},
        {"symbol": "ICP-USD", "name": "Internet Computer", "category": "Cripto"},
        {"symbol": "APT-USD", "name": "Aptos", "category": "Cripto"},
        {"symbol": "SHIB-USD", "name": "Shiba Inu", "category": "Cripto"},
        {"symbol": "XLM-USD", "name": "Stellar", "category": "Cripto"},
        {"symbol": "ATOM-USD", "name": "Cosmos", "category": "Cripto"}
    ],
    "commodities": [
        {"symbol": "GC=F", "name": "Oro (Gold Futures)", "category": "Metales Preciosos"},
        {"symbol": "SI=F", "name": "Plata (Silver Futures)", "category": "Metales Preciosos"},
        {"symbol": "PL=F", "name": "Platino (Platinum)", "category": "Metales Preciosos"},
        {"symbol": "PA=F", "name": "Paladio (Palladium)", "category": "Metales Industriales"},
        {"symbol": "HG=F", "name": "Cobre (Copper)", "category": "Metales Industriales"},
        {"symbol": "CL=F", "name": "Petróleo Crudo WTI", "category": "Energía"},
        {"symbol": "BZ=F", "name": "Petróleo Brent", "category": "Energía"},
        {"symbol": "NG=F", "name": "Gas Natural", "category": "Energía"}
    ]
}

# -------------------------------------------------------------------------
# FEEDS RSS AMPLIADOS Y REGLAS LÉXICAS DE IMPACTO
# -------------------------------------------------------------------------
RSS_FEEDS = {
    "CNBC Markets": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
    "Yahoo Finance": "https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC,%5EIXIC,SPY,QQQ&region=US&lang=en-US",
    "Yahoo MegaCaps": "https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,MSFT,NVDA,AMZN,GOOGL,META,TSLA,JPM,XOM&region=US&lang=en-US",
    "MarketWatch Top": "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "Investing.com": "https://www.investing.com/rss/news_301.rss",
    "Investing Macro": "https://www.investing.com/rss/news_285.rss",
}

SOURCE_ALIAS = {
    "CNBC Markets": "CNBC",
    "Yahoo Finance": "Yahoo Finance",
    "Yahoo MegaCaps": "Yahoo Finance",
    "MarketWatch Top": "MarketWatch",
    "Investing.com": "Investing",
    "Investing Macro": "Investing",
}

RSS_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    ),
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def parse_rss(url: str):
    request = urllib.request.Request(url, headers=RSS_HEADERS)
    with urllib.request.urlopen(request, timeout=12) as response:
        payload = response.read()
    return feedparser.parse(payload)


def published_iso(entry) -> str:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed:
        try:
            return datetime(*parsed[:6], tzinfo=timezone.utc).isoformat()
        except Exception:
            pass
    raw = entry.get("published") or entry.get("updated")
    if raw:
        try:
            return parsedate_to_datetime(str(raw)).astimezone(timezone.utc).isoformat()
        except Exception:
            return str(raw)
    return datetime.now(timezone.utc).isoformat()


def published_ts(value: str) -> float:
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()
    except Exception:
        try:
            return parsedate_to_datetime(value).timestamp()
        except Exception:
            return 0.0

KNOWN_CHART_TICKERS = {
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "GOOG", "META", "TSLA", "AMD", "AVGO",
    "JPM", "GS", "XOM", "UNH", "LLY", "NFLX", "INTC", "BA", "CAT", "WMT",
    "BTC-USD", "ETH-USD", "BTC", "ETH",
    "EURUSD=X", "GBPUSD=X", "USDJPY=X", "EURUSD", "GBPUSD", "USDJPY",
    "SPX", "NDX", "QQQ", "SPY", "IWM", "GLD", "USO",
}

NAME_TO_TICKER = {
    "NVIDIA": "NVDA",
    "APPLE": "AAPL",
    "MICROSOFT": "MSFT",
    "AMAZON": "AMZN",
    "TESLA": "TSLA",
    "ALPHABET": "GOOGL",
    "GOOGLE": "GOOGL",
    "BITCOIN": "BTC-USD",
    "ETHEREUM": "ETH-USD",
    "GOLDMAN": "GS",
    "JPMORGAN": "JPM",
    "MORGAN STANLEY": "MS",
    "NETFLIX": "NFLX",
    "INTEL": "INTC",
    "DELL": "DELL",
}

KEYWORDS_HIGH_IMPACT = [
    "fed", "inflation", "cpi", "rate hike", "rate cut", "nvidia", "earnings",
    "crash", "surge", "war", "tariff", "sec", "treasury", "yield", "biden",
    "trump", "powell", "geopolitical", "opec", "bankruptcy", "default",
    "nfp", "payrolls", "ecb", "boj", "gdp", "pce", "fomc",
]

KEYWORDS_MACRO = [
    "fed", "inflation", "cpi", "rate hike", "rate cut", "treasury", "yield",
    "powell", "ecb", "boj", "nfp", "payrolls", "gdp", "pce", "opec", "tariff",
    "geopolitical", "war", "fomc", "macro", "central bank", "interest rate",
]

KEYWORDS_EARNINGS = [
    "earnings", "results", "revenue", "guidance", "eps", "dividend", "buyback",
    "ipo", "merger", "acquisition", "beat estimates", "miss", "10-q", "10-k",
    "corporate", "profit", "quarter", "q1", "q2", "q3", "q4",
]

KEYWORDS_BULLISH = [
    "gain", "surge", "beat", "rally", "rise", "record", "growth", "profit",
    "jump", "soar", "bull", "upgrade", "outperform", "dividend", "breakout",
    "expansion", "boost", "positive", "high"
]

KEYWORDS_BEARISH = [
    "drop", "fall", "plunge", "miss", "recession", "loss", "crash", "slump",
    "down", "bear", "downgrade", "warning", "decline", "selloff", "inflation",
    "deficit", "tumble", "debt", "risk", "layoffs"
]

EXCLUDED_TICKERS = {
    "THE", "FOR", "AND", "NEW", "FED", "CPI", "USA", "SEC", "CEO", "WAR",
    "AI", "US", "UK", "EU", "TOP", "GDP", "NOW", "WHY", "HOW", "ALL", "ARE",
    "BIG", "CAN", "DAY", "DUE", "GET", "HAS", "ITS", "KEY", "MAY", "NOT",
    "ONE", "OUT", "SEE", "SET", "TWO", "WHO", "JOB", "PMI", "PCE", "ETF"
}

def _score_jitter(text: str) -> int:
    digest = hashlib.md5(text.encode("utf-8")).hexdigest()
    return int(digest[:8], 16)


def analyze_sentiment_and_impact(text: str):
    text_lower = text.lower()
    bullish_hits = sum(1 for word in KEYWORDS_BULLISH if word in text_lower)
    bearish_hits = sum(1 for word in KEYWORDS_BEARISH if word in text_lower)
    seed = _score_jitter(text_lower)

    if bullish_hits > bearish_hits:
        sentiment = "Bullish"
        base = 58 + min(bullish_hits, 5) * 5
        score = min(97, max(54, base + (seed % 19) - 9))
    elif bearish_hits > bullish_hits:
        sentiment = "Bearish"
        base = 58 + min(bearish_hits, 5) * 5
        score = min(97, max(54, base + (seed % 19) - 9))
    else:
        sentiment = "Neutral"
        score = 31 + (seed % 33)

    is_high = any(keyword in text_lower for keyword in KEYWORDS_HIGH_IMPACT)
    impact = "high" if is_high else ("medium" if (bullish_hits + bearish_hits) > 0 else "low")
    return sentiment, score, impact


def classify_desk_category(text: str) -> str:
    text_lower = text.lower()
    if any(keyword in text_lower for keyword in KEYWORDS_MACRO):
        return "macro"
    if any(keyword in text_lower for keyword in KEYWORDS_EARNINGS):
        return "earnings"
    return "general"


def extract_tickers(text: str) -> list[str]:
    upper = text.upper()
    found: list[str] = []

    def add(symbol: str) -> None:
        if symbol and symbol not in EXCLUDED_TICKERS and symbol not in found:
            found.append(symbol)

    for tag in re.findall(r"\$([A-Z]{1,5}(?:-[A-Z]{2,4})?(?:=X)?)", upper):
        add(tag)
    for tag in re.findall(r"\b(BTC-USD|ETH-USD|EURUSD=X|GBPUSD=X|USDJPY=X|EURUSD|GBPUSD|USDJPY)\b", upper):
        add(tag)
    for name, ticker in NAME_TO_TICKER.items():
        if re.search(rf"\b{re.escape(name)}\b", upper):
            add(ticker)
    for ticker in KNOWN_CHART_TICKERS:
        if re.search(rf"\b{re.escape(ticker)}\b", upper):
            add(ticker)
    return found[:4]


from api.market import (
    ALLOWED_PERIODS,
    router as market_router,
    _clamp_period,
    _flatten_ohlcv,
    _resolve_interval,
    _resample_ohlcv,
    _sanitize_ticker,
)
from pattern_detection import detect_chart_patterns
from api.academy import router as academy_router

app.include_router(market_router)
app.include_router(academy_router)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "AvizorChart Engine",
        "endpoints": [
            "/api/market/history",
            "/api/market/candles",
            "/api/market/news",
            "/api/patterns/{ticker}",
            "/api/builder/transpile",
            "/api/builder/convert",
            "/api/academy/coach",
        ],
    }


@app.get("/api/market/news")
def get_free_market_news(
    source: Optional[str] = Query(None, description="Filtrar por fuente"),
    ticker: Optional[str] = Query(None, description="Filtrar por mención de ticker"),
):
    articles = []
    if source:
        feeds_to_fetch = {
            key: url
            for key, url in RSS_FEEDS.items()
            if key == source or SOURCE_ALIAS.get(key) == source
        } or RSS_FEEDS
    else:
        feeds_to_fetch = RSS_FEEDS

    seen: set[str] = set()
    for source_name, url in feeds_to_fetch.items():
        try:
            feed = parse_rss(url)
            for entry in feed.entries[:18]:
                title = entry.get("title", "")
                summary = entry.get("summary", "")
                link = entry.get("link", "#")
                article_id = str(entry.get("id") or link or title)
                if article_id in seen:
                    continue
                seen.add(article_id)
                full_text = f"{title} {summary}"
                detected_tickers = extract_tickers(full_text)
                if ticker and ticker.upper() not in detected_tickers and ticker.lower() not in full_text.lower():
                    continue
                sentiment, score, impact = analyze_sentiment_and_impact(full_text)
                category = classify_desk_category(full_text)
                if category == "macro" and impact == "low":
                    impact = "high"
                articles.append(
                    {
                        "id": article_id,
                        "source": SOURCE_ALIAS.get(source_name, source_name),
                        "title": title,
                        "summary": summary,
                        "url": link,
                        "published": published_iso(entry),
                        "tickers": detected_tickers,
                        "sentiment": sentiment,
                        "score": score,
                        "impact": impact,
                        "category": category,
                    }
                )
        except Exception:
            continue

    articles.sort(key=lambda item: published_ts(str(item.get("published", ""))), reverse=True)
    return {"count": len(articles), "articles": articles}


@app.get("/api/patterns/{ticker}")
def get_chart_patterns(
    ticker: str,
    period: Optional[str] = Query(None, description="Periodo yfinance alineado con el gráfico"),
    interval: str = Query("1d", description="Intervalo del Mega Gráfico"),
):
    """Soportes, resistencias y patrones chartistas a partir de velas Yahoo Finance."""
    symbol = _sanitize_ticker(ticker)
    interval_key = interval.strip().lower()
    if interval_key in {"1s", "s"}:
        interval_key = "1w"
    source_interval, default_period, resample_rule, _include_time = _resolve_interval(interval_key)
    requested_period = (period or default_period).strip().lower()
    if requested_period not in ALLOWED_PERIODS:
        requested_period = default_period
    resolved_period = _clamp_period(source_interval, requested_period)

    try:
        history = yf.Ticker(symbol).history(
            period=resolved_period,
            interval=source_interval,
            auto_adjust=True,
            actions=False,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fallo al descargar {symbol}: {exc}") from exc

    if history is None or history.empty:
        raise HTTPException(status_code=404, detail=f"No se encontraron datos para {symbol}")

    frame = _flatten_ohlcv(history)
    if resample_rule:
        frame = _resample_ohlcv(frame, resample_rule)
    if frame.empty:
        raise HTTPException(status_code=404, detail=f"Sin OHLCV válido para {symbol}")

    return {
        "ticker": symbol,
        "status": "success",
        "period": resolved_period,
        "interval": interval_key,
        "data": detect_chart_patterns(frame),
    }


class BuilderTranspileBody(BaseModel):
    source: str = Field(..., min_length=1, description="Código Pine Script o MQL5")
    name: Optional[str] = Field(None, description="Nombre sugerido del indicador")


@app.post("/api/builder/transpile")
@app.post("/api/builder/convert")
def builder_transpile(payload: BuilderTranspileBody):
    """Parser estructural (metadatos/inputs/indicadores) + IA de lógica → TypeScript ECharts."""
    from parsers.mql5_parser import RobustMQL5Parser
    from parsers.pine_parser import RobustPineScriptParser
    from parsers.transpile_core import detect_language, transpile

    source = (payload.source or "").strip()
    if not source:
        raise HTTPException(status_code=400, detail="El código Pine o MQL5 está vacío.")
    language = detect_language(source)
    try:
        if language == "mql5":
            RobustMQL5Parser(source).parse()
        elif language == "pine":
            RobustPineScriptParser(source).parse()
        result = transpile(source, payload.name or "")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Fallo al convertir con el parser Python: {exc}") from exc
    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)