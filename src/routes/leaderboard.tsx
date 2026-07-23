import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { useI18n } from "@/lib/i18n";
import { currentWeekLabel, fetchLeaderboard, getCurrentUserId, getMyProfile } from "@/lib/leaderboard";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Weekly Leaderboard — Bleach Arena" },
      { name: "description", content: "Top Bleach Arena players this week. Scores reset weekly." },
      { property: "og:title", content: "Bleach Arena — Weekly Leaderboard" },
      { property: "og:description", content: "Top players this week." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { t, locale } = useI18n();
  const [myId, setMyId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      setMyId(await getCurrentUserId());
      const p = await getMyProfile();
      setMyUsername(p?.username ?? null);
    })();
  }, []);

  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchLeaderboard(100),
    staleTime: 30_000,
  });

  return (
    <>
      <ReiatsuBackground count={22} />
      <SiteHeader />
      <UsernamePrompt
        open={editing}
        initial={myUsername ?? ""}
        onClose={() => setEditing(false)}
        onSaved={(u) => { setMyUsername(u); setEditing(false); refetch(); }}
      />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        <div style={{ animation: "card-in 0.5s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("resetsWeekly")}</span>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">{t("weeklyLeaderboard")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("weekOf")} {currentWeekLabel(locale)}</p>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("username")}</span>
            <p className="mt-0.5 truncate font-semibold text-foreground">{myUsername ?? "—"}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
          >
            {t("changeUsername")}
          </button>
        </div>

        <ol className="mt-6 space-y-2">
          {isLoading && (
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-muted-foreground">{t("loadingBoard")}</li>
          )}
          {!isLoading && (rows?.length ?? 0) === 0 && (
            <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-muted-foreground">{t("emptyBoard")}</li>
          )}
          {rows?.map((r, i) => {
            const isMe = myId && r.user_id === myId;
            return (
              <li
                key={r.user_id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-md transition-colors ${
                  isMe ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/[0.03]"
                }`}
                style={{ animation: `card-in 0.4s ${Math.min(i, 10) * 0.03}s ease-out both` }}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg font-display text-sm font-black ${
                    r.rank === 1 ? "bg-primary text-primary-foreground"
                    : r.rank === 2 ? "bg-accent/80 text-background"
                    : r.rank === 3 ? "bg-white/20 text-foreground"
                    : "bg-white/5 text-muted-foreground"
                  }`}
                >
                  {r.rank}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {r.username}
                  {isMe && (
                    <span className="ms-2 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">{t("you")}</span>
                  )}
                </span>
                <span className="font-display text-lg font-black text-glow-orange">{r.score.toFixed(1)}</span>
              </li>
            );
          })}
        </ol>
      </main>
    </>
  );
}