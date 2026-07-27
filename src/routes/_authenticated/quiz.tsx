import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { quizQuestions, characterTraits } from "@/data/quiz";
import { characters } from "@/data/characters";
import type { Character, TraitKey } from "@/types/character";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";
import { RARITY_COLOR } from "@/lib/rarity";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({
    meta: [
      { title: "Which Bleach Character Are You? — Bleach Arena" },
      { name: "description", content: "Answer a short personality quiz and discover your closest Bleach match." },
      { property: "og:title", content: "Which Bleach Character Are You?" },
      { property: "og:description", content: "A quick personality quiz that maps you to a Bleach character." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuizPage,
});

type Match = { character: Character; score: number; pct: number };

function QuizPage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState<"intro" | "quiz" | "result">("intro");
  const [idx, setIdx] = useState(0);
  const [totals, setTotals] = useState<Record<string, number>>({});

  const total = quizQuestions.length;
  const q = quizQuestions[idx];

  const answer = (ansIdx: number) => {
    const t = { ...totals };
    for (const [k, v] of Object.entries(q.answers[ansIdx].traits)) {
      t[k] = (t[k] ?? 0) + (v as number);
    }
    setTotals(t);
    if (idx + 1 >= total) {
      setStep("result");
    } else {
      setIdx(idx + 1);
    }
  };

  const restart = () => {
    setTotals({});
    setIdx(0);
    setStep("intro");
  };

  const matches = useMemo<Match[]>(() => {
    if (step !== "result") return [];
    const userVec = totals;
    const list: Match[] = [];
    for (const [slug, prof] of Object.entries(characterTraits)) {
      const character = characters.find((c) => c.slug === slug);
      if (!character) continue;
      let dot = 0;
      let magA = 0;
      let magB = 0;
      const keys = new Set<TraitKey>([
        ...(Object.keys(userVec) as TraitKey[]),
        ...(Object.keys(prof) as TraitKey[]),
      ]);
      for (const k of keys) {
        const a = userVec[k] ?? 0;
        const b = prof[k] ?? 0;
        dot += a * b;
        magA += a * a;
        magB += b * b;
      }
      const sim = magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
      list.push({ character, score: dot, pct: Math.round(sim * 100) });
    }
    list.sort((a, b) => b.pct - a.pct || b.score - a.score);
    return list.slice(0, 3);
  }, [step, totals]);

  return (
    <>
      <ReiatsuBackground count={20} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {step === "intro" && (
          <section className="flex flex-col items-center gap-6 text-center" style={{ animation: "card-in 0.5s ease-out both" }}>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("quizShort")}</p>
            <h1 className="font-display text-3xl font-black text-glow-orange sm:text-5xl">{t("quiz")}</h1>
            <p className="max-w-lg text-sm text-muted-foreground sm:text-base">{t("quizDesc")}</p>
            <button
              onClick={() => setStep("quiz")}
              className="glow-orange rounded-2xl bg-primary px-8 py-4 font-display text-base font-black uppercase tracking-[0.25em] text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {t("startQuizBtn")}
            </button>
          </section>
        )}

        {step === "quiz" && q && (
          <section key={q.id} className="flex flex-col gap-6" style={{ animation: "card-in 0.35s ease-out both" }}>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>{t("question")} {idx + 1} {t("ofN")} {total}</span>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((idx + 1) / total) * 100}%` }} />
              </div>
            </div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{q.q[locale]}</h2>
            <ul className="grid gap-3">
              {q.answers.map((a, i) => (
                <li key={i}>
                  <button
                    onClick={() => answer(i)}
                    className="w-full rounded-2xl border border-white/10 bg-card/60 px-5 py-4 text-start text-sm font-medium backdrop-blur-md transition-all hover:border-primary/50 hover:bg-white/[0.06] sm:text-base"
                  >
                    {a.text[locale]}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {step === "result" && matches.length > 0 && (
          <section className="flex flex-col items-center gap-8" style={{ animation: "card-in 0.6s ease-out both" }}>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("yourMatch")}</p>
              <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
                {matches[0].character.name[locale]}
              </h1>
              <p className="mt-2 text-sm text-accent">{matches[0].pct}% {t("matchScore")}</p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-3">
              {matches.map((m, i) => {
                const color = RARITY_COLOR[m.character.rarity];
                return (
                  <div
                    key={m.character.id}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 text-center backdrop-blur-md"
                    style={{
                      animation: `card-in 0.5s ${0.1 + i * 0.15}s ease-out both`,
                      boxShadow: i === 0 ? `0 20px 60px -20px ${color}` : undefined,
                    }}
                  >
                    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10">
                      {m.character.image ? (
                        <img src={m.character.image} alt={m.character.name[locale]} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-4xl font-black" style={{ color }}>
                          {m.character.name.en.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">#{i + 1}</div>
                      <div className="font-display text-lg font-bold">{m.character.name[locale]}</div>
                      <div className="text-xs" style={{ color }}>{m.pct}% {t("matchScore")}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                className="glow-orange rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground"
              >
                {t("retakeQuiz")}
              </button>
              <Link
                to="/"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
              >
                {t("home")}
              </Link>
            </div>
          </section>
        )}
      </main>
    </>
  );
}