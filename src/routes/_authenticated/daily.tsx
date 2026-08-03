import { formatHMS, msUntilServerMidnight } from "@/lib/server-time";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import { claimDailyLogin, DAILY_CALENDAR, getDailyLoginState, trackAchievement, type DailyLoginState } from "@/lib/progression";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/daily")({
  head: () => ({
    meta: [
      { title: "Daily Login — Bleach Arena" },
      { name: "description", content: "Claim your daily reward and grow your login streak." },
      { property: "og:title", content: "Bleach Arena — Daily Login" },
      { property: "og:description", content: "Login every day for stacking rewards." },
    ],
  }),
  component: DailyPage,
});

function useCountdownUTC() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  return formatHMS(msUntilServerMidnight(now));
}

function DailyPage() {
  const { t, locale } = useI18n();
  const { refresh: refreshSouls } = useSouls();
  const [state, setState] = useState<DailyLoginState | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [lastReward, setLastReward] = useState<{ souls?: number; pack?: string | null } | null>(null);
  const countdown = useCountdownUTC();

  const load = async () => { setState(await getDailyLoginState()); };
  useEffect(() => { load(); }, []);

  const claim = async () => {
    if (claiming || !state?.can_claim) return;
    setClaiming(true);
    play("rare");
    const r = await claimDailyLogin();
    setClaiming(false);
    if (r.ok) {
      setLastReward({ souls: r.souls, pack: r.pack });
      refreshSouls();
      // Streak-based achievement
      if ((r.streak ?? 0) >= 30) trackAchievement("gen_login_30", 30, true);
      load();
    }
  };

  const nextDay = state?.next_day ?? 1;

  return (
    <>
      <ReiatsuBackground count={16} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <div className="mb-6 text-center" style={{ animation: "card-in 0.4s ease-out both" }}>
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("daily")}</p>
          <h1 className="mt-1 font-display text-4xl font-black text-glow-orange">{t("daily")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("dailyDesc")}</p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-display text-2xl font-black text-primary">{state?.streak ?? 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("dailyStreak")}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-display text-2xl font-black text-primary">{state?.total_claims ?? 0}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("daysClaimed")}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-display text-sm font-black text-primary">{countdown}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("nextRewardIn")}</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-7">
            {DAILY_CALENDAR.map((d) => {
              const isNext = state?.can_claim && d.day === nextDay;
              const isDone = !state?.can_claim && d.day === (((state?.streak ?? 1) - 1) % 7) + 1;
              const isBig = d.day === 7;
              return (
                <div
                  key={d.day}
                  className={
                    "flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all " +
                    (isNext ? "border-primary/70 bg-primary/15 shadow-[0_0_28px_-8px_oklch(0.75_0.18_55)]" :
                     isDone ? "border-accent/40 bg-accent/10" :
                     "border-white/10 bg-white/5")
                  }
                >
                  <div className={"font-display text-xs font-black " + (isBig ? "text-primary" : "")}>D{d.day}</div>
                  <div className="text-[10px] leading-tight">{locale === "ar" ? d.label_ar : d.label_en}</div>
                </div>
              );
            })}
          </div>

          <button
            onClick={claim}
            disabled={!state?.can_claim || claiming}
            className="glow-orange mt-6 w-full rounded-xl bg-primary px-5 py-4 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40"
          >
            {state?.can_claim ? (claiming ? "…" : t("claimToday")) : t("claimedToday")}
          </button>

          {lastReward && (
            <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-4 text-center text-sm">
              {lastReward.souls ? <>+{lastReward.souls} ✦{" "}</> : null}
              {lastReward.pack ? <span className="text-primary">+ {lastReward.pack} pack</span> : null}
            </div>
          )}
        </section>
      </main>
    </>
  );
}