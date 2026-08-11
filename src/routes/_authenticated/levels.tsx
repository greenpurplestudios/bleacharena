import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { claimLevelReward, getLevelRewardsState, getMyProfileFull, type LevelRewardRow, type ProfileFull } from "@/lib/progression";
import { XPBar } from "@/components/XPBar";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/levels")({
  head: () => ({
    meta: [
      { title: "Levels — Bleach Arena" },
      { name: "description", content: "Climb levels and unlock milestone rewards." },
      { property: "og:title", content: "Bleach Arena — Levels" },
      { property: "og:description", content: "Every milestone reward on your path." },
    ],
  }),
  component: LevelsPage,
});

function LevelsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<LevelRewardRow[]>([]);
  const [p, setP] = useState<ProfileFull | null>(null);
  const { refresh: refreshSouls } = useSouls();

  const load = async () => {
    const [r, pf] = await Promise.all([getLevelRewardsState(), getMyProfileFull()]);
    setRows(r);
    setP(pf);
  };
  useEffect(() => { load(); }, []);

  const claim = async (lvl: number) => {
    play("rare");
    const r = await claimLevelReward(lvl);
    if (r.ok) { refreshSouls(); load(); }
  };

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("levels")}</p>
          <h1 className="mt-1 font-display text-4xl font-black text-glow-orange">{t("levels")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("levelsDesc")}</p>
        </div>

        {p && (
          <div className="mx-auto mb-6 max-w-md rounded-2xl border border-white/10 bg-card/60 p-5 backdrop-blur">
            <XPBar level={p.level} xp={p.xp} xpToNext={p.xp_to_next} />
            <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
              {p.xp_to_next - p.xp} XP {t("toNextLevel")}
            </p>
          </div>
        )}

        <ol className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.level}
              className={
                "flex items-center justify-between gap-3 rounded-xl border p-4 " +
                (r.claimed ? "border-white/10 bg-white/[0.02] opacity-70" :
                 r.unlocked ? "border-primary/50 bg-primary/10" :
                 "border-white/10 bg-white/5")
              }
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 font-display text-sm font-black text-primary">
                  {r.level}
                </span>
                <div>
                  <div className="font-display text-sm font-black">{locale === "ar" ? r.name_ar : r.name_en}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {r.souls > 0 && <>+{r.souls} ✦{" "}</>}
                    {[r.title_item, r.color_item, r.frame_item, r.border_item, r.badge_item]
                      .filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              {r.claimed ? (
                <span className="text-xs font-black text-accent">✓ {t("claimed")}</span>
              ) : r.unlocked ? (
                <button onClick={() => claim(r.level)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground">
                  {t("claim")}
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">{t("locked")}</span>
              )}
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}