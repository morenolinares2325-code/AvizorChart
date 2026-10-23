"use client";

import {
  Bot,
  Cable,
  LineChart,
  Plus,
  Send,
  Shield,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { findAsset, searchUniverse } from "@/lib/mockScreenerData";
import {
  loadUserPortfolios,
  newPortfolio,
  saveUserPortfolios,
  type PortfolioKind,
  type UserPortfolio,
} from "@/lib/userPortfolios";

type PrivateTab = "cuenta" | "cartera" | "conexion";

const TABS: { id: PrivateTab; label: string; hint: string; icon: typeof UserRound }[] = [
  { id: "cuenta", label: "Cuenta", hint: "Perfil y suscripción", icon: UserRound },
  { id: "cartera", label: "Cartera", hint: "Listas y Mega Gráfico", icon: Wallet },
  { id: "conexion", label: "Conexión", hint: "Telegram, broker y bot", icon: Cable },
];

const STORAGE_KEY = "avizor.private.v1";

interface PrivateState {
  name: string;
  email: string;
  timezone: string;
  plan: "free" | "pro" | "desk";
  broker: string;
  mt5Login: string;
  mt5Server: string;
  apiKey: string;
  riskPct: number;
  autoEnabled: boolean;
  telegramBot: string;
  telegramChat: string;
  botName: string;
}

const DEFAULT_STATE: PrivateState = {
  name: "Operador Avizor",
  email: "operador@avizorchart.dev",
  timezone: "Europe/Madrid",
  plan: "pro",
  broker: "IC Markets",
  mt5Login: "",
  mt5Server: "ICMarketsSC-Demo",
  apiKey: "",
  riskPct: 0.75,
  autoEnabled: false,
  telegramBot: "",
  telegramChat: "",
  botName: "Avizor Bot",
};

export function PrivateWorkspace() {
  const [tab, setTab] = useState<PrivateTab>("cuenta");
  const [state, setState] = useState<PrivateState>(DEFAULT_STATE);
  const [portfolios, setPortfolios] = useState<UserPortfolio[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PrivateState>) });
      }
    } catch {
      setState(DEFAULT_STATE);
    }
    setPortfolios(loadUserPortfolios());
  }, []);

  function patch(partial: Partial<PrivateState>) {
    setState((current) => ({ ...current, ...partial }));
    setSaved(false);
  }

  function persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    saveUserPortfolios(portfolios);
    setSaved(true);
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      <header className="pointer-events-none flex h-16 shrink-0 items-center gap-3 border-b border-[#1F1F2E] bg-[#0A0A0F]/80 backdrop-blur-md pl-12 pr-3">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#00FF66]">Zona privada</p>
          <p className="hidden truncate text-[11px] text-zinc-500 sm:block">Cuenta · carteras · conexiones</p>
        </div>
        <nav className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {TABS.map((item) => {
            const Icon = item.icon;
            const on = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex h-12 min-w-[9.5rem] items-center gap-2.5 rounded-lg border px-3 text-left transition ${
                  on
                    ? "border-[#00FF66]/40 bg-[#00FF66]/10"
                    : "border-[#1F1F2E] bg-[#050508] hover:border-zinc-600"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${on ? "text-[#00FF66]" : "text-zinc-400"}`} />
                <span>
                  <span className={`block text-[13px] font-semibold ${on ? "text-white" : "text-zinc-200"}`}>
                    {item.label}
                  </span>
                  <span className="block font-mono text-[9px] uppercase tracking-wide text-zinc-500">{item.hint}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={persist}
          className="ml-auto h-10 shrink-0 rounded-md bg-[#00FF66] px-4 font-mono text-[11px] font-semibold uppercase tracking-wide text-black"
        >
          {saved ? "Guardado" : "Guardar"}
        </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "cuenta" ? <AccountPane state={state} patch={patch} /> : null}
        {tab === "cartera" ? (
          <PortfolioDesk
            portfolios={portfolios}
            onChange={(next) => {
              setPortfolios(next);
              setSaved(false);
            }}
          />
        ) : null}
        {tab === "conexion" ? <ConnectionPane state={state} patch={patch} /> : null}
      </div>
    </div>
  );
}

function AccountPane({
  state,
  patch,
}: {
  state: PrivateState;
  patch: (partial: Partial<PrivateState>) => void;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Panel icon={<UserRound className="h-5 w-5" />} title="Perfil de operador">
        <Field label="Nombre" value={state.name} onChange={(value) => patch({ name: value })} />
        <Field label="Email" value={state.email} onChange={(value) => patch({ email: value })} />
        <Field label="Zona horaria" value={state.timezone} onChange={(value) => patch({ timezone: value })} />
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          Identidad local de este terminal. OAuth se conectará más adelante; hoy se guarda en el navegador.
        </p>
      </Panel>
      <Panel icon={<Shield className="h-5 w-5" />} title="Suscripción">
        <p className="mb-3 text-sm text-zinc-400">El plan vive dentro de la cuenta. Elige el nivel de mesa.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(
            [
              { id: "free", name: "Free", price: "0 €", note: "Screener limitado" },
              { id: "pro", name: "Pro", price: "29 €/mes", note: "Mega Gráfico + noticias" },
              { id: "desk", name: "Desk", price: "99 €/mes", note: "Agentes + MT5 live" },
            ] as const
          ).map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => patch({ plan: plan.id })}
              className={`rounded-xl border p-4 text-left ${
                state.plan === plan.id
                  ? "border-[#00FF66]/50 bg-[#00FF66]/10"
                  : "border-[#1F1F2E] bg-[#050508] hover:border-zinc-600"
              }`}
            >
              <p className="text-sm font-semibold text-white">{plan.name}</p>
              <p className="mt-1 font-mono text-2xl text-zinc-50">{plan.price}</p>
              <p className="mt-1 text-xs text-zinc-500">{plan.note}</p>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function PortfolioDesk({
  portfolios,
  onChange,
}: {
  portfolios: UserPortfolio[];
  onChange: (next: UserPortfolio[]) => void;
}) {
  const [activeId, setActiveId] = useState(portfolios[0]?.id ?? "");
  const active = portfolios.find((item) => item.id === activeId) ?? portfolios[0] ?? null;
  const [draft, setDraft] = useState("");
  const suggestions = useMemo(() => searchUniverse(draft), [draft]);

  useEffect(() => {
    if (!portfolios.some((item) => item.id === activeId) && portfolios[0]) {
      setActiveId(portfolios[0].id);
    }
  }, [activeId, portfolios]);

  function patchActive(partial: Partial<UserPortfolio>) {
    if (!active) {
      return;
    }
    onChange(portfolios.map((item) => (item.id === active.id ? { ...item, ...partial } : item)));
  }

  function addTicker(raw: string) {
    const ticker = raw.trim().toUpperCase();
    if (!active || !ticker) {
      return;
    }
    if (active.tickers.includes(ticker)) {
      setDraft("");
      return;
    }
    patchActive({ tickers: [...active.tickers, ticker] });
    setDraft("");
  }

  function removeTicker(ticker: string) {
    if (!active) {
      return;
    }
    patchActive({ tickers: active.tickers.filter((item) => item !== ticker) });
  }

  return (
    <div className="mx-auto flex h-full min-h-[32rem] max-w-[1400px] flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Carteras de seguimiento</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-400">
            Crea tantas listas como necesites: acciones o multiactivos. Cada símbolo abre el Mega Gráfico en un paso.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const next = newPortfolio("acciones");
              onChange([...portfolios, next]);
              setActiveId(next.id);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#1F1F2E] px-3 font-mono text-[11px] uppercase tracking-wide text-zinc-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Acciones
          </button>
          <button
            type="button"
            onClick={() => {
              const next = newPortfolio("multiactivos");
              onChange([...portfolios, next]);
              setActiveId(next.id);
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#00FF66] px-3 font-mono text-[11px] font-semibold uppercase tracking-wide text-black"
          >
            <Plus className="h-3.5 w-3.5" />
            Multiactivos
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-1.5 overflow-y-auto rounded-xl border border-[#1F1F2E] bg-[#0A0A0F] p-2">
          {portfolios.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-zinc-500">Crea la primera cartera.</p>
          ) : (
            portfolios.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`w-full rounded-lg px-3 py-2.5 text-left ${
                  item.id === active?.id ? "bg-[#00FF66]/10 ring-1 ring-[#00FF66]/35" : "hover:bg-white/[0.04]"
                }`}
              >
                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-zinc-500">
                  {item.kind} · {item.tickers.length} símbolos
                </p>
              </button>
            ))
          )}
        </aside>

        {active ? (
          <section className="flex min-h-0 flex-col rounded-xl border border-[#1F1F2E] bg-[#0A0A0F] p-4">
            <div className="flex flex-wrap items-start gap-3">
              <label className="min-w-[16rem] flex-1 text-[11px] uppercase tracking-wide text-zinc-500">
                Nombre de la cartera
                <input
                  value={active.name}
                  onChange={(event) => patchActive({ name: event.target.value })}
                  className="mt-1 h-11 w-full rounded-md border border-[#1F1F2E] bg-[#050508] px-3 text-lg font-semibold text-white outline-none focus:border-[#00FF66]/40"
                />
              </label>
              <label className="text-[11px] uppercase tracking-wide text-zinc-500">
                Tipo de listado
                <select
                  value={active.kind}
                  onChange={(event) => patchActive({ kind: event.target.value as PortfolioKind })}
                  className="mt-1 h-11 rounded-md border border-[#1F1F2E] bg-[#050508] px-2 text-sm text-white"
                >
                  <option value="acciones">Acciones</option>
                  <option value="multiactivos">Multiactivos</option>
                </select>
              </label>
              {active.tickers[0] ? (
                <Link
                  href={`/grafico?ticker=${encodeURIComponent(active.tickers[0])}`}
                  className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-[#00FF66] px-4 font-mono text-[11px] font-semibold uppercase tracking-wide text-black"
                >
                  <LineChart className="h-4 w-4" />
                  Abrir en Mega Gráfico
                </Link>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  const next = portfolios.filter((item) => item.id !== active.id);
                  onChange(next);
                  setActiveId(next[0]?.id ?? "");
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/10"
                title="Eliminar cartera"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <form
              className="relative mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                addTicker(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Añadir ticker: NVDA, EURUSD, BTC-USD…"
                className="h-11 w-full rounded-md border border-[#1F1F2E] bg-[#050508] px-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-[#00FF66]/40"
              />
              {suggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-[#1F1F2E] bg-[#0A0A0F] shadow-xl">
                  {suggestions.map((asset) => (
                    <li key={asset.ticker}>
                      <button
                        type="button"
                        onClick={() => addTicker(asset.ticker)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/[0.04]"
                      >
                        <span className="font-mono text-sm text-white">{asset.ticker}</span>
                        <span className="truncate pl-3 text-xs text-zinc-500">{asset.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </form>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
              {active.tickers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                  Esta cartera está vacía. Añade símbolos para seguirlos y saltar al gráfico.
                </p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {active.tickers.map((ticker) => {
                    const asset = findAsset(ticker);
                    return (
                      <li
                        key={ticker}
                        className="flex items-center gap-2 rounded-lg border border-[#1F1F2E] bg-[#050508] px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-sm font-semibold text-white">{ticker}</p>
                          <p className="truncate text-[11px] text-zinc-500">{asset?.name ?? ticker}</p>
                        </div>
                        <Link
                          href={`/grafico?ticker=${encodeURIComponent(ticker)}`}
                          className="inline-flex h-8 items-center rounded-md border border-[#00FF66]/30 px-2 font-mono text-[10px] uppercase tracking-wide text-[#00FF66] hover:bg-[#00FF66]/10"
                        >
                          Gráfico
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeTicker(ticker)}
                          className="text-zinc-600 hover:text-red-300"
                          title="Quitar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        ) : (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-zinc-800 text-sm text-zinc-500">
            Crea una cartera para empezar el seguimiento.
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionPane({
  state,
  patch,
}: {
  state: PrivateState;
  patch: (partial: Partial<PrivateState>) => void;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-3">
      <Panel icon={<Send className="h-5 w-5" />} title="Telegram">
        <p className="mb-3 text-sm text-zinc-400">Alertas, interrogatorios del profesor y avisos de ejecución.</p>
        <Field
          label="Token del bot"
          value={state.telegramBot}
          onChange={(value) => patch({ telegramBot: value })}
          secret
        />
        <Field
          label="Chat ID"
          value={state.telegramChat}
          onChange={(value) => patch({ telegramChat: value })}
        />
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          El bot no envía mensajes hasta que guardes token y chat. Úsalo como canal de disciplina, no de ruido.
        </p>
      </Panel>
      <Panel icon={<Cable className="h-5 w-5" />} title="Broker / MT5">
        <Field label="Broker" value={state.broker} onChange={(value) => patch({ broker: value })} />
        <Field label="Login MT5" value={state.mt5Login} onChange={(value) => patch({ mt5Login: value })} />
        <Field label="Servidor" value={state.mt5Server} onChange={(value) => patch({ mt5Server: value })} />
        <Field
          label="API key"
          value={state.apiKey}
          onChange={(value) => patch({ apiKey: value })}
          secret
        />
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          El puente deja listos login y servidor. Las órdenes live llegan cuando el agente de ejecución esté armado.
        </p>
      </Panel>
      <Panel icon={<Bot className="h-5 w-5" />} title="Bot Avizor">
        <Field label="Nombre del bot" value={state.botName} onChange={(value) => patch({ botName: value })} />
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-200">
          <input
            type="checkbox"
            checked={state.autoEnabled}
            onChange={(event) => patch({ autoEnabled: event.target.checked })}
            className="accent-emerald-500"
          />
          Armar envío automático (paper primero)
        </label>
        <p className="mt-3 rounded-lg border border-[#1F1F2E] bg-[#050508] px-3 py-2.5 text-xs leading-5 text-zinc-400">
          El tamaño y el riesgo no se editan aquí. Los asignan los <span className="text-zinc-200">agentes IA</span> de
          la mesa y se los pasan al bot con la orden (ticker, lado, SL/TP y size).
        </p>
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          El bot ejecuta lo que reciba. Hoy queda en modo seguro hasta autenticar el puente.
        </p>
      </Panel>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1F1F2E] bg-[#0A0A0F] p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <span className="text-[#00FF66]">{icon}</span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  secret,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  secret?: boolean;
}) {
  return (
    <label className="mt-2 block text-xs text-zinc-500">
      {label}
      <input
        type={secret ? "password" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded border border-[#1F1F2E] bg-[#050508] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#00FF66]/40"
      />
    </label>
  );
}
