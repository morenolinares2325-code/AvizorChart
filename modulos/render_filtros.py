"""
Renderizado de las 5 pestañas de filtros.
Reutilizable para Acciones, Forex, Índices, Metales, Cripto.
"""

import streamlit as st
from modulos.catalogo_indicadores import CATALOGO_INDICADORES
from modulos.motor_parametros import render_editor_dinamico


def render_pestana_descriptivo():
    """Pestaña 1: Descriptivo & Universo."""
    c1, c2 = st.columns(2)
    with c1:
        st.slider("Rango de Precio ($):", 1, 5000, (5, 800), key="filtro_precio")
    with c2:
        st.selectbox(
            "Volumen Diario Mínimo:",
            ["Cualquiera (sin filtro)", "> 100k", "> 500k", "> 1M", "> 5M"],
            index=2,
            key="filtro_volumen"
        )
    st.number_input(
        "Máx. finalistas analizados en profundidad:",
        10, 300, 50, 10,
        key="filtro_max_fund"
    )


def render_pestana_fundamental():
    """Pestaña 2: Fundamental & Balances."""
    st.radio(
        "Perfil de Solvencia:",
        ["⚪ Sin filtro", "🟢 Empresa sólida", "💎 Calidad premium",
         "📈 Crecimiento", "💰 Valor"],
        index=0,
        horizontal=True,
        key="filtro_perfil"
    )


def render_pestana_cuantitativo():
    """Pestaña 3: Catálogo Cuantitativo (460+)."""
    st.markdown("#### 🔬 Constructor Cuantitativo de Estrategias")
    st.caption("Selecciona una o más familias técnicas para combinar indicadores.")

    cat_col1, cat_col2 = st.columns([1, 2])
    with cat_col1:
        familia = st.selectbox(
            "Familia Cuantitativa",
            list(CATALOGO_INDICADORES.keys()),
            key="filtro_familia_cuant"
        )
    with cat_col2:
        indicadores_sel = st.multiselect(
            f"Indicadores de {familia}:",
            options=CATALOGO_INDICADORES[familia],
            default=[CATALOGO_INDICADORES[familia][0]],
            key="filtro_indicadores_cuant"
        )

    if indicadores_sel:
        st.markdown("##### ⚙️ Editor de Parámetros")
        for idx, ind in enumerate(indicadores_sel):
            with st.expander(f"Parámetros: {ind}", expanded=(idx == 0)):
                render_editor_dinamico(ind, f"acc_{idx}")

    return indicadores_sel


def render_pestana_tecnico():
    """Pestaña 4: Técnico & Volatilidad."""
    c1, c2 = st.columns(2)
    with c1:
        st.number_input("Periodo RSI:", 2, 50, 14, key="filtro_rsi_period")
        st.selectbox(
            "Condición RSI:",
            ["Cualquiera", "Sobreventa extrema (<30)", "Sobreventa (30-45)",
             "Neutro-bajo (40-55)", "Sobrecompra (55-70)", "Sobrecompra extrema (>70)"],
            key="filtro_rsi_modo"
        )
    with c2:
        st.number_input("Periodo EMA:", 5, 100, 20, key="filtro_ema_period")
        st.selectbox(
            "Condición de Media:",
            ["Cualquiera", "Precio > EMA", "Precio < EMA",
             "Cruce Alcista Reciente", "Cruce Bajista Reciente"],
            key="filtro_ema_cond"
        )

    c3, c4 = st.columns(2)
    with c3:
        st.number_input("Periodo Supertrend:", 5, 50, 10, key="filtro_st_period")
        st.selectbox(
            "Condición Supertrend:",
            ["Cualquiera", "Cruce Alcista Reciente", "Cruce Bajista Reciente",
             "Solo Alcista", "Solo Bajista"],
            key="filtro_st_cond"
        )
    with c4:
        st.number_input("Multiplicador Supertrend:", value=3.0, step=0.5, key="filtro_st_mult")
        st.number_input("Volumen Relativo Mínimo:", 0.0, value=1.2, step=0.1, key="filtro_vol_rel")

    c5, c6, c7 = st.columns(3)
    with c5:
        st.slider("Distancia máx. nivel (%):", 0.5, 8.0, 3.5, 0.1, key="filtro_dist_pct")
    with c6:
        st.slider("Distancia máx. en ATR:", 0.5, 4.0, 2.5, 0.1, key="filtro_dist_atr")
    with c7:
        st.slider("Ventana ruptura (velas):", 0, 7, 3, key="filtro_ventana_ruptura")


def render_pestana_patrones():
    """Pestaña 5: Patrones & SMC."""
    c1, c2 = st.columns(2)
    with c1:
        st.multiselect(
            "Eventos de Estructura:",
            ["Ruptura Resistencia", "Rebote Soporte", "Ruptura Soporte",
             "Rechazo en Resistencia", "Consolidación"],
            default=["Ruptura Resistencia", "Rebote Soporte"],
            key="filtro_eventos"
        )
        st.number_input("Ventana S/R (Pivots):", 15, 100, 40, key="filtro_ventana_niveles")
    with c2:
        st.selectbox(
            "Fiabilidad mínima de patrón:",
            ["Todas", "Media o Alta", "Solo Alta"],
            index=1,
            key="filtro_fiabilidad"
        )
        st.number_input("Ventana geométrica:", 8, 60, 15, key="filtro_ventana_patron")


def render_5_pestanas():
    """Renderiza las 5 pestañas de filtros."""
    sub_desc, sub_fund, sub_cuant, sub_tec, sub_pat = st.tabs([
        "🏷️ Descriptivo & Universo",
        "📊 Fundamental & Balances",
        "📈 Catálogo Cuantitativo (460+)",
        "📉 Técnico & Volatilidad",
        "📏 Patrones & SMC",
    ])

    with sub_desc:
        render_pestana_descriptivo()

    with sub_fund:
        render_pestana_fundamental()

    with sub_cuant:
        indicadores_sel = render_pestana_cuantitativo()
        st.session_state["filtro_indicadores_sel"] = indicadores_sel

    with sub_tec:
        render_pestana_tecnico()

    with sub_pat:
        render_pestana_patrones()
