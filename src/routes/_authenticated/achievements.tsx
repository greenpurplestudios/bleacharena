import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { getMyAchievements, type AchievementRow } from "@/lib/progression";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — Bleach Arena" },
      { name: "description", content: "Unlock achievements across every game mode." },
      { property: "og:title", content: "Bleach Arena — Achievements" },
      { property: "og:description", content: "Every badge, every category." },
    ],
  }),
  component: AchievementsPage,
});

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8", rare: "#38bdf8", epic: "#a78bfa", legendary: "#f59e0b", mythic: "#e879f9",
};

function AchievementsPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<AchievementRow[]>([]);

  useEffect(() => { getMyAchievements().then(setRows); }, []);

  const grouped = useMemo(() => {
    const g: Record<string, AchievementRow[]> = {};
    rows.forEach((r) => { (g[r.category] ??= []).push(r); });
    return g;
  }, [rows]);

  const unlockedCount = rows.filter((r) => r.unlocked_at).length;

  const categoryLabel = (c: string) => {
    const map: Record<string, string> = {
      draft: t("categoryDraft"), collection: t("categoryCollection"),
      packs: t("categoryPacks"), rivals: t("categoryRivals"),
      bleachdle: t("categoryBleachdle"), economy: t("categoryEconomy"),
      general: t("categoryGeneral"),
    };
    return map[c] ?? c;
  };

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <div className="mb-6 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("achievements")}</p>
          <h1 className="mt-1 font-display text-4xl font-black text-glow-orange">{t("achievements")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("achievementsDesc")}</p>
          <p className="mt-2 text-xs font-black text-accent">{unlockedCount} / {rows.length} {t("unlocked")}</p>
        </div>

        {Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="mb-8">
            <h2 className="mb-3 font-display text-lg font-black uppercase tracking-widest text-muted-foreground">{categoryLabel(cat)}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {list.map((a) => {
                const pct = a.target > 0 ? Math.min(100, (a.progress / a.target) * 100) : 0;
                const color = RARITY_COLOR[a.rarity] ?? "#94a3b8";
                const done = !!a.unlocked_at;
                return (
                  <div
                    key={a.id}
                    className={"rounded-xl border p-3 " + (done ? "bg-white/5" : "bg-white/[0.02] opacity-90")}
                    style={{ borderColor: done ? `${color}66` : "rgba(255,255,255,0.1)", boxShadow: done ? `0 0 20px -12px ${color}` : undefined }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-black">{locale === "ar" ? a.name_ar : a.name_en}</div>
                        <div className="text-[11px] text-muted-foreground">{locale === "ar" ? a.desc_ar : a.desc_en}</div>
                      </div>
                      <span className="rounded-md border px-2 py-0.5 text-[9px] uppercase tracking-widest" style={{ borderColor: `${color}66`, color, background: `${color}1a` }}>
                        {a.rarity}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: pct + "%", background: color }} />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">{a.progress}/{a.target}</span>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground">
                      +{a.xp_reward} XP{a.soul_reward > 0 ? ` · +${a.soul_reward} ✦` : ""}
                      {done && <span className="ms-2 text-accent">✓ {t("unlocked")}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}