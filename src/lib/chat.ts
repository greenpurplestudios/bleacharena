import { supabase } from "@/integrations/supabase/client";

export interface GlobalMessage {
  id: string;
  user_id: string;
  username: string | null;
  username_color: string | null;
  name_frame: string | null;
  title: string | null;
  avatar_character_id: string | null;
  content: string;
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface Conversation {
  user_id: string;
  username: string | null;
  username_color: string | null;
  name_frame: string | null;
  avatar_character_id: string | null;
  last_message: string | null;
  last_at: string;
  unread: number;
}

type Rpc = { ok: boolean; error?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, args?: Record<string, unknown>) => (supabase.rpc as any)(name, args ?? {});

export async function getGlobalMessages(limit = 100): Promise<GlobalMessage[]> {
  const { data, error } = await rpc("get_global_messages", { p_limit: limit });
  if (error || !data) return [];
  return (data as GlobalMessage[]).slice().reverse();
}

export async function sendGlobalMessage(content: string): Promise<Rpc> {
  const { data, error } = await rpc("send_global_message", { p_content: content });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: "empty" }) as Rpc;
}

export async function deleteGlobalMessage(id: string): Promise<Rpc> {
  const { data, error } = await rpc("delete_global_message", { p_id: id });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: "empty" }) as Rpc;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await rpc("get_my_conversations");
  if (error || !data) return [];
  return (data as Conversation[]).map((c) => ({ ...c, unread: Number(c.unread) }));
}

export async function getDirectMessages(other: string, limit = 100): Promise<DirectMessage[]> {
  const { data, error } = await rpc("get_direct_messages", { p_other: other, p_limit: limit });
  if (error || !data) return [];
  return (data as DirectMessage[]).slice().reverse();
}

export async function sendDirectMessage(to: string, content: string): Promise<Rpc> {
  const { data, error } = await rpc("send_direct_message", { p_to: to, p_content: content });
  if (error) return { ok: false, error: error.message };
  return (data ?? { ok: false, error: "empty" }) as Rpc;
}

export async function markConversationRead(other: string): Promise<void> {
  await rpc("mark_conversation_read", { p_other: other });
}

export async function getUnreadDmCount(): Promise<number> {
  const { data, error } = await rpc("get_unread_dm_count");
  if (error) return 0;
  return Number(data ?? 0);
}
