export interface NavItem {
  href: string;
  label: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { href: "/screener", label: "Screener" },
  { href: "/grafico", label: "Mega Gráfico" },
  { href: "/market-news", label: "Market News" },
  { href: "/comunidad", label: "Comunidad" },
  { href: "/academia", label: "Academia" },
  { href: "/perfil", label: "Zona Privada" },
] as const;
