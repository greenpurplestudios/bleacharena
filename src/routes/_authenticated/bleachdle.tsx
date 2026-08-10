import { formatHMS, msUntilServerMidnight } from "@/lib/server-time";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import { characters } from "@/data/characters";
import { RARITY_LABEL } from "@/lib/rarity";
import type { Character } from "@/types/character";
import {
  MAX_GUESSES,
  compareGuess,
  fetchDailyPuzzle,
  fetchMyBleachdleStats,
  shareEmojis,
  submitBleachdle,
  type BleachdleStats,
  type DailyPuzzle,
  type GuessRow,
  type HintCell,
} from "@/lib/bleachdle";
import { play } from "@/lib/sound";
import { useSouls } from "@/hooks/use-souls";
import { addXp, trackAchievement, XP } from "@/lib/progression";
import { trackMission } from "@/lib/missions";

export const Route = createFileRoute("/_authenticated/bleachdle")({
  head: () => ({
    meta: [
      { title: "Bleachdle — Daily Character Puzzle | Bleach Arena" },
      { name: "description", content: "Guess today's Bleach character in 6 tries. New puzzle every 24 hours, same for every player worldwide." },
      { property: "og:title", content: "Bleachdle — Daily Character Puzzle" },
      { property: "og:description", content: "One character. Six guesses. Worldwide daily." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BleachdlePage,
});

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return formatHMS(msUntilServerMidnight(now));
}

function CellChip({ cell, tOvr, tRarity, tAff, tName, tGender, tGenderMale, tGenderFemale, tGenderOther }: { cell: HintCell; tOvr: string; tRarity: string; tAff: string; tName: string; tGender: string; tGenderMale: string; tGenderFemale: string; tGenderOther: string }) {
  let bg = "bg-white/5 border-white/10 text-muted-foreground";
  if (cell.state === "correct") bg = "bg-emerald-500/20 border-emerald-400/50 text-emerald-100";
  else if (cell.state === "partial") bg = "bg-amber-500/20 border-amber-400/50 text-amber-100";
  else if (cell.kind === "ovr" && (cell.state === "higher" || cell.state === "lower")) {
    bg = "bg-white/5 border-white/10 text-foreground";
  }
  const label =
    cell.kind === "name" ? tName :
    cell.kind === "ovr" ? tOvr :
    cell.kind === "rarity" ? tRarity :
    cell.kind === "gender" ? tGender : tAff;
  const genderLabel = (v: string) => v === "male" ? tGenderMale : v === "female" ? tGenderFemale : tGenderOther;
  const content =
    cell.kind === "ovr" ? (
      <span className="flex items-center gap-1 font-display font-black">
        {cell.value}
        {cell.state === "higher" && <span aria-label="higher">⬆</span>}
        {cell.state === "lower" && <span aria-label="lower">⬇</span>}
        {cell.state === "correct" && <span aria-label="correct">✓</span>}
      </span>
    ) : cell.kind === "rarity" ? (
      <span className="font-semibold capitalize">{cell.value}</span>
    ) : cell.kind === "affiliation" ? (
      <span className="font-semibold truncate">{cell.value}</span>
    ) : cell.kind === "gender" ? (
      <span className="font-semibold truncate">{genderLabel(cell.value)}</span>
    ) : (
      <span aria-hidden className="font-black">{cell.state === "correct" ? "✓" : "✗"}</span>
    );
  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border px-1.5 py-2 text-[11px] ${bg}`} style={{ animation: "card-in 0.35s ease-out both" }}>
      <div className="text-[9px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-center leading-tight">{content}</div>
    </div>
  );
}

function GuessRowView({ row, locale, ...labels }: { row: GuessRow; locale: "en" | "ar"; tOvr: string; tRarity: string; tAff: string; tName: string; tGender: string; tGenderMale: string; tGenderFemale: string; tGenderOther: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))] gap-1.5 items-stretch">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-1.5">
        {row.guess.image ? (
          <img src={row.guess.image} alt="" className="h-10 w-10 flex-shrink-0 rounded-md object-cover" loading="lazy" />
        ) : (
          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-white/10" />
        )}
        <span className="truncate text-xs font-semibold">{row.guess.name[locale]}</span>
      </div>
      {row.cells.map((c, i) => (
        <CellChip key={i} cell={c} tOvr={labels.tOvr} tRarity={labels.tRarity} tAff={labels.tAff} tName={labels.tName} tGender={labels.tGender} tGenderMale={labels.tGenderMale} tGenderFemale={labels.tGenderFemale} tGenderOther={labels.tGenderOther} />
      ))}
    </div>
  );
}

function BleachdlePage() {
  const { t, locale } = useI18n();
  const { refresh: refreshSouls } = useSouls();
  const countdown = useCountdown();

  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GuessRow[]>([]);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [stats, setStats] = useState<BleachdleStats | null>(null);
  const [soulsAwarded, setSoulsAwarded] = useState<number | null>(null);
  const [shared, setShared] = useState(false);
  const [practice, setPractice] = useState(false);
  const [practiceAnswerId, setPracticeAnswerId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const answerId = practice ? practiceAnswerId : puzzle?.character_id ?? null;
  const answer = useMemo(() => characters.find((c) => c.id === answerId) ?? null, [answerId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, s] = await Promise.all([fetchDailyPuzzle(), fetchMyBleachdleStats()]);
      if (!alive) return;
      setPuzzle(p);
      setStats(s);
      setLoading(false);
      // Restore in-progress guesses from localStorage for today's puzzle
      if (p && !p.already_solved) {
        try {
          const key = `bleachdle:progress:${p.day_key}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const ids: string[] = JSON.parse(raw);
            const answerChar = characters.find((c) => c.id === p.character_id);
            if (answerChar && Array.isArray(ids)) {
              const restored: GuessRow[] = [];
              for (const id of ids) {
                const g = characters.find((c) => c.id === id);
                if (g) restored.push(compareGuess(g, answerChar));
              }
              if (restored.length) setRows(restored);
            }
          }
        } catch {}
      }
    })();
    return () => { alive = false; };
  }, []);

  const guessedIds = useMemo(() => new Set(rows.map((r) => r.guess.id)), [rows]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return characters
      .filter((c) => !guessedIds.has(c.id))
      .filter((c) => c.name.en.toLowerCase().includes(q) || c.name.ar.includes(query.trim()))
      .slice(0, 8);
  }, [query, guessedIds]);

  useEffect(() => { setHighlight(0); }, [query]);

  const finish = async (finalRows: GuessRow[], didWin: boolean) => {
    setDone(true);
    setWon(didWin);
    play(didWin ? "rare" : "tap");
    if (practice || !puzzle) return;
    void trackMission("bleachdle_play", 1);
    if (didWin) void trackMission("bleachdle_win", 1);
    const res = await submitBleachdle(puzzle.day_key, finalRows.length, didWin);
    if (res.ok) {
      setSoulsAwarded(res.souls ?? 0);
      if ((res.souls ?? 0) > 0) refreshSouls();
      const s = await fetchMyBleachdleStats();
      setStats(s);
      // Progression
      const xp = didWin ? XP.bleachdleWin(finalRows.length) : XP.bleachdleLose;
      await Promise.all([
        addXp(xp, "bleachdle"),
        didWin ? trackAchievement("bd_first", 1) : Promise.resolve(),
        didWin ? trackAchievement("bd_100", 1) : Promise.resolve(),
        s?.best_streak ? trackAchievement("bd_streak_7", s.best_streak, true) : Promise.resolve(),
        s?.best_streak ? trackAchievement("bd_streak_30", s.best_streak, true) : Promise.resolve(),
      ]);
    }
  };

  const submit = (choice: Character) => {
    if (!answer || done) return;
    if (guessedIds.has(choice.id)) return;
    const row = compareGuess(choice, answer);
    const next = [...rows, row];
    setRows(next);
    setQuery("");
    play("tap");
    const isWin = choice.id === answer.id;
    // Persist in-progress guesses (only for the real daily puzzle)
    if (!practice && puzzle) {
      try {
        const key = `bleachdle:progress:${puzzle.day_key}`;
        localStorage.setItem(key, JSON.stringify(next.map((r) => r.guess.id)));
      } catch {}
    }
    if (isWin || next.length >= MAX_GUESSES) {
      if (!practice && puzzle) {
        try { localStorage.removeItem(`bleachdle:progress:${puzzle.day_key}`); } catch {}
      }
      finish(next, isWin);
    }
  };

  const startPractice = () => {
    // Random character (not today's) for practice
    const pool = characters.filter((c) => c.id !== puzzle?.character_id);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setPracticeAnswerId(pick.id);
    setPractice(true);
    setRows([]);
    setDone(false);
    setWon(false);
    setQuery("");
    setSoulsAwarded(null);
    setShared(false);
  };

  const share = async () => {
    if (!puzzle) return;
    const grid = shareEmojis(rows, won);
    const header = `${t("bleachdleShareTitle")} #${puzzle.puzzle_number}`;
    const footer = won
      ? `${t("solvedIn")} ${rows.length} ${t("guesses")}!`
      : t("outOfGuesses");
    const text = `${header}\n\n${grid}\n\n${footer}\nbleacharena.com`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const guessesLeft = MAX_GUESSES - rows.length;
  const alreadyDoneToday = !practice && puzzle?.already_solved && rows.length === 0;

  return (
    <>
      <ReiatsuBackground count={16} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6 text-center" style={{ animation: "card-in 0.5s ease-out both" }}>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {puzzle ? `${t("puzzleNumber")} #${puzzle.puzzle_number}` : t("bleachdle")}
            {practice && <span className="ms-2 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] text-accent">{t("practiceModeNote")}</span>}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-glow-orange sm:text-4xl">{t("bleachdle")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">{t("bleachdleTagline")}</p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center text-sm text-muted-foreground">…</div>
        ) : !puzzle || !answer ? (
          <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-center text-sm text-destructive">Error loading puzzle</div>
        ) : (
          <>
            {/* Status bar */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-card/60 p-3 backdrop-blur">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{t("guessesLeft")}</span>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_GUESSES }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-4 rounded-full ${i < guessesLeft ? "bg-primary" : "bg-white/10"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="opacity-70">{t("nextPuzzleIn")} </span>
                <span className="font-display font-black text-foreground">{countdown}</span>
              </div>
            </div>

            {/* Input */}
            {!done && !alreadyDoneToday && (
              <div className="relative mb-4" ref={listRef}>
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, suggestions.length - 1)); }
                    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
                    else if (e.key === "Enter" && suggestions[highlight]) { e.preventDefault(); submit(suggestions[highlight]); }
                    else if (e.key === "Escape") setQuery("");
                  }}
                  placeholder={t("searchCharacter")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                />
                {suggestions.length > 0 && (
                  <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-white/10 bg-card/95 py-1 shadow-2xl backdrop-blur-xl">
                    {suggestions.map((c, i) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setHighlight(i)}
                          onClick={() => submit(c)}
                          className={`flex w-full items-center gap-3 px-3 py-2 text-start text-sm ${i === highlight ? "bg-primary/15 text-primary" : "hover:bg-white/5"}`}
                        >
                          {c.image ? (
                            <img src={c.image} alt="" className="h-8 w-8 rounded object-cover" loading="lazy" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-white/10" />
                          )}
                          <span className="flex-1 truncate">{c.name[locale]}</span>
                          <span className="text-[10px] text-muted-foreground">{RARITY_LABEL[c.rarity][locale]}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Already solved notice */}
            {alreadyDoneToday && (
              <div className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-center text-sm">
                <div className="font-display text-lg font-black text-emerald-200">
                  {t("solvedIn")} {puzzle.previous_guesses} {t("guesses")} ✓
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{t("nextPuzzleIn")} {countdown}</div>
                <button
                  onClick={startPractice}
                  className="mt-3 rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground"
                >
                  {t("startPractice")}
                </button>
              </div>
            )}

            {/* Guess history */}
            {rows.length > 0 && (
              <div className="mb-4 flex flex-col gap-1.5">
                {rows.map((r, i) => (
                  <GuessRowView key={i} row={r} locale={locale} tOvr={t("ovrHint")} tRarity={t("rarityHint")} tAff={t("affiliationHint")} tName={t("characterHint")} tGender={t("genderHint")} tGenderMale={t("genderMale")} tGenderFemale={t("genderFemale")} tGenderOther={t("genderOther")} />
                ))}
              </div>
            )}

            {/* Result */}
            {done && (
              <div className={`mb-4 rounded-2xl border p-5 text-center ${won ? "border-emerald-400/40 bg-emerald-500/10" : "border-destructive/40 bg-destructive/10"}`} style={{ animation: "card-in 0.5s ease-out both" }}>
                <div className={`font-display text-2xl font-black ${won ? "text-emerald-200" : "text-destructive"}`}>
                  {won ? `${t("solvedIn")} ${rows.length} ${t("guesses")}!` : t("outOfGuesses")}
                </div>
                {!won && answer && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t("correctAnswerWas")}: <span className="font-semibold text-foreground">{answer.name[locale]}</span>
                  </div>
                )}
                {soulsAwarded !== null && soulsAwarded > 0 && (
                  <div className="mt-2 text-sm font-black text-accent">+{soulsAwarded} ✦</div>
                )}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {!practice && (
                    <button
                      onClick={share}
                      className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground"
                    >
                      {shared ? t("shared") : t("share")}
                    </button>
                  )}
                  <button
                    onClick={startPractice}
                    className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground hover:bg-white/10"
                  >
                    {t("startPractice")}
                  </button>
                </div>
              </div>
            )}

            {/* Stats */}
            {stats && (
              <section className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur">
                <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("yourStats")}</div>
                <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                  {[
                    { k: "gamesPlayed", v: stats.games_played },
                    { k: "gamesWon", v: stats.games_won },
                    { k: "currentStreak", v: stats.current_streak },
                    { k: "bestStreak", v: stats.best_streak },
                    { k: "avgGuesses", v: stats.avg_guesses ?? "—" },
                    { k: "fastestSolve", v: stats.fastest_solve ?? "—" },
                  ].map((s) => (
                    <div key={s.k} className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
                      <div className="font-display text-lg font-black text-primary">{s.v}</div>
                      <div className="text-[9px] uppercase tracking-widest text-muted-foreground">{t(s.k as "gamesPlayed")}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}