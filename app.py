"""
AvizorChart — Router principal.
Home + 6 subpantallas con URLs limpias.
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
paginas = [
    st.Page("pages/home.py", title="Inicio", url_path="inicio", default=True),
    st.Page("pages/panel_usuario.py", title="Panel de Usuario", url_path="panel-usuario", icon="👤"),
    st.Page("pages/buscadores.py", title="Buscadores", url_path="buscadores", icon="🔍"),
    st.Page("pages/graficos.py", title="Gráficos", url_path="graficos", icon="📊"),
    st.Page("pages/noticias_eventos.py", title="Noticias y Eventos", url_path="noticias", icon="📰"),
    st.Page("pages/formacion.py", title="Formación", url_path="formacion", icon="📚"),
    st.Page("pages/otros.py", title="Otros", url_path="otros", icon="⚙️"),
]

# =============================================================================
# NAVEGACIÓN
# =============================================================================
pg = st.navigation(paginas)
pg.run()
