import { supabase } from "@/integrations/supabase/client";

/**
 * No-op kept for backwards compatibility. Anonymous accounts are no longer
 * created — users must sign in via /auth.
 */
export function ensureAnonSession(): Promise<void> {
  return Promise.resolve();
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<{ username: string | null } | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const { data } = await supabase
    .from("profiles")
    .select("username, title, username_color")
    .eq("user_id", uid)
    .maybeSingle();
  return (data as { username: string | null; title?: string | null; username_color?: string | null } | null) ?? { username: null };
}

export type SubmitResult =
  | { ok: true; improved: boolean; score: number; season: string }
  | { ok: false; needsUsername?: boolean; error?: string };

export interface TeamMemberPayload {
  name: string;
  image: string | null;
  overall: number;
}

export async function submitScore(
  rawScore: number,
  team: TeamMemberPayload[] = [],
): Promise<SubmitResult> {
  const clamped = Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));
  const cleanTeam = team
    .slice(0, 10)
    .map((m) => ({
      name: String(m.name ?? "").slice(0, 60),
      image: m.image ?? null,
      overall: Number(m.overall) || 0,
    }));
  const { data, error } = await supabase.rpc("submit_score", {
    p_score: clamped,
    p_team: cleanTeam,
  });
  if (error) return { ok: false, error: error.message };
  const payload = (data ?? {}) as {
    ok: boolean;
    needs_username?: boolean;
    improved?: boolean;
    score?: number;
    season?: string;
    error?: string;
  };
  if (!payload.ok) {
    return { ok: false, needsUsername: payload.needs_username, error: payload.error };
  }
  return {
    ok: true,
    improved: !!payload.improved,
    score: Number(payload.score ?? clamped),
    season: payload.season ?? "",
  };
}

export type UsernameResult =
  | { ok: true; username: string }
  | { ok: false; error: "taken" | "invalid_length" | "invalid_chars" | "unknown" };

export async function setUsername(name: string): Promise<UsernameResult> {
  const { data, error } = await supabase.rpc("set_username", { p_username: name });
  if (error) return { ok: false, error: "unknown" };
  const payload = (data ?? {}) as { ok: boolean; username?: string; error?: string };
  if (payload.ok && payload.username) return { ok: true, username: payload.username };
  const known = ["taken", "invalid_length", "invalid_chars"] as const;
  type Known = (typeof known)[number];
  const err = payload.error ?? "";
  const mapped: Known | "unknown" =
    (known as readonly string[]).includes(err) ? (err as Known) : "unknown";
  return { ok: false, error: mapped };
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  team: TeamMemberPayload[];
  title: string | null;
  username_color: string | null;
  name_frame: string | null;
  avatar_character_id: string | null;
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_limit: limit,
  });
  if (error || !data) return [];
  return (data as Array<Omit<LeaderboardRow, "team" | "title" | "username_color" | "name_frame" | "avatar_character_id"> & {
    team: unknown; title?: string | null; username_color?: string | null;
    name_frame?: string | null; avatar_character_id?: string | null;
  }>).map((r) => ({
    rank: Number(r.rank),
    user_id: r.user_id,
    username: r.username,
    score: Number(r.score),
    team: Array.isArray(r.team)
      ? (r.team as TeamMemberPayload[]).map((m) => ({
          name: String(m?.name ?? ""),
          image: m?.image ?? null,
          overall: Number(m?.overall) || 0,
        }))
      : [],
    title: r.title ?? null,
    username_color: r.username_color ?? null,
    name_frame: r.name_frame ?? null,
    avatar_character_id: r.avatar_character_id ?? null,
  }));
}

export function currentWeekLabel(locale: "en" | "ar"): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (day + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diff);
  return monday.toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}