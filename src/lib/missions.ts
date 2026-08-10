import { supabase } from "@/integrations/supabase/client";

/**
 * Mission *events* are what gameplay reports. The daily challenge bank lives in
 * the database, so new challenges can be added there without shipping code:
 * every mission definition points at one of these event keys.
 */
export type MissionEvent =
  | "draft_play"
  | "draft_rank"
  | "draft_mythic"
  | "pack_open"
  | "pack_legendary"
  | "rival_play"
  | "rival_win"
  | "quiz_correct"
  | "bleachdle_play"
  | "bleachdle_win"
  | "duel_play"
  | "duel_win"
  | "duel_ultimate"
  | "personality_quiz"
  | "login_claim"
  | "collect_new";

/** Back-compat alias — call sites pass event keys. */
export type MissionId = MissionEvent;

export type MissionDifficulty = "easy" | "medium" | "hard";

export interface Mission {
  mission_id: string;
  target: number;
  reward_souls: number;
  progress: number;
  claimed: boolean;
  sort_order: number;
  difficulty: MissionDifficulty;
  name_en: string;
  name_ar: string;
  event_key: MissionEvent;
  rerolls_left: number;
}

export const MISSION_ICON: Record<MissionEvent, string> = {
  draft_play: "⚡",
  draft_rank: "🏅",
  draft_mythic: "🔥",
  pack_open: "🎴",
  pack_legendary: "✨",
  rival_play: "🛡",
  rival_win: "⚔",
  quiz_correct: "💬",
  bleachdle_play: "🔎",
  bleachdle_win: "🎯",
  duel_play: "🀄",
  duel_win: "👑",
  duel_ultimate: "🗡",
  personality_quiz: "🧭",
  login_claim: "📅",
  collect_new: "📖",
};

export const DIFFICULTY_COLOR: Record<MissionDifficulty, string> = {
  easy: "oklch(0.78 0.16 155)",
  medium: "oklch(0.78 0.17 75)",
  hard: "oklch(0.68 0.21 20)",
};

export const DIFFICULTY_LABEL: Record<MissionDifficulty, { en: string; ar: string }> = {
  easy: { en: "Easy", ar: "سهل" },
  medium: { en: "Medium", ar: "متوسط" },
  hard: { en: "Hard", ar: "صعب" },
};

export function missionName(m: Mission, locale: "en" | "ar"): string {
  return (locale === "ar" ? m.name_ar : m.name_en) || m.mission_id;
}

export async function getMyMissions(): Promise<Mission[]> {
  const { data, error } = await supabase.rpc("get_my_missions");
  if (error || !data) return [];
  return data as unknown as Mission[];
}

/** Report gameplay progress. Every active mission on that event advances. */
export async function trackMission(event: MissionEvent, increment = 1): Promise<void> {
  try {
    await supabase.rpc("track_mission", { p_mission_id: event, p_increment: increment });
  } catch {
    // silent — missions are optional side-effects
  }
}

/** One free reroll per day, on any unclaimed mission. */
export async function rerollMission(missionId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("reroll_mission", { p_mission_id: missionId });
  if (error) return { ok: false, error: error.message };
  const d = data as { ok: boolean; error?: string };
  return { ok: d.ok, error: d.error };
}

export async function claimMission(id: string): Promise<{ ok: boolean; souls?: number; error?: string }> {
  const { data, error } = await supabase.rpc("claim_mission", { p_mission_id: id });
  if (error) return { ok: false, error: error.message };
  const d = data as { ok: boolean; souls_awarded?: number; error?: string };
  return { ok: d.ok, souls: d.souls_awarded, error: d.error };
}