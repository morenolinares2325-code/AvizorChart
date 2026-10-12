"""
AvizorChart — Pantalla de inicio + Router principal
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
# NAVEGACIÓN CON st.navigation
# =============================================================================
paginas = [
    st.Page("pages/panel_usuario.py", title="Panel de Usuario", url_path="panel-usuario", icon="👤"),
    st.Page("pages/buscadores.py", title="Buscadores", url_path="buscadores", icon="🔍"),
    st.Page("pages/graficos.py", title="Gráficos", url_path="graficos", icon="📊"),
    st.Page("pages/noticias_eventos.py", title="Noticias y Eventos", url_path="noticias", icon="📰"),
    st.Page("pages/formacion.py", title="Formación", url_path="formacion", icon="📚"),
    st.Page("pages/otros.py", title="Otros", url_path="otros", icon="⚙️"),
]

pg = st.navigation(paginas)

# =============================================================================
# PANTALLA DE INICIO (solo si no hay página seleccionada)
# =============================================================================
# Streamlit ejecuta app.py siempre, pero si el usuario navega a una subpantalla,
# `pg.run()` renderiza esa subpantalla. La home se muestra cuando no hay
# página activa (es decir, en la raíz `/`).

# NOTA: Con st.navigation, la home se muestra en la URL raíz `/` automáticamente
# si no defines ninguna página con default=True. Pero para tener una home
# personalizada con botones, la mejor forma es NO usar st.navigation y sí
# hacer un enrutador manual. Te lo explico abajo.

# =============================================================================
# ALTERNATIVA: ROUTER MANUAL CON HOME PERSONALIZADA
# =============================================================================
