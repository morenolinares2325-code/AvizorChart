export const WORLD_TV_DESK_KEY = "avizor.worldtv.desk.v1";

export const WORLD_TV_REGIONS = [
  { id: "us", label: "EE.UU." },
  { id: "uk", label: "UK" },
  { id: "eu", label: "Europa" },
  { id: "apac", label: "Asia-Pacífico" },
  { id: "asean", label: "Tailandia / ASEAN" },
  { id: "mena", label: "Oriente Medio" },
  { id: "africa", label: "África" },
  { id: "oceania", label: "Oceanía" },
  { id: "latam", label: "Latam" },
] as const;

export type WorldTvRegionId = (typeof WORLD_TV_REGIONS)[number]["id"];

export interface WorldTvChannel {
  id: string;
  label: string;
  title: string;
  region: WorldTvRegionId;
  youtubeChannelId?: string;
  handle?: string;
  videoId?: string;
}

export const WORLD_TV_CHANNELS: WorldTvChannel[] = [
  { id: "bloomberg", label: "Bloomberg", title: "Bloomberg Markets", region: "us", youtubeChannelId: "UCIALMYtNnZtNYHsRirqUOzQ", videoId: "OlUMDZchivQ" },
  { id: "cnbc", label: "CNBC", title: "CNBC International", region: "us", youtubeChannelId: "UCrp_UI8XtuYfpiqluWLD7Lw", videoId: "9NyxcX3rhQs" },
  { id: "yahoo", label: "Yahoo Finance", title: "Yahoo Finance Live", region: "us", youtubeChannelId: "UCEAZeUIeJs0IjQiqTClHaGg", videoId: "KQp-e_XQnDE" },
  { id: "foxbiz", label: "Fox Business", title: "Fox Business", region: "us", youtubeChannelId: "UCc7p3J50Wbm8UZ50Be6YqPg", handle: "@FoxBusiness" },
  { id: "reuters", label: "Reuters", title: "Reuters", region: "us", youtubeChannelId: "UChqUTb7kYRX8-EiaN3X44WQ", handle: "@Reuters" },
  { id: "wsj", label: "WSJ", title: "Wall Street Journal", region: "us", youtubeChannelId: "UCK7tptUDHh-RYDsdxO1-5QQ", handle: "@wsj" },
  { id: "nbc", label: "NBC News", title: "NBC News", region: "us", youtubeChannelId: "UCeY0bbntWzzVIaj2z3QigXg", handle: "@NBCNews" },
  { id: "kitco", label: "Kitco", title: "Kitco NEWS", region: "us", youtubeChannelId: "UCCsz7PXdcx1yZGZo7hUwwIg", handle: "@KitcoNEWS" },

  { id: "sky", label: "Sky News", title: "Sky News", region: "uk", youtubeChannelId: "UCoMdktPbSTixAyNGwb-UYkQ", videoId: "cY-6Ari01EE" },
  { id: "bbc", label: "BBC News", title: "BBC News", region: "uk", youtubeChannelId: "UC16niRr50-MS1ZwJl5pIQ8g", handle: "@BBCNews" },
  { id: "guardian", label: "Guardian", title: "The Guardian", region: "uk", youtubeChannelId: "UCHpw8xwDNhU9gdohEcJu4aA", handle: "@theguardian" },
  { id: "itv", label: "ITV News", title: "ITV News", region: "uk", youtubeChannelId: "UCFQgi22Ht00CpaOQLtvZx2A", handle: "@itvnews" },
  { id: "cityam", label: "City A.M.", title: "City A.M.", region: "uk", youtubeChannelId: "UCkN3-J2WZ1uGv4Iu-kJwPXw", handle: "@CityAM" },

  { id: "dw", label: "DW", title: "DW News", region: "eu", youtubeChannelId: "UCknLrEdhRCp1aegaAuM0FaQ", videoId: "LuKwFajn37U" },
  { id: "france24", label: "France 24", title: "France 24 English", region: "eu", youtubeChannelId: "UCQfwfsi5VrQ8yKZ-ULxRQKA", videoId: "Ap-UM1O9RBU" },
  { id: "euronews", label: "Euronews", title: "Euronews", region: "eu", youtubeChannelId: "UCW2QcKZiU8-NiYzxORhC0qw", handle: "@euronews" },
  { id: "bfm", label: "BFM Business", title: "BFM Business", region: "eu", youtubeChannelId: "UCCva-1YJY_IY8dBOvPoePzA", handle: "@bfmbusiness" },
  { id: "ntv", label: "n-tv", title: "n-tv Nachrichten", region: "eu", youtubeChannelId: "UC9-ptAQn_l0e8B6SYqzqQ0g", handle: "@ntvNachrichten" },
  { id: "rtve", label: "RTVE", title: "RTVE Noticias", region: "eu", youtubeChannelId: "UCsZt-9rNs0XZoYzQxYZf-uA", handle: "@rtve" },

  { id: "cna", label: "CNA", title: "CNA", region: "apac", youtubeChannelId: "UC5l1Yto5oPGfKEMX0806n7Q", videoId: "-PWMxjBgr0k" },
  { id: "nikkei", label: "Nikkei", title: "Nikkei Asia", region: "apac", youtubeChannelId: "UCyumUxW9HIh8H7Rq_UzrQLA", handle: "@nikkei" },
  { id: "arirang", label: "Arirang", title: "Arirang News", region: "apac", youtubeChannelId: "UCzznO4xSV8BErFU6W2cBUSQ", videoId: "zvoPEgZeWkg" },
  { id: "bloomberg-asia", label: "Bloomberg Asia", title: "Bloomberg Asia", region: "apac", youtubeChannelId: "UCIALMYtNnZtNYHsRirqUOzQ", videoId: "f39oHo6vFLg" },
  { id: "nhk", label: "NHK World", title: "NHK WORLD-JAPAN", region: "apac", youtubeChannelId: "UCSPEjw8F2nQDffANB62Rj5A", handle: "@NHKWORLDJAPAN" },
  { id: "cgtn", label: "CGTN", title: "CGTN", region: "apac", youtubeChannelId: "UCgrNz-aDmcr15Go-dBOfpKg", handle: "@cgtn" },
  { id: "scmp", label: "SCMP", title: "South China Morning Post", region: "apac", youtubeChannelId: "UC4SUWizzKb1WUAuW2Y-h4-A", handle: "@scmp" },

  { id: "thaipbs", label: "Thai PBS", title: "Thai PBS", region: "asean", youtubeChannelId: "UC_D5C2p0rF8G8v9v4k5n2gA", handle: "@ThaiPBS" },
  { id: "nationtv", label: "Nation TV", title: "Nation TV 22", region: "asean", youtubeChannelId: "UCnv0C3h0K2bM5f8c0YqX2wA", handle: "@nationtv22" },
  { id: "kompas", label: "Kompas", title: "Kompas TV", region: "asean", youtubeChannelId: "UC5N-dy-vqYT7iQMF0pW7_nA", handle: "@KompasTV" },
  { id: "abs", label: "ABS-CBN", title: "ABS-CBN News", region: "asean", youtubeChannelId: "UCE2606dvTNJh1SDKd80QPEA", handle: "@ABSCBNNews" },
  { id: "straitstimes", label: "Straits Times", title: "The Straits Times", region: "asean", youtubeChannelId: "UC4p_I9eiLow9X81OOx_c2KA", handle: "@TheStraitsTimes" },

  { id: "aljazeera", label: "Al Jazeera", title: "Al Jazeera English", region: "mena", youtubeChannelId: "UCNye-wNBqNL5YDmRXLQhHVA", handle: "@aljazeeraenglish" },
  { id: "trt", label: "TRT World", title: "TRT World", region: "mena", youtubeChannelId: "UC7fWeaHhqgM4Ry-R-B9BNRg", handle: "@trtworld" },
  { id: "skyarabia", label: "Sky Arabia", title: "Sky News Arabia", region: "mena", youtubeChannelId: "UCoMr21PDqt2m8qEHhJ2B4gA", handle: "@SkyNewsArabia" },
  { id: "cnbcarabia", label: "CNBC Arabia", title: "CNBC Arabia", region: "mena", youtubeChannelId: "UCsZt9-9rNs0XZoYzQxYZf-uB", handle: "@CNBCArabia" },

  { id: "africanews", label: "Africanews", title: "Africanews", region: "africa", youtubeChannelId: "UC1_E8C8ZjfcE8S7K8g3a0gA", handle: "@africanews" },
  { id: "channels", label: "Channels TV", title: "Channels Television", region: "africa", youtubeChannelId: "UCEXGDNclvmg6RW0vipJYsTQ", handle: "@channelstv" },
  { id: "sabc", label: "SABC", title: "SABC News", region: "africa", youtubeChannelId: "UC8yH-uI81UUtEMHjwOA7BQA", handle: "@SABCNews" },
  { id: "ewn", label: "EWN", title: "Eyewitness News", region: "africa", youtubeChannelId: "UCcuT5I2xZ2Q2kq3Q2kq3Q2k", handle: "@ewn" },

  { id: "abcau", label: "ABC News AU", title: "ABC News Australia", region: "oceania", youtubeChannelId: "UCLgL5-sJ9r7HqzWQsIabUlg", handle: "@abcnews" },
  { id: "skyau", label: "Sky News AU", title: "Sky News Australia", region: "oceania", youtubeChannelId: "UCwd5VFu4KoJNjkWJZ6J5nww", handle: "@SkyNewsAustralia" },
  { id: "sbs", label: "SBS", title: "SBS News", region: "oceania", youtubeChannelId: "UCrYAB7CyPeJ0_D33JzUzFqQ", handle: "@sbsnews" },

  { id: "cnnesp", label: "CNN Español", title: "CNN en Español", region: "latam", youtubeChannelId: "UC_lEiu6917IJz03TnntWUaQ", handle: "@cnnee" },
  { id: "ntn24", label: "NTN24", title: "NTN24", region: "latam", youtubeChannelId: "UCEJsULQh5oXQk4dMf5nFd5g", handle: "@NTN24" },
  { id: "tnar", label: "TN", title: "Todo Noticias", region: "latam", youtubeChannelId: "UCjM1hSEi0MVrUYctw_wwK-g", handle: "@todonoticias" },
  { id: "globonews", label: "GloboNews", title: "g1 / GloboNews", region: "latam", youtubeChannelId: "UCaKOvSW-NSlVIgQJVBiFIzw", handle: "@g1" },
  { id: "forotv", label: "Foro TV", title: "Foro News", region: "latam", youtubeChannelId: "UC2SfeO3FJC10C3J2Wc365yQ", handle: "@ForoTV" },
];

export type WorldTvChannelId = (typeof WORLD_TV_CHANNELS)[number]["id"];

export function isWorldTvChannelId(value: string): value is WorldTvChannelId {
  return WORLD_TV_CHANNELS.some((item) => item.id === value);
}

export function worldTvChannel(id: string): WorldTvChannel {
  return WORLD_TV_CHANNELS.find((item) => item.id === id) ?? WORLD_TV_CHANNELS[0];
}

export function channelsByRegion(region: WorldTvRegionId): WorldTvChannel[] {
  return WORLD_TV_CHANNELS.filter((item) => item.region === region);
}

export const WORLD_TV_REGION_LABEL: Record<WorldTvRegionId, string> = Object.fromEntries(
  WORLD_TV_REGIONS.map((item) => [item.id, item.label]),
) as Record<WorldTvRegionId, string>;
