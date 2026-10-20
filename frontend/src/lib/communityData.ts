export type CommunityTab = "x" | "foro" | "embajadores" | "amigas";

export interface XPost {
  id: string;
  handle: string;
  name: string;
  verified: boolean;
  time: string;
  text: string;
  cashtags: string[];
  likes: number;
  rts: number;
  replies: number;
  sentiment: "bull" | "bear" | "neutral";
}

export interface ForumThread {
  id: string;
  board: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  last: string;
  pinned?: boolean;
}

export interface Ambassador {
  id: string;
  name: string;
  handle: string;
  region: string;
  focus: string;
  xp: number;
}

export interface PartnerPage {
  id: string;
  name: string;
  kind: string;
  url: string;
  blurb: string;
}

export const X_POSTS: XPost[] = [
  {
    id: "1",
    handle: "zerohedge",
    name: "ZeroHedge",
    verified: true,
    time: "2m",
    text: "El VIX se comprime otra vez bajo 16 mientras el Nasdaq marca máximos. La complacencia es el trade. $SPX $QQQ",
    cashtags: ["SPX", "QQQ"],
    likes: 1840,
    rts: 612,
    replies: 203,
    sentiment: "bear",
  },
  {
    id: "2",
    handle: "DeItaone",
    name: "Walter Bloomberg",
    verified: true,
    time: "6m",
    text: "BREAKING: NVDA — demanda de data centers sigue por encima de oferta, según notas de sell-side. $NVDA",
    cashtags: ["NVDA"],
    likes: 4210,
    rts: 1502,
    replies: 388,
    sentiment: "bull",
  },
  {
    id: "3",
    handle: "unusual_whales",
    name: "unusual_whales",
    verified: true,
    time: "11m",
    text: "Flujo inusual: 18k calls $TSLA 280c semanales, sweep agresivo. Premium ~$2.4M. $TSLA",
    cashtags: ["TSLA"],
    likes: 990,
    rts: 274,
    replies: 141,
    sentiment: "bull",
  },
  {
    id: "4",
    handle: "FxHedging",
    name: "FX Desk",
    verified: false,
    time: "18m",
    text: "EURUSD rechaza 1.0880. Si pierde 1.0820 el siguiente imán es 1.0765. $EURUSD",
    cashtags: ["EURUSD"],
    likes: 312,
    rts: 48,
    replies: 67,
    sentiment: "bear",
  },
  {
    id: "5",
    handle: "AvizorChart",
    name: "AvizorChart.dev",
    verified: true,
    time: "24m",
    text: "Ojeador: compresión en $AMD con ATR cayendo 3 sesiones. La mesa de agentes queda en STANDBY hasta la vela de detonación.",
    cashtags: ["AMD"],
    likes: 156,
    rts: 41,
    replies: 22,
    sentiment: "neutral",
  },
  {
    id: "6",
    handle: "firstsquawk",
    name: "First Squawk",
    verified: true,
    time: "31m",
    text: "Oro consolida sobre 2.640. Flujos a $GLD coinciden con cobertura de duration. $GC $GLD",
    cashtags: ["GLD", "GC"],
    likes: 540,
    rts: 119,
    replies: 44,
    sentiment: "bull",
  },
  {
    id: "7",
    handle: "CryptoQuant",
    name: "CryptoQuant",
    verified: true,
    time: "44m",
    text: "Exchange netflow de $BTC sigue negativo. Menos oferta líquida, misma narrativa de supply shock. $BTC",
    cashtags: ["BTC"],
    likes: 2104,
    rts: 701,
    replies: 256,
    sentiment: "bull",
  },
  {
    id: "8",
    handle: "OptionsFlowHQ",
    name: "Options Flow HQ",
    verified: false,
    time: "1h",
    text: "Put/call de $SPY en 1.12 intradía. No es pánico, es cobertura de fin de mes.",
    cashtags: ["SPY"],
    likes: 188,
    rts: 22,
    replies: 19,
    sentiment: "neutral",
  },
];

