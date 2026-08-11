import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { getMyProfileFull, setAvatar, setFavorite, type ProfileFull } from "@/lib/progression";
import { fetchMyCollection } from "@/lib/packs";
import { characters } from "@/data/characters";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { XPBar } from "@/components/XPBar";
import { AvatarPicker } from "@/components/AvatarPicker";
import { NameFrame, NAME_FRAMES } from "@/components/NameFrame";
import { fetchMyInventory, equipItem, type InventoryItem } from "@/lib/store";
import { getMyReferral, referralLink, type ReferralState } from "@/lib/referrals";

export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({
    meta: [
      { title: "My Profile — Bleach Arena" },
      { name: "description", content: "Your player profile: level, achievements and stats." },
      { property: "og:title", content: "Bleach Arena — My Profile" },
      { property: "og:description", content: "Track your progression across every mode." },
    ],
  }),
  component: MyProfilePage,
});

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString(); } catch { return "—"; }
}
function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return `${h}h ${m}m`;
}

function MyProfilePage() {
  const { t, locale } = useI18n();
  const [p, setP] = useState<ProfileFull | null>(null);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [pickerMode, setPickerMode] = useState<"avatar" | "favorite" | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [referral, setReferral] = useState<ReferralState | null>(null);
  const [copied, setCopied] = useState(false);
  const [equipping, setEquipping] = useState(false);

  const load = async () => {
    const [prof, coll, inv, ref] = await Promise.all([
      getMyProfileFull(), fetchMyCollection(), fetchMyInventory(), getMyReferral(),
    ]);
    setP(prof);
    setOwnedIds(new Set(coll.map((r) => r.characterId)));
    setInventory(inv);
    setReferral(ref);
  };
  useEffect(() => { load(); }, []);

  const fav = useMemo(
    () => (p?.favorite_character_id ? characters.find((c) => c.id === p.favorite_character_id) : null),
    [p?.favorite_character_id],
  );

  const completion = p && p.collection_total > 0
    ? Math.round((p.collection_owned / p.collection_total) * 100) : 0;

  const ownedFrames = useMemo(
    () => inventory.filter((i) => i.kind === "name_frame" && NAME_FRAMES[i.itemId]),
    [inventory],
  );

  const applyFrame = async (id: string | null) => {
    setEquipping(true);
    await equipItem("name_frame", id);
    setEquipping(false);
    load();
  };

  if (!p) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-4xl p-8 text-center text-sm text-muted-foreground">{t("loading")}</main>
      </>
    );
  }

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <header className="rounded-3xl border border-white/10 bg-card/60 p-6 backdrop-blur-xl" style={{ animation: "card-in 0.4s ease-out both" }}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <button onClick={() => setPickerMode("avatar")} className="group relative">
              <PlayerAvatar characterId={p.avatar_character_id} frame={p.profile_frame} size={96} fallback={(p.username ?? "?")[0]?.toUpperCase()} />
              <span className="absolute inset-x-0 -bottom-1 rounded-md bg-black/70 py-0.5 text-center text-[9px] uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                {t("changeAvatar")}
              </span>
            </button>
            <div className="min-w-0 flex-1 text-center sm:text-start">
              <NameFrame frame={p.name_frame}>
                <span className="font-display text-3xl font-black" style={p.username_color ? { color: p.username_color } : undefined}>
                  {p.username ?? "—"}
                </span>
              </NameFrame>
              {p.title && (
                <div className="mt-1 text-xs uppercase tracking-widest text-accent">{p.title}</div>
              )}
              <div className="mt-3 max-w-md">
                <XPBar level={p.level} xp={p.xp} xpToNext={p.xp_to_next} />
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("memberSince")} {fmtDate(p.created_at)}
              </div>
            </div>
          </div>
        </header>

        {/* Key stats grid */}
        <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={t("collectionCompletion")} value={`${completion}%`} sub={`${p.collection_owned}/${p.collection_total}`} />
          <Stat label={t("currentRivalRank")} value={p.rival_rating} sub={`${p.rival_wins}W · ${p.rival_losses}L`} />
          <Stat label={t("highestRivalRank")} value={p.highest_rival_rating} />
          <Stat label={t("bestDraftScore")} value={p.best_draft_score.toFixed?.(1) ?? p.best_draft_score} />
          <Stat label={t("bleachdleBestStreakLabel")} value={p.bleachdle_best_streak} />
          <Stat label={t("draftsPlayed")} value={p.drafts_played} />
          <Stat label={t("packsOpenedStat")} value={p.packs_opened} />
          <Stat label={t("totalSoulsEarned")} value={p.total_souls_earned} />
        </section>

        {/* Favorite */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-black">{t("favoriteCharacter")}</h2>
            <button
              onClick={() => setPickerMode("favorite")}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold"
            >
              {t("setFavorite")}
            </button>
          </div>
          {fav ? (
            <div className="flex items-center gap-3">
              {fav.image && <img src={fav.image} alt="" className="h-16 w-16 rounded-lg object-cover" />}
              <div>
                <div className="font-display text-lg font-black">{fav.name[locale]}</div>
                <div className="text-xs text-muted-foreground">#{fav.overall}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("none")}</p>
          )}
        </section>

        {/* Recent achievements */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur">
          <h2 className="mb-3 font-display text-lg font-black">{t("nameFrame")}</h2>
          {ownedFrames.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("none")}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ownedFrames.map((f) => {
                const active = p.name_frame === f.itemId;
                return (
                  <button key={f.itemId} disabled={equipping}
                    onClick={() => applyFrame(active ? null : f.itemId)}
                    className={`rounded-xl border p-2 transition-colors disabled:opacity-50 ${
                      active ? "border-primary/60 bg-primary/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}>
                    <NameFrame frame={f.itemId}>
                      <span className="font-display text-sm font-bold">{p.username ?? "—"}</span>
                    </NameFrame>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                      {active ? t("unequip") : t("equip")}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {referral && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur">
            <h2 className="mb-3 font-display text-lg font-black">{t("inviteFriends")}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
                {referralLink(referral.code)}
              </code>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(referralLink(referral.code));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  } catch { /* ignore */ }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground">
                {copied ? t("copied") : t("copyLink")}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat label={t("referralsCount")} value={referral.total} />
              <Stat label={t("referralSoulsEarned")} value={referral.soulsEarned} />
            </div>
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-black">{t("recentAchievements")}</h2>
            <Link to="/achievements" className="text-xs text-primary hover:underline">{t("view")}</Link>
          </div>
          {p.recent_achievements.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <ul className="space-y-2">
              {p.recent_achievements.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  <span>{locale === "ar" ? a.name_ar : a.name_en}</span>
                  <span className="text-[10px] uppercase tracking-widest text-accent">{a.rarity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/levels" className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground">{t("levels")}</Link>
          <Link to="/achievements" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest">{t("achievements")}</Link>
          <Link to="/daily" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest">{t("daily")}</Link>
          <Link to="/settings" className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest">{t("settings")}</Link>
        </div>
      </main>

      {pickerMode && (
        <AvatarPicker
          ownedIds={ownedIds}
          currentId={pickerMode === "avatar" ? p.avatar_character_id : p.favorite_character_id}
          onClose={() => setPickerMode(null)}
          onSelect={async (id) => {
            if (pickerMode === "avatar") await setAvatar(id);
            else await setFavorite(id);
            setPickerMode(null);
            load();
          }}
        />
      )}
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