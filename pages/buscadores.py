import streamlit as st

st.title("🔍 Buscadores")
st.caption("Cuatro formas de encontrar oportunidades para la Mesa.")

tab1, tab2, tab3, tab4 = st.tabs([
    "🔍 Búsqueda Directa",
    "📈 Búsqueda de Acciones",
    "🌍 Búsqueda Multi-Activo",
    "📁 Buscador de Carteras",
])

with tab1:
    st.subheader("Búsqueda Directa")
    st.caption("Introduce un ticker y pásalo directo a la Mesa.")
    ticker = st.text_input("Ticker", placeholder="Ej: NVDA, AAPL, TSLA...", key="dir_ticker")
    timeframe = st.selectbox("Timeframe", ["1H", "2H", "3H", "4H", "1D", "1S"], key="dir_tf")
    if st.button("🚀 Enviar a la Mesa", type="primary", key="btn_dir"):
        if ticker:
            st.success(f"Enviando {ticker} ({timeframe}) a la Mesa...")
        else:
            st.warning("Introduce un ticker.")

with tab2:
    st.subheader("Búsqueda de Acciones")
    st.info("🚧 Sección en desarrollo.")

with tab3:
    st.subheader("Búsqueda Multi-Activo")
    st.info("🚧 Sección en desarrollo.")

with tab4:
    st.subheader("Buscador de Carteras")
    st.info("🚧 Sección en desarrollo.")
