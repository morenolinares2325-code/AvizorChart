"use client";

import { usePathname } from "next/navigation";
import { ImmersiveMark } from "@/components/layout/ImmersiveMark";
import { Navbar } from "@/components/layout/Navbar";
import { SupportWidget } from "@/components/layout/SupportWidget";

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
        <main className="min-h-screen pt-14">{children}</main>
        <SupportWidget />
      </>
    );
  }

  return (
    <>
      <ImmersiveMark />
      <main className="h-screen w-screen overflow-hidden bg-[#050508]">{children}</main>
    </>
  );
}
