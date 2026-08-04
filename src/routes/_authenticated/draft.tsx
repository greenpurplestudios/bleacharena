import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import type { Character } from "@/types/character";
import { characters } from "@/data/characters";
import { pickWeighted } from "@/lib/rarity";
import { scoreTeam } from "@/lib/scoring";
import { CharacterCard } from "@/components/CharacterCard";
import { TeamSlots } from "@/components/TeamSlots";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { submitScore, getMyProfile } from "@/lib/leaderboard";
import { awardPackFromScore, PACK_LABEL, PACK_COLOR, type PackTier } from "@/lib/packs";
import { trackMission } from "@/lib/missions";
import { addXp, bumpProfileStats, trackAchievement, XP } from "@/lib/progression";
import { play } from "@/lib/sound";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { fetchActivePotion, formatRemaining, type ActivePotion } from "@/lib/potions";

export const Route = createFileRoute("/_authenticated/draft")({
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [potion, setPotion] = useState<ActivePotion>({ active: false, luck: 0 });
  const [revealed, setRevealed] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    fetchActivePotion().then(setPotion);
  }, []);
  useEffect(() => {
    if (!potion.active) return;
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [potion.active]);

  const potionLeft = potion.endsAt ? potion.endsAt - nowTs : 0;
  const potionRunning = potion.active && potionLeft > 0;
  const activeLuck = potionRunning ? potion.luck : 0;

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
    return pickWeighted(pool, Math.random, activeLuck);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, phase, filled, rerollKey]);

  // Play a reveal / rare flourish whenever a new card is presented.
  useEffect(() => {
    if (!current) return;
    haptic("draft");
    if (current.rarity === "mythic" || current.rarity === "legendary") play("rare");
    else play("reveal");
  }, [current?.id, rerollKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitPick = useCallback(
    (c: Character) => {
      play("pick");
      haptic("press");
      setTeam((prev) => {
        const next = [...prev];
        const idx = next.findIndex((x) => x === null);
        if (idx !== -1) next[idx] = c;
        if (next.every(Boolean)) { setPhase("result"); play("success"); }
        return next;
      });
      setSeenIds((s) => new Set(s).add(c.id));
      setRerollKey((k) => k + 1);
    },
    [],
  );

  const onSkip = useCallback(() => {
    if (!current || skipsLeft <= 0) return;
    play("skip");
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
    setConfirmReset(false);
  }, []);

  return (
    <>
      <ReiatsuBackground count={22} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        {potionRunning && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2.5">
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
              +{Math.round(activeLuck * 100)}% {t("luckBoost")}
            </span>
            <span className="font-display text-base font-black tabular-nums text-emerald-300">
              {formatRemaining(potionLeft)}
            </span>
          </div>
        )}
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
                <CharacterCard
                  character={current}
                  faceDown
                  onReveal={() => setRevealed(true)}
                />
                {!revealed && (
                  <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {t("tapToReveal")}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setRevealed(false); commitPick(current); }}
                    disabled={!revealed}
                    className="glow-orange rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("add")}
                  </button>
                  <button
                    onClick={() => { setRevealed(false); onSkip(); }}
                    disabled={skipsLeft <= 0 || !revealed}
                    className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {skipsLeft > 0 ? t("skip") : t("outOfSkips")}
                  </button>
                </div>
                {filled > 0 && (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:bg-white/5"
                  >
                    {t("resetDraft")}
                  </button>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-muted-foreground">
                {t("noMore")}
              </div>
            )}

            {confirmReset && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={() => setConfirmReset(false)}>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
                  style={{ animation: "card-in 0.25s ease-out both" }}
                >
                  <h3 className="font-display text-lg font-bold">{t("resetDraft")}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t("resetDraftConfirm")}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10"
                    >
                      {t("cancel")}
                    </button>
                    <button
                      onClick={reset}
                      className="glow-orange rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                    >
                      {t("confirm")}
                    </button>
                  </div>
                </div>
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
  const [submitState, setSubmitState] = useState<"idle" | "done" | "not-improved">("idle");
  const [needsUsername, setNeedsUsername] = useState(false);
  const [packAward, setPackAward] = useState<PackTier | null>(null);

  const doSubmit = useCallback(async () => {
    const payload = team.filter((c): c is Character => !!c).map((c) => ({
      name: c.name.en,
      image: c.image ?? null,
      overall: c.overall,
    }));
    const res = await submitScore(score.overall, payload);
    if (!res.ok) {
      if (res.needsUsername) setNeedsUsername(true);
      return;
    }
    setSubmitState(res.improved ? "done" : "not-improved");
    // Award pack for this draft regardless of PB — one pack per completed draft.
    const award = await awardPackFromScore(score.overall);
    if (award.awarded && award.tier) setPackAward(award.tier);
    trackMission("draft_play", 1);
    // Progression
    await Promise.all([
      addXp(XP.draft(score.overall), "draft"),
      bumpProfileStats({ drafts_played: 1, best_draft_score: score.overall }),
      trackAchievement("draft_first", 1),
      trackAchievement("draft_100", 1),
      trackAchievement("draft_500", 1),
      score.overall >= 90 ? trackAchievement("draft_90", 1) : Promise.resolve(),
      score.overall >= 95 ? trackAchievement("draft_95", 1) : Promise.resolve(),
      score.overall >= 100 ? trackAchievement("draft_perfect", 1) : Promise.resolve(),
    ]);
  }, [score.overall, team]);

  useEffect(() => {
    (async () => {
      const p = await getMyProfile();
      if (!p?.username) { setNeedsUsername(true); return; }
      doSubmit();
    })();
  }, [doSubmit]);

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
      <UsernamePrompt
        open={needsUsername}
        onClose={() => setNeedsUsername(false)}
        dismissible={false}
        onSaved={() => { setNeedsUsername(false); doSubmit(); }}
      />
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
        <Link
          to="/leaderboard"
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
        >
          {t("viewLeaderboard")}
        </Link>
        <button
          onClick={share}
          className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
        >
          {copied ? t("shared") : t("share")}
        </button>
      </div>
      {submitState === "done" && <p className="text-sm text-accent">{t("scoreSubmitted")}</p>}
      {submitState === "not-improved" && <p className="text-sm text-muted-foreground">{t("scoreNotImproved")}</p>}
      {packAward && (
        <div
          className="mt-2 flex flex-col items-center gap-3 rounded-2xl border px-6 py-5"
          style={{
            borderColor: `${PACK_COLOR[packAward]}66`,
            background: `${PACK_COLOR[packAward]}12`,
            boxShadow: `0 0 40px -14px ${PACK_COLOR[packAward]}`,
            animation: "card-in 0.5s ease-out both",
          }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("packEarned")}
          </span>
          <span className="font-display text-2xl font-black" style={{ color: PACK_COLOR[packAward] }}>
            {PACK_LABEL[packAward][locale]}
          </span>
          <Link
            to="/packs"
            className="rounded-xl bg-primary px-5 py-2 font-display text-xs font-black uppercase tracking-widest text-primary-foreground"
          >
            {t("openPack")}
          </Link>
        </div>
      )}
    </section>
  );
}