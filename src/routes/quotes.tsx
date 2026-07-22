import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { quotes, type Quote } from "@/data/quotes";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/quotes")({
  head: () => ({
    meta: [
      { title: "Who Said That? — Bleach Draft" },
      {
        name: "description",
        content:
          "Test your Bleach knowledge. Three quotes, five choices each — guess the speaker.",
      },
      { property: "og:title", content: "Who Said That? — Bleach Trivia" },
      { property: "og:description", content: "Three quotes, five choices each. Prove you know Bleach." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuotesPage,
});

const ROUND_SIZE = 3;
const CHOICE_COUNT = 5;

interface Round {
  quote: Quote;
  choices: string[]; // speaker names in current locale
  correct: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRounds(locale: "en" | "ar"): Round[] {
  const picked = shuffle(quotes).slice(0, ROUND_SIZE);
  const allSpeakers = Array.from(new Set(quotes.map((q) => q.speaker[locale])));
  return picked.map((q) => {
    const correct = q.speaker[locale];
    const distractors = shuffle(allSpeakers.filter((s) => s !== correct)).slice(0, CHOICE_COUNT - 1);
    const choices = shuffle([correct, ...distractors]);
    return { quote: q, choices, correct };
  });
}

function QuotesPage() {
  const { t, locale } = useI18n();
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => buildRounds(locale), [locale, seed]);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);

  const round = rounds[idx];
  const done = started && idx >= ROUND_SIZE;

  const pick = (choice: string) => {
    if (picked || !round) return;
    setPicked(choice);
    if (choice === round.correct) setScore((s) => s + 1);
  };

  const next = () => {
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setSeed((s) => s + 1);
    setStarted(true);
    setIdx(0);
    setPicked(null);
    setScore(0);
  };

  return (
    <>
      <ReiatsuBackground count={18} />
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {!started ? (
          <section className="flex flex-col items-center gap-6 text-center" style={{ animation: "card-in 0.6s ease-out both" }}>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("quotes")}</p>
            <h1 className="font-display text-4xl font-black text-glow-orange sm:text-5xl">{t("quotesTitle")}</h1>
            <p className="max-w-md text-sm text-muted-foreground">{t("quotesTagline")}</p>
            <button
              onClick={() => setStarted(true)}
              className="glow-orange rounded-2xl bg-primary px-8 py-4 font-display text-base font-black uppercase tracking-[0.25em] text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              {t("startQuiz")}
            </button>
          </section>
        ) : done ? (
          <section className="flex flex-col items-center gap-6 text-center" style={{ animation: "card-in 0.6s ease-out both" }}>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("yourScore")}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-7xl font-black text-glow-orange">{score}</span>
              <span className="font-display text-2xl text-muted-foreground">/ {ROUND_SIZE}</span>
            </div>
            <button
              onClick={restart}
              className="glow-orange rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground"
            >
              {t("tryAgain")}
            </button>
          </section>
        ) : (
          <section key={idx} className="flex flex-col gap-5" style={{ animation: "card-in 0.5s ease-out both" }}>
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>{t("question")} {idx + 1} / {ROUND_SIZE}</span>
              <span>{score} ✦</span>
            </div>
            <blockquote className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-lg font-medium leading-relaxed text-foreground shadow-[0_0_40px_-20px_oklch(0.7_0.18_50)]">
              <span className="mb-2 block font-display text-4xl leading-none text-primary">“</span>
              {round.quote.text[locale]}
            </blockquote>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {round.choices.map((c) => {
                const isCorrect = c === round.correct;
                const isPicked = c === picked;
                let cls = "border-white/15 bg-white/5 hover:bg-white/10";
                if (picked) {
                  if (isCorrect) cls = "border-emerald-400/60 bg-emerald-500/15 text-emerald-100";
                  else if (isPicked) cls = "border-rose-400/60 bg-rose-500/15 text-rose-100";
                  else cls = "border-white/10 bg-white/[0.02] opacity-60";
                }
                return (
                  <button
                    key={c}
                    onClick={() => pick(c)}
                    disabled={!!picked}
                    className={"rounded-xl border px-4 py-3 text-start text-sm font-medium transition-all " + cls}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <span className={picked === round.correct ? "text-emerald-300" : "text-rose-300"}>
                  {picked === round.correct ? t("correct") : `${t("wrong")} — ${t("answerWas")} ${round.correct}`}
                </span>
                <button
                  onClick={next}
                  className="glow-orange rounded-lg bg-primary px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-primary-foreground"
                >
                  {idx + 1 >= ROUND_SIZE ? t("finish") : t("next")}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}