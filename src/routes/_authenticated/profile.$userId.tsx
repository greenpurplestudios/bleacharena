import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import { getPublicProfile, type ProfileFull } from "@/lib/progression";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { XPBar } from "@/components/XPBar";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  head: ({ params }) => ({
    meta: [
      { title: `Player Profile — Bleach Arena` },
      { name: "description", content: `Public player profile on Bleach Arena.` },
      { property: "og:title", content: `Bleach Arena — Player ${params.userId.slice(0, 8)}` },
    ],
  }),
  component: PublicProfilePage,
});

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return "—"; }
}

function PublicProfilePage() {
  const { userId } = Route.useParams();
  const { t, locale } = useI18n();
  const [p, setP] = useState<ProfileFull | null | "missing">(null);

  useEffect(() => {
    (async () => {
      const r = await getPublicProfile(userId);
      setP(r ?? "missing");
    })();
  }, [userId]);

  if (p === null) return (<><SiteHeader /><main className="p-10 text-center text-sm text-muted-foreground">{t("loading")}</main></>);
  if (p === "missing") return (<><SiteHeader /><main className="p-10 text-center text-sm text-muted-foreground">{t("playerNotFound")}</main></>);

  const completion = p.collection_total > 0 ? Math.round((p.collection_owned / p.collection_total) * 100) : 0;

  return (
    <>
      <ReiatsuBackground count={12} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <PlayerAvatar characterId={p.avatar_character_id} frame={p.profile_frame} size={88} fallback={(p.username ?? "?")[0]?.toUpperCase()} />
            <div className="min-w-0 flex-1 text-center sm:text-start">
              <div className="font-display text-3xl font-black" style={p.username_color ? { color: p.username_color } : undefined}>
                {p.username ?? "—"}
              </div>
              {p.title && (<div className="mt-1 text-xs uppercase tracking-widest text-accent">{p.title}</div>)}
              <div className="mt-3 max-w-md">
                <XPBar level={p.level} xp={p.xp} xpToNext={p.xp_to_next} />
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("memberSince")} {fmtDate(p.created_at)}
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("collectionCompletion")} value={`${completion}%`} />
          <Stat label={t("currentRivalRank")} value={p.rival_rating} sub={`${p.rival_wins}W · ${p.rival_losses}L`} />
          <Stat label={t("highestRivalRank")} value={p.highest_rival_rating} />
          <Stat label={t("bestDraftScore")} value={p.best_draft_score.toFixed?.(1) ?? p.best_draft_score} />
          <Stat label={t("bleachdleBestStreakLabel")} value={p.bleachdle_best_streak} />
          <Stat label={t("draftsPlayed")} value={p.drafts_played} />
          <Stat label={t("packsOpenedStat")} value={p.packs_opened} />
          <Stat label={t("totalSoulsEarned")} value={p.total_souls_earned} />
        </section>

        {p.recent_achievements.length > 0 && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur">
            <h2 className="mb-3 font-display text-lg font-black">{t("recentAchievements")}</h2>
            <ul className="space-y-2">
              {p.recent_achievements.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span>{locale === "ar" ? a.name_ar : a.name_en}</span>
                  <span className="text-[10px] uppercase tracking-widest text-accent">{a.rarity}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="font-display text-xl font-black text-primary">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</div>}
    </div>
  );
}