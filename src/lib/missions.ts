import { supabase } from "@/integrations/supabase/client";

export type MissionId = "draft_play" | "pack_open" | "rival_win" | "quiz_correct";

export interface Mission {
  mission_id: MissionId;
  target: number;
  reward_souls: number;
  progress: number;
  claimed: boolean;
  sort_order: number;
}

export const MISSION_LABEL: Record<MissionId, { en: string; ar: string }> = {
  draft_play: { en: "Complete a Draft", ar: "أكمل عملية اختيار" },
  pack_open: { en: "Open 2 Packs", ar: "افتح حزمتين" },
  rival_win: { en: "Win a Rival Battle", ar: "فز في مبارزة" },
  quiz_correct: { en: "Answer 3 Quotes Correctly", ar: "أجب على ٣ اقتباسات بشكل صحيح" },
};

export const MISSION_ICON: Record<MissionId, string> = {
  draft_play: "⚡",
  pack_open: "🎴",
  rival_win: "⚔",
  quiz_correct: "💬",
};

export async function getMyMissions(): Promise<Mission[]> {
  const { data, error } = await supabase.rpc("get_my_missions");
  if (error || !data) return [];
  return data as Mission[];
}

export async function trackMission(id: MissionId, increment = 1): Promise<void> {
  try {
    await supabase.rpc("track_mission", { p_mission_id: id, p_increment: increment });
  } catch {
    // silent — missions are optional side-effects
  }
}

export async function claimMission(id: MissionId): Promise<{ ok: boolean; souls?: number; error?: string }> {
  const { data, error } = await supabase.rpc("claim_mission", { p_mission_id: id });
  if (error) return { ok: false, error: error.message };
  const d = data as { ok: boolean; souls_awarded?: number; error?: string };
  return { ok: d.ok, souls: d.souls_awarded, error: d.error };
}