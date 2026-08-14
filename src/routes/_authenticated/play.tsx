import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "Play — Bleach Arena" },
      { name: "description", content: "Every Bleach Arena mode in one place: Soul Duel, Draft, Rivals, Bleachdle, Soul Links and mini games." },
      { property: "og:title", content: "Bleach Arena — Play" },
      { property: "og:description", content: "Soul Duel, Draft, Rivals, daily puzzles and mini games." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayPage,
});

type Text = { en: string; ar: string };
type Mode = {
  to: "/soul-duel" | "/draft" | "/rivals" | "/bleachdle" | "/soul-links" | "/quiz" | "/quotes";
  name: Text;
  blurb: Text;
  glyph: string;
  accent: string;
};
type Group = { id: string; label: Text; modes: Mode[] };

const FLAGSHIP: Mode[] = [
  {
    to: "/soul-duel",
    name: { en: "Soul Duel", ar: "نزال الأرواح" },
    blurb: { en: "6-round card battles across three battlefields.", ar: "معارك بطاقات من 6 جولات عبر ثلاث ساحات." },
    glyph: "VS",
    accent: "oklch(0.72 0.19 30)",
  },
  {
    to: "/draft",
    name: { en: "Draft", ar: "الاختيار" },
    blurb: { en: "Build the strongest five-slot team you can.", ar: "ابنِ أقوى فريق من خمس خانات." },
    glyph: "刀",
    accent: "oklch(0.78 0.16 70)",
  },
];

const GROUPS: Group[] = [
  {
    id: "battle",
    label: { en: "Battle Modes", ar: "أوضاع القتال" },
    modes: [
      {
        to: "/rivals",
        name: { en: "Rivals", ar: "المنافسون" },
        blurb: { en: "Ranked attacks against other players' teams.", ar: "هجمات مصنّفة ضد فرق اللاعبين." },
        glyph: "⚔",
        accent: "oklch(0.7 0.16 15)",
      },
    ],
  },
  {
    id: "daily",
    label: { en: "Daily", ar: "يومي" },
    modes: [
      {
        to: "/bleachdle",
        name: { en: "Bleachdle", ar: "بليتشدل" },
        blurb: { en: "Six guesses to find today's character.", ar: "ست محاولات لإيجاد شخصية اليوم." },
        glyph: "◇",
        accent: "oklch(0.75 0.14 200)",
      },
      {
        to: "/soul-links",
        name: { en: "Soul Links", ar: "روابط الأرواح" },
        blurb: { en: "Find the four hidden canon connections.", ar: "اكتشف الروابط الأربعة الخفية." },
        glyph: "⛓",
        accent: "oklch(0.72 0.15 290)",
      },
    ],
  },
  {
    id: "mini",
    label: { en: "Mini Games", ar: "ألعاب مصغرة" },
    modes: [
      {
        to: "/quiz",
        name: { en: "Personality Quiz", ar: "اختبار الشخصية" },
        blurb: { en: "Which soul matches yours?", ar: "أي روح تشبهك؟" },
        glyph: "◈",
        accent: "oklch(0.74 0.13 330)",
      },
      {
        to: "/quotes",
        name: { en: "Who Said That?", ar: "من قال ذلك؟" },
        blurb: { en: "Three quotes, five suspects.", ar: "ثلاثة اقتباسات، خمسة مشتبهين." },
        glyph: "?",
        accent: "oklch(0.76 0.13 120)",
      },
    ],
  },
];

const L = {
  eyebrow: { en: "Choose your battlefield", ar: "اختر ساحتك" },
  title: { en: "Play", ar: "العب" },
  flagship: { en: "Main Modes", ar: "الأوضاع الرئيسية" },
} as const;

function PlayPage() {
  const { locale } = useI18n();

  return (
    <>
      <SceneBackground scene="home" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div style={{ animation: "card-in 0.45s ease-out both" }}>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{L.eyebrow[locale]}</p>
          <h1 className="mt-1 font-display text-4xl font-black text-glow-orange sm:text-5xl">{L.title[locale]}</h1>
        </div>

        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
          {L.flagship[locale]}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {FLAGSHIP.map((m, i) => (
            <Link
              key={m.to}
              to={m.to}
              onClick={() => play("tap")}
              style={{
                animation: `card-in 0.5s ease-out ${0.06 * i}s both`,
                background: `linear-gradient(140deg, ${m.accent}2e, oklch(0.16 0.02 40 / 0.95))`,
                borderColor: `${m.accent}55`,
              }}
              className="group relative overflow-hidden rounded-3xl border p-5 shadow-2xl transition-transform active:scale-[0.99] sm:p-6 sm:hover:-translate-y-1"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -end-6 -top-8 select-none font-display text-[7rem] font-black leading-none opacity-15"
                style={{ color: m.accent }}
              >
                {m.glyph}
              </span>
              <span
                aria-hidden
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-black/30 font-display text-base font-black"
                style={{ color: m.accent }}
              >
                {m.glyph}
              </span>
              <h2 className="relative mt-3 font-display text-3xl font-black uppercase tracking-wide">{m.name[locale]}</h2>
              <p className="relative mt-2 max-w-xs text-xs leading-relaxed text-foreground/70 sm:text-sm">{m.blurb[locale]}</p>
              <span
                className="relative mt-4 inline-block rounded-lg border px-4 py-2 font-display text-[11px] font-black uppercase tracking-[0.2em]"
                style={{ borderColor: `${m.accent}66`, color: m.accent, background: `${m.accent}1a` }}
              >
                ▶
              </span>
            </Link>
          ))}
        </div>

        {GROUPS.map((g) => (
          <section key={g.id} className="mt-8">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{g.label[locale]}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.modes.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  onClick={() => play("tap")}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md transition-all active:scale-[0.99] hover:border-primary/40"
                >
                  <span
                    aria-hidden
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 font-display text-lg font-black"
                    style={{ color: m.accent }}
                  >
                    {m.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-black uppercase tracking-wide">
                      {m.name[locale]}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{m.blurb[locale]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
