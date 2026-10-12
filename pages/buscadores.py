import streamlit as st
from modulos.universo import (
    cargar_universo_acciones,
    cargar_universo_forex,
    cargar_universo_indices,
    cargar_universo_metales,
    cargar_universo_cripto,
)
from modulos.render_filtros import render_5_pestanas


st.title("🔍 Buscadores")
st.caption("Cuatro formas de encontrar oportunidades para la Mesa.")

# =============================================================================
# 4 PESTAÑAS
# =============================================================================
tab1, tab2, tab3, tab4 = st.tabs([
    "🔍 Búsqueda Directa",
    "📈 Búsqueda de Acciones",
    "🌍 Búsqueda Multi-Activo (Forex, Cripto, Metales, Índices)",
    "📁 Buscador de Carteras",
])

# -----------------------------------------------------------------------------
# PESTAÑA 1: BÚSQUEDA DIRECTA
# -----------------------------------------------------------------------------
with tab1:
    st.subheader("🔍 Búsqueda Directa")
    st.caption("Introduce un ticker y pásalo directo a la Mesa.")

    c1, c2 = st.columns([3, 1])
    with c1:
        ticker = st.text_input("Ticker", placeholder="Ej: NVDA, AAPL, TSLA...", key="dir_ticker")
    with c2:
        timeframe = st.selectbox("Timeframe", ["1H", "2H", "3H", "4H", "1D", "1S"], key="dir_tf")

    if st.button("🚀 Enviar a la Mesa", type="primary", use_container_width=True, key="btn_dir"):
        if ticker:
            st.success(f"Enviando **{ticker}** ({timeframe}) a la Mesa...")
            st.info("🚧 Integración con la Mesa en desarrollo.")
        else:
            st.warning("Introduce un ticker.")


# -----------------------------------------------------------------------------
# PESTAÑA 2: BÚSQUEDA DE ACCIONES
# -----------------------------------------------------------------------------
with tab2:
    st.subheader("📈 Búsqueda de Acciones")
    st.caption("Barre el universo de acciones con filtros técnicos, fundamentales y de patrones.")

    # --- Configuración operativa ---
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.slider("Nº candidatas", 5, 50, 15, 1, key="acc_top")
    with c2:
        st.number_input("💰 Presupuesto ($)", 100, 1_000_000, 10_000, 500, key="acc_presupuesto")
    with c3:
        st.slider("Riesgo por operación (%)", 0.25, 5.0, 1.0, 0.25, key="acc_riesgo")
    with c4:
        st.selectbox("Temporalidad", ["1H", "2H", "3H", "4H", "1D", "1S"], key="acc_tf")

    # --- 5 pestañas de filtros (con prefijo "acc") ---
    render_5_pestanas(prefijo="acc")

    # --- Botón de escaneo ---
    st.markdown("---")
    if st.button("🚀 Escanear universo de acciones", type="primary", use_container_width=True, key="acc_escanear"):
        with st.spinner("Cargando universo de acciones..."):
            universo = cargar_universo_acciones()
        st.info(f"Universo cargado: **{len(universo)} tickers**. Filtrado en desarrollo.")


# -----------------------------------------------------------------------------
# PESTAÑA 3: BÚSQUEDA MULTI-ACTIVO
# -----------------------------------------------------------------------------
with tab3:
    st.subheader("🌍 Búsqueda Multi-Activo")
    st.caption("Forex, Cripto, Metales, Índices. Con modo Prop Firm.")

    # --- Selector de mercado ---
    mercado = st.radio(
        "Mercado:",
        ["💱 Forex", "₿ Cripto", "🥇 Metales", "📊 Índices"],
        horizontal=True,
        key="multi_mercado",
    )

    # --- Configuración operativa ---
    c1, c2, c3, c4 = st.columns(4)
    with c1:
        st.slider("Nº candidatas", 5, 50, 10, 1, key="multi_top")
    with c2:
        st.number_input("💰 Presupuesto ($)", 100, 1_000_000, 100_000, 500, key="multi_presupuesto")
    with c3:
        st.slider("Riesgo por operación (%)", 0.25, 5.0, 1.0, 0.25, key="multi_riesgo")
    with c4:
        st.selectbox("Temporalidad", ["1H", "2H", "3H", "4H", "1D", "1S"], key="multi_tf")

    # --- Filtros + Prop Firm ---
    tab_filtros, tab_prop = st.tabs(["🎛️ Filtros", "🏦 Prop Firm"])

    with tab_filtros:
        render_5_pestanas(prefijo="multi")

    with tab_prop:
        st.markdown("### 🏦 Modo Prop Firm")
        st.caption("Las reglas de la cuenta fondeada se aplican como filtro y como dato para los agentes.")

        activar = st.checkbox("Activar modo Prop Firm", key="multi_prop_activar")

        if activar:
            c1, c2 = st.columns(2)
            with c1:
                st.selectbox(
                    "Tipo de prop firm:",
                    ["FTMO", "MyForexFunds", "The Funded Trader", "E8 Markets", "Otra"],
                    key="multi_prop_tipo"
                )
                st.selectbox(
                    "Capital de la cuenta:",
                    ["$10,000", "$25,000", "$50,000", "$100,000", "$200,000"],
                    index=3,
                    key="multi_prop_capital"
                )
            with c2:
                st.number_input("Pérdida máxima diaria (%)", 1.0, 10.0, 5.0, 0.5, key="multi_prop_perdida_diaria")
                st.number_input("Pérdida máxima total (%)", 1.0, 20.0, 10.0, 0.5, key="multi_prop_perdida_total")

            c3, c4 = st.columns(2)
            with c3:
                st.number_input("Beneficio objetivo (%)", 1.0, 30.0, 10.0, 0.5, key="multi_prop_beneficio")
                st.number_input("Días mínimos de trading", 0, 30, 4, 1, key="multi_prop_dias")
            with c4:
                st.checkbox("No mantener posiciones el fin de semana", key="multi_prop_finde")
                st.checkbox("No operar antes/después de noticias de alto impacto", key="multi_prop_noticias")
                st.checkbox("Permitir scalping", key="multi_prop_scalping")
                st.checkbox("Permitir hedging", key="multi_prop_hedging")

    # --- Botón de escaneo ---
    st.markdown("---")
    if st.button("🚀 Escanear mercado", type="primary", use_container_width=True, key="multi_escanear"):
        with st.spinner(f"Cargando universo de {mercado}..."):
            if "Forex" in mercado:
                universo = cargar_universo_forex()
            elif "Cripto" in mercado:
                universo = cargar_universo_cripto()
            elif "Metales" in mercado:
                universo = cargar_universo_metales()
            else:
                universo = cargar_universo_indices()
        st.info(f"Universo cargado: **{len(universo)} activos**. Filtrado en desarrollo.")


# -----------------------------------------------------------------------------
# PESTAÑA 4: BUSCADOR DE CARTERAS
# -----------------------------------------------------------------------------
with tab4:
    st.subheader("📁 Buscador de Carteras")
    st.caption("Genera carteras diversificadas por sectores y tipo.")
    st.info("🚧 Sección en desarrollo. Aquí irán los mapas de calor y las propuestas de cartera.")
