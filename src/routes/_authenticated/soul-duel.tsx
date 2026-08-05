import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";
import { DuelBoard } from "@/components/soulduel/DuelBoard";
import { BattlefieldCard } from "@/components/soulduel/BattlefieldCard";
import { BATTLEFIELDS } from "@/data/battlefields";
import { characters } from "@/data/characters";
import { useI18n, type TKey } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

export const Route = createFileRoute("/_authenticated/soul-duel")({
  head: () => ({
    meta: [
      { title: "Soul Duel — Strategic Card Battles | Bleach Arena" },
      {
        name: "description",
        content:
          "Soul Duel: six-round 5v5 card battles across three shared Bleach battlefields, each with its own rules, abilities and cinematic reveal.",
      },
      { property: "og:title", content: "Soul Duel — Strategic Card Battles" },
      { property: "og:description", content: "Six rounds. Three battlefields. One winner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SoulDuelPage,
});

const HOW: TKey[] = ["sdHow1", "sdHow2", "sdHow3", "sdHow4"];

function SoulDuelPage() {
  const { t, locale } = useI18n();
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <>
        <Atmosphere variant="sparks" count={16} parallax={false} />
        <SiteHeader />
        <main className="page-enter mx-auto max-w-2xl px-4 pb-28 pt-4">
          <DuelBoard pool={characters} onExit={() => setPlaying(false)} />
        </main>
      </>
    );
  }

  return (
    <>
      <Atmosphere variant="sparks" count={28} />
      <SiteHeader />

      <main className="page-enter mx-auto max-w-4xl px-4 pb-24 pt-8 sm:pt-12">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 px-6 py-12 text-center backdrop-blur-md">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 260px at 50% 0%, oklch(0.7 0.15 300 / 0.3), transparent 70%), radial-gradient(500px 240px at 50% 110%, oklch(0.75 0.18 55 / 0.25), transparent 70%)",
            }}
          />
          <div className="relative">
            <span className="text-[10px] uppercase tracking-[0.45em] text-accent rtl:tracking-normal">
              {t("soulDuelKicker")}
            </span>
            <h1 className="mt-4 font-display text-4xl font-black text-glow-orange sm:text-6xl">
              {t("soulDuel")}
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
              {t("soulDuelIntro")}
            </p>
            <button
              type="button"
              onClick={() => { play("sword"); haptic("draft"); setPlaying(true); }}
              className="tactile glow-orange mt-7 rounded-2xl bg-primary px-8 py-4 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground rtl:tracking-normal"
            >
              {t("sdStart")}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
            {t("sdHowTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {HOW.map((k, i) => (
              <li key={k} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 font-display text-[10px] font-black text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">{t(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
            {t("sdBattlefields")}
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BATTLEFIELDS.map((b, i) => (
              <li key={b.id} style={{ animation: `card-in 0.5s ${0.05 * i}s ease-out both` }}>
                <BattlefieldCard def={b} className="w-full" />
                <p className="mt-2 text-center text-xs font-bold">{b.name[locale]}</p>
                <p className="mt-0.5 text-center text-[10px] leading-tight text-muted-foreground">
                  {b.ability[locale]}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
