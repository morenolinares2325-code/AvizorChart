"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export function ImmersiveMark() {
  const router = useRouter();
  return (
    <a
      href="/"
      className="pointer-events-auto fixed left-0 top-0 z-[200] flex h-[52px] w-12 items-center justify-center"
      aria-label="Volver al menú principal"
      title="Inicio"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        router.push("/");
      }}
    >
      <Image
        src="/brand/avizor-mark.png?v=3"
        alt=""
        width={28}
        height={32}
        priority
        className="pointer-events-none h-8 w-auto object-contain brightness-0 invert opacity-95 hover:opacity-100"
      />
    </a>
  );
}
