export type SenseiTone = "praise" | "advise" | "scold" | "ask";
export type SenseiBucket =
  | "idle"
  | "open"
  | "thesis"
  | "sl"
  | "tp"
  | "manual_win"
  | "manual_loss"
  | "session"
  | "chat";

export interface SenseiCtx {
  ticker: string;
  interval: string;
  side?: "buy" | "sell";
  entry?: number;
  sl?: number | null;
  tp?: number | null;
  slPct?: number | null;
  atrPct?: number;
  riskPct?: number | null;
  pnl?: number;
  streak: number;
  thesis?: string;
}

export interface SenseiPick {
  id: string;
  text: string;
  tone: SenseiTone;
}

export interface SenseiMemory {
  ids: string[];
  texts: string[];
}

export function emptySenseiMemory(): SenseiMemory {
  return { ids: [], texts: [] };
}

export function rememberSensei(memory: SenseiMemory, pick: SenseiPick): SenseiMemory {
  const ids = [...memory.ids, pick.id].slice(-48);
  const texts = [...memory.texts, normalizeLine(pick.text)].slice(-48);
  return { ids, texts };
}

function normalizeLine(text: string): string {
  return text
    .toLowerCase()
    .replace(/[0-9]+(\.[0-9]+)?/g, "#")
    .replace(/[^a-záéíóúñü#\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function similar(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }
  if (a === b) {
    return true;
  }
  const left = new Set(a.split(" ").filter((w) => w.length > 3));
  const right = new Set(b.split(" ").filter((w) => w.length > 3));
  if (left.size === 0 || right.size === 0) {
    return false;
  }
  let hit = 0;
  left.forEach((word) => {
    if (right.has(word)) {
      hit += 1;
    }
  });
  return hit / Math.min(left.size, right.size) > 0.72;
}

function n(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

function fill(template: string, ctx: SenseiCtx): string {
  const side = (ctx.side ?? "trade").toUpperCase();
  const slNear =
    ctx.slPct != null && ctx.atrPct != null && ctx.atrPct > 0 && ctx.slPct < ctx.atrPct * 0.7;
  return template
    .replaceAll("{ticker}", ctx.ticker)
    .replaceAll("{interval}", ctx.interval)
    .replaceAll("{side}", side)
    .replaceAll("{entry}", n(ctx.entry))
    .replaceAll("{sl}", ctx.sl == null ? "sin stop" : n(ctx.sl))
    .replaceAll("{tp}", ctx.tp == null ? "sin objetivo" : n(ctx.tp))
    .replaceAll("{slPct}", n(ctx.slPct, 2))
    .replaceAll("{atrPct}", n(ctx.atrPct, 2))
    .replaceAll("{riskPct}", n(ctx.riskPct, 2))
    .replaceAll("{pnl}", n(ctx.pnl, 2))
    .replaceAll("{streak}", String(ctx.streak))
    .replaceAll("{ruido}", slNear ? "dentro del ruido ATR" : "fuera del ruido reciente")
    .replaceAll("{thesis}", ctx.thesis?.trim() ? ctx.thesis.trim().slice(0, 80) : "silencio");
}

interface LineDef {
  id: string;
  tone: SenseiTone;
  text: string;
  when?: (ctx: SenseiCtx) => boolean;
}

function cartesian(heads: string[], tails: string[], prefix: string, tone: SenseiTone): LineDef[] {
  const out: LineDef[] = [];
  heads.forEach((head, hi) => {
    tails.forEach((tail, ti) => {
      out.push({ id: `${prefix}-${hi}-${ti}`, tone, text: `${head} ${tail}` });
    });
  });
  return out;
}

const IDLE_HEADS = [
  "El size es la estrategia.",
  "No necesitas este trade.",
  "El stop no es una opinión.",
  "FOMO es una factura.",
  "Tres pérdidas no te deben un acierto.",
  "Si no puedes decir el R, no pulses.",
  "Operar aburrido es profesional.",
  "El gráfico no te debe dinero.",
  "Mover el TP por miedo no es gestión.",
  "La liquidez obvia es cebo.",
  "El marco mayor veta al menor.",
  "Si el spread se come el stop, no hay edge.",
  "Cerrar en 1R no es cobardía.",
  "Revenge trading es donar expectancy.",
  "Si no cabe en una frase, no es tesis.",
  "El mejor trade puede ser no operar.",
  "La paciencia no cotiza, pero paga.",
  "El ego quiere acción. El edge quiere espera.",
  "Un clic sin plan es entretenimiento caro.",
  "La disciplina aburre. La indisciplina arruina.",
  "Hoy no busco héroes.",
  "El mercado abre mañana.",
  "La mecha no es una ofensa personal.",
  "El diario manda más que la última vela.",
];

const IDLE_TAILS = [
  "Si duele, es demasiado grande.",
  "Respira. El permiso sale del marco mayor.",
  "Es la invalidación de la tesis, no un deseo.",
  "Pagas prima por no tener un plan.",
  "El sample size no se construye con rabia.",
  "Sin R no hay oficio, hay apuesta.",
  "La emoción es un coste oculto.",
  "Tú le debes proceso, no al revés.",
  "Es negociación con el ego.",
  "No aparques el stop donde todos lo ven.",
  "Siempre. Sin excepción de humor.",
  "Es matemáticas, no valentía barata.",
  "Anota la regla, no la euforia.",
  "Escribe primero. Opera después.",
  "Busco un plan, un stop y un size que no te rompa.",
  "El aburrimiento es un filtro de calidad.",
];

const OPEN_LINES: LineDef[] = [
  { id: "o1", tone: "ask", text: "{ticker} {interval}: {side} a {entry}. ¿Qué estructura del marco mayor te da permiso ahora mismo?" },
  { id: "o2", tone: "ask", text: "Acabas de pulsar {side} en {ticker}. No me recites indicadores. Dime el nivel que, si se rompe, te saca." },
  { id: "o3", tone: "ask", text: "{side} @ {entry}. Si esta vela cierra en contra, ¿sigues dentro o aceptas que la idea murió?" },
  { id: "o4", tone: "ask", text: "ATR ~{atrPct}%. Tu stop está {ruido}. Explícame por qué la siguiente mecha no te va a liquidar." },
  { id: "o5", tone: "ask", text: "Riesgo {riskPct}% en {ticker}. Dime en una frase qué ganas si el mercado te da la razón." },
  { id: "o6", tone: "ask", text: "{ticker} no te pidió esta orden. ¿Es el setup o la necesidad de hacer algo?" },
  { id: "o7", tone: "ask", text: "Entrada {entry}, objetivo {tp}. ¿Dónde está el desequilibrio que justifica ese camino?" },
  { id: "o8", tone: "ask", text: "Habla como si yo fuera a copiar tu {side}: nivel, invalidación, size. Sin poesía." },
  { id: "o9", tone: "ask", text: "¿Por qué {ticker} ahora y no hace diez velas? Si la respuesta es 'porque se movió', ciérralo." },
  { id: "o10", tone: "ask", text: "SL {sl} ({slPct}% del precio). ¿Ese número nació de un swing o de un porcentaje cómodo?" },
  { id: "o11", tone: "ask", text: "Estás en {side} y el reloj sigue. ¿Cuál es tu plan si el precio no hace nada en las próximas velas?" },
  { id: "o12", tone: "ask", text: "{interval} en {ticker}: ¿confluencia real o un cruce que te hizo clic?" },
  { id: "o13", tone: "ask", text: "Si te niego el trade, ¿qué argumento usas para mantenerlo? Eso es tu tesis." },
  { id: "o14", tone: "ask", text: "Acabas de comprometer capital. Nómbrame el error más probable de este {side}." },
  { id: "o15", tone: "ask", text: "No me digas 'alcista'. Dime quién está atrapado y por qué tú no." },
  { id: "o16", tone: "ask", text: "{side} a {entry}. Si el spread y el ruido se comen {slPct}%, ¿sigue existiendo edge?" },
  { id: "o17", tone: "ask", text: "Imagina que cierras ya en 0. ¿Te arrepientes? Si sí, no tenías tesis; tenías ganas." },
  { id: "o18", tone: "ask", text: "Tu tamaño es {riskPct}% de la cuenta. ¿Dormirías con el doble? Entonces es grande." },
  { id: "o19", tone: "ask", text: "Antes de defender el {side}: ¿dónde está la liquidez que te pueden cazar?" },
  { id: "o20", tone: "ask", text: "{ticker} @ {entry}. Una frase. Si no sale limpia, la operación no está lista." },
  { id: "o21", tone: "ask", when: (c) => c.sl == null, text: "Has abierto {side} en {ticker} sin stop. En mi mesa eso no es valentía: es operar a ciegas. ¿Dónde muere la idea?" },
  { id: "o22", tone: "scold", when: (c) => c.sl == null, text: "Sin SL en {ticker}. Si el mercado abre con gap, ¿quién te salva? Contesta o cierra." },
  { id: "o23", tone: "scold", when: (c) => c.sl == null, text: "Una orden sin invalidación es un deseo. {side} @ {entry}: pon el nivel o admite que estás apostando." },
  { id: "o24", tone: "ask", when: (c) => (c.riskPct ?? 0) > 2, text: "Estás arriesgando ~{riskPct}% en un solo {side}. Eso no es convicción, es tamaño de ego. ¿Lo bajas o lo justificas con números?" },
  { id: "o25", tone: "scold", when: (c) => (c.riskPct ?? 0) > 2, text: "{riskPct}% de la cuenta en {ticker}. Un mal día te saca del laboratorio. Recorta o explota, tú eliges." },
  { id: "o26", tone: "ask", when: (c) => c.streak >= 2, text: "Llevas {streak} rojos. Ahora {side} en {ticker}. ¿Es el setup o la necesidad de recuperar? Sé honesto." },
  { id: "o27", tone: "scold", when: (c) => c.streak >= 3, text: "{streak} pérdidas y pulsas otra vez. El mercado no te debe un verde. Para. Explica por qué este no es revenge." },
  { id: "o28", tone: "ask", when: (c) => c.streak >= 2, text: "Tras {streak} golpes, el size debería encogerse, no inflarse. ¿Qué cambió en {ticker} además de tu humor?" },
  { id: "o29", tone: "ask", when: (c) => c.tp == null, text: "{side} sin TP. ¿Cobras en 1R, en estructura, o cuando el P&L te dé permiso emocional?" },
  { id: "o30", tone: "ask", when: (c) => Boolean(c.slPct && c.atrPct && c.slPct < c.atrPct * 0.65), text: "Stop al {slPct}% con ATR {atrPct}%. Está {ruido}. ¿Aceptas que te salte el ruido o lo estás negando?" },
  { id: "o31", tone: "ask", when: (c) => Boolean(c.slPct && c.atrPct && c.slPct > c.atrPct * 2.2), text: "SL muy lejos ({slPct}% vs ATR {atrPct}%). O recortas size o estás financiando un capricho." },
  { id: "o32", tone: "ask", text: "Si te pregunto '¿qué invalida esto?' y tardas más de cinco segundos, no operes. Responde ahora." },
  { id: "o33", tone: "ask", text: "{ticker} {side}. ¿Hay noticia, sesión muerta o libro delgado? El contexto también es riesgo." },
  { id: "o34", tone: "ask", text: "Dibuja mentalmente el recorrido: entrada {entry}, SL {sl}, TP {tp}. Si alguna pata cojea, dímelo antes que el mercado." },
  { id: "o35", tone: "ask", text: "No quiero que aciertes. Quiero que sepas por qué perderías. Empieza por ahí." },
];

const THESIS_LINES: LineDef[] = [
  { id: "t1", tone: "scold", when: (c) => (c.thesis?.trim().length ?? 0) < 24, text: "Eso no es tesis, es ruido. Nivel, invalidación, por qué {ticker} y no otro. Otra vez." },
  { id: "t2", tone: "scold", when: (c) => (c.thesis?.trim().length ?? 0) < 24, text: "Has escrito '{thesis}'. Eso cabe en un tweet, no en un plan. Estructura, por favor." },
  { id: "t3", tone: "scold", when: (c) => c.sl == null, text: "Hablas de {ticker} y sigues sin stop. La narrativa no sustituye la invalidación." },
  { id: "t4", tone: "advise", when: (c) => (c.riskPct ?? 0) > 1.5 && (c.riskPct ?? 0) <= 2, text: "La idea se defiende. El size está en el borde ({riskPct}%). No añadas si se pone en contra." },
  { id: "t5", tone: "praise", when: (c) => (c.thesis?.trim().length ?? 0) >= 40 && (c.riskPct ?? 99) <= 1.2 && c.sl != null, text: "Bien. Tesis articulada y riesgo ~{riskPct}%. Ahora no toques el stop por miedo. Deja que el mercado hable." },
  { id: "t6", tone: "advise", text: "Anotado: '{thesis}'. Vigila no convertir esa frase en religión si el precio niega el nivel." },
  { id: "t7", tone: "advise", text: "Plan recibido. Si {ticker} no confirma, no improvises un segundo {side}. Una tesis, un riesgo." },
  { id: "t8", tone: "scold", when: (c) => (c.riskPct ?? 0) > 2, text: "Puedes tener razón y aun así reventar la cuenta con {riskPct}%. Baja el size. El edge vive en 0.5–1%." },
  { id: "t9", tone: "advise", text: "La idea es defendible. Tu trabajo ahora es aburrido: esperar SL o TP, no negociar con cada tick." },
  { id: "t10", tone: "ask", text: "Si el precio recorre medio R en contra, ¿qué haces? Dímelo ahora, no cuando duela." },
];

const SL_LINES: LineDef[] = [
  { id: "s1", tone: "advise", text: "El stop hizo su trabajo en {ticker}. Eso no es fracaso: es el coste de muestrear el edge." },
  { id: "s2", tone: "advise", text: "SL tocado. La falta habría sido ensancharlo. Anota si el nivel era ruido o invalidación real." },
  { id: "s3", tone: "advise", text: "Te sacó el mercado, no tu miedo. Bien. Ahora no busques la 'revancha' en la siguiente vela." },
  { id: "s4", tone: "scold", when: (c) => c.streak >= 2, text: "Otro stop. Racha {streak}. El siguiente impulso de clicar es el más caro. Camina." },
  { id: "s5", tone: "advise", text: "Pérdida {pnl} en {side}. Pregunta única: ¿el stop estaba detrás de estructura o detrás de esperanza?" },
  { id: "s6", tone: "advise", text: "Cerrar en stop no te hace peor trader. Negar el stop sí." },
  { id: "s7", tone: "scold", when: (c) => c.streak >= 3, text: "{streak} stops. Esto ya no es 'mala suerte'. Es tamaño, timing o ambos. Párate a escribir." },
  { id: "s8", tone: "advise", text: "El laboratorio cobra matrícula. {ticker} acaba de pasar lista. Sigue el plan, no el orgullo." },
  { id: "s9", tone: "advise", text: "Mecha contra tu {side}. Si el marco mayor sigue intacto, espera otro disparo. Si no, cierra el día." },
  { id: "s10", tone: "advise", text: "SL @ {sl}. Matemáticas ejecutadas. El ego querrá 'recuperar'. Ignóralo." },
  { id: "s11", tone: "advise", text: "Una pérdida limpia es profesional. Una pérdida negociada es aficionado." },
  { id: "s12", tone: "ask", text: "¿Moverías ese stop si volviera a operar {ticker}? Si la respuesta es sí, el nivel nunca fue válido." },
];

const TP_LINES: LineDef[] = [
  { id: "p1", tone: "praise", text: "Objetivo tocado en {ticker}. No reescribas la historia: el plan se ejecutó. Anota el setup." },
  { id: "p2", tone: "praise", text: "TP hecho. La euforia también es un sesgo. Extrae la regla, no el subidón." },
  { id: "p3", tone: "praise", text: "Cobraste lo que escribiste. Eso es oficio. El siguiente trade no está obligado a repetirlo." },
  { id: "p4", tone: "advise", text: "Verde en {ticker} ({pnl}). Si ahora aumentas size 'porque va', estás regalando el edge." },
  { id: "p5", tone: "praise", text: "1R o más, sin teatro. Así se banca una cuenta. Siguiente." },
  { id: "p6", tone: "praise", text: "El mercado te pagó por esperar tu nivel. Recuérdalo cuando FOMO llame." },
];

const MANUAL_WIN: LineDef[] = [
  { id: "mw1", tone: "praise", text: "Cerrar en 1R no es cobardía. Es matemáticas. Bancas el edge y dejas de negociar con el ego." },
  { id: "mw2", tone: "advise", text: "Cierre positivo ({pnl}). ¿Saliste porque el plan lo decía o porque el verde te daba permiso para irte?" },
  { id: "mw3", tone: "praise", text: "Has dejado dinero en la mesa a propósito. A veces eso es gestión, no miedo. Anótalo." },
  { id: "mw4", tone: "advise", text: "Verde manual en {ticker}. Extrae la regla que repetirías mañana, no la euforia de ahora." },
  { id: "mw5", tone: "ask", text: "Si el TP seguía intacto, ¿por qué cortaste? Quiero la razón de proceso, no la de alivio." },
];

const MANUAL_LOSS: LineDef[] = [
  { id: "ml1", tone: "scold", text: "Cierre manual {pnl}. ¿La tesis murió o el P&L te miraba? Si la estructura sigue, fue emoción." },
  { id: "ml2", tone: "scold", text: "Has salido antes del stop. Eso convierte un riesgo definido en un capricho." },
  { id: "ml3", tone: "ask", text: "{ticker} en rojo por tu mano. Dime qué cambió en el gráfico, no en tu pulso." },
  { id: "ml4", tone: "advise", text: "Cortar una idea rota es profesional. Cortar porque duele es aficionado. ¿Cuál fue?" },
  { id: "ml5", tone: "scold", when: (c) => c.streak >= 2, text: "Otra salida emocional con racha {streak}. El laboratorio no es un desahogo." },
  { id: "ml6", tone: "advise", text: "Pérdida {pnl}. El daño no es el tick: es si ahora operas para 'recuperar'." },
];

const SESSION_LINES: LineDef[] = [
  { id: "ss1", tone: "advise", text: "Sesión cerrada. El edge no es una vela: es el diario entero con size controlado." },
  { id: "ss2", tone: "advise", text: "Basta por hoy. Revisa proceso, no suerte. Mañana el mercado no recordará tu humor." },
  { id: "ss3", tone: "scold", when: (c) => (c.pnl ?? 0) < 0, text: "Rojo de sesión. No lo conviertas en identidad. Conviértelo en una regla nueva." },
  { id: "ss4", tone: "praise", when: (c) => (c.pnl ?? 0) > 0, text: "Positivo. No lo celebres aumentando size. Célabralo repitiendo el mismo riesgo." },
];

const CHAT_LINES: LineDef[] = [
  { id: "c1", tone: "advise", text: "Habla con nivel y riesgo, no con esperanza. Estoy escuchando." },
  { id: "c2", tone: "ask", text: "¿Eso cambia tu invalidación o solo tu relato? Sé preciso." },
  { id: "c3", tone: "advise", text: "El mercado no debate. Tú sí. Si tu argumento no cabe en un nivel, no opera." },
  { id: "c4", tone: "scold", when: (c) => (c.thesis?.trim().length ?? 0) < 12, text: "Más corto que una mecha. Desarrolla o quédate fuera." },
  { id: "c5", tone: "advise", text: "Acepto la duda. Lo que no acepto es size grande con duda." },
  { id: "c6", tone: "ask", text: "Si mañana {ticker} abre en contra, ¿tu frase de ahora sigue siendo válida?" },
  { id: "c7", tone: "advise", text: "Bien. Mantén el mismo R. El resto es ruido de chat." },
  { id: "c8", tone: "ask", text: "¿Quieres que te lleve la contraria o que te recuerde el plan que ya escribiste?" },
];

const IDLE: LineDef[] = cartesian(IDLE_HEADS, IDLE_TAILS, "idle", "advise");

const BUCKETS: Record<SenseiBucket, LineDef[]> = {
  idle: IDLE,
  open: OPEN_LINES,
  thesis: THESIS_LINES,
  sl: SL_LINES,
  tp: TP_LINES,
  manual_win: MANUAL_WIN,
  manual_loss: MANUAL_LOSS,
  session: SESSION_LINES,
  chat: CHAT_LINES,
};

function eligible(list: LineDef[], ctx: SenseiCtx, memory: SenseiMemory): LineDef[] {
  const recentIds = new Set(memory.ids.slice(-18));
  const lastText = memory.texts[memory.texts.length - 1] ?? "";
  const tagged = list.filter((item) => !item.when || item.when(ctx));
  const pool = tagged.filter((item) => !recentIds.has(item.id));
  const source = pool.length > 0 ? pool : tagged.length > 0 ? tagged : list;
  return source.filter((item) => !similar(normalizeLine(fill(item.text, ctx)), lastText));
}

export function pickSensei(bucket: SenseiBucket, ctx: SenseiCtx, memory: SenseiMemory): SenseiPick {
  let list = BUCKETS[bucket];
  if (bucket === "open") {
    const preferred = OPEN_LINES.filter((item) => item.when?.(ctx));
    if (preferred.length > 0) {
      list = [...preferred, ...OPEN_LINES.filter((item) => !item.when)];
    }
  }
  const options = eligible(list, ctx, memory);
  const chosen = options[Math.floor(Math.random() * Math.max(options.length, 1))] ?? list[0];
  return { id: chosen.id, tone: chosen.tone, text: fill(chosen.text, ctx) };
}

export function losingStreak(pnls: number[]): number {
  let nLoss = 0;
  for (const pnl of pnls) {
    if (pnl < 0) {
      nLoss += 1;
    } else {
      break;
    }
  }
  return nLoss;
}

export function atrPct(values: [number, number, number, number][], period = 14): number {
  if (values.length < 3) {
    return 0;
  }
  const take = Math.min(period, values.length - 1);
  let sum = 0;
  for (let i = values.length - take; i < values.length; i += 1) {
    const bar = values[i];
    const prev = values[i - 1];
    if (!bar || !prev) {
      continue;
    }
    const high = bar[3];
    const low = bar[2];
    const prevClose = prev[1];
    sum += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  const last = values[values.length - 1]?.[1] ?? 0;
  return last ? (sum / take / last) * 100 : 0;
}
