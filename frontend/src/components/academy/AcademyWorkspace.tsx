"use client";

import { useState } from "react";
import { BookMarked, FlaskConical } from "lucide-react";
import { FormationDesk } from "@/components/academy/FormationDesk";
import { ReplayLab } from "@/components/academy/ReplayLab";

type AcademyTab = "theory" | "lab";

export function AcademyWorkspace() {
  const [tab, setTab] = useState<AcademyTab>("theory");

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-transparent">
      <header className="pointer-events-none flex h-10 shrink-0 items-center gap-3 border-b border-[#1F1F2E] bg-black pl-12 pr-3">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Academia Avizor</p>
        <div className="flex h-8 rounded-md border border-[#1F1F2E] p-0.5">
          <button
            type="button"
            onClick={() => setTab("theory")}
            className={`inline-flex items-center gap-1.5 rounded px-3 font-mono text-[11px] ${
              tab === "theory" ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <BookMarked className="h-3.5 w-3.5" />
            Formación
          </button>
          <button
            type="button"
            onClick={() => setTab("lab")}
            className={`inline-flex items-center gap-1.5 rounded px-3 font-mono text-[11px] ${
              tab === "lab" ? "bg-[#00FF66]/15 text-[#00FF66]" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            Replay Lab
          </button>
        </div>
        <p className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-zinc-600 md:block">
          Teoría · práctica · interrogatorio
        </p>
        </div>
      </header>
      {tab === "theory" ? <FormationDesk /> : <ReplayLab />}
    </div>
  );
}
