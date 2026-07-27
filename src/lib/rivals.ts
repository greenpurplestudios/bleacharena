import { supabase } from "@/integrations/supabase/client";

export interface RivalStats {
  rating: number;
  wins: number;
  losses: number;
  battlesToday: number;
  battlesLeft: number;
}

export interface RivalOpponent {
  opponentId: string;
  username: string;
  team: string[];
}

export interface RivalBattleResult {
  ok: boolean;
  error?: string;
  battleId?: string;
  attackerScore?: number;
  defenderScore?: number;
  winnerId?: string | null;
  attackerDelta?: number;
  newRating?: number;
  soulsAwarded?: number;
  battlesLeft?: number;
}

export interface RivalLeaderRow {
  rank: number;
  user_id: string;
  username: string;
  rating: number;
  wins: number;
  losses: number;
  title: string | null;
  username_color: string | null;
}

export interface RecentBattle {
  id: string;
  created_at: string;
  opponent_id: string;
  opponent_name: string | null;
  my_score: number;
  opp_score: number;
  my_delta: number;
  i_won: boolean;
  i_lost: boolean;
}

export async function getMyRivalTeam(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_my_rival_team");
  if (error || !data) return [];
  return (data as string[]) ?? [];
}

export async function setMyRivalTeam(slots: string[]): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("set_rival_team", { p_slots: slots });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string };
  return { ok: !!p.ok, error: p.error };
}

export async function getMyRivalStats(): Promise<RivalStats> {
  const { data } = await supabase.rpc("get_my_rival_stats");
  const p = (data ?? {}) as {
    rating?: number; wins?: number; losses?: number; battles_today?: number; battles_left?: number;
  };
  return {
    rating: Number(p.rating ?? 1000),
    wins: Number(p.wins ?? 0),
    losses: Number(p.losses ?? 0),
    battlesToday: Number(p.battles_today ?? 0),
    battlesLeft: Number(p.battles_left ?? 10),
  };
}

export async function findRivalOpponent(): Promise<RivalOpponent | { error: string }> {
  const { data, error } = await supabase.rpc("find_rival_opponent");
  if (error) return { error: error.message };
  const p = (data ?? {}) as { ok: boolean; opponent_id?: string; username?: string; team?: string[]; error?: string };
  if (!p.ok) return { error: p.error ?? "no_opponent" };
  return { opponentId: p.opponent_id!, username: p.username ?? "", team: p.team ?? [] };
}

export async function battleRival(opponentId: string): Promise<RivalBattleResult> {
  const { data, error } = await supabase.rpc("battle_rival", { p_opponent: opponentId });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as {
    ok: boolean; error?: string; battle_id?: string;
    attacker_score?: number; defender_score?: number; winner_id?: string | null;
    attacker_delta?: number; new_rating?: number; souls_awarded?: number; battles_left?: number;
  };
  if (!p.ok) return { ok: false, error: p.error };
  return {
    ok: true,
    battleId: p.battle_id,
    attackerScore: Number(p.attacker_score ?? 0),
    defenderScore: Number(p.defender_score ?? 0),
    winnerId: p.winner_id ?? null,
    attackerDelta: Number(p.attacker_delta ?? 0),
    newRating: Number(p.new_rating ?? 1000),
    soulsAwarded: Number(p.souls_awarded ?? 0),
    battlesLeft: Number(p.battles_left ?? 0),
  };
}

export async function fetchRivalLeaderboard(limit = 100): Promise<RivalLeaderRow[]> {
  const { data, error } = await supabase.rpc("get_rival_leaderboard", { p_limit: limit });
  if (error || !data) return [];
  return (data as RivalLeaderRow[]).map((r) => ({
    ...r,
    rank: Number(r.rank),
    rating: Number(r.rating),
    wins: Number(r.wins),
    losses: Number(r.losses),
  }));
}

export async function fetchMyRecentBattles(limit = 10): Promise<RecentBattle[]> {
  const { data, error } = await supabase.rpc("get_my_recent_battles", { p_limit: limit });
  if (error || !data) return [];
  return (data as RecentBattle[]).map((b) => ({
    ...b,
    my_score: Number(b.my_score),
    opp_score: Number(b.opp_score),
    my_delta: Number(b.my_delta),
  }));
}