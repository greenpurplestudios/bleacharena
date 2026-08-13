import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { addXp } from "@/lib/progression";
import { trackMission } from "@/lib/missions";
import {
  GROUP_COLOR, MAX_MISTAKES, dailyLinks, evaluate, loadProgress, saveProgress,
  shareText, type LinksProgress,
} from "@/lib/soul-links";

const L = {
  title: { en: "Soul Links", ar: "روابط الأرواح" },
  kicker: { en: "Daily connection puzzle", ar: "لغز الروابط اليومي" },
  howto: {
    en: "Find four groups of four characters that share a canon connection.",
    ar: "اعثر على أربع مجموعات من أربع شخصيات تجمعها صلة من القصة.",
  },
  mistakes: { en: "Mistakes left", ar: "الأخطاء المتبقية" },
  submit: { en: "Submit", ar: "تأكيد" },
  deselect: { en: "Deselect all", ar: "إلغاء التحديد" },
  shuffle: { en: "Shuffle", ar: "خلط" },
  hint: { en: "Hint", ar: "تلميح" },
  hintText: { en: "One group starts with:", ar: "إحدى المجموعات تبدأ بـ:" },
  oneAway: { en: "One away…", ar: "على بُعد واحدة…" },
  wrong: { en: "Not a link.", ar: "ليست صلة." },
  won: { en: "Perfect reading of the threads!", ar: "قراءة مثالية للروابط!" },
  lost: { en: "Out of guesses — here are the links.", ar: "انتهت المحاولات — هذه هي الروابط." },
  done: { en: "Come back tomorrow for a new puzzle.", ar: "عد غداً للغز جديد." },
  share: { en: "Share result", ar: "شارك النتيجة" },
  copied: { en: "Copied!", ar: "تم النسخ!" },
  puzzle: { en: "Puzzle", ar: "اللغز" },
};

