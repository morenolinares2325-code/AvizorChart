import streamlit as st

# =============================================================================
# HOME — Panel inicial con botones
# =============================================================================

# --- Título ---
st.markdown("""
<div style="text-align: center; padding: 40px 0 20px 0;">
    <h1 style="font-size: 3.5rem; font-weight: 900; letter-spacing: -2px; margin: 0;
               background: linear-gradient(135deg, #f1f5f9 0%, #eab308 50%, #3b82f6 100%);
               -webkit-background-clip: text; -webkit-text-fill-color: transparent;
               background-clip: text;">
        🦅 AvizorChart
    </h1>
    <p style="color: #94a3b8; font-size: 1.1rem; margin-top: 12px;">
        Ocho analistas IA. Un veredicto. Tu decisión.
    </p>
</div>
""", unsafe_allow_html=True)

st.markdown("---")

# =============================================================================
# BOTONES DE NAVEGACIÓN
# =============================================================================

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("👤  Panel de Usuario", use_container_width=True, key="home_panel"):
        st.switch_page("pages/panel_usuario.py")
    if st.button("📊  Gráficos", use_container_width=True, key="home_graficos"):
        st.switch_page("pages/graficos.py")

with col2:
    if st.button("🔍  Buscadores", use_container_width=True, key="home_buscadores"):
        st.switch_page("pages/buscadores.py")
    if st.button("📰  Noticias y Eventos", use_container_width=True, key="home_noticias"):
        st.switch_page("pages/noticias_eventos.py")

with col3:
    if st.button("📚  Formación", use_container_width=True, key="home_formacion"):
        st.switch_page("pages/formacion.py")
    if st.button("⚙️  Otros", use_container_width=True, key="home_otros"):
        st.switch_page("pages/otros.py")
