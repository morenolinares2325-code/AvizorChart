# AvizorChart (.dev) — Especificación Técnica y Documentación Maestra Integral

## 1. Visión del Producto y Filosofía Operativa
AvizorChart es una plataforma SaaS de alto rendimiento para análisis técnico, cribado cuantitativo y trading algorítmico, diseñada para ofrecer la velocidad, fluidez y ergonomía visual de TradingView o Bloomberg Terminal, pero complementada con inteligencia artificial multi-agente y ejecución directa multiconector.

El principio fundacional de la plataforma es la **Detección Técnica Anticipada (Pre-Breakout & Squeeze Detection)**. La mayoría de herramientas comerciales alertan cuando el precio ya ha roto un nivel o ha completado un movimiento amplio; AvizorChart monitoriza métricas de compresión, proximidad geométrica, flujos de volumen y curvatura de medias para posicionar al trader en la fase de acumulación o en la vela exacta de detonación.

---

## 2. Estructura de Directorios y Arquitectura de Sistemas

El sistema mantiene desacopladas las capas de frontend (interfaz reactiva en cliente) y backend (servicios de computación matemática y orquestación):

AvizorChart/
├── backend/                         # Servidor de computación y API REST (FastAPI)
│   ├── api/                         # Rutas REST especializadas
│   │   ├── __init__.py
│   │   ├── screener.py              # Endpoints de barrido, consulta directa y universos
│   │   ├── agentes.py               # Orquestación de la Mesa de Agentes IA (Groq)
│   │   └── ejecucion.py             # Gestión de órdenes, colas MT5 y brokers API
│   ├── modulos/                     # Motores analíticos y librerías auxiliares
│   │   ├── __init__.py
│   │   ├── analisis.py              # Cálculo de indicadores (RSI, Supertrend, EMAs, Squeeze)
│   │   ├── universos.py             # Cestas de activos (Acciones, Forex, Cripto, Metales)
│   │   ├── mt5_bridge.py            # Generador y puente con Expert Advisor MQL5
│   │   └── broker_connector.py      # Conectores REST con Alpaca e Interactive Brokers
│   ├── main.py                      # Instancia principal de FastAPI, CORS y middleware
│   ├── requirements.txt             # Dependencias Python (fastapi, uvicorn, yfinance, pandas, etc.)
│   └── .env                         # Variables de entorno privadas (ignorado en Git)
├── frontend/                        # Aplicación web cliente (Next.js 14 App Router)
│   ├── src/
│   │   ├── app/                     # Rutas y páginas de la interfaz
│   │   │   ├── layout.tsx           # Layout global oscuro, fuentes y Navbar fija
│   │   │   ├── page.tsx             # Landing Page interactiva con scroll dinámico
│   │   │   ├── screener/            # Sección 1: Los 4 Buscadores
│   │   │   │   └── page.tsx
│   │   │   ├── grafico/             # Sección 2: Mega Gráfico ECharts e Indicator Builder
│   │   │   │   └── page.tsx
│   │   │   ├── market-news/         # Sección 3: Noticias en vivo, TV y redes sociales
│   │   │   │   └── page.tsx
│   │   │   ├── comunidad/           # Sección 4: Foros, salas y embajadores
│   │   │   │   └── page.tsx
│   │   │   ├── academia/            # Sección 5: Maestro IA y manuales formativos
│   │   │   │   └── page.tsx
│   │   │   └── perfil/              # Sección 6: Cartera, suscripción y automatización
│   │   │       └── page.tsx
│   │   ├── components/              # Componentes de UI reutilizables
│   │   │   ├── layout/              # Navbar superior, Footer legal y Sidebars
│   │   │   ├── screener/            # Tablas densas, inputs con autocompletado y filtros
│   │   │   ├── chart/               # Contenedor ECharts con barra de herramientas de dibujo
│   │   │   └── ui/                  # Botones, modales, badges y selectores estilizados
│   ├── package.json                 # Dependencias (next, react, tailwindcss, echarts, lucide-react)
│   └── .env.local                   # Configuración del frontend (NEXT_PUBLIC_API_URL)
├── .cursorrules                     # Directivas de contexto y comportamiento para Cursor IDE
├── .cursorignore                    # Exclusión de directorios pesados para el indexador de IA
├── .gitignore                       # Filtro de Git (oculta node_modules, cachés y secretos)
└── DOCUMENTACION.md                 # Documento maestro de arquitectura y especificación funcional

---

## 3. Experiencia de Usuario: Landing Page y Navegación Principal

