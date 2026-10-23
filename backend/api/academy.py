from __future__ import annotations

import os
from pathlib import Path
from typing import Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel, Field

try:
    from groq import Groq
except ImportError:  # pragma: no cover
    Groq = None  # type: ignore

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

router = APIRouter(prefix="/api/academy", tags=["Academia"])


class CoachIn(BaseModel):
    kind: Literal["open", "entry", "close", "chat"]
    ticker: str
    interval: str = "1d"
    side: Literal["buy", "sell"]
    entry: float
    sl: Optional[float] = None
    tp: Optional[float] = None
    qty: float = 1
    unit: Literal["shares", "lots"] = "shares"
    balance: float = 100000
    thesis: str = ""
    pnl: Optional[float] = None
    reason: Optional[str] = None
    startBalance: float = 100000
    atrPct: Optional[float] = None
    slPct: Optional[float] = None
    riskPct: Optional[float] = None
    streak: int = 0
    recent: list[str] = Field(default_factory=list)


class CoachOut(BaseModel):
    tone: Literal["praise", "advise", "scold", "ask"]
    text: str
    source: Literal["ai", "local"] = "ai"


def _groq_text(prompt: str) -> Optional[str]:
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key or Groq is None:
        return None
    try:
        client = Groq(api_key=api_key)
        chat = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
            temperature=0.78,
            max_tokens=220,
        )
        text = (chat.choices[0].message.content or "").strip()
        return text or None
    except Exception:
        return None


def _tone_from_text(text: str, kind: str, pnl: Optional[float]) -> str:
    low = text.lower()
    if any(word in low for word in ("excelente", "bien", "sólida", "felicidades", "correcto", "oficio")):
        return "praise"
    if any(word in low for word in ("grave", "imprudente", "temerario", "regañ", "a ciegas", "ego")):
        return "scold"
    if "?" in text and kind in ("open", "chat", "entry"):
        return "ask"
    if kind == "close" and pnl is not None and pnl < 0:
        return "advise"
    return "advise"


@router.post("/coach", response_model=CoachOut)
def coach(payload: CoachIn) -> CoachOut:
    banned = " | ".join(payload.recent[-6:]) if payload.recent else "(ninguna)"
    ctx = (
        f"Activo {payload.ticker} {payload.interval} | lado {payload.side.upper()} | entrada {payload.entry} | "
        f"SL {payload.sl} ({payload.slPct}%) | TP {payload.tp} | size {payload.qty} {payload.unit} | "
        f"cuenta {payload.balance:.0f} | riesgo {payload.riskPct}% | ATR {payload.atrPct}% | "
        f"racha pérdidas {payload.streak} | PnL {payload.pnl} | motivo {payload.reason}"
    )
    persona = (
        "Eres Kenji Takahashi, Profesor Agente de AvizorChart, maestro japonés de ~60 años, estricto, sabio y disciplinado. Nunca te llames Sensei. "
        "Hablas español, seco, humano, nunca robótico. Máximo 70 palabras. No predices el precio. "
        "Varía el vocabulario. PROHIBIDO repetir o parafrasear estas líneas recientes: "
        f"{banned}. "
        "PROHIBIDO usar la plantilla 'Justifica la tesis' o 'Sin plan no hay operación'."
    )
    if payload.kind == "open":
        prompt = (
            f"{persona}\nEl alumno acaba de ABRIR. Interroga de forma orgánica según el contexto real.\n{ctx}\n"
            "Si no hay SL, falta grave. Si racha>=2, sospecha revenge. Si riesgo>2%, reprende el size. "
            "Si el SL está dentro del ATR, pregunta por el ruido. Empieza con FELICITAR / ACONSEJAR / REGAÑAR / PREGUNTAR."
        )
    elif payload.kind == "entry":
        prompt = (
            f"{persona}\nEl alumno justifica la entrada.\n{ctx}\nTesis: {payload.thesis or '(vacía)'}\n"
            "Evalúa disciplina, no el acierto. Empieza con FELICITAR / ACONSEJAR / REGAÑAR / PREGUNTAR."
        )
    elif payload.kind == "chat":
        prompt = (
            f"{persona}\nEl alumno te habla en el laboratorio, no necesariamente con orden nueva.\n{ctx}\n"
            f"Mensaje: {payload.thesis or '(vacío)'}\nResponde como maestro real. "
            "Empieza con FELICITAR / ACONSEJAR / REGAÑAR / PREGUNTAR."
        )
    else:
        prompt = (
            f"{persona}\nVeredicto de CIERRE.\n{ctx}\nTesis original: {payload.thesis or '(no aportó)'}\n"
            "Si cierra cerca de 1R puedes recordar que no es cobardía, pero NO uses siempre esa frase. "
            "Si es stop, no humilles; cobra proceso. Empieza con FELICITAR / ACONSEJAR / REGAÑAR / PREGUNTAR."
        )

    text = _groq_text(prompt)
    if not text:
        return CoachOut(tone="advise", text="", source="local")
    head = text.split("\n", 1)[0].upper()
    tone: Literal["praise", "advise", "scold", "ask"] = "advise"
    if "PREGUNT" in head:
        tone = "ask"
    elif "FELICITAR" in head or "FELICIT" in head:
        tone = "praise"
    elif "REGAÑ" in head:
        tone = "scold"
    else:
        tone = _tone_from_text(text, payload.kind, payload.pnl)  # type: ignore[assignment]
    clean = text.split("\n", 1)[-1].strip() if "\n" in text else text
    for tag in (
        "FELICITAR",
        "ACONSEJAR",
        "REGAÑAR",
        "PREGUNTAR",
        "FELICITAR:",
        "ACONSEJAR:",
        "REGAÑAR:",
        "PREGUNTAR:",
    ):
        if clean.upper().startswith(tag):
            clean = clean[len(tag) :].lstrip(" :.-")
            break
    return CoachOut(tone=tone, text=clean or text, source="ai")
