import { msUntilServerMidnight } from "@/lib/server-time";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import {
  claimMission,
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
  getMyMissions,
  MISSION_ICON,
  missionName,
  rerollMission,
  type Mission,
  type MissionEvent,
} from "@/lib/missions";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/missions")({
  head: () => ({
    meta: [
      { title: "Daily Missions — Bleach Arena" },
      { name: "description", content: "Complete daily objectives to earn Souls and grow your collection." },
      { property: "og:title", content: "Bleach Arena — Daily Missions" },
      { property: "og:description", content: "Fresh objectives every 24 hours. Rack up Souls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionsPage,
});

function useResetCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return useMemo(() => {
    const ms = msUntilServerMidnight(now);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return { h, m };
  }, [now]);
}

function MissionsPage() {
  const { t, locale } = useI18n();
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { refresh: refreshSouls } = useSouls();
  const reset = useResetCountdown();

  const load = async () => setMissions(await getMyMissions());
  useEffect(() => { load(); }, []);

  const rerollsLeft = missions?.[0]?.rerolls_left ?? 0;

  const doClaim = async (id: string) => {
    if (busy) return;
    setBusy(id);
    const res = await claimMission(id);
    setBusy(null);
    if (res.ok) {
      play("rare");
      refreshSouls();
      load();
    } else {
      play("skip");
    }
  };

  const doReroll = async (id: string) => {
    if (busy) return;
    setBusy(id);
    const res = await rerollMission(id);
    setBusy(null);
    if (res.ok) { play("reveal"); load(); } else { play("skip"); }
  };

  return (
    <>
      <ReiatsuBackground count={16} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">{t("missionsSub")}</p>
            <h1 className="font-display text-3xl font-black tracking-tight sm:text-4xl">
              {t("dailyMissions")}
            </h1>
          </div>
          <div className="rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
            {t("resetsIn")}{" "}
            <span className="font-mono text-foreground">
              {reset.h}
              {t("hours")} {reset.m}
              {t("minutes")}
            </span>
          </div>
        </header>

        <p className="mb-3 text-sm text-muted-foreground">{t("missionsDesc")}</p>
        <p className="mb-6 text-xs text-muted-foreground">
          {locale === "ar"
            ? `٤ تحديات عشوائية كل يوم — إعادة توزيع متبقية: ${rerollsLeft}`
            : `4 random challenges each day — rerolls left: ${rerollsLeft}`}
        </p>

        <ul className="space-y-3">
          {(missions ?? []).map((m) => {
            const id = m.mission_id;
            const ev = m.event_key as MissionEvent;
            const pct = Math.min(100, Math.round((m.progress / Math.max(1, m.target)) * 100));
            const complete = m.progress >= m.target;
            const label = missionName(m, locale);
            const diff = m.difficulty ?? "easy";
            return (
              <li
                key={id}
                className="rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-2xl"
                    aria-hidden
                  >
                    {MISSION_ICON[ev] ?? "✦"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="font-display text-base font-bold">{label}</h2>
                      <span
                        className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rtl:tracking-normal"
                        style={{ color: DIFFICULTY_COLOR[diff], borderColor: `${DIFFICULTY_COLOR[diff]}55` }}
                      >
                        {DIFFICULTY_LABEL[diff][locale]}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        +{m.reward_souls} ✦
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted/40">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: complete
                            ? "oklch(0.75 0.18 145)"
                            : "oklch(0.7 0.19 55)",
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {m.progress} / {m.target}
                      </span>
                      {m.claimed ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                          {t("claimed")}
                        </span>
                      ) : complete ? (
                        <button
                          type="button"
                          onClick={() => doClaim(id)}
                          disabled={busy === id}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:opacity-60"
                        >
                          {busy === id ? "…" : t("claim")}
                        </button>
                      ) : rerollsLeft > 0 ? (
                        <button
                          type="button"
                          onClick={() => doReroll(id)}
                          disabled={busy === id}
                          className="rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground disabled:opacity-60"
                        >
                          {busy === id ? "…" : locale === "ar" ? "إعادة توزيع ↻" : "Reroll ↻"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          {missions && missions.length === 0 ? (
            <li className="rounded-2xl border border-border/60 bg-card/70 p-6 text-center text-sm text-muted-foreground">
              —
            </li>
          ) : null}
        </ul>
      </main>
    </>
  );
}