import { supabase } from "@/integrations/supabase/client";
import { STARTER_WEAPON } from "@/lib/soul-duel/ultimates";
import type { Difficulty } from "@/lib/soul-duel/types";

export interface ForgeCatalogEntry {
  weaponId: string;
  fragmentCost: number;
  soulCost: number;
  starter: boolean;
}

export interface ForgeState {
  fragments: number;
  souls: number;
  equipped: string;
  weapons: string[];
  catalog: ForgeCatalogEntry[];
}

const EMPTY: ForgeState = {
  fragments: 0, souls: 0, equipped: STARTER_WEAPON, weapons: [STARTER_WEAPON], catalog: [],
};

type RawCatalog = { weapon_id: string; fragment_cost: number; soul_cost: number; starter: boolean };

export async function fetchForge(): Promise<ForgeState> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_forge");
  if (error || !data || !(data as { ok?: boolean }).ok) return EMPTY;
  const d = data as {
    fragments: number; souls: number | null; equipped: string;
    weapons: string[]; catalog: RawCatalog[];
  };
  return {
    fragments: Number(d.fragments ?? 0),
    souls: Number(d.souls ?? 0),
    equipped: d.equipped || STARTER_WEAPON,
    weapons: d.weapons?.length ? d.weapons : [STARTER_WEAPON],
    catalog: (d.catalog ?? []).map((c) => ({
      weaponId: c.weapon_id,
      fragmentCost: Number(c.fragment_cost),
      soulCost: Number(c.soul_cost),
      starter: !!c.starter,
    })),
  };
}

export async function forgeWeapon(weaponId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("forge_weapon", { p_weapon_id: weaponId });
  if (error) return { ok: false as const, error: error.message };
  return (data ?? { ok: false }) as { ok: boolean; error?: string; fragments?: number; souls?: number };
}

export async function equipWeapon(weaponId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("equip_weapon", { p_weapon_id: weaponId });
  if (error) return { ok: false as const, error: error.message };
  return (data ?? { ok: false }) as { ok: boolean; error?: string };
}

export async function awardFragments(amount: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("award_fragments", { p_amount: amount });
  if (error) return { ok: false as const, awarded: 0 };
  return (data ?? { ok: false, awarded: 0 }) as { ok: boolean; awarded?: number; fragments?: number };
}

/** Broken Sword Fragments earned from a finished duel. */
export function fragmentReward(difficulty: Difficulty, won: boolean, tie = false): number {
  const base: Record<Difficulty, [number, number]> = {
    practice: [3, 6],
    normal: [6, 14],
    nightmare: [10, 24],
  };
  const [loss, win] = base[difficulty];
  if (tie) return Math.round((loss + win) / 2);
  return won ? win : loss;
}