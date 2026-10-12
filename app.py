"""
AvizorChart — Router principal.
Home + 6 secciones principales + 4 subsecciones de Buscadores.
"""

import streamlit as st

# =============================================================================
# CONFIGURACIÓN DE PÁGINA
# =============================================================================
st.set_page_config(
    page_title="AvizorChart",
    page_icon="🦅",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# =============================================================================
# CSS PARA OCULTAR EL MENÚ LATERAL Y EL HEADER
# =============================================================================
st.markdown("""
<style>
    [data-testid="stSidebar"] { display: none !important; }
    [data-testid="stSidebarCollapsedControl"] { display: none !important; }
    [data-testid="stHeader"] { display: none !important; }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# DEFINICIÓN DE PÁGINAS
# =============================================================================

# --- SECCIÓN BUSCADORES (4 subsecciones) ---
buscadores = [
    st.Page("pages/buscador_directo.py", title="Búsqueda Directa", url_path="buscadores/directa", icon="🔍"),
    st.Page("pages/buscador_acciones.py", title="Búsqueda de Acciones", url_path="buscadores/acciones", icon="📈"),
    st.Page("pages/buscador_multi.py", title="Búsqueda Multi-Activo (Forex, Cripto, Metales, Índices)", url_path="buscadores/multi", icon="🌍"),
    st.Page("pages/buscador_carteras.py", title="Buscador de Carteras", url_path="buscadores/carteras", icon="📁"),
]

# --- SECCIÓN PRINCIPAL ---
principal = [
    st.Page("pages/home.py", title="Inicio", url_path="inicio", default=True, icon="🏠"),
    st.Page("pages/panel_usuario.py", title="Panel de Usuario", url_path="panel-usuario", icon="👤"),
    st.Page("pages/graficos.py", title="Gráficos", url_path="graficos", icon="📊"),
    st.Page("pages/noticias_eventos.py", title="Noticias y Eventos", url_path="noticias", icon="📰"),
    st.Page("pages/formacion.py", title="Formación", url_path="formacion", icon="📚"),
    st.Page("pages/otros.py", title="Otros", url_path="otros", icon="⚙️"),
]

# =============================================================================
# NAVEGACIÓN
# =============================================================================
pg = st.navigation({
    "🏠 Principal": principal,
    "🔍 Buscadores": buscadores,
})
pg.run()
