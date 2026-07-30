import { supabase } from "@/integrations/supabase/client";

export type ClanRole = "leader" | "officer" | "member";

export interface ClanListRow {
  id: string;
  tag: string;
  name: string;
  description: string;
  member_count: number;
  total_level: number;
  created_at: string;
  my_request: boolean;
}

export interface ClanMember {
  user_id: string;
  role: ClanRole;
  username: string | null;
  username_color: string | null;
  title: string | null;
  avatar_character_id: string | null;
  profile_frame: string | null;
  level: number;
  rival_rating: number;
  joined_at: string;
}

export interface ClanJoinRequestRow {
  user_id: string;
  created_at: string;
  username: string | null;
  username_color: string | null;
  title: string | null;
  avatar_character_id: string | null;
  profile_frame: string | null;
  level: number;
}

export interface ClanDetails {
  id: string;
  tag: string;
  name: string;
  description: string;
  leader_id: string;
  member_count: number;
  created_at: string;
}

export interface MyClanState {
  ok: true;
  in_clan: boolean;
  my_role?: ClanRole;
  clan?: ClanDetails;
  members?: ClanMember[];
  requests?: ClanJoinRequestRow[];
}

export interface ClanMessage {
  id: string;
  user_id: string;
  username: string | null;
  username_color: string | null;
  avatar_character_id: string | null;
  content: string;
  created_at: string;
}

export interface ClanLeaderboardRow {
  rank: number;
  id: string;
  tag: string;
  name: string;
  member_count: number;
  total_level: number;
  total_rating: number;
}

export interface ClanWeeklyRow {
  rank: number;
  id: string;
  tag: string;
  name: string;
  member_count: number;
  total_score: number;
  scoring_members: number;
}

export interface ClanWeeklyRewardStatus {
  ok: boolean;
  season?: string;
  in_clan: boolean;
  rank: number | null;
  score: number | null;
  souls: number;
  pack: string | null;
  claimed: boolean;
  has_entry: boolean;
}

type RpcResult = { ok: boolean; error?: string; [k: string]: unknown };

async function rpc(name: string, args?: Record<string, unknown>): Promise<RpcResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(name, args ?? {});
  if (error) return { ok: false, error: error.message };
  return ((data as unknown) as RpcResult) ?? { ok: false, error: "empty" };
}

export const createClan = (tag: string, name: string, description: string) =>
  rpc("create_clan", { p_tag: tag, p_name: name, p_description: description });
export const requestJoinClan = (clanId: string) => rpc("request_join_clan", { p_clan_id: clanId });
export const cancelJoinRequest = (clanId: string) => rpc("cancel_join_request", { p_clan_id: clanId });
export const respondJoinRequest = (userId: string, accept: boolean) =>
  rpc("respond_join_request", { p_user_id: userId, p_accept: accept });
export const leaveClan = () => rpc("leave_clan");
export const kickClanMember = (userId: string) => rpc("kick_clan_member", { p_user_id: userId });
export const setClanMemberRole = (userId: string, role: "officer" | "member") =>
  rpc("set_clan_member_role", { p_user_id: userId, p_role: role });
export const transferClanLeadership = (userId: string) =>
  rpc("transfer_clan_leadership", { p_user_id: userId });
export const disbandClan = () => rpc("disband_clan");
export const updateClanDescription = (description: string) =>
  rpc("update_clan_description", { p_description: description });
export const sendClanMessage = (content: string) =>
  rpc("send_clan_message", { p_content: content });

export async function getMyClan(): Promise<MyClanState> {
  const { data, error } = await supabase.rpc("get_my_clan");
  if (error || !data) return { ok: true, in_clan: false };
  return (data as unknown) as MyClanState;
}

export async function listClans(query = ""): Promise<ClanListRow[]> {
  const { data, error } = await supabase.rpc("list_clans", { p_query: query, p_limit: 50 });
  if (error || !data) return [];
  return data as ClanListRow[];
}

export async function getClanMessages(limit = 100): Promise<ClanMessage[]> {
  const { data, error } = await supabase.rpc("get_clan_messages", { p_limit: limit });
  if (error || !data) return [];
  return (data as ClanMessage[]).slice().reverse();
}

export async function getClanLeaderboard(limit = 100): Promise<ClanLeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_clan_leaderboard", { p_limit: limit });
  if (error || !data) return [];
  return data as ClanLeaderboardRow[];
}

export async function getClanWeeklyLeaderboard(limit = 100): Promise<ClanWeeklyRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_clan_weekly_leaderboard", { p_limit: limit });
  if (error || !data) return [];
  return (data as ClanWeeklyRow[]).map((r) => ({ ...r, total_score: Number(r.total_score) }));
}

export async function getMyClanWeeklyReward(): Promise<ClanWeeklyRewardStatus | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_my_clan_weekly_reward");
  if (error || !data) return null;
  return data as ClanWeeklyRewardStatus;
}

export const claimClanWeeklyReward = () => rpc("claim_clan_weekly_reward");