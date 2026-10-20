export interface AcademyFile {
  id: string;
  title: string;
  kind: "manual" | "libro" | "checklist";
  pages: string;
  size: string;
  body: string;
}

export const ACADEMY_FILES: AcademyFile[] = [
  {
    id: "m1",
    title: "Manual de pre-detonación Avizor",
    kind: "manual",
    pages: "24 p.",
    size: "48 KB",
    body: `MANUAL DE PRE-DETONACIÓN — AvizorChart.dev

1. Compresión: ATR y rango decreciente 3–8 sesiones.
2. Geometría: triángulo / canal / soporte-resistencia.
3. Volumen: divergencia o secado antes de la vela de detonación.
4. Filtro de noticias: no operar 60 min alrededor de NFP/FOMC/CPI.
5. Riesgo: 0.5%–1% de cuenta por idea. Stop estructural, no arbitrario.
`,
  },
  {
    id: "m2",
    title: "Playbook de ejecución (órdenes y R:B)",
    kind: "manual",
    pages: "18 p.",
    size: "36 KB",
    body: `PLAYBOOK DE EJECUCIÓN

- Orden límite en retest, no chase.
- Stop más allá del último swing inválido.
- TP1 en 1R (cerrar 40%), TP2 en extensión.
- Si el spread > 18% del stop, no hay trade.
`,
  },
  {
    id: "b1",
    title: "Notas de lectura — Market Wizards (extracto pedagógico)",
    kind: "libro",
    pages: "12 p.",
    size: "22 KB",
    body: `NOTAS PEDAGÓGICAS (no sustituye el libro original)

- El edge es un proceso, no una predicción.
- Cortar pérdidas es una habilidad, no una virtud moral.
- Tamaño de posición > dirección.
Estas notas son material interno de estudio de AvizorChart.
`,
  },
  {
    id: "b2",
    title: "Notas — Trading in the Zone (disciplina)",
    kind: "libro",
    pages: "10 p.",
    size: "19 KB",
    body: `DISCIPLINA

El mercado no te debe nada. Cada vela es independiente.
Define el escenario ANTES de entrar. El diario post-trade es el alfa.
`,
  },
  {
    id: "c1",
    title: "Checklist pre-mercado",
    kind: "checklist",
    pages: "2 p.",
    size: "8 KB",
    body: `CHECKLIST

[ ] Sesión y huecos overnight
[ ] Niveles S/R del D1 y H1
[ ] Calendario macro 24h
[ ] Sesgo (solo long / solo short / flat)
[ ] Riesgo máximo del día
[ ] Sin noticias de alto impacto en 30 min
`,
  },
];

export function downloadAcademyFile(file: AcademyFile): void {
  const blob = new Blob([file.body], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${file.id}-${file.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
