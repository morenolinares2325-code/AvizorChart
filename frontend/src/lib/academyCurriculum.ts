export interface AcademyLesson {
  id: string;
  title: string;
  minutes: number;
  summary: string;
  body: string;
  youtubeId?: string;
}

export interface AcademyModule {
  id: string;
  level: "base" | "intermedio" | "avanzado";
  title: string;
  blurb: string;
  lessons: AcademyLesson[];
}

export const ACADEMY_MODULES: AcademyModule[] = [
  {
    id: "fundamentos",
    level: "base",
    title: "Fundamentos y microestructura",
    blurb: "Qué es un mercado, cómo se forma el precio y qué implica cada vela.",
    lessons: [
      {
        id: "f1",
        title: "Subasta continua y el libro de órdenes",
        minutes: 12,
        youtubeId: "p7HKvqRI_Bo",
        summary: "El precio no es un número mágico: es el último acuerdo entre oferta y demanda.",
        body: `Un mercado organizado es una subasta continua. Cada tick es un pacto: alguien compró porque valoraba más el activo que el vendedor.

La vela japonesa resume esa subasta en un intervalo: apertura, máximo, mínimo y cierre. El cuerpo cuenta quién ganó el tramo; las mechas cuentan dónde el mercado rechazó precio.

Antes de indicadores, pregunta: ¿quién está agresivo? Si el cierre queda cerca del máximo con rango amplio, la demanda empujó. Si el cierre queda en el tercio inferior, la oferta recuperó el tramo.

El libro de órdenes (DOM) muestra intención pasiva. El tape muestra agresión. En AvizorChart operas con velas, pero piensas como si vieras ambos: el cierre es el veredicto, el volumen es el jurado.`,
      },
      {
        id: "f2",
        title: "Timeframes y alineación",
        minutes: 10,
        youtubeId: "PHe0bXaT5N0",
        summary: "El gráfico superior define el clima; el inferior, el disparo.",
        body: `Trabaja siempre con al menos dos marcos: uno de contexto (4h/diario) y uno de ejecución (15m/1h).

Contexto: tendencia, rango, sesgo institucional. Ejecución: disparo, stop estructural, primer objetivo.

Si el diario es alcista y el 15m es un pullback a media, no estás “comprando porque RSI 30”: estás comprando descuento dentro de un flujo mayor.

Regla Avizor: no operes un disparo que contradiga el marco superior salvo que tu plan lo declare explícitamente (reversionistas). El resto del tiempo, el marco mayor veta al menor.`,
      },
      {
        id: "f3",
        title: "Volumen, rango y calidad de vela",
        minutes: 11,
        summary: "Una vela sin volumen es ruido. Un rango sin aceptación es trampa.",
        body: `Tres lecturas juntas: rango (ATR), volumen relativo y posición del cierre.

- Rango alto + volumen alto + cierre extremo: iniciativa.
- Rango alto + volumen bajo: hueco de liquidez, no persigas.
- Rango bajo + volumen secándose: compresión. Ahí nace el Replay Lab: esperar detonación, no adivinar dirección.

El ATR no es un indicador de entrada. Es una unidad de riesgo. Un stop de 0.3 ATR en un activo de 2 ATR diarios es suicidio estadístico.`,
      },
    ],
  },
  {
    id: "precio",
    level: "base",
    title: "Acción del precio y estructuras",
    blurb: "Máximos, mínimos, rupturas, retests y fallos.",
    lessons: [
      {
        id: "p1",
        title: "Estructura de mercado: HH, HL, LH, LL",
        minutes: 14,
        youtubeId: "p7HKvqRI_Bo",
        summary: "La tendencia es una secuencia de extremos, no una media móvil.",
        body: `Alcista: higher highs y higher lows. Bajista: lower highs y lower lows. Rango: extremos que no progresan.

El cambio de carácter (CHOCH) ocurre cuando se rompe el último extremo contrario con aceptación — no con un pincelazo de mecha.

Marca swings con una regla fija (por ejemplo, 3 velas a cada lado). Si cambias el criterio cada operación, no tienes estructura: tienes sesgo.

En el simulador, dibuja el último swing inválido antes de pulsar BUY. Ese swing es tu stop, no un número redondo.`,
      },
      {
        id: "p2",
        title: "Soporte, resistencia y el retest",
        minutes: 12,
        summary: "Los niveles no son líneas: son zonas de aceptación previa.",
        body: `Un nivel gana valor cuando el precio lo visita, se aleja y vuelve. La primera visita es descubrimiento; la segunda es decisión.

Opera el retest, no la ruptura en caliente, salvo que tu playbook sea momentum puro y el riesgo esté acotado.

Truco: convierte rupturas fallidas en setups. Si rompe un máximo y cierra otra vez dentro, la liquidez de stops se ha cazado. Ahí el profesor te preguntará por qué tu stop no está “justo detrás del nivel obvio”.`,
      },
      {
        id: "p3",
        title: "Huecos, desequilibrios y FVG",
        minutes: 13,
        summary: "Un imbalance es deuda de subasta: el mercado suele volver a pagarla.",
        body: `Un Fair Value Gap (FVG) es un tramo de tres velas donde el mercado no transaccionó de forma equilibrada. No es magia institucional: es ineficiencia.

Úsalo como imán, no como destino obligatorio. Confluencia: FVG + HL de tendencia + zona de volumen.

El stop no va “en el FVG”. Va más allá de la estructura que invalidaría la tesis.`,
      },
    ],
  },
  {
    id: "patrones",
    level: "intermedio",
    title: "Patrones, detonación y confluencia",
    blurb: "Geometría, velas de rechazo y el filtro de noticias.",
    lessons: [
      {
        id: "t1",
        title: "Compresiones: triángulos, banderas, canales",
        minutes: 12,
        summary: "La energía se acumula cuando el rango se encoge.",
        body: `Pre-detonación Avizor: ATR decreciente 3–8 sesiones, geometría clara, volumen en secado.

No adivines el lado. Define ambos escenarios: ruptura con aceptación y falso rompimiento.

La vela de detonación debe expandir rango y volumen. Si no, es un fake. En el Replay Lab verás cómo el profesor penaliza entradas en el medio de la caja.`,
      },
      {
        id: "t2",
        title: "Patrones de vela con contexto",
        minutes: 10,
        summary: "Un engulfing en tierra de nadie no vale nada.",
        body: `Pin bar, engulfing, inside bar: solo existen junto a un nivel. Sin nivel, son adornos.

Checklist: ¿dónde? ¿quién empujó el cierre? ¿el volumen confirma? ¿el stop cabe en 1R razonable?

Si el stop para “respetar la vela” te obliga a arriesgar 3% de cuenta, no hay patrón: hay ego.`,
      },
      {
        id: "t3",
        title: "Filtro de calendario",
        minutes: 8,
        youtubeId: "PHe0bXaT5N0",
        summary: "NFP, FOMC, CPI: el spread se come tu edge.",
        body: `No operes 30–60 minutos alrededor de datos de alto impacto salvo que tu plan sea específicamente de noticia (y entonces el size es mínimo).

El Replay Lab no simula slippage extremo, pero tú sí debes imaginarlo: si tu stop es 8 ticks y el spread salta a 12, el trade ya nació muerto.`,
      },
    ],
  },
  {
    id: "institucional",
    level: "intermedio",
    title: "Flujos institucionales y liquidez",
    blurb: "Stops, equal highs, order blocks y la caza de liquidez.",
    lessons: [
      {
        id: "i1",
        title: "Liquidez: equal highs y pools de stops",
        minutes: 14,
        summary: "El mercado se alimenta de stops obvios.",
        body: `Equal highs/lows son imanes. Los stops de retail se agrupan detrás. El precio suele barrerlos antes de ir al destino real.

No coloques el SL un tick detrás del máximo evidente. Colócalo más allá de la zona donde la tesis queda inválida, y reduce size para que el riesgo en $ siga siendo 0.5–1%.`,
      },
      {
        id: "i2",
        title: "Order blocks y zonas de origen",
        minutes: 12,
        summary: "La última vela contraria antes de un impulso impulsivo.",
        body: `Un order block es una zona de origen del movimiento, no un rectángulo sagrado. Debe alinearse con estructura y con un desequilibrio.

Entrada: mitigación (retest) con rechazo. Invalidación: cierre agresivo a través del bloque con volumen.

Si no puedes explicar el bloque en una frase, no es un bloque: es un dibujo.`,
      },
      {
        id: "i3",
        title: "Premium / discount y el equilibrio",
        minutes: 10,
        summary: "Compra barato en tendencia alcista; vende caro en bajista.",
        body: `Divide el último swing en dos. Premium es la mitad cara; discount, la barata.

En alcista, las compras de calidad viven en discount. Comprar premium es chase. El profesor te lo recordará cuando justifiques un BUY en máximos del día sin pullback.`,
      },
    ],
  },
  {
    id: "riesgo",
    level: "intermedio",
    title: "Gestión de riesgo y tamaño",
    blurb: "R múltiplos, drawdown y por qué el size es la estrategia.",
    lessons: [
      {
        id: "r1",
        title: "Riesgo fijo por idea",
        minutes: 12,
        summary: "Primero el stop, después el size. Nunca al revés.",
        body: `Fórmula: size = (cuenta × %riesgo) / |entrada − SL|.

Si el SL está lejos, el size baja. Si “necesitas” más contratos para que “valga la pena”, estás operando aburrimiento, no un edge.

En el simulador, rellena SL antes de BUY. El profesor evalúa si el riesgo es coherente con 0.5–1% de la cuenta.`,
      },
      {
        id: "r2",
        title: "R:R, expectativa y series de pérdidas",
        minutes: 11,
        summary: "Un sistema de 40% acierto sobrevive si el R medio es > 1.5.",
        body: `Expectativa = (winrate × avgWin) − (lossrate × avgLoss).

Tras 5 pérdidas, el impulso es “recuperar”. La regla es size constante o recorte, nunca martingala.

Objetivo de sesión: no superar 2R de pérdida diaria. El Replay Lab termina cuando cierras el ciclo: el veredicto no es una vela, es el diario entero.`,
      },
      {
        id: "r3",
        title: "Correlación y sobreexposición",
        minutes: 8,
        summary: "Tres compras de semicondutores no son tres ideas.",
        body: `NVDA, AMD y SMH se mueven juntos. Si arriesgas 1% en cada una, el riesgo real es ~3% al mismo factor.

En formación, trata el libro como un presupuesto de factores, no de tickers.`,
      },
    ],
  },
  {
    id: "psico",
    level: "avanzado",
    title: "Psicología y proceso",
    blurb: "FOMO, revenge trading y el diario como instrumento.",
    lessons: [
      {
        id: "y1",
        title: "Sesgos que te quiebran la cuenta",
        minutes: 12,
        youtubeId: "p7HKvqRI_Bo",
        summary: "El enemigo no es el mercado. Es la necesidad de tener razón.",
        body: `FOMO: entrar porque “se va”. Revenge: entrar porque “me la debe”. Confirmation: solo ves el lado de tu posición.

Antídoto operativo: checklist escrito ANTES del clic. Si no puedes dictar la tesis en 20 segundos, no hay trade.

El profesor del Replay Lab existe para forzar esa frase. No es decoración.`,
      },
      {
        id: "y2",
        title: "Diario, etiquetas y revisión semanal",
        minutes: 10,
        summary: "Sin etiquetas no hay estadística; sin estadística no hay mejora.",
        body: `Cada trade: setup, R planificado, R obtenido, error (sí/no), emoción al entrar.

Revisión: ¿qué setup tiene esperanza positiva? Mata el resto.

El panel final de la simulación es tu primer diario automático: wins verdes, losses rojos, sin narrativa.`,
      },
      {
        id: "y3",
        title: "Ritual de sesión",
        minutes: 8,
        summary: "Calentamiento, ejecución, apagado.",
        body: `Antes: sesgo del marco mayor, niveles, noticias, riesgo máximo.
Durante: una idea a la vez, size fijo.
Después: capturas, etiqueta, cierre de plataforma.

Si no apagas, sigues cazando. El botón “Cerrar sesión” del Replay Lab es parte del entrenamiento.`,
      },
    ],
  },
  {
    id: "playbooks",
    level: "avanzado",
    title: "Playbooks y metodologías avanzadas",
    blurb: "Tres manuales de ejecución listos para el simulador.",
    lessons: [
      {
        id: "m1",
        title: "Playbook A — Pullback en tendencia",
        minutes: 12,
        summary: "Compra HL en discount con stop bajo el swing.",
        body: `1. Diario/4h alcista.
2. Retroceso a zona de descuento o media.
3. Vela de rechazo + volumen.
4. SL bajo el HL. TP1 en 1R (parcial), TP2 en último máximo.

Invalidación: cierre bajo el HL con rango amplio.`,
      },
      {
        id: "m2",
        title: "Playbook B — Ruptura con aceptación",
        minutes: 11,
        summary: "No el wick: el cierre y el retest.",
        body: `1. Compresión visible.
2. Cierre fuera de la caja con volumen.
3. Retest a la frontera convertida.
4. SL dentro de la caja. TP en extensión 1.6–2R.

Si no hay retest y persigues, el profesor te regaña. Con razón.`,
      },
      {
        id: "m3",
        title: "Playbook C — Reversión en barrido de liquidez",
        minutes: 13,
        summary: "Deja que cazen stops ajenos, no los tuyos.",
        body: `1. Equal highs evidentes.
2. Barrido y cierre de vuelta dentro.
3. Entrada en el cierre de rechazo o en micro-retest.
4. SL más allá del barrido. TP al lado opuesto del rango.

Riesgo: operar cada mecha. Filtro: solo en nivel mayor y con sesión activa.`,
      },
    ],
  },
];

export const PSY_CAPSULES = [
  "El size es la estrategia. Si duele, es demasiado grande.",
  "No necesitas este trade. El mercado abre mañana.",
  "El stop no es una opinión. Es la invalidación de la tesis.",
  "FOMO es pagar prima por no tener un plan.",
  "Tres pérdidas seguidas no te deben un acierto.",
  "Si no puedes decir el R en voz alta, no pulses BUY.",
  "Operar aburrido es profesional. Operar emocionado es caro.",
  "El gráfico no te debe dinero. Tú le debes disciplina.",
  "Un TP movido por miedo no es gestión: es negociación con el ego.",
  "La liquidez obvia es cebo. No aparques el stop ahí.",
  "El marco mayor veta al menor. Siempre.",
  "Si el spread se come el stop, no hay edge.",
  "Cerrar en 1R no es cobardía. Es matemáticas.",
  "Revenge trading es donar expectancy.",
  "Escribe la tesis. Si no cabe en una frase, no es tesis.",
  "El mejor trade de la sesión puede ser no operar.",
];
