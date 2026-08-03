import { createFileRoute, Link } from "@tanstack/react-router";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";
import { useI18n, type TKey } from "@/lib/i18n";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/soul-duel")({
  head: () => ({
    meta: [
      { title: "Soul Duel — Coming Soon | Bleach Arena" },
      {
        name: "description",
        content:
          "Soul Duel: strategic 5v5 card battles across three random Bleach dimensions with unique character abilities. Coming soon to Bleach Arena.",
      },
      { property: "og:title", content: "Soul Duel — Coming Soon" },
      { property: "og:description", content: "Strategic 5v5 cinematic card battles. Coming soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SoulDuelPage,
});

const FEATURES: { icon: string; title: TKey; desc: TKey }[] = [
  { icon: "⚔", title: "soulDuelF1", desc: "soulDuelF1Desc" },
  { icon: "◈", title: "soulDuelF2", desc: "soulDuelF2Desc" },
  { icon: "卍", title: "soulDuelF3", desc: "soulDuelF3Desc" },
  { icon: "✦", title: "soulDuelF4", desc: "soulDuelF4Desc" },
];

function SoulDuelPage() {
  const { t } = useI18n();

  return (
    <>
      <Atmosphere variant="sparks" count={30} />
      <SiteHeader />

      <main className="page-enter mx-auto max-w-4xl px-4 pb-24 pt-8 sm:pt-12">
        {/* Hero banner */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 px-6 py-14 text-center backdrop-blur-md sm:py-20">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 260px at 50% 0%, oklch(0.7 0.15 300 / 0.3), transparent 70%), radial-gradient(500px 240px at 50% 110%, oklch(0.75 0.18 55 / 0.25), transparent 70%)",
            }}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/4 bg-white/10 blur-xl"
            style={{ animation: "gate-sweep 6s ease-in-out infinite" }}
          />
          <div className="relative">
            <span className="text-[10px] uppercase tracking-[0.45em] text-accent">
              {t("soulDuelKicker")}
            </span>
            <h1
              className="mt-4 font-display text-4xl font-black text-glow-orange sm:text-6xl"
              style={{ animation: "card-in 0.7s ease-out both" }}
            >
              {t("soulDuel")}
            </h1>
            <div
              className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-display text-xs font-black uppercase tracking-[0.35em] text-accent"
              style={{ animation: "pulse-glow 3s ease-in-out infinite" }}
            >
              {t("comingSoon")}
            </div>
            <p className="mx-auto mt-6 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("soulDuelIntro")}
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="tactile group rounded-2xl border border-white/10 bg-card/50 p-5 text-start backdrop-blur-md"
              style={{ animation: `card-in 0.5s ${0.08 * i}s ease-out both` }}
            >
              <span className="font-display text-3xl text-primary" aria-hidden>{f.icon}</span>
              <h2 className="mt-3 font-display text-base font-bold">{t(f.title)}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t(f.desc)}</p>
            </div>
          ))}
        </section>

        <p className="mt-8 text-center font-display text-sm tracking-[0.2em] text-accent">
          {t("soulDuelTease")}
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            to="/draft"
            onClick={() => play("sword")}
            className="tactile glow-orange rounded-2xl bg-primary px-7 py-3.5 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground"
          >
            {t("playDraft")}
          </Link>
        </div>
      </main>
    </>
  );
}