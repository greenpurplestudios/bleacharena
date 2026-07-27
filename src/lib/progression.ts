import { supabase } from "@/integrations/supabase/client";

// Untyped RPC helper — new functions may not be in generated types yet.
// Using any here is intentional and localized.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

export function xpForLevel(level: number): number {
  const n = Math.max(1, level);
  return 50 * n * (n + 1);
}

// XP amounts per activity
export const XP = {
  draft: (score: number) => Math.round(20 + Math.max(0, score) / 2), // 20..70
  packOpen: 25,
  rivalWin: 60,
  rivalDraw: 25,
  rivalLoss: 15,
  bleachdleWin: (guesses: number) => Math.max(20, 60 - guesses * 5),
  bleachdleLose: 10,
  missionClaim: 30,
  purchase: 5,
};

// ---------- Event bus ----------
export interface AchievementUnlock {
  id: string;
  name_en: string;
  name_ar: string;
  rarity: string;
  xp_reward: number;
  soul_reward: number;
}
export interface ProgressionEvent {
  xpGained?: number;
  level?: number;
  prevLevel?: number;
  leveledUp?: boolean;
  unlockedLevels?: number[];
  achievements?: AchievementUnlock[];
}
type Listener = (e: ProgressionEvent) => void;
const listeners = new Set<Listener>();
export function onProgression(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
function emit(e: ProgressionEvent) {
  listeners.forEach((l) => {
    try { l(e); } catch { /* noop */ }
  });
}

// ---------- XP ----------
export async function addXp(amount: number, source = "generic"): Promise<void> {
  if (!amount || amount <= 0) return;
  const { data } = await sb.rpc("add_xp", { p_amount: amount, p_source: source });
  const d = (data ?? {}) as {
    ok?: boolean;
    level?: number;
    prev_level?: number;
    leveled_up?: boolean;
    unlocks?: number[];
  };
  if (d && d.ok) {
    emit({
      xpGained: amount,
      level: d.level,
      prevLevel: d.prev_level,
      leveledUp: !!d.leveled_up,
      unlockedLevels: Array.isArray(d.unlocks) ? d.unlocks : [],
    });
  }
}

// ---------- Achievements ----------
export async function trackAchievement(
  id: string,
  progress = 1,
  absolute = false,
): Promise<void> {
  try {
    const { data } = await sb.rpc("track_achievement", {
      p_id: id, p_progress: progress, p_absolute: absolute,
    });
    const d = (data ?? {}) as { ok?: boolean; unlocked?: boolean; achievement?: AchievementUnlock };
    if (d?.ok && d.unlocked && d.achievement) {
      emit({ achievements: [d.achievement] });
    }
  } catch { /* silent */ }
}

// Fire many at once (parallel)
export function trackMany(items: Array<{ id: string; progress?: number; absolute?: boolean }>) {
  return Promise.all(items.map((i) => trackAchievement(i.id, i.progress ?? 1, !!i.absolute)));
}

// ---------- Daily login ----------
export interface DailyLoginState {
  streak: number;
  can_claim: boolean;
  next_day: number;
  total_claims: number;
  last_claim_day: string | null;
}
export async function getDailyLoginState(): Promise<DailyLoginState | null> {
  const { data } = await sb.rpc("get_daily_login_state");
  const d = data as DailyLoginState & { ok?: boolean };
  if (!d?.ok) return null;
  return d;
}
export async function claimDailyLogin(): Promise<{
  ok: boolean; streak?: number; day_index?: number; souls?: number; pack?: string | null; error?: string;
}> {
  const { data, error } = await sb.rpc("claim_daily_login");
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false }) as {
    ok: boolean; streak?: number; day_index?: number; souls?: number; pack?: string | null; error?: string;
  };
}

export const DAILY_CALENDAR: Array<{ day: number; type: "souls" | "pack"; value: number | string; label_en: string; label_ar: string }> = [
  { day: 1, type: "souls", value: 100, label_en: "100 Souls", label_ar: "١٠٠ روح" },
  { day: 2, type: "pack", value: "bronze", label_en: "Bronze Pack", label_ar: "حزمة برونزية" },
  { day: 3, type: "souls", value: 200, label_en: "200 Souls", label_ar: "٢٠٠ روح" },
  { day: 4, type: "pack", value: "silver", label_en: "Silver Pack", label_ar: "حزمة فضية" },
  { day: 5, type: "souls", value: 300, label_en: "300 Souls", label_ar: "٣٠٠ روح" },
  { day: 6, type: "pack", value: "gold", label_en: "Gold Pack", label_ar: "حزمة ذهبية" },
  { day: 7, type: "pack", value: "legend", label_en: "Legend Pack + 500 Souls", label_ar: "حزمة أسطورية + ٥٠٠" },
];

