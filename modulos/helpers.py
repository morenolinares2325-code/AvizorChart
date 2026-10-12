"""
Helpers compartidos de AvizorChart.
Funciones de formateo, fechas, colores y utilidades varias.
"""

from datetime import datetime
import pytz


# =============================================================================
# FORMATEO DE NÚMEROS
# =============================================================================

def formatear_precio(precio):
    """Formatea un precio con 2 decimales."""
    if precio is None:
        return "—"
    try:
        return f"${float(precio):,.2f}"
    except (ValueError, TypeError):
        return "—"


def formatear_pct(valor, decimales=2):
    """Formatea un porcentaje con signo."""
    if valor is None:
        return "—"
    try:
        return f"{float(valor):+.{decimales}f}%"
    except (ValueError, TypeError):
        return "—"


def formatear_dinero(valor):
    """Formatea un valor monetario grande (K, M, B)."""
    if valor is None:
        return "—"
    try:
        v = float(valor)
        if abs(v) >= 1_000_000_000:
            return f"${v/1_000_000_000:.2f}B"
        if abs(v) >= 1_000_000:
            return f"${v/1_000_000:.2f}M"
        if abs(v) >= 1_000:
            return f"${v/1_000:.2f}K"
        return f"${v:.2f}"
    except (ValueError, TypeError):
        return "—"


def formatear_volumen(volumen):
    """Formatea un volumen grande (K, M, B)."""
    if volumen is None:
        return "—"
    try:
        v = float(volumen)
        if v >= 1_000_000_000:
            return f"{v/1_000_000_000:.2f}B"
        if v >= 1_000_000:
            return f"{v/1_000_000:.2f}M"
        if v >= 1_000:
            return f"{v/1_000:.1f}K"
        return f"{v:.0f}"
    except (ValueError, TypeError):
        return "—"


# =============================================================================
# FECHAS Y HORAS
# =============================================================================

def ahora_utc():
    """Devuelve la fecha/hora actual en UTC."""
    return datetime.now(pytz.UTC)


def fecha_hoy():
    """Devuelve la fecha de hoy en formato YYYY-MM-DD."""
    return datetime.now().strftime("%Y-%m-%d")


def formatear_fecha(fecha):
    """Formatea una fecha a string legible."""
    if fecha is None:
        return "—"
    try:
        if isinstance(fecha, str):
            return fecha
        return fecha.strftime("%Y-%m-%d")
    except Exception:
        return "—"


def tiempo_desde(fecha):
    """Devuelve el tiempo transcurrido desde una fecha."""
    if fecha is None:
        return "—"
    try:
        if isinstance(fecha, str):
            fecha = datetime.fromisoformat(fecha.replace("Z", "+00:00"))
        delta = datetime.now(pytz.UTC) - fecha
        segundos = int(delta.total_seconds())
        if segundos < 60:
            return f"hace {segundos}s"
        if segundos < 3600:
            return f"hace {segundos // 60}m"
        if segundos < 86400:
            return f"hace {segundos // 3600}h"
        return f"hace {segundos // 86400}d"
    except Exception:
        return "—"


# =============================================================================
# COLORES Y ESTILOS
# =============================================================================

def color_por_valor(valor):
    """Devuelve un color según si el valor es positivo o negativo."""
    if valor is None:
        return "#64748b"
    try:
        v = float(valor)
        if v > 0:
            return "#10b981"  # verde
        if v < 0:
            return "#ef4444"  # rojo
        return "#64748b"  # gris
    except (ValueError, TypeError):
        return "#64748b"


def emoji_por_valor(valor):
    """Devuelve un emoji según si el valor es positivo o negativo."""
    if valor is None:
        return "⚪"
    try:
        v = float(valor)
        if v > 0:
            return "🟢"
        if v < 0:
            return "🔴"
        return "⚪"
    except (ValueError, TypeError):
        return "⚪"


# =============================================================================
# VALIDACIÓN
# =============================================================================

def es_ticker_valido(ticker):
    """Comprueba si un string parece un ticker válido."""
    if not ticker or not isinstance(ticker, str):
        return False
    t = ticker.strip().upper()
    if not (1 <= len(t) <= 10):
        return False
    return t.replace("-", "").replace(".", "").replace("/", "").isalnum()
