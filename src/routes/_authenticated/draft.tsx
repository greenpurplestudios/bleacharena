import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useRef } from "react";
import type { Character } from "@/types/character";
import { characters } from "@/data/characters";
import { pickWeighted } from "@/lib/rarity";
import { scoreTeam } from "@/lib/scoring";
import { CharacterCard } from "@/components/CharacterCard";
import { TeamSlots } from "@/components/TeamSlots";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import { submitScore, getMyProfile } from "@/lib/leaderboard";
import { awardPackFromScore, PACK_LABEL, PACK_COLOR, type PackTier } from "@/lib/packs";
import { trackMission } from "@/lib/missions";
import { addXp, bumpProfileStats, trackAchievement, XP } from "@/lib/progression";
import { play, loadPrefs } from "@/lib/sound";
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

/**
 * The whole draft lives in ONE state object so a pick/skip is a single atomic
 * transition: the character leaves the pool, the team/skip counter updates and
 * the card is cleared together. `current` is real state (never derived from an
 * impure useMemo), so re-renders can never regenerate, duplicate or swap the
 * displayed card.
 */
interface DraftState {
  team: (Character | null)[];
  skipsLeft: number;
  /** picked + skipped ids — excluded from the pool */
  usedIds: string[];
  current: Character | null;
  phase: Phase;
  /** increments on every new card, used purely as a render key */
  cardKey: number;
}

function initialDraft(): DraftState {
  return {
    team: Array.from({ length: TEAM_SIZE }, () => null),
    skipsLeft: MAX_SKIPS,
    usedIds: [],
    current: null,
    phase: "drafting",
    cardKey: 0,
  };
}

function DraftPage() {
  const { t, locale } = useI18n();
  const [st, setSt] = useState<DraftState>(initialDraft);
  const [confirmReset, setConfirmReset] = useState(false);
  const [potion, setPotion] = useState<ActivePotion>({ active: false, luck: 0 });
  /** id of the card the player has flipped — resets implicitly with each card */
  const [revealedId, setRevealedId] = useState<string | null>(null);
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
  const luckRef = useRef(0);
  luckRef.current = activeLuck;

  const { team, skipsLeft, current, phase, cardKey } = st;
  const filled = useMemo(() => team.filter(Boolean).length, [team]);
  const poolEmpty = st.usedIds.length >= characters.length;
  const flipReveal = loadPrefs().flipReveal !== false;
  const revealed = !flipReveal || (!!current && revealedId === current.id);

  /**
   * Draw exactly one card whenever the board is empty and the draft is live.
   * Because `current` is nulled atomically by the action that consumed it, this
   * can never run twice for the same slot.
   */
  useEffect(() => {
    if (phase !== "drafting" || current || filled >= TEAM_SIZE) return;
    setSt((s) => {
      if (s.phase !== "drafting" || s.current || s.team.filter(Boolean).length >= TEAM_SIZE) return s;
      const used = new Set(s.usedIds);
      const pool = characters.filter((c) => !used.has(c.id));
      const next = pool.length ? pickWeighted(pool, Math.random, luckRef.current) : null;
      if (!next) return s;
      return { ...s, current: next, cardKey: s.cardKey + 1 };
    });
  }, [phase, current, filled]);

  // Play a reveal / rare flourish whenever a new card is presented.
  useEffect(() => {
    if (!current) return;
    haptic("draft");
    if (current.rarity === "mythic" || current.rarity === "legendary") play("rare");
    else play("reveal");
  }, [current?.id, cardKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitPick = useCallback(() => {
    let completed = false;
    setSt((s) => {
      const c = s.current;
      if (!c || s.phase !== "drafting") return s; // rapid double-tap guard
      const team = [...s.team];
      const idx = team.findIndex((x) => x === null);
      if (idx === -1) return s;
      team[idx] = c;
      const done = team.every(Boolean);
      completed = done;
      return {
        ...s,
        team,
        usedIds: [...s.usedIds, c.id],
        current: null,
        phase: done ? "result" : "drafting",
      };
    });
    play("pick");
    haptic("press");
    if (completed) play("success");
  }, []);

  const onSkip = useCallback(() => {
    let skipped = false;
    setSt((s) => {
      const c = s.current;
      if (!c || s.phase !== "drafting" || s.skipsLeft <= 0) return s;
      skipped = true;
      return {
        ...s,
        usedIds: [...s.usedIds, c.id],
        skipsLeft: s.skipsLeft - 1,
        current: null,
      };
    });
    if (skipped) play("skip");
  }, []);

  const reset = useCallback(() => {
    setSt(initialDraft());
    setRevealedId(null);
    setConfirmReset(false);
  }, []);

  return (
    <>
      <SceneBackground scene="draft" />
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
              <div key={`${current.id}-${cardKey}`} className="w-full max-w-sm">
                <CharacterCard
                  character={current}
                  faceDown
                  onReveal={() => setRevealedId(current.id)}
                />
                {!revealed && (
                  <p className="mt-3 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
                    {t("tapToReveal")}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={commitPick}
                    disabled={!revealed}
                    className="glow-orange rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t("add")}
                  </button>
                  <button
                    onClick={onSkip}
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
              poolEmpty ? (
                <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-muted-foreground">
                  {t("noMore")}
                </div>
              ) : (
                <div className="h-[420px] w-full max-w-sm rounded-xl border border-white/5 bg-white/[0.02]" aria-hidden />
              )
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
    if (["A", "S", "SS", "SS+"].includes(score.rank)) trackMission("draft_rank", 1);
    if (team.some((c) => c?.rarity === "mythic")) trackMission("draft_mythic", 1);
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