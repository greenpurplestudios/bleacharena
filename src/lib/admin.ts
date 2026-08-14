import { supabase } from "@/integrations/supabase/client";

/**
 * Admin RPCs are authorized server-side via the `user_roles` table and
 * `has_role()`; nothing here is trusted for permissions. These wrappers are
 * untyped because the generated Supabase types lag behind new functions.
 */
type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
const rpc = ((name: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as Rpc)(name, args)) as Rpc;

export interface AdminPlayer {
  user_id: string;
  username: string | null;
  souls: number;
  level: number;
  created_at: string;
  is_admin: boolean;
}

export async function amIAdmin(): Promise<boolean> {
  const { data, error } = await rpc("am_i_admin");
  if (error) return false;
  return data === true;
}

export async function searchPlayers(q: string): Promise<AdminPlayer[]> {
  const { data, error } = await rpc("admin_search_players", { p_q: q, p_limit: 40 });
  if (error || !Array.isArray(data)) return [];
  return data as AdminPlayer[];
}

export interface AdminPlayerDetail {
  profile: Record<string, unknown> | null;
  level: { level: number; xp: number; total_xp: number } | null;
  packs: { tier: string; count: number }[];
  cards: number;
  items: number;
  achievements: number;
  daily: { streak: number; total_claims: number } | null;
  rival: { rating: number; wins: number; losses: number } | null;
  is_admin: boolean;
}

export async function getPlayer(userId: string): Promise<AdminPlayerDetail | null> {
  const { data, error } = await rpc("admin_get_player", { p_user: userId });
  if (error || !data) return null;
  return data as AdminPlayerDetail;
}

export type AdminResult = { ok: boolean; error?: string };

async function call(fn: string, args: Record<string, unknown>): Promise<AdminResult> {
  const { data, error } = await rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  const payload = (data ?? {}) as AdminResult;
  return payload.ok ? { ok: true } : { ok: false, error: payload.error ?? "failed" };
}

export const adminGrantSouls = (u: string, amount: number) => call("admin_grant_souls", { p_user: u, p_amount: amount });
export const adminGrantXp = (u: string, amount: number) => call("admin_grant_xp", { p_user: u, p_amount: amount });
export const adminGrantPack = (u: string, tier: string, count: number) => call("admin_grant_pack", { p_user: u, p_tier: tier, p_count: count });
export const adminGrantCharacter = (u: string, characterId: string, count: number) => call("admin_grant_character", { p_user: u, p_character: characterId, p_count: count });
export const adminGrantItem = (u: string, itemId: string) => call("admin_grant_item", { p_user: u, p_item: itemId });
export const adminUnlockAchievement = (u: string, id: string) => call("admin_unlock_achievement", { p_user: u, p_achievement: id });
export const adminSetStreak = (u: string, streak: number) => call("admin_set_streak", { p_user: u, p_streak: streak });
export const adminSetUsername = (u: string, username: string) => call("admin_set_username", { p_user: u, p_username: username });
export const adminTransferProgress = (from: string, to: string) => call("admin_transfer_progress", { p_from: from, p_to: to });

export interface AuditRow {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export async function fetchAuditLog(): Promise<AuditRow[]> {
  const { data, error } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (c: string, o: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: AuditRow[] | null; error: unknown }>;
        };
      };
    };
  }).from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(50);
  if (error || !data) return [];
  return data;
}
