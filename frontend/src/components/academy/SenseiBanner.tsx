"use client";

import { useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface SenseiBannerProps {
  headline: string;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  unlocked: boolean;
}

export function SenseiBanner({ headline, draft, onDraft, onSend, unlocked }: SenseiBannerProps) {
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (unlocked) {
      boxRef.current?.focus();
    }
  }, [unlocked]);

  return (
    <header className="grid h-[132px] shrink-0 grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-[#1F1F2E] bg-[#0A0A0F] px-3 py-2">
      <img
        src="/academy/sensei.jpg"
        alt="Kenji Takahashi"
        width={96}
        height={96}
        className="h-[96px] w-[96px] self-center rounded-full object-cover object-top ring-2 ring-[#00FF66]/55"
      />
      <div className="flex min-w-0 flex-col justify-center border-r border-[#1F1F2E] pr-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-[#00FF66]">
          Profesor Agente
        </p>
        <p className="text-[15px] font-semibold text-white">Kenji Takahashi</p>
        <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-zinc-300">{headline}</p>
      </div>
      <div className="flex min-h-0 min-w-0 flex-col">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
          {unlocked ? "Responde al profesor" : "Respuesta bloqueada"}
        </p>
        <form
          className="mt-1 flex min-h-0 flex-1 gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            if (unlocked) {
              onSend();
            }
          }}
        >
          <textarea
            ref={boxRef}
            value={draft}
            disabled={!unlocked}
            onChange={(event) => onDraft(event.target.value)}
            onKeyDown={(event) => {
              if (!unlocked) {
                return;
              }
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            rows={3}
            placeholder={
              unlocked
                ? "¿Por qué esta operación? Nivel, invalidación y plan."
                : "Se abre cuando ejecutes un BUY o SELL y el profesor te pregunte."
            }
            className={`min-h-0 min-w-0 flex-1 resize-none rounded-md border px-2.5 py-2 text-[13px] leading-5 outline-none ${
              unlocked
                ? "border-[#00FF66]/35 bg-[#050508] text-white placeholder:text-zinc-500 focus:border-[#00FF66]/60"
                : "cursor-not-allowed border-[#1F1F2E] bg-[#050508]/70 text-zinc-500 placeholder:text-zinc-600"
            }`}
          />
          <button
            type="submit"
            disabled={!unlocked}
            className="inline-flex w-10 shrink-0 items-center justify-center self-stretch rounded-md border border-[#1F1F2E] text-[#00FF66] hover:bg-[#00FF66]/10 disabled:cursor-not-allowed disabled:opacity-35"
            title="Enviar respuesta"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </header>
  );
}
