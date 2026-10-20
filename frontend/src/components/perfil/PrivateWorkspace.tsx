"use client";

import { Cable, KeyRound, ScrollText, Shield, UserRound, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type PrivateTab = "cuenta" | "suscripcion" | "broker" | "cartera" | "logs" | "auto";

const TABS: { id: PrivateTab; label: string }[] = [
  { id: "cuenta", label: "Cuenta" },
  { id: "suscripcion", label: "Suscripción" },
  { id: "broker", label: "Broker & MT5" },
  { id: "cartera", label: "Cartera" },
  { id: "logs", label: "Logs" },
  { id: "auto", label: "Automatización" },
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
};

export function PrivateWorkspace() {
  const [tab, setTab] = useState<PrivateTab>("cuenta");
  const [state, setState] = useState<PrivateState>(DEFAULT_STATE);
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
  }, []);

  function patch(partial: Partial<PrivateState>) {
    setState((current) => ({ ...current, ...partial }));
    setSaved(false);
  }

  function persist() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setSaved(true);
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08090d]">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800/80 px-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Zona privada</p>
        <div className="flex h-8 min-w-0 overflow-x-auto rounded border border-zinc-800 p-0.5">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded px-2.5 font-mono text-[11px] ${
                tab === item.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={persist}
          className="ml-auto rounded border border-zinc-700 px-2.5 py-1 font-mono text-[11px] text-zinc-200"
        >
          {saved ? "Guardado" : "Guardar"}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "cuenta" ? (
          <Panel icon={<UserRound className="h-4 w-4" />} title="Perfil de operador">
            <Field label="Nombre" value={state.name} onChange={(value) => patch({ name: value })} />
            <Field label="Email" value={state.email} onChange={(value) => patch({ email: value })} />
            <Field label="Zona horaria" value={state.timezone} onChange={(value) => patch({ timezone: value })} />
            <p className="mt-3 text-xs text-zinc-500">
              La cuenta queda lista para conectar identidad (OAuth) en una fase posterior. Los datos se
              guardan solo en este navegador.
            </p>
          </Panel>
        ) : null}

        {tab === "suscripcion" ? (
          <Panel icon={<Shield className="h-4 w-4" />} title="Plan">
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
                  className={`rounded-xl border p-3 text-left ${
                    state.plan === plan.id ? "border-emerald-500/50 bg-emerald-500/10" : "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-100">{plan.name}</p>
                  <p className="mt-1 font-mono text-lg text-zinc-50">{plan.price}</p>
                  <p className="mt-1 text-xs text-zinc-500">{plan.note}</p>
                </button>
              ))}
            </div>
          </Panel>
        ) : null}

        {tab === "broker" ? (
          <Panel icon={<Cable className="h-4 w-4" />} title="Conexión broker / MT5">
            <Field label="Broker" value={state.broker} onChange={(value) => patch({ broker: value })} />
            <Field label="Login MT5" value={state.mt5Login} onChange={(value) => patch({ mt5Login: value })} />
            <Field label="Servidor" value={state.mt5Server} onChange={(value) => patch({ mt5Server: value })} />
            <Field
              label="API key (enmascarada)"
              value={state.apiKey}
              onChange={(value) => patch({ apiKey: value })}
              secret
            />
            <p className="mt-3 rounded border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-500">
              El puente MT5 no envía órdenes todavía. Este apartado deja listos login, servidor y clave para
              el agente de ejecución.
            </p>
          </Panel>
        ) : null}

        {tab === "cartera" ? (
          <Panel icon={<Wallet className="h-4 w-4" />} title="Cartera papel">
            <table className="w-full text-left text-sm">
              <thead className="font-mono text-[10px] uppercase text-zinc-500">
                <tr>
                  <th className="pb-2">Símbolo</th>
                  <th>Lado</th>
                  <th>Qty</th>
                  <th>PnL</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200">
                <tr className="border-t border-zinc-800">
                  <td className="py-2 font-mono">NVDA</td>
                  <td className="text-emerald-400">LONG</td>
                  <td>12</td>
                  <td className="text-emerald-400">+1.8%</td>
                </tr>
                <tr className="border-t border-zinc-800">
                  <td className="py-2 font-mono">EURUSD</td>
                  <td className="text-red-400">SHORT</td>
                  <td>0.40</td>
                  <td className="text-red-400">-0.3%</td>
                </tr>
                <tr className="border-t border-zinc-800">
                  <td className="py-2 font-mono">BTC-USD</td>
                  <td className="text-zinc-400">FLAT</td>
                  <td>0</td>
                  <td className="text-zinc-500">—</td>
                </tr>
              </tbody>
            </table>
          </Panel>
        ) : null}

        {tab === "logs" ? (
          <Panel icon={<ScrollText className="h-4 w-4" />} title="Logs de ejecución">
            <ul className="space-y-2 font-mono text-[11px] text-zinc-400">
              <li>13:02:11 · STANDBY · mesa de agentes sin ticker en cola</li>
              <li>12:48:02 · PAPER · SIM long 184.50 cerrado +0.62</li>
              <li>12:11:40 · NEWS · feed RSS OK (40 teletipos)</li>
              <li>11:03:09 · MT5 · puente no autenticado</li>
            </ul>
          </Panel>
        ) : null}

        {tab === "auto" ? (
          <Panel icon={<KeyRound className="h-4 w-4" />} title="Automatización">
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={state.autoEnabled}
                onChange={(event) => patch({ autoEnabled: event.target.checked })}
                className="accent-emerald-500"
              />
              Armar envío automático (paper primero)
            </label>
            <label className="mt-3 block font-mono text-[10px] text-zinc-500">
              Riesgo por operación (%)
              <input
                type="number"
                min={0.1}
                max={2}
                step={0.05}
                value={state.riskPct}
                onChange={(event) => patch({ riskPct: Number(event.target.value) })}
                className="mt-1 w-32 rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-xs text-zinc-100"
              />
            </label>
            <p className="mt-3 text-xs text-zinc-500">
              Cuando el puente MT5 esté activo, este interruptor permitirá que el Director de Mesa autorice
              tamaño y envío. Hoy queda preparado, en modo seguro.
            </p>
          </Panel>
        ) : null}
      </div>
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
    <section className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <h1 className="flex items-center gap-2 text-lg font-semibold text-zinc-50">
        <span className="text-emerald-400">{icon}</span>
        {title}
      </h1>
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
        className="mt-1 w-full rounded border border-zinc-800 bg-[#08090d] px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
      />
    </label>
  );
}
