"""
AvizorChart — Router principal.
Home + 6 secciones principales.
"""

import streamlit as st

st.set_page_config(
    page_title="AvizorChart",
    page_icon="🦅",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown("""
<style>
    [data-testid="stSidebar"] { display: none !important; }
    [data-testid="stSidebarCollapsedControl"] { display: none !important; }
    [data-testid="stHeader"] { display: none !important; }
</style>
""", unsafe_allow_html=True)

paginas = [
    st.Page("pages/home.py", title="Inicio", url_path="inicio", default=True, icon="🏠"),
    st.Page("pages/panel_usuario.py", title="Panel de Usuario", url_path="panel-usuario", icon="👤"),
    st.Page("pages/buscadores.py", title="Buscadores", url_path="buscadores", icon="🔍"),
    st.Page("pages/graficos.py", title="Gráficos", url_path="graficos", icon="📊"),
    st.Page("pages/noticias_eventos.py", title="Noticias y Eventos", url_path="noticias", icon="📰"),
    st.Page("pages/formacion.py", title="Formación", url_path="formacion", icon="📚"),
    st.Page("pages/otros.py", title="Otros", url_path="otros", icon="⚙️"),
]

pg = st.navigation(paginas)
pg.run()
