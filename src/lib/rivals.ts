import { supabase } from "@/integrations/supabase/client";

export interface RivalStats {
  rating: number;
  wins: number;
  losses: number;
  battlesToday: number;
  battlesLeft: number;
  defensesToday: number;
  defensesLeft: number;
  weeklyPoints: number;
  weeklyWins: number;
  weeklyLosses: number;
}

export interface RivalOpponent {
  opponentId: string;
  username: string;
  team: string[];
  rating?: number;
  teamPower?: number;
}

/** One of up to four rival squads; stamina is per team, not per card. */
export interface RivalTeam {
  index: number;
  slots: string[];
  staminaLeft: number;
  name: string | null;
}

export const RIVAL_MAX_TEAMS = 4;
export const RIVAL_TEAM_STAMINA = 3;
export const RIVAL_DAILY_ATTACKS = 12;

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
  staminaLeft?: number;
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
  name_frame: string | null;
  avatar_character_id: string | null;
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

export interface RivalWeeklyRow extends RivalLeaderRow {
  points: number;
}

export async function getMyRivalTeam(): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_my_rival_team");
  if (error || !data) return [];
  return (data as string[]) ?? [];
}

export async function getMyRivalTeams(): Promise<RivalTeam[]> {
  const { data, error } = await (supabase.rpc as unknown as (
    n: string,
  ) => Promise<{ data: unknown; error: unknown }>)("get_my_rival_teams");
  if (error || !Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    index: Number(r["team_index"] ?? 0),
    slots: (r["slots"] as string[]) ?? [],
    staminaLeft: Number(r["stamina_left"] ?? 0),
    name: (r["name"] as string) ?? null,
  }));
}

export async function setMyRivalTeam(slots: string[], teamIndex = 0): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("set_rival_team", { p_slots: slots, p_index: teamIndex } as never);
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string };
  return { ok: !!p.ok, error: p.error };
}

export async function deleteRivalTeam(teamIndex: number): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await (supabase.rpc as unknown as (
    n: string, a: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>)("delete_rival_team", { p_index: teamIndex });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string };
  return { ok: !!p.ok, error: p.error };
}

export async function getMyRivalStats(): Promise<RivalStats> {
  const { data } = await supabase.rpc("get_my_rival_stats");
  const p = (data ?? {}) as {
    rating?: number; wins?: number; losses?: number; battles_today?: number; battles_left?: number;
    defenses_today?: number; defenses_left?: number;
    weekly_points?: number; weekly_wins?: number; weekly_losses?: number;
  };
  return {
    rating: Number(p.rating ?? 1000),
    wins: Number(p.wins ?? 0),
    losses: Number(p.losses ?? 0),
    battlesToday: Number(p.battles_today ?? 0),
    battlesLeft: Number(p.battles_left ?? RIVAL_DAILY_ATTACKS),
    defensesToday: Number(p.defenses_today ?? 0),
    defensesLeft: Number(p.defenses_left ?? RIVAL_DAILY_ATTACKS),
    weeklyPoints: Number(p.weekly_points ?? 0),
    weeklyWins: Number(p.weekly_wins ?? 0),
    weeklyLosses: Number(p.weekly_losses ?? 0),
  };
}

export async function findRivalOpponent(teamIndex = 0): Promise<RivalOpponent | { error: string }> {
  const { data, error } = await supabase.rpc("find_rival_opponent", { p_team_index: teamIndex } as never);
  if (error) return { error: error.message };
  const p = (data ?? {}) as {
    ok: boolean; opponent_id?: string; username?: string; team?: string[]; error?: string;
    rating?: number; team_power?: number;
  };
  if (!p.ok) return { error: p.error ?? "no_opponent" };
  return {
    opponentId: p.opponent_id!, username: p.username ?? "", team: p.team ?? [],
    rating: p.rating != null ? Number(p.rating) : undefined,
    teamPower: p.team_power != null ? Number(p.team_power) : undefined,
  };
}

export async function battleRival(opponentId: string, teamIndex = 0): Promise<RivalBattleResult> {
  const { data, error } = await supabase.rpc("battle_rival", { p_opponent: opponentId, p_team_index: teamIndex } as never);
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as {
    ok: boolean; error?: string; battle_id?: string;
    attacker_score?: number; defender_score?: number; winner_id?: string | null;
    attacker_delta?: number; new_rating?: number; souls_awarded?: number; battles_left?: number;
    stamina_left?: number;
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
    staminaLeft: Number(p.stamina_left ?? 0),
  };
}

export async function fetchRivalWeeklyLeaderboard(limit = 100): Promise<RivalWeeklyRow[]> {
  const { data, error } = await (supabase.rpc as unknown as (
    n: string, a: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: unknown }>)("get_rival_weekly_leaderboard", { p_limit: limit });
  if (error || !Array.isArray(data)) return [];
  return (data as RivalWeeklyRow[]).map((r) => ({
    ...r,
    rank: Number(r.rank),
    points: Number(r.points),
    rating: Number(r.rating),
    wins: Number(r.wins),
    losses: Number(r.losses),
  }));
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