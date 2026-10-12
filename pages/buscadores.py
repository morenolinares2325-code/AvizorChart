import streamlit as st
from modulos.universo import cargar_universo_acciones
from modulos.render_filtros import render_5_pestanas


st.title("📈 Búsqueda de Acciones")
st.caption("Barre el universo de acciones con filtros técnicos, fundamentales y de patrones.")


# =============================================================================
# CONFIGURACIÓN OPERATIVA
# =============================================================================
st.markdown("### ⚙️ Configuración Operativa")

c1, c2, c3, c4 = st.columns(4)
with c1:
    top_mostrar = st.slider("Nº candidatas a listar", 5, 50, 15, 1, key="acc_top")
with c2:
    presupuesto = st.number_input("💰 Presupuesto ($)", 100, 1_000_000, 10_000, 500, key="acc_presupuesto")
with c3:
    riesgo_pct = st.slider("Riesgo por operación (%)", 0.25, 5.0, 1.0, 0.25, key="acc_riesgo")
with c4:
    timeframe = st.selectbox("Temporalidad", ["1H", "2H", "3H", "4H", "1D", "1S"], key="acc_tf")


# =============================================================================
# FILTROS (5 PESTAÑAS)
# =============================================================================
st.markdown("### 🎛️ Filtros")
render_5_pestanas()


# =============================================================================
# BOTÓN DE ESCANEO
# =============================================================================
st.markdown("---")

if st.button("🚀 Escanear universo de acciones", type="primary", use_container_width=True, key="acc_escanear"):
    with st.spinner("Cargando universo de acciones..."):
        universo = cargar_universo_acciones()
    st.info(f"Universo cargado: **{len(universo)} tickers**. Filtrado en desarrollo.")
    st.warning("🚧 La lógica de filtrado real se implementará en el siguiente paso.")
