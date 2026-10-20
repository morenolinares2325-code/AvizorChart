"use client";

import { BadgeCheck, Globe2, Hash, MessageSquare, Pin, Repeat2, Send, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AMBASSADORS,
  FORUM_BOARDS,
  FORUM_THREADS,
  PARTNER_PAGES,
  TRENDING,
  X_POSTS,
  type CommunityTab,
  type ForumThread,
} from "@/lib/communityData";

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M18.244 2H21l-6.51 7.44L22 22h-6.79l-4.32-6.44L6.2 22H3.44l7.02-8.02L2 2h6.96l3.9 5.92L18.244 2Zm-1.19 18.2h1.88L7.03 3.7H5.01l12.044 16.5Z"
      />
    </svg>
  );
}

export function CommunityWorkspace() {
  const [tab, setTab] = useState<CommunityTab>("x");
  const [composer, setComposer] = useState("");
  const [posts, setPosts] = useState(X_POSTS);
  const [board, setBoard] = useState("Todos");
  const [threadId, setThreadId] = useState(FORUM_THREADS[0].id);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<Record<string, string[]>>({
    t1: ["El volumen de apertura no confirma. Espero el retest de 18:00 UTC."],
  });
  const [applied, setApplied] = useState(false);

  const threads = useMemo(
    () => FORUM_THREADS.filter((item) => board === "Todos" || item.board === board),
    [board],
  );
  const activeThread = threads.find((item) => item.id === threadId) ?? threads[0] ?? FORUM_THREADS[0];

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-[#08090d]">
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-zinc-800/80 px-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Comunidad</p>
        <div className="flex h-8 overflow-x-auto rounded border border-zinc-800 p-0.5">
          {(
            [
              { id: "x", label: "Red X" },
              { id: "foro", label: "Foro" },
              { id: "embajadores", label: "Embajadores" },
              { id: "amigas", label: "Páginas amigas" },
            ] as const
          ).map((item) => (
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
      </header>

      {tab === "x" ? (
        <XFeed
          posts={posts}
          composer={composer}
          onComposer={setComposer}
          onPublish={() => {
            const text = composer.trim();
            if (!text) {
              return;
            }
            const cashtags = Array.from(text.matchAll(/\$([A-Z]{1,6})/g)).map((match) => match[1]);
            setPosts((current) => [
              {
                id: `local-${Date.now()}`,
                handle: "operador",
                name: "Tú",
                verified: false,
                time: "ahora",
                text,
                cashtags,
                likes: 0,
                rts: 0,
                replies: 0,
                sentiment: "neutral",
              },
              ...current,
            ]);
            setComposer("");
          }}
        />
      ) : null}
      {tab === "foro" ? (
        <Forum
          board={board}
          onBoard={setBoard}
          threads={threads}
          active={activeThread}
          onSelect={setThreadId}
          reply={reply}
          onReply={setReply}
          replies={replies[activeThread.id] ?? []}
          onSend={() => {
            const text = reply.trim();
            if (!text) {
              return;
            }
            setReplies((current) => ({
              ...current,
              [activeThread.id]: [...(current[activeThread.id] ?? []), text],
            }));
            setReply("");
          }}
        />
      ) : null}
      {tab === "embajadores" ? <Ambassadors applied={applied} onApply={() => setApplied(true)} /> : null}
      {tab === "amigas" ? <Partners /> : null}
    </div>
  );
}

function XFeed({
  posts,
  composer,
  onComposer,
  onPublish,
}: {
  posts: typeof X_POSTS;
  composer: string;
  onComposer: (value: string) => void;
  onPublish: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_280px]">
      <section className="min-h-0 overflow-y-auto border-zinc-800/80 lg:border-r">
        <div className="sticky top-0 z-10 border-b border-zinc-800/80 bg-[#08090d]/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2 text-zinc-100">
            <XMark className="h-4 w-4" />
            <span className="text-sm font-semibold">Feed de trading</span>
          </div>
          <form
            className="mt-3"
            onSubmit={(event) => {
              event.preventDefault();
              onPublish();
            }}
          >
            <textarea
              value={composer}
              onChange={(event) => onComposer(event.target.value)}
              rows={2}
              placeholder="Comparte un setup, un $TICKER o un sesgo de sesión…"
              className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-600"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-950"
              >
                <Send className="h-3 w-3" />
                Postear
              </button>
            </div>
          </form>
        </div>
        <ul>
          {posts.map((post) => (
            <li key={post.id} className="border-b border-zinc-800/80 px-4 py-3">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] text-zinc-300">
                  {post.handle.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1 text-sm">
                    <span className="font-semibold text-zinc-100">{post.name}</span>
                    {post.verified ? <BadgeCheck className="h-3.5 w-3.5 text-sky-400" /> : null}
                    <span className="font-mono text-xs text-zinc-500">@{post.handle}</span>
                    <span className="text-zinc-600">· {post.time}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-200">{post.text}</p>
                  {post.cashtags.length > 0 ? (
                    <p className="mt-2 flex flex-wrap gap-1">
                      {post.cashtags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/grafico?symbol=${tag}`}
                          className="font-mono text-[11px] text-sky-400 hover:underline"
                        >
                          ${tag}
                        </Link>
                      ))}
                    </p>
                  ) : null}
                  <p className="mt-2 flex gap-4 font-mono text-[11px] text-zinc-500">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {post.replies}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Repeat2 className="h-3 w-3" /> {post.rts}
                    </span>
                    <span>{post.likes} likes</span>
                    <span
                      className={
                        post.sentiment === "bull"
                          ? "text-emerald-400"
                          : post.sentiment === "bear"
                            ? "text-red-400"
                            : "text-zinc-500"
                      }
                    >
                      {post.sentiment}
                    </span>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <aside className="min-h-0 overflow-y-auto p-3">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <Hash className="h-3 w-3" /> Tendencias
          </p>
          <ul className="mt-2 space-y-2">
            {TRENDING.map((item) => (
              <li key={item.tag} className="flex items-center justify-between text-sm">
                <Link href={`/grafico?symbol=${item.tag.replace("$", "")}`} className="font-mono text-sky-400">
                  {item.tag}
                </Link>
                <span className="font-mono text-[10px] text-zinc-500">{item.posts}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Spaces / salas</p>
          <ul className="mt-2 space-y-2 text-sm text-zinc-300">
            <li>En vivo · Premarket NY (142 oyentes)</li>
            <li>Hoy 18:00 · Macro FOMC desk</li>
            <li>Mañana · Embajadores AMA</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Forum({
  board,
  onBoard,
  threads,
  active,
  onSelect,
  reply,
  onReply,
  replies,
  onSend,
}: {
  board: string;
  onBoard: (value: string) => void;
  threads: ForumThread[];
  active: ForumThread;
  onSelect: (id: string) => void;
  reply: string;
  onReply: (value: string) => void;
  replies: string[];
  onSend: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[38%_62%]">
      <section className="min-h-0 overflow-y-auto border-zinc-800/80 lg:border-r">
        <div className="flex flex-wrap gap-1 border-b border-zinc-800/80 p-2">
          {["Todos", ...FORUM_BOARDS].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onBoard(item)}
              className={`rounded px-2 py-1 font-mono text-[10px] ${
                board === item ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <ul>
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => onSelect(thread.id)}
                className={`w-full px-3 py-2.5 text-left ${
                  active.id === thread.id ? "bg-emerald-500/10" : "hover:bg-zinc-900"
                }`}
              >
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-zinc-500">
                  {thread.pinned ? <Pin className="h-3 w-3 text-amber-400" /> : null}
                  {thread.board} · {thread.last}
                </p>
                <p className="mt-1 text-sm text-zinc-100">{thread.title}</p>
                <p className="mt-1 font-mono text-[10px] text-zinc-500">
                  {thread.author} · {thread.replies} resp. · {thread.views} vistas
                </p>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{active.board}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-50">{active.title}</h2>
          <p className="mt-4 rounded border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
            Hilo abierto por <span className="font-mono text-emerald-400">{active.author}</span>. Debate
            operativo, sin recomendaciones de inversión. Usa tickers con $ para enlazar al Mega Gráfico.
          </p>
          <ul className="mt-3 space-y-2">
            {replies.map((item, index) => (
              <li key={`${item}-${index}`} className="rounded border border-zinc-800/80 bg-zinc-950/60 p-3 text-sm text-zinc-200">
                <p className="font-mono text-[10px] text-zinc-500">tú</p>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <form
          className="border-t border-zinc-800 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <textarea
            value={reply}
            onChange={(event) => onReply(event.target.value)}
            rows={2}
            className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-600"
            placeholder="Responder al hilo…"
          />
          <button
            type="submit"
            className="mt-2 rounded border border-zinc-700 px-3 py-1.5 font-mono text-[11px] text-zinc-200"
          >
            Publicar respuesta
          </button>
        </form>
      </section>
    </div>
  );
}

function Ambassadors({ applied, onApply }: { applied: boolean; onApply: () => void }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <p className="max-w-2xl text-sm text-zinc-400">
        Los embajadores Avizor organizan salas locales, curan setups y representan la mesa en X. No es un
        programa de señales: es distribución de método y disciplina.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AMBASSADORS.map((person) => (
          <article key={person.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Users className="h-4 w-4 text-emerald-400" />
              {person.name}
            </p>
            <p className="mt-1 font-mono text-[11px] text-sky-400">{person.handle}</p>
            <p className="mt-2 text-xs text-zinc-400">
              {person.region} · {person.focus}
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full bg-emerald-500" style={{ width: `${person.xp}%` }} />
            </div>
            <p className="mt-1 font-mono text-[10px] text-zinc-500">XP {person.xp}</p>
          </article>
        ))}
      </div>
      <form
        className="mt-6 max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Solicitud</p>
        <input
          required
          placeholder="Nombre"
          className="mt-3 w-full rounded border border-zinc-800 bg-[#08090d] px-3 py-2 text-sm outline-none"
        />
        <input
          required
          placeholder="Handle de X"
          className="mt-2 w-full rounded border border-zinc-800 bg-[#08090d] px-3 py-2 text-sm outline-none"
        />
        <textarea
          required
          rows={3}
          placeholder="Por qué quieres representar el método Avizor"
          className="mt-2 w-full rounded border border-zinc-800 bg-[#08090d] px-3 py-2 text-sm outline-none"
        />
        <button
          type="submit"
          className="mt-3 rounded bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white"
        >
          {applied ? "Solicitud enviada" : "Enviar solicitud"}
        </button>
      </form>
    </div>
  );
}

function Partners() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <p className="max-w-2xl text-sm text-zinc-400">
        Directorio de páginas amigas. AvizorChart no es afiliado: son recursos públicos de trading para
        contrastar criterio.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {PARTNER_PAGES.map((page) => (
          <a
            key={page.id}
            href={page.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition hover:border-zinc-600"
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              {page.name}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">{page.kind}</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">{page.blurb}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
