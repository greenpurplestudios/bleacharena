import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";
import { DuelBoard } from "@/components/soulduel/DuelBoard";
import { OnlineDuel } from "@/components/soulduel/OnlineDuel";
import { DuelRanking } from "@/components/soulduel/DuelRanking";
import { BattlefieldCard } from "@/components/soulduel/BattlefieldCard";
import { BATTLEFIELDS } from "@/data/battlefields";
import { DUEL_ROSTER } from "@/data/soul-duel-roster";
import { useI18n, type TKey } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { fetchForge, type ForgeState } from "@/lib/forge";
import { ULTIMATE_EFFECT_TEXT, ultimateOf } from "@/lib/soul-duel/ultimates";
import type { Difficulty } from "@/lib/soul-duel/types";

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

const DIFFICULTIES: { id: Difficulty; label: TKey; desc: TKey; color: string }[] = [
  { id: "practice", label: "sdPractice", desc: "sdPracticeDesc", color: "oklch(0.75 0.14 160)" },
  { id: "normal", label: "sdNormal", desc: "sdNormalDesc", color: "oklch(0.8 0.16 220)" },
  { id: "nightmare", label: "sdNightmare", desc: "sdNightmareDesc", color: "oklch(0.65 0.22 20)" },
];

function SoulDuelPage() {
  const { t, locale } = useI18n();
  const [playing, setPlaying] = useState(false);
  const [online, setOnline] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [forge, setForge] = useState<ForgeState | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchForge().then((f) => { if (alive) setForge(f); });
    return () => { alive = false; };
  }, []);

  const weapon = ultimateOf(forge?.equipped);

  if (online) {
    return (
      <>
        <Atmosphere variant="sparks" count={16} parallax={false} />
        <SiteHeader />
        <main className="page-enter mx-auto max-w-2xl px-4 pb-28 pt-4">
          <OnlineDuel pool={DUEL_ROSTER} weaponId={forge?.equipped} onExit={() => setOnline(false)} />
        </main>
      </>
    );
  }

  if (playing) {
    return (
      <>
        <Atmosphere variant="sparks" count={16} parallax={false} />
        <SiteHeader />
        <main className="page-enter mx-auto max-w-2xl px-4 pb-28 pt-4">
          <DuelBoard
            pool={DUEL_ROSTER}
            onExit={() => setPlaying(false)}
            difficulty={difficulty}
            weaponId={forge?.equipped}
          />
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
            <div className="mt-4">
              <button
                type="button"
                onClick={() => { play("sword"); haptic("draft"); setOnline(true); }}
                className="tactile rounded-2xl border border-accent/50 bg-accent/10 px-8 py-3.5 font-display text-sm font-black uppercase tracking-[0.25em] text-accent rtl:tracking-normal"
              >
                {t("sdOnline")}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">{t("sdOnlineDesc")}</p>
            </div>
          </div>
        </section>

        {/* difficulty */}
        <section className="mt-6">
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
            {t("sdDifficulty")}
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {DIFFICULTIES.map((d) => {
              const on = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setDifficulty(d.id); play("tap"); haptic("tap"); }}
                  aria-pressed={on}
                  className="tactile rounded-2xl border p-3 text-start transition-colors"
                  style={{
                    borderColor: on ? d.color : "oklch(1 0 0 / 0.1)",
                    background: on ? `${d.color}1a` : "oklch(1 0 0 / 0.02)",
                    boxShadow: on ? `0 0 24px -10px ${d.color}` : undefined,
                  }}
                >
                  <p className="font-display text-sm font-black" style={{ color: on ? d.color : undefined }}>
                    {t(d.label)}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t(d.desc)}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* loadout */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
              {t("sdLoadout")}
            </h2>
            <Link
              to="/forge"
              onClick={() => play("tap")}
              className="tactile rounded-xl border border-accent/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent rtl:tracking-normal"
            >
              {t("forge")}
            </Link>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <img
              src={weapon.art}
              alt={weapon.name[locale]}
              className="w-20 shrink-0 rounded-xl border border-white/15"
              style={{ boxShadow: `0 0 26px -10px ${weapon.visual.glow}` }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground rtl:tracking-normal">
                {t("sdUltimate")}
              </p>
              <p className="font-display text-base font-black" style={{ color: weapon.visual.glow }}>
                {weapon.name[locale]}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {ULTIMATE_EFFECT_TEXT[weapon.id]?.[locale]}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">{t("sdUltOnce")}</p>
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

        <DuelRanking />
      </main>
    </>
  );
}