### Barra Superior Fija (Navbar Estilo TradingView)
* **Logotipo:** Identidad visual "AvizorChart.dev" con isotipo futurista y badge dinámico de latencia/estado del backend (verde: conectado, rojo: reconectando).
* **Las 6 Pestañas de Navegación Principal:**
  1. `Screener`: Motor de cribado dividido en sus 4 modalidades operativas.
  2. `Mega Gráfico`: Espacio de análisis técnico puro con ECharts e Indicator Builder.
  3. `Market News`: Feed en vivo de noticias macroeconómicas, televisión bursátil y streaming.
  4. `Comunidad`: Foros de discusión por mercados, canales de debate y enlaces de embajadores.
  5. `Academia`: Entrenador/Maestro IA interactivo y biblioteca formativa modular.
  6. `Zona Privada`: Gestión de cuenta, balance de cartera, logs de trading y configuración de brokers.
* **Extremo Derecho:** Reloj en horario UTC/Mercado (Nueva York, Londres, Tokio), selector de temas (modo oscuro por defecto), botón de notificaciones activas y acceso directo al perfil de usuario.

### Estructura de la Pantalla de Inicio (Scroll Storytelling Futurista)
Al ingresar a la raíz del dominio (`/`), el usuario experimenta una presentación estructurada en bloques interactivos conforme desciende verticalmente:
* **Bloque 1 - Hero Section:**
  * Tipografía limpia, titulares impactantes y animación de fondo con cuadrícula de datos financieros sutilmente iluminada.
  * Título central: "Anticípate al Mercado Antes de que Ocurra la Ruptura".
  * Subtítulo explicativo destacando la detección temprana frente al análisis reactivo tradicional.
  * Botones de acción directa: "Abrir Screener Cuantitativo" y "Explorar Mega Gráfico".
* **Bloque 2 - Demostración de los 4 Screeners:**
  * Tarjetas interactivas que simulan el funcionamiento en tiempo real de la Búsqueda Directa, el Ojeador de Acciones con filtros de riesgo, el Ojeador Multiactivo y el Constructor de Carteras Sectoriales.
* **Bloque 3 - La Detección Técnica Anticipada:**
  * Explicación visual de los triggers matemáticos: compresión de volatilidad (squeeze listo para expandir), rotura inminente de triángulos/canales, convergencia de EMAs y giros de Supertrend.
* **Bloque 4 - Sala de Deliberación IA (Mesa de Agentes):**
  * Presentación visual del equipo de 8 agentes especializados analizando un activo en tiempo real hasta alcanzar el consenso operativo.
* **Bloque 5 - Embudo de Ejecución en 3 Niveles:**
  * Comparativa clara de los métodos de salida: alertas instantáneas por Telegram, ejecución semi-automática con 1 clic en interfaz y automatización total 100% conectada a MT5 o brokers institucionales.
* **Bloque 6 - Academia, Comunidad y Red Colaborativa:**
  * Muestra de las capacidades formativas del Maestro IA y de las salas de debate comunitario.
* **Footer Legal y Asistencia en Vivo:**
  * **Descargo de Responsabilidad (Disclaimer):** Advertencia explícita y formal sobre los riesgos inherentes a la operativa en mercados financieros, derivados, acciones, criptoactivos y apalancamiento, aclarando la naturaleza analítica y formativa del software.
  * Enlaces a Términos del Servicio, Política de Privacidad y Normativa de Cookies.
  * **Asistente de Soporte IA (Widget Flotante):** Ventana de chat desplegable en la esquina inferior derecha equipada con un modelo de soporte técnico entrenado para resolver dudas sobre el uso de la web, configuración de API keys, interpretación de screeners y resolución de problemas de conectividad.

---

## 4. Desglose Exhaustivo de las 6 Secciones

### Sección 1: Screener Cuantitativo (4 Buscadores)
1. **Búsqueda Directa:**
   * Campo de entrada de ticker con búsqueda predictiva y soporte multiactivo (acciones USA, índices, criptomonedas y pares Forex).
   * Al pulsar "Analizar", el sistema obtiene datos OHLCV recientes, computa niveles clave (soporte, resistencia, ATR, RSI, Supertrend, EMAs) y transfiere automáticamente el informe consolidado a la Mesa de Agentes IA para su dictamen.
2. **Ojeador de Acciones:**
   * **Filtros de Cuenta y Gestión Monetaria:** Tamaño de cuenta ($), riesgo por operación (% o $), drawdown máximo tolerado, apalancamiento admitido y ratio Riesgo:Beneficio mínimo objetivo (ej. 1:2 o 1:3).
   * **Filtros Técnicos y Algoritmos de Anticipación:**
     * *Geometría Chartista:* Detección de precio a menos de un 1.5% del vértice de triángulos ascendentes/descendentes, directrices de canales o cuñas de compresión.
     * *Divergencias y Momento:* Divergencias regulares u ocultas en RSI/MACD en timeframes de 15m, 1h o Diario.
     * *Volatilidad y Squeeze:* Bandas de Bollinger comprimidas dentro de los Canales de Keltner (aviso de explosión inminente de volatilidad).
     * *Medias Móviles:* Proximidad a cruce inminente de EMA 9 sobre 21, EMA 19, o cruces de medio/largo plazo (EMA 50/200).
     * *Volumen Institucional:* Picos de volumen relativo (RVOL > 1.5) y velas con rechazo significativo en mecha inferior o superior.
   * **Capa de Clasificación:** El motor puntúa los activos del universo analizado (Score 0-100) y lista las opciones con mayor probabilidad, permitiendo enviarlas en lote o individualmente a la Mesa de Agentes.
