import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import type { Character } from "@/types/character";
import { characters } from "@/data/characters";
import { pickWeighted } from "@/lib/rarity";
import { scoreTeam } from "@/lib/scoring";
import { CharacterCard } from "@/components/CharacterCard";
import { TeamSlots } from "@/components/TeamSlots";
import { StatBar } from "@/components/StatBar";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/draft")({
  head: () => ({
    meta: [
      { title: "Draft — Bleach Draft" },
      {
        name: "description",
        content:
          "Draft your 5-slot Bleach team. One character at a time, three skips, weighted rarity.",
      },
      { property: "og:title", content: "Bleach Draft — Live Draft" },
      {
        property: "og:description",
        content: "Forge your Gotei one Reiatsu at a time.",
      },
    ],
  }),
  component: DraftPage,
});

const TEAM_SIZE = 5;
const MAX_SKIPS = 5;

type Phase = "drafting" | "result";

function DraftPage() {
  const { t, locale } = useI18n();
  const [team, setTeam] = useState<(Character | null)[]>(
    () => Array.from({ length: TEAM_SIZE }, () => null),
  );
  const [skipsLeft, setSkipsLeft] = useState(MAX_SKIPS);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<Phase>("drafting");
  const [rerollKey, setRerollKey] = useState(0);

  const filled = team.filter(Boolean).length;

  const pool = useMemo(
    () => characters.filter((c) => !seenIds.has(c.id) && !skippedIds.has(c.id)),
    [seenIds, skippedIds],
  );

  const current: Character | null = useMemo(() => {
    if (phase !== "drafting" || filled >= TEAM_SIZE) return null;
    if (pool.length === 0) return null;
    // rerollKey participates so React re-picks after actions.
    void rerollKey;
    return pickWeighted(pool);
  }, [pool, phase, filled, rerollKey]);

  const commitPick = useCallback(
    (c: Character) => {
      setTeam((prev) => {
        const next = [...prev];
        const idx = next.findIndex((x) => x === null);
        if (idx !== -1) next[idx] = c;
        if (next.every(Boolean)) setPhase("result");
        return next;
      });
      setSeenIds((s) => new Set(s).add(c.id));
      setRerollKey((k) => k + 1);
    },
    [],
  );

  const onSkip = useCallback(() => {
    if (!current || skipsLeft <= 0) return;
    setSkippedIds((s) => new Set(s).add(current.id));
    setSkipsLeft((n) => n - 1);
    setRerollKey((k) => k + 1);
  }, [current, skipsLeft]);

  const reset = useCallback(() => {
    setTeam(Array.from({ length: TEAM_SIZE }, () => null));
    setSkipsLeft(MAX_SKIPS);
    setSeenIds(new Set());
    setSkippedIds(new Set());
    setPhase("drafting");
    setRerollKey((k) => k + 1);
  }, []);

  return (
    <>
      <ReiatsuBackground count={22} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <div className="mb-6">
          <TeamSlots team={team} />
        </div>

        {phase === "drafting" ? (
          <section className="flex flex-col items-center gap-6">
            <div className="flex w-full max-w-sm items-center justify-between text-xs">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-widest text-muted-foreground">
                {t("skipsLeft")}
              </span>
              <div className="flex gap-1.5">
                {Array.from({ length: MAX_SKIPS }).map((_, i) => (
                  <span
                    key={i}
                    className={
                      "h-2 w-6 rounded-full transition-all " +
                      (i < skipsLeft
                        ? "bg-accent shadow-[0_0_10px_-2px_oklch(0.82_0.12_220)]"
                        : "bg-white/10")
                    }
                  />
                ))}
              </div>
            </div>

            {current ? (
              <div key={current.id + rerollKey} className="w-full max-w-sm">
                <CharacterCard character={current} />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => commitPick(current)}
                    className="glow-orange rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t("add")}
                  </button>
                  <button
                    onClick={onSkip}
                    disabled={skipsLeft <= 0}
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {skipsLeft > 0 ? t("skip") : t("outOfSkips")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-muted-foreground">
                {t("noMore")}
              </div>
            )}
          </section>
        ) : (
          <ResultScreen team={team} onReset={reset} locale={locale} />
        )}
      </main>
    </>
  );
}

function ResultScreen({
  team,
  onReset,
  locale,
}: {
  team: (Character | null)[];
  onReset: () => void;
  locale: "en" | "ar";
}) {
  const { t } = useI18n();
  const score = useMemo(() => scoreTeam(team), [team]);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const names = team.filter(Boolean).map((c) => c!.name.en).join(", ");
    const text = `Bleach Draft — Rank ${score.rank} (${score.overall}) — ${names}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Bleach Draft", text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {}
  };

  return (
    <section className="flex flex-col items-center gap-8" style={{ animation: "card-in 0.6s ease-out both" }}>
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("result")}</p>
        <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
          {t("yourTeam")}
        </h1>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
        {team.map((c, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
          >
            <span className="font-display text-3xl font-black text-primary text-glow-orange">
              {c?.name.en.split(" ").slice(0, 2).map((n) => n[0]).join("")}
            </span>
            <span className="text-xs font-medium">{c?.name[locale]}</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {c ? `#${c.overall}` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <StatBar label={t("attack")} value={score.attack} delay={100} />
        <StatBar label={t("defense")} value={score.defense} delay={180} accent="accent" />
        <StatBar label={t("speed")} value={score.speed} delay={260} />
        <StatBar label={t("reiatsu")} value={score.reiatsu} delay={340} accent="accent" />
        <StatBar label={t("intelligence")} value={score.intelligence} delay={420} />
        <StatBar label={t("technique")} value={score.technique} delay={500} accent="accent" />
        <StatBar label={t("potential")} value={score.potential} delay={580} />
      </div>

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-6">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {t("teamScore")}
        </span>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-6xl font-black text-glow-orange">
            {score.overall}
          </span>
          <span
            className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 font-display text-2xl font-black text-primary"
          >
            {score.rank}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onReset}
          className="glow-orange rounded-xl bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground"
        >
          {t("playAgain")}
        </button>
        <button
          onClick={share}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
        >
          {copied ? t("shared") : t("share")}
        </button>
      </div>
    </section>
  );
}