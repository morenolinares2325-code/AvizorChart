"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LiveTvProvider } from "@/components/news/LiveTvContext";
import { NewsFloatingTv, NewsTheaterTv } from "@/components/news/NewsLiveTv";

export function LiveTvShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tvPopout = pathname.startsWith("/tv/popout");
  return (
    <LiveTvProvider>
      {children}
      {tvPopout ? null : (
        <>
          <NewsFloatingTv />
          <NewsTheaterTv />
        </>
      )}
    </LiveTvProvider>
  );
}