3. **Ojeador Multiactivo:**
   * Misma potencia analítica que el Ojeador de Acciones adaptada a las características de liquidez, correlación y horarios de:
     * *Forex:* 30 pares mayores y menores, calculando spreads y sesiones activas.
     * *Criptoactivos:* Top 20 por capitalización con cálculo de dominancia de BTC y correlación general.
     * *Índices Globales:* S&P 500, Nasdaq, Dow Jones, DAX, Nikkei y EuroStoxx.
     * *Metales y Materias Primas:* Oro (XAUUSD), Plata (XAGUSD), Petróleo (WTI/Brent) y Gas Natural.
4. **Constructor de Carteras por Sectores:**
   * Diseñado para la estructuración de portafolios diversificados de medio y largo plazo.
   * Filtra y clasifica activos por sectores (Tecnología, Consumo, Salud, Financiero, Industrial, Energía, etc.).
   * Analiza correlaciones cruzadas para evitar sobreexposición a un único factor de riesgo.
   * Sugiere ponderaciones porcentuales óptimas según el perfil de volatilidad deseado por el trader.

---

### Sección 2: Mega Gráfico Bursátil & Indicator Builder
* **Visualización Dinámica de Precios (Motor Apache ECharts):**
  * Gráfico financiero nativo con velas japonesas ultra-fluidas, escala logarítmica/lineal, volumen integrado con diferenciación de color y multitemporalidad (desde 1 minuto hasta velas semanales).
  * Panel de herramientas de anotación y dibujo: líneas de tendencia, canales paralelos, zonas rectangulares de soporte/resistencia, retrocesos y extensiones de Fibonacci, y marcadores de texto.
  * Detección visual sobreimpresa: marcas automáticas en pantalla de niveles pivote, mechas de rechazo institucional y figuras chartistas identificadas por el backend.
* **Indicator Builder (Constructor Visual de Indicadores):**
  * Entorno interactivo sin necesidad de programación que permite al usuario formular condiciones lógicas combinadas.
  * Ejemplo de regla construible: `[SI RSI(14) < 30] Y [Precio toca Soporte Dinámico] Y [Volumen > Media(20)] -> Generar Señal Compra en Gráfico`.
  * Capacidad de guardar las fórmulas personalizadas, aplicarlas sobre cualquier activo y configurar disparadores de alerta sonora o visual.

---

### Sección 3: Market News & Live Financial Hub
* **Monitor de Noticias en Tiempo Real:** Agregador de teletipos financieros categorizados por divisa o activo implicado, con clasificación algorítmica de sentimiento de impacto (Bullish, Bearish, Neutral).
* **Streaming y Media Bursátil:** Ventana de visualización para seguir emisiones televisivas económicas en directo (Bloomberg, CNBC o canales financieros abiertos) y streams especializados.
* **Radar Social:** Feed curado de cuentas oficiales, analistas cualificados y fuentes macroeconómicas en redes para monitorizar debates de mercado y lecturas de datos de IPC, tipos de interés o nóminas no agrícolas.

---

### Sección 4: Comunidad & Red de Embajadores
* **Salas de Trading en Vivo y Foros:** Canales temáticos segmentados por mercados (Acciones USA, Daytrading Forex, Swing Trading Cripto, etc.) donde los traders comparten gráficos, tesis operativas y opiniones.
* **Directorio de Páginas Amigas y Recursos:** Repositorio de plataformas, herramientas de backtesting, calendarios económicos y calculadoras financieras recomendadas.
* **Área de Embajadores y Afiliados:** Panel dedicado para miembros del programa de partners con seguimiento de referidos, comisiones por suscripción y material gráfico de difusión.

---

### Sección 5: Academia de Trading & Maestro IA
* **Maestro IA (Tutor Especializado 24/7):**
  * Asistente conversacional con personalidad pedagógica, rigurosa y constructiva.
  * Capacidad de resolver dudas operativas sobre conceptos técnicos (Order Blocks, Wyckoff, liquidez, ratios R:B), análisis de casos hipotéticos y orientación psicológica ante pérdidas o rachas negativas (psicotrading).
