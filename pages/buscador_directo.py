import streamlit as st

st.title("🔍 Búsqueda Directa")
st.caption("Introduce un ticker y pásalo directo a la Mesa.")

ticker = st.text_input("Ticker", placeholder="Ej: NVDA, AAPL, TSLA...", key="ticker", bind="query-params")
timeframe = st.selectbox("Timeframe", ["1H", "2H", "3H", "4H", "1D", "1S"], key="timeframe", bind="query-params")

if st.button("🚀 Enviar a la Mesa", type="primary"):
    if ticker:
        st.success(f"Enviando {ticker} ({timeframe}) a la Mesa...")
    else:
        st.warning("Introduce un ticker.")
