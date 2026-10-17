import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

AGENTES = {
    "david": {"nombre": "David Chen", "rol": "Ojeador / Head Scout"},
    "marcus": {"nombre": "Marcus Vance", "rol": "Analista Técnico"},
    "elena": {"nombre": "Elena Rostova", "rol": "Analista Fundamental"},
    "arthur": {"nombre": "Arthur Pendelton", "rol": "Macro & Eventos"},
    "sarah": {"nombre": "Sarah Jenkins", "rol": "Sentimiento de Mercado"},
    "viktor": {"nombre": "Viktor Krum", "rol": "Gestor de Riesgo"},
    "adrian": {"nombre": "Adriana Vega", "rol": "Jefa de Seguimiento"},
    "diana": {"nombre": "José Moreno", "rol": "Director General / CEO"}
}

def llamar_ia(prompt: str) -> str:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return "⚠️ Falta la clave GROQ_API_KEY en el archivo .env."
        
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=350,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        return f"⚠️ Error en Groq: {str(e)[:150]}"

# --- DICTÁMENES DE LOS 8 AGENTES ---

def dictamen_david(ticker: str, d: dict) -> str:
    prompt = f"""Eres David Chen, Ojeador / Head Scout de AvizorChart. Has seleccionado esta candidata. Explica por qué pasó tu filtro.
Acción: {ticker} | Precio: ${d.get('precio')} | Setup: {d.get('tipo_setup')} | Estado: {d.get('estado_visual')}
Nivel: {d.get('nivel_clave')} | Distancia: {d.get('distancia_pct')}% ({d.get('distancia_atr')} ATR) | Patrón: {d.get('patron')}
Máximo 90 palabras. Tono directo de cazador de mercado. Sin preguntas finales."""
    return llamar_ia(prompt)

def dictamen_marcus(ticker: str, d: dict) -> str:
    prompt = f"""Eres Marcus Vance, Analista Técnico sobrio y frío.
Acción: {ticker} | Precio: ${d.get('precio')} | ATR: ${d.get('atr')} | RSI: {d.get('rsi')}
Cruce EMA19: {d.get('cruce_ema')} | Supertrend: {d.get('cruce_supertrend')} | MACD: {d.get('cruce_macd')}
Patrón: {d.get('patron')} ({d.get('fiabilidad')}) | Nivel: {d.get('nivel_clave')}
Lectura sobria de la acción del precio. Sin florituras. Máximo 90 palabras."""
    return llamar_ia(prompt)

def dictamen_elena(ticker: str, d: dict) -> str:
    prompt = f"""Eres Elena Rostova, Analista Fundamental de números fríos.
Acción: {ticker} | Sector: {d.get('sector')} | PER: {d.get('per')} | ROE: {d.get('roe')}%
Margen Neto: {d.get('margen_neto')}% | Deuda/Equity: {d.get('deuda')} | Crec. Ventas: {d.get('crec_ventas')}%
Evalúa la calidad del negocio. Máximo 90 palabras."""
    return llamar_ia(prompt)

def dictamen_arthur(ticker: str, d: dict) -> str:
    prompt = f"""Eres Arthur Pendelton, analista macro y catalizadores.
Acción: {ticker} | Sector: {d.get('sector')} | País: {d.get('pais')} | Beta: {d.get('beta')}
Próximos Earnings: {d.get('earnings_date')} | Dividendo: {d.get('dividend_date')}
Analiza riesgos de calendario y contexto macro. Máximo 90 palabras."""
    return llamar_ia(prompt)

def dictamen_sarah(ticker: str, d: dict) -> str:
    prompt = f"""Eres Sarah Jenkins, experta en posicionamiento de manos fuertes y sentimiento.
Acción: {ticker} | Institucionales: {d.get('held_institutions')} | Insiders: {d.get('held_insiders')}
Short float: {d.get('short_pct_float')} | Ratio cobertura: {d.get('short_ratio')} | Consenso analistas: {d.get('recommendation_mean')}
Diagnostica la psicología de los participantes. Máximo 90 palabras."""
    return llamar_ia(prompt)

def dictamen_viktor(ticker: str, d: dict) -> str:
    accion = d.get('accion', 'BUY')
prompt = f"""Eres Viktor Krum, Gestor de Riesgo marcial.
Empieza SIEMPRE con: {accion} en ${d.get('entrada')}
Modalidad: {d.get('modalidad')} | Stop Loss: ${d.get('sl')} | TP1: ${d.get('tp1')} | TP2: ${d.get('tp2')} | R:B: {d.get('ratio_rb')}
Acciones recomendadas: {d.get('acciones')} | Riesgo total: ${d.get('riesgo_max_dinero')}
Justifica el stop y la orden de ejecución. Máximo 90 palabras."""
    return llamar_ia(prompt)

def dictamen_adrian(ticker: str, d: dict) -> str:
    prompt = f"""Eres Adriana Vega, Jefa de Seguimiento.
Acción: {ticker} | Precio actual: ${d.get('precio')} | Entrada fijada: ${d.get('nivel_entrada')}
Distancia a entrada: {d.get('distancia_entrada_pct')}%
Informa concisamente del estado de vigilancia de la orden. Máximo 50 palabras."""
    return llamar_ia(prompt)

def dictamen_diana(ticker: str, d: dict, resumen_agentes: dict) -> str:
    accion = d.get('accion', 'BUY')
    prompt = f"""Eres José Moreno, CEO y Director General de la mesa.
Empieza SIEMPRE con: APROBADA para {accion}, RECHAZADA o CONDICIONADA.
Acción: {ticker} | Score cuantitativo: {d.get('score')}/100 | Ratio R:B: {d.get('ratio_rb')}

Resumen del equipo:
- Técnico: {resumen_agentes.get('marcus', 'Sin informe')}
- Fundamental: {resumen_agentes.get('elena', 'Sin informe')}
- Riesgo: {resumen_agentes.get('viktor', 'Sin informe')}

Emite tu veredicto final ejecutivo con instrucción clara. Máximo 90 palabras."""
    return llamar_ia(prompt)