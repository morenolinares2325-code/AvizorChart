"use client";

import Image from "next/image";
import Link from "next/link";

export function ImmersiveMark() {
  return (
    <Link
      href="/"
      className="fixed left-0 top-0 z-[60] flex h-[52px] w-12 items-center justify-center"
      aria-label="Volver al menú principal"
      title="Inicio"
    >
      <Image
        src="/brand/avizor-mark.png?v=3"
        alt=""
        width={28}
        height={32}
        priority
        className="h-8 w-auto object-contain brightness-0 invert opacity-95 hover:opacity-100"
      />
    </Link>
  );
}