* **Manual Integral de Trading:**
  * Plataforma educativa estructurada por módulos formativos: Fundamentos de Mercado, Análisis Gráfico y Patrones, Gestión Cuantitativa de Riesgo, Trading Sistemático y Operativa Algorítmica.

---

### Sección 6: Zona Privada de Usuario & Panel de Automatización
* **Panel de Control Operativo:**
  * Métricas consolidadas de rendimiento: win-rate acumulado, ratio Sharpe, factor de beneficio y curva de capital simulada o real.
  * Historial detallado de todas las señales generadas, órdenes ejecutadas y resultados de auditoría.
  * Gestión de suscripción a la plataforma y credenciales de acceso.
* **Centro de Conexión de Brokers y Automatización:**
  * Configuración de llaves de API (Alpaca, Interactive Brokers, OANDA) con selector de entorno Demo / Cuenta Real.
  * Módulo de sincronización con MetaTrader 5 (MT5).
  * Selector global del nivel de operativa activa (Nivel 1, Nivel 2 o Nivel 3).

---

## 5. El Sistema de Ejecución en 3 Niveles

| Nivel | Nombre | Mecánica del Flujo Operativo | Canal y Destino de Ejecución |
| :--- | :--- | :--- | :--- |
| **Nivel 1** | **Señal (Aviso Manual)** | La Mesa de Agentes valida una oportunidad y el sistema publica un informe completo con ticker, dirección (BUY/SELL), tipo de orden (Market o Limit), precio de entrada, Stop Loss, Take Profit y ratio R:B. | Mensaje formateado en el canal/bot privado de Telegram y alerta en el panel web. El trader opera por su cuenta si lo desea. |
| **Nivel 2** | **Semi-Automático (1 Clic)** | El motor de riesgo calcula el tamaño de posición (lotes o acciones) según el balance del usuario. Se genera una tarjeta interactiva en pantalla con la orden precargada y un botón de confirmación. | Al presionar "Ejecutar", la orden Bracket se envía inmediatamente a la API del broker configurado o a la cola del bot de MT5. |
| **Nivel 3** | **Automatización 100% (Desatendida)** | La orden se calcula y despacha de manera autónoma en milisegundos tras la aprobación colegiada de los agentes, bajo la supervisión de filtros de drawdown diario y margen libre. | Disparo directo por API REST/WebSocket (IBKR, Alpaca) o toma de orden automática vía Expert Advisor en MetaTrader 5. |

---

## 6. Arquitectura de Conexión Externa: MetaTrader 5 y Brokers API

### Integración con MetaTrader 5 (MT5)
* **Expert Advisor Receptor (`AvizorReceiver.mq5`):**
  * Script MQL5 ligero que opera en cualquier gráfica de MT5 en el ordenador o VPS del usuario.
  * Realiza peticiones periódicas mediante `WebRequest` al endpoint seguro de FastAPI (`GET /api/mt5/cola-ordenes?token=XXXX`).
  * En cuanto detecta una orden asignada a su cuenta (aprobada en Nivel 2 por clic o en Nivel 3 automáticamente), la ejecuta en el broker local asignando el magic number, SL y TP calculados, reportando de vuelta el ticket generado a la API.

### Integración con Brokers Directos (Interactive Brokers / Alpaca / OANDA)
* El backend de FastAPI gestiona la conexión mediante SDKs oficiales y llamadas REST autenticadas.
* Empleo estricto de órdenes compuestas tipo **Bracket (Parent + Children OCO)**: la orden principal de compra/venta se envía indisolublemente asociada a su orden de Stop Loss y Take Profit, garantizando que el usuario esté siempre protegido ante eventuales desconexiones.

---

## 7. Motor Técnico de Anticipación: Señales y Estados Operativos

Cada cálculo cuantitativo implementado en el backend (`backend/modulos/analisis.py`) evalúa el mercado y retorna un estado técnico normalizado para evitar señales tardías:

* **Estado 0 — Inactivo:**
  * Las métricas se encuentran en rangos de dispersión normales sin convergencia técnica. No hay setups próximos a detonar.
* **Estado 1 — Pre-Aviso (A Punto de Romper):**
  * El activo cumple condiciones de proximidad inmediata: bandas en compresión severa (*squeeze* activo), precio a menos de 1 ATR de romper una directriz relevante de canal o cuña, o medias móviles a punto de cruzarse. El sistema etiqueta el activo como "Vigilancia Prioritaria" y lo coloca en cabeza de lista.
* **Estado 2 — Detonado (Rotura en Curso Confirmada):**
  * La vela en formación confirma el quiebre de la figura o el cruce de medias con expansión de volumen por encima del umbral establecido. Se dispara de forma instantánea el envío a la Mesa de Agentes IA para análisis de confirmación y posterior ejecución.