// ---------- Profile / Levels ----------
export interface ProfileFull {
  user_id: string;
  username: string | null;
  title: string | null;
  username_color: string | null;
  avatar_character_id: string | null;
  favorite_character_id: string | null;
  profile_frame: string | null;
  profile_border: string | null;
  souls: number;
  total_souls_earned: number;
  packs_opened: number;
  drafts_played: number;
  best_draft_score: number;
  highest_rival_rating: number;
  play_seconds: number;
  created_at: string;
  level: number;
  xp: number;
  total_xp: number;
  xp_to_next: number;
  collection_owned: number;
  collection_total: number;
  rival_rating: number;
  rival_wins: number;
  rival_losses: number;
  bleachdle_best_streak: number;
  bleachdle_current_streak: number;
  recent_achievements: Array<{ id: string; name_en: string; name_ar: string; rarity: string; unlocked_at: string }>;
}

export async function getMyProfileFull(): Promise<ProfileFull | null> {
  const { data } = await sb.rpc("get_my_profile_full");
  const d = data as (ProfileFull & { ok?: boolean }) | null;
  if (!d || !d.ok) return null;
  return d;
}

export async function getPublicProfile(userId: string): Promise<ProfileFull | null> {
  const { data } = await sb.rpc("get_public_profile", { p_user_id: userId });
  const d = data as (ProfileFull & { ok?: boolean }) | null;
  if (!d || !d.ok) return null;
  return d;
}

export async function setAvatar(characterId: string | null): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await sb.rpc("set_avatar", { p_character_id: characterId });
  if (error) return { ok: false, error: error.message };
  const d = (data ?? {}) as { ok: boolean; error?: string };
  return d;
}

export async function setFavorite(characterId: string | null): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await sb.rpc("set_favorite", { p_character_id: characterId });
  if (error) return { ok: false, error: error.message };
  return (data ?? {}) as { ok: boolean; error?: string };
}

// ---------- Level rewards ----------
export interface LevelRewardRow {
  level: number;
  souls: number;
  title_item: string | null;
  color_item: string | null;
  frame_item: string | null;
  border_item: string | null;
  badge_item: string | null;
  name_en: string;
  name_ar: string;
  claimed: boolean;
  unlocked: boolean;
}
export async function getLevelRewardsState(): Promise<LevelRewardRow[]> {
  const { data, error } = await sb.rpc("get_level_rewards_state");
  if (error || !data) return [];
  return data as LevelRewardRow[];
}
export async function claimLevelReward(level: number): Promise<{ ok: boolean; error?: string; souls?: number }> {
  const { data, error } = await sb.rpc("claim_level_reward", { p_level: level });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false }) as { ok: boolean; error?: string; souls?: number };
}

// ---------- Achievements listing ----------
export interface AchievementRow {
  id: string;
  category: string;
  rarity: string;
  target: number;
  xp_reward: number;
  soul_reward: number;
  title_reward: string | null;
  name_en: string;
  name_ar: string;
  desc_en: string;
  desc_ar: string;
  sort_order: number;
  progress: number;
  unlocked_at: string | null;
}
export async function getMyAchievements(): Promise<AchievementRow[]> {
  const { data, error } = await sb.rpc("get_my_achievements");
  if (error || !data) return [];
  return data as AchievementRow[];
}

// ---------- Profile counter updates ----------
// Simple client-side counter updates. RLS allows updating own profile.
export async function bumpProfileStats(patch: Partial<{
  drafts_played: number;
  packs_opened: number;
  best_draft_score: number;
  highest_rival_rating: number;
  play_seconds: number;
}>): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  const { data: cur } = await supabase.from("profiles")
    .select("drafts_played, packs_opened, best_draft_score, highest_rival_rating, play_seconds")
    .eq("user_id", u.user.id).maybeSingle();
  if (!cur) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = cur as any;
  const next: Record<string, number> = {};
  if (patch.drafts_played) next.drafts_played = (c.drafts_played ?? 0) + patch.drafts_played;
  if (patch.packs_opened) next.packs_opened = (c.packs_opened ?? 0) + patch.packs_opened;
  if (patch.best_draft_score !== undefined) {
    next.best_draft_score = Math.max(c.best_draft_score ?? 0, patch.best_draft_score);
  }
  if (patch.highest_rival_rating !== undefined) {
    next.highest_rival_rating = Math.max(c.highest_rival_rating ?? 1000, patch.highest_rival_rating);
  }
  if (patch.play_seconds) next.play_seconds = (c.play_seconds ?? 0) + patch.play_seconds;
  if (Object.keys(next).length === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any).update(next).eq("user_id", u.user.id);
}

// Rival-rating tier helper for achievements
export function ratingTierUnlocks(rating: number): string[] {
  const ids: string[] = [];
  if (rating >= 1100) ids.push("rival_lieutenant");
  if (rating >= 1300) ids.push("rival_captain");
  if (rating >= 1500) ids.push("rival_royal_guard");
  if (rating >= 1800) ids.push("rival_soul_king");
  return ids;
}