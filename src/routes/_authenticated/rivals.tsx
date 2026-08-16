import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { characters } from "@/data/characters";
import { RARITY_COLOR } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import { fetchMyCollection } from "@/lib/packs";
import { trackMission } from "@/lib/missions";
import { addXp, bumpProfileStats, ratingTierUnlocks, trackAchievement, XP } from "@/lib/progression";
import {
  battleRival,
  deleteRivalTeam,
  fetchMyRecentBattles,
  fetchRivalLeaderboard,
  fetchRivalWeeklyLeaderboard,
  findRivalOpponent,
  getMyRivalTeams,
  getMyRivalStats,
  setMyRivalTeam,
  RIVAL_DAILY_ATTACKS,
  RIVAL_MAX_TEAMS,
  RIVAL_TEAM_STAMINA,
  type RivalBattleResult,
  type RivalOpponent,
} from "@/lib/rivals";
import { getCurrentUserId } from "@/lib/leaderboard";
import { play as playSound } from "@/lib/sound";
import { NameFrame } from "@/components/NameFrame";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export const Route = createFileRoute("/_authenticated/rivals")({
  head: () => ({
    meta: [
      { title: "Rivals — Bleach Arena" },
      { name: "description", content: "Build your rival team and battle other players for ranking and Souls." },
      { property: "og:title", content: "Bleach Arena — Rivals" },
      { property: "og:description", content: "Duel other Soul Reapers for glory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RivalsPage,
});

const characterById = new Map(characters.map((c) => [c.id, c]));

const L = {
  squads: { en: "Squads", ar: "الفرق" },
  squad: { en: "Squad", ar: "فرقة" },
  stamina: { en: "Stamina", ar: "الطاقة" },
  attacksLeft: { en: "Attacks left", ar: "الهجمات المتبقية" },
  defenses: { en: "Defenses today", ar: "الدفاعات اليوم" },
  allTime: { en: "All-time", ar: "الكل" },
  weekly: { en: "Weekly", ar: "أسبوعي" },
  weeklyPoints: { en: "Weekly points", ar: "نقاط الأسبوع" },
  clear: { en: "Clear squad", ar: "مسح الفرقة" },
  empty: { en: "Empty", ar: "فارغة" },
  noStamina: { en: "This squad is out of stamina today.", ar: "لا توجد طاقة لهذه الفرقة اليوم." },
  shielded: { en: "That defender already hit the daily defense cap.", ar: "وصل المدافع إلى الحد اليومي للدفاعات." },
  invalidTeam: { en: "Pick a valid squad.", ar: "اختر فرقة صالحة." },
} as const;

function RivalsPage() {
  const { t, locale } = useI18n();
  const qc = useQueryClient();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [myId, setMyId] = useState<string | null>(null);
  const [teamIndex, setTeamIndex] = useState(0);
  const [boardMode, setBoardMode] = useState<"all" | "week">("all");
  const [teamDraft, setTeamDraft] = useState<string[]>([]);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<RivalOpponent | null>(null);
  const [battle, setBattle] = useState<RivalBattleResult | null>(null);
  const [battling, setBattling] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => { getCurrentUserId().then(setMyId); }, []);

  const { data: stats } = useQuery({ queryKey: ["rival-stats"], queryFn: getMyRivalStats });
  const { data: collection } = useQuery({ queryKey: ["collection"], queryFn: fetchMyCollection });
  const { data: teams } = useQuery({ queryKey: ["rival-teams"], queryFn: getMyRivalTeams });
  const { data: board } = useQuery({ queryKey: ["rival-board"], queryFn: () => fetchRivalLeaderboard(50), staleTime: 30_000 });
  const { data: weekBoard } = useQuery({ queryKey: ["rival-board-week"], queryFn: () => fetchRivalWeeklyLeaderboard(50), staleTime: 30_000 });
  const { data: recent } = useQuery({ queryKey: ["rival-recent"], queryFn: () => fetchMyRecentBattles(10) });

  const activeTeam = useMemo(
    () => (teams ?? []).find((tm) => tm.index === teamIndex) ?? null,
    [teams, teamIndex],
  );
  const savedTeam = activeTeam?.slots ?? [];

  useEffect(() => {
    setTeamDraft(activeTeam?.slots ?? []);
  }, [activeTeam]);

  const ownedIds = useMemo(() => new Set((collection ?? []).map((r) => r.characterId)), [collection]);
  const ownedCharacters = useMemo(
    () => characters.filter((c) => ownedIds.has(c.id)).sort((a, b) => b.overall - a.overall),
    [ownedIds],
  );

  const toggleSlot = (id: string) => {
    playSound("tap");
    setTeamDraft((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  };

  const saveTeam = async () => {
    setSaveMsg(null);
    const res = await setMyRivalTeam(teamDraft, teamIndex);
    if (!res.ok) {
      playSound("error");
      setSaveMsg(res.error ?? "error");
      return;
    }
    playSound("success");
    setSaveMsg("saved");
    await qc.invalidateQueries({ queryKey: ["rival-teams"] });
  };

  const clearTeam = async () => {
    const res = await deleteRivalTeam(teamIndex);
    if (!res.ok) { playSound("error"); setSaveMsg(res.error ?? "error"); return; }
    playSound("tap");
    setTeamDraft([]);
    setOpponent(null);
    await qc.invalidateQueries({ queryKey: ["rival-teams"] });
  };

  const findOpponent = async () => {
    setSearching(true);
    setBattle(null);
    playSound("tap");
    const res = await findRivalOpponent(teamIndex);
    setSearching(false);
    if ("error" in res) {
      playSound("error");
      setOpponent(null);
      setSaveMsg(res.error);
      return;
    }
    setOpponent(res);
    playSound("reveal");
  };

  const doBattle = async () => {
    if (!opponent) return;
    setBattling(true);
    setBattle(null);
    playSound("pick");
    const res = await battleRival(opponent.opponentId, teamIndex);
    setBattling(false);
    if (!res.ok) {
      playSound("error");
      setSaveMsg(res.error ?? "error");
      return;
    }
    setBattle(res);
    const won = res.winnerId === myId;
    const draw = res.winnerId === null;
    trackMission("rival_play", 1);
    if (won) { playSound("rare"); trackMission("rival_win", 1); }
    else if (draw) playSound("reveal");
    else playSound("error");
    // Progression
    const xp = won ? XP.rivalWin : draw ? XP.rivalDraw : XP.rivalLoss;
    const newRating = res.newRating ?? 1000;
    const tierIds = ratingTierUnlocks(newRating);
    await Promise.all([
      addXp(xp, "rival"),
      bumpProfileStats({ highest_rival_rating: newRating }),
      won ? trackAchievement("rival_first", 1) : Promise.resolve(),
      won ? trackAchievement("rival_10", 1) : Promise.resolve(),
      won ? trackAchievement("rival_100", 1) : Promise.resolve(),
      won ? trackAchievement("rival_500", 1) : Promise.resolve(),
      ...tierIds.map((id) => trackAchievement(id, 1)),
    ]);
    qc.invalidateQueries({ queryKey: ["rival-stats"] });
    qc.invalidateQueries({ queryKey: ["rival-teams"] });
    qc.invalidateQueries({ queryKey: ["rival-board"] });
    qc.invalidateQueries({ queryKey: ["rival-board-week"] });
    qc.invalidateQueries({ queryKey: ["rival-recent"] });
    qc.invalidateQueries({ queryKey: ["souls"] });
  };

  const teamReady = teamDraft.length === 5;
  const savedReady = savedTeam.length === 5;
  const staminaLeft = activeTeam?.staminaLeft ?? RIVAL_TEAM_STAMINA;

  const errorLabel = (err: string): string => {
    switch (err) {
      case "need_team": return t("rivalNeedTeam");
      case "opponent_no_team": return t("rivalNoOpponent");
      case "no_opponent": return t("rivalNoOpponent");
      case "daily_limit": return t("rivalDailyReached");
      case "already_fought_today": return t("rivalAlreadyFought");
      case "need_five": return t("rivalNeedFive");
      case "duplicates": return t("rivalDuplicates");
      case "not_owned": return t("rivalNotOwned");
      case "no_stamina": return tx("noStamina");
      case "defender_shielded": return tx("shielded");
      case "invalid_team": return tx("invalidTeam");
      case "saved": return t("saved");
      default: return err;
    }
  };

  return (
    <>
      <SceneBackground scene="social" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <div style={{ animation: "card-in 0.5s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("rivalsSub")}</span>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">{t("rivals")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("rivalsDesc")}</p>
        </div>

        {/* Stats bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCell label={t("rivalRating")} value={stats?.rating ?? "—"} accent />
          <StatCell label={t("rivalWins")} value={stats?.wins ?? 0} />
          <StatCell label={t("rivalLosses")} value={stats?.losses ?? 0} />
          <StatCell label={t("rivalBattlesLeft")} value={`${stats?.battlesLeft ?? 10} / 10`} />
        </div>

        {/* Team builder */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-black">{t("rivalTeamTitle")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t("rivalTeamDesc")}</p>
            </div>
            <button
              onClick={saveTeam}
              disabled={!teamReady}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40"
            >
              {t("save")}
            </button>
          </div>

          {/* Selected slots */}
          <div className="mb-5 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const id = teamDraft[i];
              const c = id ? characterById.get(id) : null;
              return (
                <div
                  key={i}
                  className={c ? "" : "aspect-[1128/1394] overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.03]"}
                >
                  {c ? (
                    <button onClick={() => toggleSlot(c.id)} className="block w-full">
                      <CharacterCard character={c} interactive={false} className="w-full" />
                    </button>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground/40">+</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Owned pool */}
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("rivalPickFromCollection")}</p>
          {ownedCharacters.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
              {t("rivalEmptyCollection")}{" "}
              <Link to="/packs" className="text-primary underline underline-offset-4">{t("packs")}</Link>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
              {ownedCharacters.map((c) => {
                const active = teamDraft.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleSlot(c.id)}
                    className={
                      "group relative block overflow-hidden rounded-lg border transition-all " +
                      (active
                        ? "border-primary/80 ring-2 ring-primary/40"
                        : "border-white/10 hover:border-white/30")
                    }
                    style={{ boxShadow: `0 0 14px -12px ${RARITY_COLOR[c.rarity]}` }}
                  >
                    <CharacterCard character={c} interactive={false} className="w-full" />
                    {active && (
                      <span className="absolute inset-x-0 bottom-0 bg-primary/80 py-0.5 text-center font-display text-[10px] font-black text-primary-foreground">
                        ✓ {t("picked")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {saveMsg && (
            <p className={"mt-3 text-xs " + (saveMsg === "saved" ? "text-accent" : "text-primary")}>
              {errorLabel(saveMsg)}
            </p>
          )}
        </section>

        {/* Battle */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-black">{t("rivalBattle")}</h2>
            <button
              onClick={findOpponent}
              disabled={!savedReady || searching || (stats?.battlesLeft ?? 0) <= 0}
              className="rounded-lg border border-primary/60 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary disabled:opacity-40"
            >
              {searching ? t("searching") : t("findOpponent")}
            </button>
          </div>

          {!savedReady && (
            <p className="text-xs text-muted-foreground">{t("rivalSaveFirst")}</p>
          )}

          {opponent && (
            <div className="mt-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("opponent")}</p>
              <p className="mt-1 font-display text-lg font-black">{opponent.username}</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {opponent.team.map((id) => {
                  const c = characterById.get(id);
                  if (!c) return <div key={id} className="aspect-[1128/1394] rounded-lg border border-white/10 bg-white/5" />;
                  return (
                    <div key={id} className="relative">
                      <CharacterCard character={c} interactive={false} className="w-full" />
                    </div>
                  );
                })}
              </div>
              <button
                onClick={doBattle}
                disabled={battling}
                className="glow-orange mt-4 w-full rounded-xl bg-primary px-4 py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40"
              >
                {battling ? t("battling") : t("beginBattle")}
              </button>
            </div>
          )}

          {battle && battle.ok && (
            <div
              className="mt-5 rounded-xl border border-white/10 bg-background/60 p-5 text-center"
              style={{ animation: "card-in 0.5s ease-out both" }}
            >
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("result")}</p>
              <p
                className={
                  "mt-1 font-display text-3xl font-black " +
                  (battle.winnerId === myId
                    ? "text-glow-orange"
                    : battle.winnerId === null
                      ? "text-accent"
                      : "text-muted-foreground")
                }
              >
                {battle.winnerId === myId ? t("victory") : battle.winnerId === null ? t("draw") : t("defeat")}
              </p>
              <p className="mt-3 font-display text-2xl">
                <span className="text-primary">{battle.attackerScore?.toFixed(1)}</span>
                <span className="mx-3 text-muted-foreground">vs</span>
                <span>{battle.defenderScore?.toFixed(1)}</span>
              </p>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs">
                <span className={battle.attackerDelta! >= 0 ? "text-accent" : "text-primary"}>
                  {battle.attackerDelta! >= 0 ? "+" : ""}{battle.attackerDelta} {t("rivalRating")}
                </span>
                <span className="text-accent">+{battle.soulsAwarded} ✦</span>
              </div>
            </div>
          )}
        </section>

        {/* Recent battles */}
        {recent && recent.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-display text-lg font-black">{t("rivalRecent")}</h2>
            <ol className="space-y-2">
              {recent.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="truncate font-semibold">{b.opponent_name ?? "—"}</span>
                    <span className="ms-2 text-xs text-muted-foreground">
                      {b.my_score.toFixed(1)} vs {b.opp_score.toFixed(1)}
                    </span>
                  </div>
                  <span
                    className={
                      "rounded-md px-2 py-0.5 font-display text-xs font-black " +
                      (b.i_won
                        ? "bg-primary/20 text-primary"
                        : b.i_lost
                          ? "bg-white/10 text-muted-foreground"
                          : "bg-accent/20 text-accent")
                    }
                  >
                    {b.i_won ? "W" : b.i_lost ? "L" : "D"} {b.my_delta >= 0 ? "+" : ""}{b.my_delta}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Rival leaderboard */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-black">{t("rivalTopFighters")}</h2>
          <ol className="space-y-2">
            {(board ?? []).slice(0, 20).map((r) => {
              const isMe = myId && r.user_id === myId;
              return (
                <li
                  key={r.user_id}
                  className={
                    "flex items-center gap-3 rounded-xl border px-4 py-3 " +
                    (isMe ? "border-primary/50 bg-primary/10" : "border-white/10 bg-white/[0.03]")
                  }
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-display text-sm font-black">
                    {r.rank}
                  </span>
                  <PlayerAvatar
                    characterId={r.avatar_character_id}
                    size={30}
                    fallback={(r.username ?? "?")[0]?.toUpperCase()}
                  />
                  <span className="min-w-0 flex-1 font-semibold">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: r.user_id }}
                      className="inline-flex max-w-full items-center hover:opacity-90"
                    >
                      <NameFrame frame={r.name_frame}>
                        <span className="truncate" style={r.username_color ? { color: r.username_color } : undefined}>
                          {r.username}
                        </span>
                      </NameFrame>
                    </Link>
                    {isMe && (
                      <span className="ms-2 rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-primary">{t("you")}</span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{r.wins}W · {r.losses}L</span>
                  <span className="font-display text-lg font-black text-glow-orange">{r.rating}</span>
                </li>
              );
            })}
            {(board?.length ?? 0) === 0 && (
              <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-muted-foreground">
                {t("rivalEmptyBoard")}
              </li>
            )}
          </ol>
        </section>

        {/* locale marker to satisfy usage */}
        <span className="sr-only">{locale}</span>
      </main>
    </>
  );
}

function StatCell({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
      <p className={"mt-1 font-display text-2xl font-black " + (accent ? "text-glow-orange" : "text-foreground")}>{value}</p>
    </div>
  );
}