export const Route = createFileRoute("/_authenticated/soul-links")({
  head: () => ({
    meta: [
      { title: "Soul Links — Bleach Arena" },
      {
        name: "description",
        content: "Soul Links: the daily Bleach connection puzzle. Find four groups of four characters bound by canon.",
      },
      { property: "og:title", content: "Bleach Arena — Soul Links" },
      { property: "og:description", content: "A new four-by-four Bleach connection puzzle every day." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SoulLinksPage,
});

function SoulLinksPage() {
  const { locale, dir } = useI18n();
  const daily = useMemo(() => dailyLinks(), []);
  const [progress, setProgress] = useState<LinksProgress | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<string[]>(() => daily.tiles.map((t) => t.slug));
  const [flash, setFlash] = useState<"one" | "wrong" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setProgress(loadProgress(daily.dayKey)); }, [daily.dayKey]);

  const commit = (next: LinksProgress) => { setProgress(next); saveProgress(next); };

  if (!progress) return null;

  const solvedSlugs = new Set(
    progress.solved.flatMap((gi) => daily.puzzle.groups[gi].slugs),
  );
  const remaining = order.filter((s) => !solvedSlugs.has(s));
  const finished = progress.finished;

  const toggle = (slug: string) => {
    if (finished) return;
    play("tap");
    setSelected((sel) =>
      sel.includes(slug) ? sel.filter((s) => s !== slug)
      : sel.length >= 4 ? sel
      : [...sel, slug],
    );
  };

  const submit = async () => {
    if (selected.length !== 4 || finished) return;
    const row = selected.map(
      (s) => daily.tiles.find((t) => t.slug === s)?.groupIndex ?? 0,
    );
    const res = evaluate(daily.puzzle, selected);
    const history = [...progress.history, row];

    if (res && "solved" in res) {
      play("pick");
      haptic("flip");
      const solved = [...progress.solved, res.solved];
      const won = solved.length === 4;
      commit({ ...progress, solved, history, finished: won, won });
      setSelected([]);
      if (won) {
        play("success");
        const xp = Math.max(20, 60 - progress.mistakes * 10);
        addXp(xp, "soul-links");
        trackMission("bleachdle_solve", 1).catch(() => { /* optional mission */ });
      }
      return;
    }

    const mistakes = progress.mistakes + 1;
    const lost = mistakes >= MAX_MISTAKES;
    play("skip");
    haptic("tap");
    setFlash(res && "oneAway" in res ? "one" : "wrong");
    window.setTimeout(() => setFlash(null), 1400);
    commit({
      ...progress,
      mistakes,
      history,
      finished: lost,
      won: false,
      solved: lost ? [0, 1, 2, 3] : progress.solved,
    });
    if (lost) setSelected([]);
  };

  const doShuffle = () => {
    play("tap");
    setOrder((o) => {
      const arr = o.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    });
  };

  const useHint = () => {
    if (progress.hintUsed || finished) return;
    play("tap");
    commit({ ...progress, hintUsed: true });
  };

  const hintGroup = daily.puzzle.groups.find((_g, i) => !progress.solved.includes(i));

  const share = async () => {
    const text = shareText(daily, progress, locale);
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); setCopied(true); }
    } catch { /* dismissed */ }
  };

  return (
    <>
      <SceneBackground scene="draft" />
      <SiteHeader />
      <main className="page-enter mx-auto max-w-2xl px-4 pb-28 pt-6" dir={dir}>
        <header className="text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {L.kicker[locale]}
          </span>
          <h1 className="mt-2 font-display text-3xl font-black text-glow-orange">{L.title[locale]}</h1>
          <p className="mx-auto mt-2 max-w-sm text-balance text-xs text-muted-foreground">
            {L.howto[locale]}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {L.puzzle[locale]} #{daily.puzzleNumber}
          </p>
        </header>

        {/* solved bands */}
        <div className="mt-6 space-y-2">
          {progress.solved.map((gi) => {
            const grp = daily.puzzle.groups[gi];
            const color = GROUP_COLOR[gi];
            return (
              <div
                key={grp.id}
                className="rounded-2xl border p-3 text-center"
                style={{ borderColor: `${color}66`, background: `${color}1f`, animation: "scale-in 0.25s ease-out both" }}
              >
                <div className="font-display text-sm font-black uppercase tracking-[0.16em] rtl:tracking-normal" style={{ color }}>
                  {grp.label[locale]}
                </div>
                <div className="mt-1 text-xs text-foreground/85">
                  {grp.slugs
                    .map((s) => daily.tiles.find((t) => t.slug === s)?.character.name[locale])
                    .join(" · ")}
                </div>
              </div>
            );
          })}
        </div>

        {/* board */}
        {remaining.length > 0 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {remaining.map((slug) => {
              const tile = daily.tiles.find((t) => t.slug === slug)!;
              const on = selected.includes(slug);
              return (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggle(slug)}
                  className={`tactile relative aspect-[3/4] overflow-hidden rounded-xl border text-start transition-transform ${
                    on ? "border-primary" : "border-white/10"
                  }`}
                  style={{
                    boxShadow: on ? "0 0 0 2px oklch(0.75 0.18 55 / 0.8), 0 8px 20px -10px #000" : undefined,
                    transform: on ? "scale(0.96)" : undefined,
                  }}
                  aria-pressed={on}
                >
                  {tile.character.image ? (
                    <img
                      src={tile.character.image}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: "50% 22%" }}
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.9))" }}
                  />
                  <span className="absolute inset-x-1 bottom-1 line-clamp-2 text-center text-[10px] font-black leading-tight">
                    {tile.character.name[locale]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* status */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">{L.mistakes[locale]}:</span>
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: i < MAX_MISTAKES - progress.mistakes ? "oklch(0.75 0.2 30)" : "oklch(1 0 0 / 0.15)" }}
            />
          ))}
        </div>

        {flash ? (
          <p className="mt-2 text-center text-xs font-bold text-accent" style={{ animation: "fade-in 0.2s ease-out both" }}>
            {(flash === "one" ? L.oneAway : L.wrong)[locale]}
          </p>
        ) : null}

        {progress.hintUsed && hintGroup && !finished ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {L.hintText[locale]}{" "}
            <span className="font-bold text-foreground">
              {daily.tiles.find((t) => t.slug === hintGroup.slugs[0])?.character.name[locale]}
            </span>
          </p>
        ) : null}

        {!finished ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={doShuffle} className="game-btn rounded-xl border border-white/12 px-4 py-2.5 text-xs font-black uppercase tracking-widest rtl:tracking-normal">
              {L.shuffle[locale]}
            </button>
            <button
              type="button"
              onClick={() => { setSelected([]); play("tap"); }}
              disabled={!selected.length}
              className="game-btn rounded-xl border border-white/12 px-4 py-2.5 text-xs font-black uppercase tracking-widest disabled:opacity-40 rtl:tracking-normal"
            >
              {L.deselect[locale]}
            </button>
            <button
              type="button"
              onClick={useHint}
              disabled={progress.hintUsed}
              className="game-btn rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-accent disabled:opacity-40 rtl:tracking-normal"
            >
              {L.hint[locale]}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={selected.length !== 4}
              className="glow-orange rounded-xl bg-primary px-6 py-2.5 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40 rtl:tracking-normal"
            >
              {L.submit[locale]}
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-white/10 bg-card/70 p-5 text-center backdrop-blur-md">
            <p className={`font-display text-lg font-black ${progress.won ? "text-emerald-400" : "text-accent"}`}>
              {(progress.won ? L.won : L.lost)[locale]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{L.done[locale]}</p>
            <button
              type="button"
              onClick={share}
              className="glow-orange mt-4 rounded-xl bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground rtl:tracking-normal"
            >
              {copied ? L.copied[locale] : L.share[locale]}
            </button>
          </div>
        )}
      </main>
    </>
  );
}
