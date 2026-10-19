"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Radar, UserRound, X } from "lucide-react";
import { useState } from "react";
import { PRIMARY_NAV } from "@/lib/navigation";
import { ConnectionBadge } from "@/components/layout/ConnectionBadge";
import { MarketClock } from "@/components/layout/MarketClock";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-bull/40 bg-bull/10 text-bull shadow-[0_0_18px_rgba(34,197,94,0.25)]">
              <Radar className="h-4 w-4" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight text-zinc-100">
                AvizorChart
                <span className="text-bull">.dev</span>
              </span>
              <span className="hidden text-[10px] uppercase tracking-[0.18em] text-zinc-500 xl:block">
                Terminal cuantitativo
              </span>
            </span>
          </Link>
          <ConnectionBadge connected />
        </div>

        <ul className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                    active
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <MarketClock />
          <Link
            href="/perfil"
            className="inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
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
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
