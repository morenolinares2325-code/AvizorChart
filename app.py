"""
AvizorChart — Router principal
Define todas las páginas y sus URLs limpias para Framer.
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
# DEFINICIÓN DE PÁGINAS
# =============================================================================

# --- SECCIÓN BUSCADORES ---
buscadores = [
    st.Page("pages/buscador_directo.py", title="Búsqueda Directa", url_path="buscadores/directa", icon="🔍"),
    st.Page("pages/buscador_acciones.py", title="Búsqueda de Acciones", url_path="buscadores/acciones", icon="📈"),
    st.Page("pages/buscador_multi.py", title="Búsqueda Multi-Activo", url_path="buscadores/multi", icon="🌍"),
    st.Page("pages/buscador_carteras.py", title="Buscador de Carteras", url_path="buscadores/carteras", icon="📁"),
]

# --- SECCIÓN PRINCIPAL ---
principal = [
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
    "🔍 Buscadores": buscadores,
    "🏠 Principal": principal,
})

pg.run()
