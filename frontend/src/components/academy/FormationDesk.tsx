"use client";

import { useMemo, useState } from "react";
import { BookOpen, Clock, GraduationCap, PlayCircle } from "lucide-react";
import { ACADEMY_MODULES, type AcademyLesson } from "@/lib/academyCurriculum";
import { ACADEMY_FILES, downloadAcademyFile } from "@/lib/academyLibrary";

const LEVELS: Record<string, string> = {
  base: "Base",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export function FormationDesk() {
  const first = ACADEMY_MODULES[0]?.lessons[0];
  const [moduleId, setModuleId] = useState(ACADEMY_MODULES[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(first?.id ?? "");
  const currentModule = ACADEMY_MODULES.find((item) => item.id === moduleId) ?? ACADEMY_MODULES[0];
  const lesson: AcademyLesson | undefined =
    currentModule?.lessons.find((item) => item.id === lessonId) ?? currentModule?.lessons[0];
  const index = useMemo(() => {
    const mods = ACADEMY_MODULES.flatMap((mod) => mod.lessons.map((item) => ({ mod: mod.id, lesson: item.id })));
    return mods.findIndex((item) => item.lesson === lesson?.id);
  }, [lesson?.id]);

  function select(mod: string, id: string) {
    setModuleId(mod);
    setLessonId(id);
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="min-h-0 overflow-y-auto p-2 lg:border-r lg:border-[#1F1F2E]">
        <div className="rounded-lg border border-[#1F1F2E] bg-black px-3 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">Plan de estudios</p>
          <p className="mt-1 text-sm text-zinc-300">7 bloques · teoría operativa, no folklore.</p>
        </div>
        <div className="mt-2 space-y-2">
          {ACADEMY_MODULES.map((mod) => (
            <div key={mod.id} className="overflow-hidden rounded-lg border border-[#1F1F2E] bg-black">
              <button
                type="button"
                onClick={() => select(mod.id, mod.lessons[0]?.id ?? "")}
                className={`flex w-full items-start gap-2 bg-black px-3 py-2.5 text-left ${
                  moduleId === mod.id ? "border-b border-[#1F1F2E]" : ""
                }`}
              >
                <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00FF66]" />
                <span>
                  <span className="block font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                    {LEVELS[mod.level]}
                  </span>
                  <span className="text-[13px] font-medium text-zinc-100">{mod.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{mod.blurb}</span>
                </span>
              </button>
              {moduleId === mod.id
                ? mod.lessons.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => select(mod.id, item.id)}
                      className={`flex w-full items-center gap-2 bg-black px-3 py-1.5 pl-9 text-left font-mono text-[11px] ${
                        lessonId === item.id ? "text-[#00FF66]" : "text-zinc-500 hover:text-zinc-200"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))
                : null}
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg border border-[#1F1F2E] bg-black px-3 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Manuales Avizor</p>
          <ul className="space-y-1">
            {ACADEMY_FILES.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => downloadAcademyFile(file)}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 hover:text-white"
                >
                  <BookOpen className="h-3 w-3" />
                  {file.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="min-h-0 overflow-y-auto p-2 sm:p-4">
        {lesson ? (
          <article className="mx-auto max-w-3xl space-y-2">
            <div className="rounded-lg border border-[#1F1F2E] bg-black p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                {currentModule?.title} · lección {index + 1}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{lesson.title}</h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {lesson.minutes} min · {lesson.summary}
              </p>
            </div>
            {lesson.youtubeId ? (
              <div className="overflow-hidden rounded-lg border border-[#1F1F2E] bg-black">
                <div className="flex items-center gap-2 border-b border-[#1F1F2E] bg-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  <PlayCircle className="h-3.5 w-3.5 text-[#00FF66]" />
                  Videoteca complementaria
                </div>
                <iframe
                  title={lesson.title}
                  src={`https://www.youtube-nocookie.com/embed/${lesson.youtubeId}`}
                  className="aspect-video w-full bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <div className="space-y-2 rounded-lg border border-[#1F1F2E] bg-black p-4 text-[15px] leading-7 text-zinc-300">
              {lesson.body.split("\n\n").map((para) => (
                <p key={para.slice(0, 24)} className="whitespace-pre-wrap">
                  {para}
                </p>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}
