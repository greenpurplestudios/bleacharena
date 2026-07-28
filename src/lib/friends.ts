import { supabase } from "@/integrations/supabase/client";

export type FriendState = "none" | "self" | "friends" | "outgoing" | "incoming";

export interface FriendRow {
  user_id: string;
  username: string | null;
  title: string | null;
  username_color: string | null;
  avatar_character_id: string | null;
  profile_frame: string | null;
  level: number;
  rival_rating?: number;
  friended_at?: string;
}

export interface FriendRequestRow {
  id: string;
  direction: "incoming" | "outgoing";
  user_id: string;
  username: string | null;
  title: string | null;
  username_color: string | null;
  avatar_character_id: string | null;
  profile_frame: string | null;
  created_at: string;
}

export async function sendFriendRequest(userId: string) {
  const { data, error } = await supabase.rpc("send_friend_request", { p_addressee: userId });
  if (error) return { ok: false, error: error.message } as const;
  return data as { ok: boolean; error?: string; status?: string };
}

export async function respondFriendRequest(requestId: string, accept: boolean) {
  const { data, error } = await supabase.rpc("respond_friend_request", { p_request_id: requestId, p_accept: accept });
  if (error) return { ok: false, error: error.message } as const;
  return data as { ok: boolean; error?: string; status?: string };
}

export async function removeFriend(userId: string) {
  const { data, error } = await supabase.rpc("remove_friend", { p_other: userId });
  if (error) return { ok: false, error: error.message } as const;
  return data as { ok: boolean };
}

export async function listFriends(): Promise<FriendRow[]> {
  const { data, error } = await supabase.rpc("get_my_friends");
  if (error || !data) return [];
  return data as FriendRow[];
}

export async function listFriendRequests(): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase.rpc("get_my_friend_requests");
  if (error || !data) return [];
  return data as FriendRequestRow[];
}

export async function getFriendStatus(userId: string): Promise<{ state: FriendState; id?: string }> {
  const { data, error } = await supabase.rpc("get_friend_status", { p_other: userId });
  if (error || !data) return { state: "none" };
  return data as { state: FriendState; id?: string };
}

export async function searchUsers(query: string): Promise<FriendRow[]> {
  const q = query.trim();
  if (!q) return [];
  const { data, error } = await supabase.rpc("search_users", { p_query: q, p_limit: 20 });
  if (error || !data) return [];
  return data as FriendRow[];
}