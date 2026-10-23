export const WORLD_TV_DESK_KEY = "avizor.worldtv.desk.v2";

export const WORLD_TV_REGIONS = [
  { id: "global", label: "Global" },
  { id: "us", label: "USA" },
  { id: "es", label: "España" },
  { id: "eu", label: "Europa" },
  { id: "uk", label: "UK" },
  { id: "asia", label: "Asia" },
] as const;

export const TV_TUNER_TABS = [
  { id: "global", label: "Global" },
  { id: "us", label: "USA" },
  { id: "es", label: "España" },
  { id: "eu", label: "Europa" },
  { id: "asia", label: "Asia" },
] as const;

export type TvTunerTabId = (typeof TV_TUNER_TABS)[number]["id"];
export type WorldTvRegionId = (typeof WORLD_TV_REGIONS)[number]["id"];

export interface TvChannelSeed {
  id: string;
  name: string;
  channelId?: string;
  handle: string;
  type: string;
  region: string;
  flag: string;
}

export interface WorldTvChannel {
  id: string;
  label: string;
  title: string;
  region: WorldTvRegionId;
  flag?: string;
  format?: string;
  youtubeChannelId?: string;
  handle?: string;
  videoId?: string;
}

function asYtChannelId(value: string | undefined): string | undefined {
  const raw = value?.trim() ?? "";
  return /^UC[\w-]{22}$/.test(raw) ? raw : undefined;
}

function asRegion(value: string): WorldTvRegionId {
  const key = value.trim().toLowerCase();
  if (key === "usa") {
    return "us";
  }
  if (key === "españa" || key === "espana" || key === "es") {
    return "es";
  }
  if (key === "europa" || key === "eu") {
    return "eu";
  }
  if (key === "uk" || key === "reino unido") {
    return "uk";
  }
  if (key === "asia") {
    return "asia";
  }
  return "global";
}

function asHandle(value: string): string {
  const raw = value.trim();
  return raw.startsWith("@") ? raw : `@${raw}`;
}

