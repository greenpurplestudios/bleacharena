import { supabase } from "@/integrations/supabase/client";

export interface PotionRow {
  itemId: string;
  count: number;
  name: { en: string; ar: string };
  luck: number;
  minutes: number;
}

export interface ActivePotion {
  active: boolean;
  itemId?: string;
  luck: number;
  /** ms epoch when it ends (client clock adjusted from server) */
  endsAt?: number;
}

export const POTION_COLOR: Record<string, string> = {
  potion_luck_25: "oklch(0.78 0.14 150)",
  potion_luck_50: "oklch(0.75 0.16 220)",
  potion_luck_100: "oklch(0.72 0.24 25)",
};

export async function fetchMyPotions(): Promise<PotionRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_my_potions");
  if (error || !data) return [];
  return (data as Array<{ item_id: string; count: number; name_en: string; name_ar: string; luck: number; minutes: number }>)
    .map((r) => ({
      itemId: r.item_id,
      count: Number(r.count),
      name: { en: r.name_en, ar: r.name_ar },
      luck: Number(r.luck),
      minutes: Number(r.minutes),
    }));
}

function toActive(p: {
  active?: boolean; item_id?: string; luck?: number; expires_at?: string; now?: string;
}): ActivePotion {
  if (!p?.active || !p.expires_at) return { active: false, luck: 0 };
  const serverNow = p.now ? new Date(p.now).getTime() : Date.now();
  const remaining = new Date(p.expires_at).getTime() - serverNow;
  return { active: true, itemId: p.item_id, luck: Number(p.luck ?? 0), endsAt: Date.now() + remaining };
}

export async function fetchActivePotion(): Promise<ActivePotion> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_active_potion");
  if (error || !data) return { active: false, luck: 0 };
  return toActive(data);
}

export async function activatePotion(
  itemId: string,
): Promise<{ ok: boolean; error?: string; potion?: ActivePotion }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("activate_potion", { p_item_id: itemId });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string; luck?: number; expires_at?: string; now?: string; item_id?: string };
  if (!p.ok) return { ok: false, error: p.error };
  return { ok: true, potion: toActive({ ...p, active: true }) };
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}