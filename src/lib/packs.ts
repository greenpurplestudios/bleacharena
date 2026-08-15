import { supabase } from "@/integrations/supabase/client";
import type { Rarity } from "@/types/character";

export type PackTier = "bronze" | "silver" | "gold" | "ultra" | "legend";

export const PACK_TIERS: PackTier[] = ["bronze", "silver", "gold", "ultra", "legend"];

export const PACK_LABEL: Record<PackTier, { en: string; ar: string }> = {
  bronze: { en: "Bronze Pack", ar: "حزمة برونزية" },
  silver: { en: "Silver Pack", ar: "حزمة فضية" },
  gold: { en: "Gold Pack", ar: "حزمة ذهبية" },
  ultra: { en: "Ultra Pack", ar: "حزمة أولترا" },
  legend: { en: "Legend Pack", ar: "حزمة أسطورية" },
};

export const PACK_COLOR: Record<PackTier, string> = {
  bronze: "oklch(0.62 0.11 55)",
  silver: "oklch(0.82 0.02 250)",
  gold: "oklch(0.82 0.16 85)",
  ultra: "oklch(0.7 0.22 300)",
  legend: "oklch(0.72 0.24 25)",
};

/**
 * Alpha helper for the pack colors. They are `oklch()` strings, so appending
 * hex alpha (`${color}88`) produces an invalid value that browsers drop —
 * which is what made the packs render see-through. Use color-mix instead.
 */
export function packAlpha(color: string, pct: number): string {
  return `color-mix(in oklab, ${color} ${pct}%, transparent)`;
}

/** Blend a pack color toward black for solid, opaque surfaces. */
export function packShade(color: string, pct: number): string {
  return `color-mix(in oklab, ${color} ${pct}%, #0b0806)`;
}

export const PACK_DESCRIPTION: Record<PackTier, { en: string; ar: string }> = {
  bronze: { en: "Common → Uncommon, small Rare chance.", ar: "عادي إلى غير مألوف، فرصة صغيرة للنادر." },
  silver: { en: "Uncommon → Rare, small Epic chance.", ar: "غير مألوف إلى نادر، فرصة صغيرة للملحمي." },
  gold: { en: "Rare → Epic, chance at Legendary.", ar: "نادر إلى ملحمي، فرصة للأسطوري." },
  ultra: { en: "Epic → Legendary, chance at Mythic.", ar: "ملحمي إلى أسطوري، فرصة للأسطوري الخارق." },
  legend: { en: "Legendary → Mythic guaranteed.", ar: "أسطوري أو أسطوري خارق مضمون." },
};

export const DUPLICATE_SOULS: Record<Rarity, number> = {
  common: 5,
  uncommon: 10,
  rare: 25,
  epic: 60,
  legendary: 150,
  mythic: 400,
  founder: 2500,
};

export function packTierFromScore(score: number): PackTier | null {
  if (score >= 95) return "legend";
  if (score >= 90) return "ultra";
  if (score >= 86) return "gold";
  if (score >= 81) return "silver";
  if (score >= 75) return "bronze";
  return null;
}

export async function awardPackFromScore(score: number): Promise<{ awarded: boolean; tier?: PackTier }> {
  const { data, error } = await supabase.rpc("award_pack_from_score", { p_score: score });
  if (error) return { awarded: false };
  const p = (data ?? {}) as { ok: boolean; awarded?: boolean; tier?: PackTier };
  return { awarded: !!p.awarded, tier: p.tier };
}

export interface OpenPackResult {
  ok: boolean;
  characterId?: string;
  rarity?: Rarity;
  overall?: number;
  duplicate?: boolean;
  soulsAwarded?: number;
  error?: string;
}

export async function openPack(tier: PackTier): Promise<OpenPackResult> {
  const { data, error } = await supabase.rpc("open_pack", { p_tier: tier });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as {
    ok: boolean;
    character_id?: string;
    rarity?: Rarity;
    overall?: number;
    duplicate?: boolean;
    souls_awarded?: number;
    error?: string;
  };
  if (!p.ok) return { ok: false, error: p.error };
  return {
    ok: true,
    characterId: p.character_id,
    rarity: p.rarity,
    overall: p.overall,
    duplicate: !!p.duplicate,
    soulsAwarded: Number(p.souls_awarded ?? 0),
  };
}

export interface PackInventoryRow { tier: PackTier; count: number }

/** Souls price per pack tier at Kon's Kiosk (mirrors the server-side buy_pack prices). */
export const PACK_PRICE: Record<PackTier, number> = {
  bronze: 150,
  silver: 350,
  gold: 700,
  ultra: 1400,
  legend: 2800,
};

export interface BuyPackResult {
  ok: boolean;
  tier?: PackTier;
  count?: number;
  spent?: number;
  souls?: number;
  error?: string;
}

export async function buyPack(tier: PackTier, count = 1): Promise<BuyPackResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("buy_pack", { p_tier: tier, p_count: count });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; tier?: PackTier; count?: number; spent?: number; souls?: number; error?: string };
  if (!p.ok) return { ok: false, error: p.error };
  return { ok: true, tier: p.tier, count: Number(p.count ?? 0), spent: Number(p.spent ?? 0), souls: Number(p.souls ?? 0) };
}

export interface OpenAllResult {
  ok: boolean;
  opened: number;
  soulsAwarded: number;
  results: OpenPackResult[];
  error?: string;
}

export async function openAllPacks(tier: PackTier): Promise<OpenAllResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("open_all_packs", { p_tier: tier });
  if (error) return { ok: false, opened: 0, soulsAwarded: 0, results: [], error: error.message };
  const p = (data ?? {}) as {
    ok: boolean; opened?: number; souls_awarded?: number; error?: string;
    results?: Array<{ character_id?: string; rarity?: Rarity; overall?: number; duplicate?: boolean; souls_awarded?: number }>;
  };
  if (!p.ok) return { ok: false, opened: 0, soulsAwarded: 0, results: [], error: p.error };
  return {
    ok: true,
    opened: Number(p.opened ?? 0),
    soulsAwarded: Number(p.souls_awarded ?? 0),
    results: (p.results ?? []).map((r) => ({
      ok: true,
      characterId: r.character_id,
      rarity: r.rarity,
      overall: r.overall,
      duplicate: !!r.duplicate,
      soulsAwarded: Number(r.souls_awarded ?? 0),
    })),
  };
}

export async function fetchMyPacks(): Promise<PackInventoryRow[]> {
  const { data, error } = await supabase.rpc("get_my_packs");
  if (error || !data) return [];
  return (data as Array<{ tier: string; count: number }>).map((r) => ({
    tier: r.tier as PackTier,
    count: Number(r.count),
  }));
}

export interface CollectionRow {
  characterId: string;
  count: number;
  rarity: Rarity;
  overall: number;
}

export async function fetchMyCollection(): Promise<CollectionRow[]> {
  const { data, error } = await supabase.rpc("get_my_collection");
  if (error || !data) return [];
  return (data as Array<{ character_id: string; count: number; rarity: string; overall: number }>).map((r) => ({
    characterId: r.character_id,
    count: Number(r.count),
    rarity: r.rarity as Rarity,
    overall: Number(r.overall),
  }));
}

export async function fetchMySouls(): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return 0;
  const { data } = await supabase
    .from("profiles")
    .select("souls")
    .eq("user_id", u.user.id)
    .maybeSingle();
  return Number(data?.souls ?? 0);
}