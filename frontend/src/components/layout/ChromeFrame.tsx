"use client";

import { usePathname } from "next/navigation";
import { ImmersiveMark } from "@/components/layout/ImmersiveMark";
import { Navbar } from "@/components/layout/Navbar";
import { SupportWidget } from "@/components/layout/SupportWidget";
import { TickerCascadeBackdrop } from "@/components/layout/TickerCascadeBackdrop";

export function ChromeFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const home = pathname === "/";
  const tvPopout = pathname.startsWith("/tv/popout");

  if (tvPopout) {
    return <main className="h-screen w-screen overflow-hidden bg-black">{children}</main>;
  }

  if (home) {
    return (
      <>
        <Navbar />
        <main className="relative min-h-screen pt-14">
          <TickerCascadeBackdrop />
          <div className="relative z-[1]">{children}</div>
        </main>
        <SupportWidget />
      </>
    );
  }

  return (
    <>
      <main className="relative h-screen w-screen overflow-hidden bg-[#050508]">
        <TickerCascadeBackdrop />
        <div className="relative z-[1] h-full w-full">{children}</div>
      </main>
      <ImmersiveMark />
    </>
  );
}
