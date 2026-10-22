"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, UserRound, X } from "lucide-react";
import { useState } from "react";
import { PRIMARY_NAV } from "@/lib/navigation";
import { ConnectionBadge } from "@/components/layout/ConnectionBadge";
import { MarketClock } from "@/components/layout/MarketClock";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#00FF66]/15 bg-[#050508]/95 backdrop-blur-xl">
      <nav className="mx-auto grid h-14 w-full grid-cols-[1fr_auto_1fr] items-stretch px-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="AvizorChart.dev — volver al inicio"
          >
            <span className="relative flex h-10 w-9 shrink-0 items-center justify-center overflow-visible">
              <Image
                src="/brand/avizor-mark.png?v=3"
                alt=""
                width={36}
                height={40}
                priority
                className="h-10 w-auto max-w-none object-contain object-center opacity-95 transition duration-200 group-hover:opacity-100"
              />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[15px] font-semibold tracking-tight text-white transition duration-200 group-hover:opacity-80">
                AvizorChart.dev
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.2em] text-zinc-500 xl:block">
                Terminal cuantitativo
              </span>
            </span>
          </Link>
          <span className="hidden 2xl:inline-flex">
            <ConnectionBadge connected />
          </span>
        </div>

        <ul className="hidden items-stretch lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  className={`relative flex h-full items-center justify-center px-3 text-[13px] font-medium tracking-tight transition-colors xl:px-3.5 ${
                    active ? "text-white" : "text-white/80 hover:text-white"
                  }`}
                >
                  {item.label}
                  {active ? (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-0 mx-auto h-[2px] max-w-[1.6rem] rounded-full bg-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.55)]"
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <MarketClock />
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 rounded-full border border-[#00FF66]/20 bg-[#0A0A0F] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-[#00FF66]/45"
          >
            <UserRound className="h-4 w-4 text-zinc-400" aria-hidden />
            <span className="hidden sm:inline">Cuenta</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-800 text-zinc-300 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open ? (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
          <ul className="grid gap-1">
            {PRIMARY_NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-md px-3 py-2 text-sm ${
                      active ? "bg-[#00FF66]/10 text-white" : "text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