export const TRENDING = [
  { tag: "$NVDA", posts: "124K" },
  { tag: "$BTC", posts: "98K" },
  { tag: "$SPY", posts: "76K" },
  { tag: "$TSLA", posts: "54K" },
  { tag: "$EURUSD", posts: "21K" },
  { tag: "#FOMC", posts: "18K" },
];

export const FORUM_BOARDS = ["Índices", "Acciones", "Forex", "Cripto", "Opciones", "Psicotrading"];

export const FORUM_THREADS: ForumThread[] = [
  {
    id: "t1",
    board: "Índices",
    title: "¿Ruptura real de $QQQ o fakeout de apertura?",
    author: "scout_01",
    replies: 48,
    views: 1920,
    last: "hace 4 min",
    pinned: true,
  },
  {
    id: "t2",
    board: "Acciones",
    title: "Playbook de pre-detonación en semis ($NVDA / $AMD / $AVGO)",
    author: "elena.r",
    replies: 33,
    views: 1402,
    last: "hace 12 min",
    pinned: true,
  },
  {
    id: "t3",
    board: "Forex",
    title: "Londres: sesgo de $GBPUSD con NFP a 48h",
    author: "fx_london",
    replies: 19,
    views: 640,
    last: "hace 21 min",
  },
  {
    id: "t4",
    board: "Cripto",
    title: "Funding de $BTC en perpetuos y sesgo de apalancamiento",
    author: "onchain",
    replies: 61,
    views: 3104,
    last: "hace 29 min",
  },
  {
    id: "t5",
    board: "Opciones",
    title: "Spreads de crédito vs débito cuando IV rank > 50",
    author: "viktor",
    replies: 14,
    views: 501,
    last: "hace 41 min",
  },
  {
    id: "t6",
    board: "Psicotrading",
    title: "Regla de 3 pérdidas: cómo cortar la racha sin tilt",
    author: "adriana",
    replies: 27,
    views: 880,
    last: "hace 1 h",
  },
];

export const AMBASSADORS: Ambassador[] = [
  { id: "a1", name: "Lucía Navarro", handle: "@luciafx", region: "Madrid", focus: "Forex + índices EU", xp: 92 },
  { id: "a2", name: "Marco Silva", handle: "@silvaflow", region: "Lisboa", focus: "Opciones $SPY", xp: 88 },
  { id: "a3", name: "Ana Ríos", handle: "@anaonchain", region: "CDMX", focus: "Cripto y funding", xp: 84 },
  { id: "a4", name: "Owen Blake", handle: "@owendesk", region: "London", focus: "Futuros ES/NQ", xp: 90 },
];

export const PARTNER_PAGES: PartnerPage[] = [
  {
    id: "p1",
    name: "TradingView",
    kind: "Gráficos",
    url: "https://www.tradingview.com",
    blurb: "Referencia de charting colaborativo y ideas públicas.",
  },
  {
    id: "p2",
    name: "BabyPips",
    kind: "Formación FX",
    url: "https://www.babypips.com",
    blurb: "School of Pipsology: base de forex para operadores nuevos.",
  },
  {
    id: "p3",
    name: "Investopedia",
    kind: "Enciclopedia",
    url: "https://www.investopedia.com",
    blurb: "Definiciones, estrategias y calendario económico.",
  },
  {
    id: "p4",
    name: "CME Group",
    kind: "Futuros",
    url: "https://www.cmegroup.com",
    blurb: "Especificaciones de contratos, volumen y open interest.",
  },
  {
    id: "p5",
    name: "FXStreet",
    kind: "Forex news",
    url: "https://www.fxstreet.com",
    blurb: "Cobertura intradía de divisas y macro.",
  },
  {
    id: "p6",
    name: "DailyFX",
    kind: "Análisis",
    url: "https://www.dailyfx.com",
    blurb: "Sesgo técnico y fundamental de IG.",
  },
  {
    id: "p7",
    name: "Seeking Alpha",
    kind: "Renta variable",
    url: "https://seekingalpha.com",
    blurb: "Tesis long/short y transcripts de earnings.",
  },
  {
    id: "p8",
    name: "StockCharts",
    kind: "Técnico",
    url: "https://stockcharts.com",
    blurb: "Market carpets, breadth y charting clásico.",
  },
];
