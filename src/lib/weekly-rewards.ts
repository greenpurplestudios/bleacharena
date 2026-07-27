import { supabase } from "@/integrations/supabase/client";

export type PackTier = "bronze" | "silver" | "gold" | "ultra" | "legend";

export interface WeeklyRewardStatus {
  ok: boolean;
  season?: string;
  rank: number | null;
  score: number | null;
  souls: number;
  pack: PackTier | null;
  claimed: boolean;
  has_entry: boolean;
  error?: string;
}

export async function getMyWeeklyReward(): Promise<WeeklyRewardStatus | null> {
  const { data, error } = await supabase.rpc("get_my_weekly_reward");
  if (error || !data) return null;
  return data as unknown as WeeklyRewardStatus;
}

export async function claimWeeklyReward(): Promise<{
  ok: boolean;
  rank?: number;
  souls?: number;
  pack?: PackTier | null;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("claim_weekly_reward");
  if (error) return { ok: false, error: error.message };
  return data as unknown as { ok: boolean; rank?: number; souls?: number; pack?: PackTier | null; error?: string };
}

export const REWARD_TIERS: {
  label: { en: string; ar: string };
  souls: number;
  pack: PackTier | null;
}[] = [
  { label: { en: "#1", ar: "١" }, souls: 500, pack: "legend" },
  { label: { en: "#2 – #3", ar: "٢ – ٣" }, souls: 300, pack: "ultra" },
  { label: { en: "#4 – #10", ar: "٤ – ١٠" }, souls: 200, pack: "gold" },
  { label: { en: "#11 – #25", ar: "١١ – ٢٥" }, souls: 100, pack: "silver" },
  { label: { en: "#26 – #100", ar: "٢٦ – ١٠٠" }, souls: 50, pack: "bronze" },
  { label: { en: "Participation", ar: "المشاركة" }, souls: 25, pack: null },
];

export const PACK_LABEL: Record<PackTier, { en: string; ar: string }> = {
  bronze: { en: "Bronze", ar: "برونزية" },
  silver: { en: "Silver", ar: "فضية" },
  gold: { en: "Gold", ar: "ذهبية" },
  ultra: { en: "Ultra", ar: "خارقة" },
  legend: { en: "Legend", ar: "أسطورية" },
};