"""Capa de lógica del Builder: Groq traduce condiciones/cruces a JSON de señales ECharts."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from builder_system_prompt import BUILDER_SYSTEM_PROMPT

BACKEND_ENV = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV, override=True)

try:
    from groq import Groq
except ImportError:  # pragma: no cover
    Groq = None  # type: ignore

_LAST_STATUS = ""


def last_ai_status() -> str:
    return _LAST_STATUS


def _groq_api_key() -> str:
    load_dotenv(BACKEND_ENV, override=True)
    return os.environ.get("GROQ_API_KEY", "").strip().strip('"').strip("'")


def extract_logic_with_ai(source: str, language: str, structural: dict[str, Any]) -> dict[str, Any] | None:
    global _LAST_STATUS
    api_key = _groq_api_key()
    if not api_key:
        _LAST_STATUS = "GROQ_API_KEY no está definida en backend/.env."
        return None
    if Groq is None:
        _LAST_STATUS = "Falta el paquete groq. Instálalo en el backend."
        return None
    summary = {
        "language": language,
        "name": structural.get("name"),
        "inputs": structural.get("inputs") or [],
        "series": [
            {"function": row.get("function"), "kind": row.get("kind"), "args": row.get("args")}
            for row in (structural.get("series") or [])[:24]
        ],
        "parser_signals": structural.get("signals") or {},
    }
    user = (
        f"Lenguaje detectado: {language}\n"
        f"Resumen estructural del parser:\n{json.dumps(summary, ensure_ascii=False)[:6000]}\n\n"
        f"Código fuente completo:\n{source[:14000]}"
    )
    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            temperature=0.05,
            max_tokens=1800,
            messages=[
                {"role": "system", "content": BUILDER_SYSTEM_PROMPT},
                {"role": "user", "content": user},
            ],
        )
        raw = (completion.choices[0].message.content or "").strip()
    except Exception as exc:
        detail = str(exc).replace(api_key, "***")
        lower = detail.lower()
        if "invalid_api_key" in lower or "401" in detail:
            _LAST_STATUS = "Groq rechazó GROQ_API_KEY (401). Regenera la clave en console.groq.com y actualiza backend/.env."
        else:
            _LAST_STATUS = f"Groq no respondió ({type(exc).__name__})."
        return None
    parsed = parse_logic_json(raw)
    if not parsed:
        _LAST_STATUS = "Groq respondió, pero el JSON de lógica no era válido."
        return None
    _LAST_STATUS = "ok"
    return parsed


def parse_logic_json(raw: str) -> dict[str, Any] | None:
    text = raw.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        payload = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    if not isinstance(payload, dict):
        return None
    return {
        "name": str(payload.get("name") or "").strip(),
        "signals": [item for item in payload.get("signals") or [] if isinstance(item, dict)],
        "zones": [item for item in payload.get("zones") or [] if isinstance(item, dict)],
        "lines": [item for item in payload.get("lines") or [] if isinstance(item, dict)],
        "labels": [item for item in payload.get("labels") or [] if isinstance(item, dict)],
        "notes": [str(item) for item in payload.get("notes") or []],
    }
