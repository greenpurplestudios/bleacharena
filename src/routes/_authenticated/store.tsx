import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";
import uraharaArt from "@/assets/characters/urahara.jpeg.asset.json";
import konArt from "@/assets/characters/kon.jpeg.asset.json";
import nimaiyaArt from "@/assets/characters/nimaya.jpeg.asset.json";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Store — Bleach Arena" },
      { name: "description", content: "Three storefronts: Urahara's Shop for cosmetics and potions, Nimaiya's Forge for ultimate weapons, and Kon's Kiosk for collectible packs." },
      { property: "og:title", content: "Bleach Arena — Store" },
      { property: "og:description", content: "Urahara's Shop, Nimaiya's Forge and Kon's Kiosk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StoreHubPage,
});

type Door = {
  to: "/shop" | "/forge" | "/packs";
  name: { en: string; ar: string };
  keeper: { en: string; ar: string };
  line: { en: string; ar: string };
  art?: string;
  glyph: string;
  /** CSS gradient describing the shop's atmosphere. */
  bg: string;
  accent: string;
};

const DOORS: Door[] = [
  {
    to: "/shop",
    name: { en: "Urahara's Shop", ar: "متجر أوراهارا" },
    keeper: { en: "Kisuke Urahara", ar: "كيسكي أوراهارا" },
    line: {
      en: "Titles, name frames, colors and luck potions — all for Souls.",
      ar: "ألقاب وإطارات أسماء وألوان وجرعات حظ — كلها مقابل الأرواح.",
    },
    art: uraharaArt.url,
    glyph: "✧",
    bg: "linear-gradient(135deg, oklch(0.32 0.06 60 / 0.9), oklch(0.16 0.02 40 / 0.95))",
    accent: "oklch(0.78 0.16 70)",
  },
  {
    to: "/forge",
    name: { en: "Nimaiya's Forge", ar: "مصهر نيمايا" },
    keeper: { en: "Ōetsu Nimaiya", ar: "أويتسو نيمايا" },
    line: {
      en: "Spend fragments to forge and equip Ultimate Weapons for Soul Duel.",
      ar: "استخدم الشظايا لصهر وتجهيز الأسلحة النهائية لنزال الأرواح.",
    },
    art: nimaiyaArt.url,
    glyph: "🔨",
    bg: "linear-gradient(135deg, oklch(0.34 0.11 25 / 0.9), oklch(0.15 0.03 20 / 0.96))",
    accent: "oklch(0.72 0.19 30)",
  },
  {
    to: "/packs",
    name: { en: "Kon's Kiosk", ar: "كشك كون" },
    keeper: { en: "Kon", ar: "كون" },
    line: {
      en: "Tear open collectible packs and pull new characters for your collection.",
      ar: "مزّق العبوات القابلة للجمع واسحب شخصيات جديدة لمجموعتك.",
    },
    art: konArt.url,
    glyph: "🎪",
    bg: "linear-gradient(135deg, oklch(0.33 0.09 145 / 0.85), oklch(0.15 0.03 150 / 0.96))",
    accent: "oklch(0.78 0.15 150)",
  },
];

const L = {
  eyebrow: { en: "Soul Society commerce", ar: "تجارة مجتمع الأرواح" },
  title: { en: "Store", ar: "المتجر" },
  enter: { en: "Enter", ar: "ادخل" },
} as const;

function StoreHubPage() {
  const { t, locale } = useI18n();
  const { souls } = useSouls();

  return (
    <>
      <SceneBackground scene="store" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div style={{ animation: "card-in 0.45s ease-out both" }}>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{L.eyebrow[locale]}</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-4xl font-black text-glow-orange sm:text-5xl">{L.title[locale]}</h1>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-display text-sm font-black text-accent">
              <span aria-hidden>✦</span>
              {souls ?? 0} {t("souls")}
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {DOORS.map((d, i) => (
            <Link
              key={d.to}
              to={d.to}
              onClick={() => play("tap")}
              style={{ animation: `card-in 0.5s ease-out ${0.08 * i}s both`, background: d.bg }}
              className="group relative block overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-transform active:scale-[0.99] sm:hover:-translate-y-1"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{ background: `radial-gradient(70% 90% at 85% 0%, ${d.accent}33, transparent 70%)` }}
              />
              <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 p-5 sm:p-6">
                <div className="min-w-0 pb-1">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/30 font-display text-base"
                    style={{ color: d.accent }}
                  >
                    {d.glyph}
                  </span>
                  <h2 className="mt-3 font-display text-2xl font-black uppercase tracking-wide sm:text-3xl">
                    {d.name[locale]}
                  </h2>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em]" style={{ color: d.accent }}>
                    {d.keeper[locale]}
                  </p>
                  <p className="mt-3 max-w-sm text-xs leading-relaxed text-foreground/70 sm:text-sm">{d.line[locale]}</p>
                  <span
                    className="mt-4 inline-block rounded-lg border px-4 py-2 font-display text-[11px] font-black uppercase tracking-[0.2em]"
                    style={{ borderColor: `${d.accent}66`, color: d.accent, background: `${d.accent}1a` }}
                  >
                    {L.enter[locale]} →
                  </span>
                </div>
                {d.art ? (
                  <img
                    src={d.art}
                    alt={d.keeper[locale]}
                    loading="lazy"
                    className="h-36 w-24 shrink-0 self-end object-cover object-top opacity-95 drop-shadow-[0_0_25px_rgba(0,0,0,0.85)] sm:h-52 sm:w-36"
                    style={{
                      maskImage: "linear-gradient(to bottom, black 80%, transparent)",
                      WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent)",
                    }}
                  />
                ) : (
                  <span
                    aria-hidden
                    className="mb-2 me-2 select-none font-display text-6xl font-black opacity-25 sm:text-8xl"
                    style={{ color: d.accent }}
                  >
                    刀
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