/** Listado oficial del sintonizador. Los channelId incompletos se resuelven por handle. */
export const TV_CHANNELS: TvChannelSeed[] = [
  { id: "tradertv", name: "TraderTV Live", channelId: "UCnMn36GT_H0X-w5_ckLtlgQ", handle: "@tradertvlive", type: "Directo L-V", region: "USA", flag: "🇺🇸" },
  { id: "bloomberg", name: "Bloomberg Television", channelId: "UCIALMKvObZNtJ6AmdCLP7Lg", handle: "@markets", type: "Directo 24h", region: "Global", flag: "🌍" },
  { id: "yahoo", name: "Yahoo Finance", channelId: "UCEAZeUIeJs0IjQiqTCdVSIg", handle: "@YahooFinance", type: "Directo + programas", region: "USA", flag: "🇺🇸" },
  { id: "cnbc", name: "CNBC Television", channelId: "UCrp_UI8XtuYfpiqALiuTmUQ", handle: "@CNBCtelevision", type: "Directo + programas", region: "USA", flag: "🇺🇸" },
  { id: "tastylive", name: "tastylive", handle: "@tastylive", type: "Directo L-V", region: "USA", flag: "🇺🇸" },
  { id: "schwab", name: "Schwab Network", handle: "@SchwabNetwork", type: "Directo L-V", region: "USA", flag: "🇺🇸" },
  { id: "skynews", name: "Sky News", channelId: "UCoMdktPbSTixAyNGwb-UYkQ", handle: "@SkyNews", type: "Directo 24h", region: "Europa", flag: "🇬🇧" },
  { id: "dw", name: "DW News", channelId: "UCknLrEdhRCp1aegoMqRaCZg", handle: "@DWNews", type: "Directo 24h", region: "Europa", flag: "🇩🇪" },
  { id: "france24", name: "France 24 English", channelId: "UCQfwfsi5VrQ8yKZ-UWmAEFg", handle: "@FRANCE24English", type: "Directo 24h", region: "Europa", flag: "🇫🇷" },
  { id: "aljazeera", name: "Al Jazeera English", channelId: "UCNye-wNBqNL5ZzHSJdpkiRg", handle: "@AlJazeeraEnglish", type: "Directo 24h", region: "Global", flag: "🌍" },
  { id: "cnbctv18", name: "CNBC TV18", channelId: "UCYnNYzuLOSSSGJAqoWPWmzg", handle: "@CNBCtv18", type: "Directo Asia", region: "Asia", flag: "🇮🇳" },
  { id: "nhk", name: "NHK World", channelId: "UC3y_pqLzCZBoSQBCQ2fBm0w", handle: "@NHKWorldNews", type: "Directo 24h", region: "Asia", flag: "🇯🇵" },
  { id: "trtworld", name: "TRT World", handle: "@TRTWorld", type: "Directo 24h", region: "Europa", flag: "🇹🇷" },
  { id: "negociostv", name: "Negocios TV", channelId: "UCr6JcgG9eskEzL-6nqhmR9Q", handle: "@NegociosTV", type: "Directo + programas", region: "España", flag: "🇪🇸" },
  { id: "domenech", name: "Domènec Surià", handle: "@BlogdeDoc", type: "2 directos diarios", region: "España", flag: "🇪🇸" },
  { id: "pablogil", name: "Pablo Gil Trader", handle: "@PabloGilTrader", type: "Vídeos frecuentes", region: "España", flag: "🇪🇸" },
  { id: "elartedeinvertir", name: "El Arte de Invertir", handle: "@ElArteDeInvertir", type: "Diario", region: "España", flag: "🇪🇸" },
  { id: "enbolsa", name: "Enbolsa", handle: "@EnbolsaNet", type: "Análisis técnico", region: "España", flag: "🇪🇸" },
  { id: "davidgalan", name: "David Galán Bolsa", handle: "@BolsaGeneral", type: "Análisis técnico", region: "España", flag: "🇪🇸" },
  { id: "thetradingchannel", name: "The Trading Channel", channelId: "UCPhAMnWQCKSHcQOQrOt8X1A", handle: "@TheTradingChannel", type: "Educación trading", region: "Global", flag: "🌍" },
  { id: "warriortrading", name: "Warrior Trading", handle: "@WarriorTrading", type: "Day Trading USA", region: "USA", flag: "🇺🇸" },
  { id: "chartfanatics", name: "Chart Fanatics", handle: "@ChartFanatics", type: "Sesiones largas", region: "USA", flag: "🇺🇸" },
  { id: "toritrades", name: "Tori Trades", handle: "@ToriTrades", type: "Trading day", region: "USA", flag: "🇺🇸" },
  { id: "livetraders", name: "Live Traders", handle: "@LiveTraders", type: "Estrategias", region: "USA", flag: "🇺🇸" },
  { id: "raynerteo", name: "Rayner Teo", handle: "@TraderLion", type: "Educación", region: "Asia", flag: "🇸🇬" },
  { id: "andiypips", name: "Andyy Pips", handle: "@AndyyPips", type: "Forex", region: "Europa", flag: "🇬🇧" },
  { id: "novatostrading", name: "Novatos Trading Club", handle: "@NovatosTradingClub", type: "Formación", region: "España", flag: "🇪🇸" },
  { id: "valueschool", name: "Value School", handle: "@ValueSchoolES", type: "Inversión y valor", region: "España", flag: "🇪🇸" },
  { id: "estrategiasinversion", name: "Estrategias de Inversión", handle: "@EstrategiasdInversion", type: "Diario bolsa", region: "España", flag: "🇪🇸" },
  { id: "rankia", name: "Rankia", handle: "@Rankia", type: "Comunidad y análisis", region: "España", flag: "🇪🇸" },
  { id: "meetkevin", name: "Meet Kevin", handle: "@MeetKevin", type: "Macro y mercado", region: "USA", flag: "🇺🇸" },
  { id: "grahamstephan", name: "Graham Stephan", handle: "@GrahamStephan", type: "Finanzas", region: "USA", flag: "🇺🇸" },
  { id: "andreijikh", name: "Andrei Jikh", handle: "@AndreiJikh", type: "Inversión", region: "USA", flag: "🇺🇸" },
  { id: "patrickboyle", name: "Patrick Boyle on Finance", handle: "@PatrickBoyleonFinance", type: "Análisis profundo", region: "UK", flag: "🇬🇧" },
  { id: "reuters", name: "Reuters", handle: "@Reuters", type: "Noticias", region: "Global", flag: "🌍" },
];

export const WORLD_TV_CHANNELS: WorldTvChannel[] = TV_CHANNELS.map((item) => ({
  id: item.id,
  label: item.name,
  title: item.name,
  region: asRegion(item.region),
  flag: item.flag,
  format: item.type,
  youtubeChannelId: asYtChannelId(item.channelId),
  handle: asHandle(item.handle),
}));

export type WorldTvChannelId = (typeof TV_CHANNELS)[number]["id"];

export function isWorldTvChannelId(value: string): value is WorldTvChannelId {
  return WORLD_TV_CHANNELS.some((item) => item.id === value);
}

export function worldTvChannel(id: string): WorldTvChannel {
  return WORLD_TV_CHANNELS.find((item) => item.id === id) ?? WORLD_TV_CHANNELS[0];
}

export function channelsByRegion(region: WorldTvRegionId): WorldTvChannel[] {
  return WORLD_TV_CHANNELS.filter((item) => item.region === region);
}

export function channelFlag(channel: WorldTvChannel): string {
  return channel.flag ?? "🌐";
}

export function channelsForTunerTab(tab: TvTunerTabId): WorldTvChannel[] {
  if (tab === "global") {
    return WORLD_TV_CHANNELS;
  }
  if (tab === "us") {
    return WORLD_TV_CHANNELS.filter((item) => item.region === "us");
  }
  if (tab === "es") {
    return WORLD_TV_CHANNELS.filter((item) => item.region === "es" || item.flag === "🇪🇸");
  }
  if (tab === "eu") {
    return WORLD_TV_CHANNELS.filter((item) => item.region === "eu" || item.region === "uk");
  }
  return WORLD_TV_CHANNELS.filter((item) => item.region === "asia");
}

export const WORLD_TV_REGION_LABEL: Record<WorldTvRegionId, string> = Object.fromEntries(
  WORLD_TV_REGIONS.map((item) => [item.id, item.label]),
) as Record<WorldTvRegionId, string>;
