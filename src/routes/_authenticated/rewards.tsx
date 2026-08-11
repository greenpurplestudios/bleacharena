import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { haptic } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import {
  claimWeeklyReward,
  getMyWeeklyReward,
  PACK_LABEL,
  REWARD_TIERS,
  type WeeklyRewardStatus,
} from "@/lib/weekly-rewards";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Weekly Rewards — Bleach Arena" },
      { name: "description", content: "Claim rewards based on your final leaderboard rank from last week." },
      { property: "og:title", content: "Bleach Arena — Weekly Rewards" },
      { property: "og:description", content: "Souls and packs for the top rivals every week." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RewardsPage,
});

function RewardsPage() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<WeeklyRewardStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const { refresh: refreshSouls } = useSouls();

  const load = async () => setStatus(await getMyWeeklyReward());
  useEffect(() => { load(); }, []);

  const doClaim = async () => {
    if (busy) return;
    setBusy(true);
    const res = await claimWeeklyReward();
    setBusy(false);
    if (res.ok) {
      play("rare");
      haptic("reward");
      refreshSouls();
      load();
    } else {
      play("skip");
    }
  };

  const canClaim = status?.ok && status.has_entry && !status.claimed;

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{t("weeklyRewardsSub")}</p>
          <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
            {t("weeklyRewards")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("weeklyRewardsDesc")}</p>
        </header>

        {/* Your reward card */}
        <section className="mb-8 rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur">
          {!status ? (
            <div className="text-sm text-muted-foreground">…</div>
          ) : !status.has_entry ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              {t("noEntry")}
            </div>
          ) : (
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 font-display text-2xl font-black text-primary"
                  aria-hidden
                >
                  #{status.rank}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    {t("yourRank")}
                  </div>
                  <div className="font-display text-lg font-bold">
                    {t("yourScore")}:{" "}
                    <span className="text-primary">{Number(status.score ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-accent">
                    +{status.souls} ✦
                    {status.pack ? (
                      <span className="ms-2 text-foreground/80">
                        + {PACK_LABEL[status.pack][locale]} {t("bonusPack")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div>
                {status.claimed ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    {t("rewardClaimed")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={doClaim}
                    disabled={!canClaim || busy}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-60"
                  >
                    {busy ? "…" : t("claimReward")}
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Tiers */}
        <section>
          <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {t("rewardTiers")}
          </h2>
          <ul className="space-y-2">
            {REWARD_TIERS.map((tier, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-card/50 px-4 py-3 backdrop-blur"
              >
                <span className="font-display text-sm font-bold">{tier.label[locale]}</span>
                <span className="text-sm font-semibold">
                  <span className="text-accent">+{tier.souls} ✦</span>
                  {tier.pack ? (
                    <span className="ms-2 text-muted-foreground">
                      + {PACK_LABEL[tier.pack][locale]} {t("bonusPack")}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}