"""
Renderizado de las 5 pestañas de filtros.
Reutilizable para Acciones, Forex, Índices, Metales, Cripto.
Cada subsección pasa un prefijo único para evitar keys duplicadas.
"""

import streamlit as st
from modulos.catalogo_indicadores import CATALOGO_INDICADORES
from modulos.motor_parametros import render_editor_dinamico


def render_pestana_descriptivo(prefijo):
    """Pestaña 1: Descriptivo & Universo."""
    c1, c2 = st.columns(2)
    with c1:
        st.slider("Rango de Precio ($):", 1, 5000, (5, 800), key=f"{prefijo}_precio")
    with c2:
        st.selectbox(
            "Volumen Diario Mínimo:",
            ["Cualquiera (sin filtro)", "> 100k", "> 500k", "> 1M", "> 5M"],
            index=2,
            key=f"{prefijo}_volumen"
        )
    st.number_input(
        "Máx. finalistas analizados en profundidad:",
        10, 300, 50, 10,
        key=f"{prefijo}_max_fund"
    )


def render_pestana_fundamental(prefijo):
    """Pestaña 2: Fundamental & Balances."""
    st.radio(
        "Perfil de Solvencia:",
        ["⚪ Sin filtro", "🟢 Empresa sólida", "💎 Calidad premium",
         "📈 Crecimiento", "💰 Valor"],
        index=0,
        horizontal=True,
        key=f"{prefijo}_perfil"
    )


def render_pestana_cuantitativo(prefijo):
    """Pestaña 3: Catálogo Cuantitativo (460+)."""
    st.markdown("#### 🔬 Constructor Cuantitativo de Estrategias")
    st.caption("Selecciona una o más familias técnicas para combinar indicadores.")

    cat_col1, cat_col2 = st.columns([1, 2])
    with cat_col1:
        familia = st.selectbox(
            "Familia Cuantitativa",
            list(CATALOGO_INDICADORES.keys()),
            key=f"{prefijo}_familia_cuant"
        )
    with cat_col2:
        indicadores_sel = st.multiselect(
            f"Indicadores de {familia}:",
            options=CATALOGO_INDICADORES[familia],
            default=[CATALOGO_INDICADORES[familia][0]],
            key=f"{prefijo}_indicadores_cuant"
        )

    if indicadores_sel:
        st.markdown("##### ⚙️ Editor de Parámetros")
        for idx, ind in enumerate(indicadores_sel):
            with st.expander(f"Parámetros: {ind}", expanded=(idx == 0)):
                render_editor_dinamico(ind, f"{prefijo}_acc_{idx}")

    return indicadores_sel


def render_pestana_tecnico(prefijo):
    """Pestaña 4: Técnico & Volatilidad."""
    c1, c2 = st.columns(2)
    with c1:
        st.number_input("Periodo RSI:", 2, 50, 14, key=f"{prefijo}_rsi_period")
        st.selectbox(
            "Condición RSI:",
            ["Cualquiera", "Sobreventa extrema (<30)", "Sobreventa (30-45)",
             "Neutro-bajo (40-55)", "Sobrecompra (55-70)", "Sobrecompra extrema (>70)"],
            key=f"{prefijo}_rsi_modo"
        )
    with c2:
        st.number_input("Periodo EMA:", 5, 100, 20, key=f"{prefijo}_ema_period")
        st.selectbox(
            "Condición de Media:",
            ["Cualquiera", "Precio > EMA", "Precio < EMA",
             "Cruce Alcista Reciente", "Cruce Bajista Reciente"],
            key=f"{prefijo}_ema_cond"
        )

    c3, c4 = st.columns(2)
    with c3:
        st.number_input("Periodo Supertrend:", 5, 50, 10, key=f"{prefijo}_st_period")
        st.selectbox(
            "Condición Supertrend:",
            ["Cualquiera", "Cruce Alcista Reciente", "Cruce Bajista Reciente",
             "Solo Alcista", "Solo Bajista"],
            key=f"{prefijo}_st_cond"
        )
    with c4:
        st.number_input("Multiplicador Supertrend:", value=3.0, step=0.5, key=f"{prefijo}_st_mult")
        st.number_input("Volumen Relativo Mínimo:", 0.0, value=1.2, step=0.1, key=f"{prefijo}_vol_rel")

    c5, c6, c7 = st.columns(3)
    with c5:
        st.slider("Distancia máx. nivel (%):", 0.5, 8.0, 3.5, 0.1, key=f"{prefijo}_dist_pct")
    with c6:
        st.slider("Distancia máx. en ATR:", 0.5, 4.0, 2.5, 0.1, key=f"{prefijo}_dist_atr")
    with c7:
        st.slider("Ventana ruptura (velas):", 0, 7, 3, key=f"{prefijo}_ventana_ruptura")


def render_pestana_patrones(prefijo):
    """Pestaña 5: Patrones & SMC."""
    c1, c2 = st.columns(2)
    with c1:
        st.multiselect(
            "Eventos de Estructura:",
            ["Ruptura Resistencia", "Rebote Soporte", "Ruptura Soporte",
             "Rechazo en Resistencia", "Consolidación"],
            default=["Ruptura Resistencia", "Rebote Soporte"],
            key=f"{prefijo}_eventos"
        )
        st.number_input("Ventana S/R (Pivots):", 15, 100, 40, key=f"{prefijo}_ventana_niveles")
    with c2:
        st.selectbox(
            "Fiabilidad mínima de patrón:",
            ["Todas", "Media o Alta", "Solo Alta"],
            index=1,
            key=f"{prefijo}_fiabilidad"
        )
        st.number_input("Ventana geométrica:", 8, 60, 15, key=f"{prefijo}_ventana_patron")


def render_5_pestanas(prefijo="gen"):
    """
    Renderiza las 5 pestañas de filtros.
    
    Args:
        prefijo: string único por subsección (ej: "acc", "multi")
                 para evitar keys duplicadas.
    """
    sub_desc, sub_fund, sub_cuant, sub_tec, sub_pat = st.tabs([
        "🏷️ Descriptivo & Universo",
        "📊 Fundamental & Balances",
        "📈 Catálogo Cuantitativo (460+)",
        "📉 Técnico & Volatilidad",
        "📏 Patrones & SMC",
    ])

    with sub_desc:
        render_pestana_descriptivo(prefijo)

    with sub_fund:
        render_pestana_fundamental(prefijo)

    with sub_cuant:
        indicadores_sel = render_pestana_cuantitativo(prefijo)
        st.session_state[f"filtro_indicadores_sel_{prefijo}"] = indicadores_sel

    with sub_tec:
        render_pestana_tecnico(prefijo)

    with sub_pat:
        render_pestana_patrones(prefijo)
