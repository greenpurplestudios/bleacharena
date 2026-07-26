import { supabase } from "@/integrations/supabase/client";

let anonPromise: Promise<void> | null = null;

/**
 * Ensures the visitor has a Supabase session. Creates a silent anonymous
 * account on first visit so scores can be submitted under a stable user id.
 */
export function ensureAnonSession(): Promise<void> {
  if (anonPromise) return anonPromise;
  anonPromise = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      // eslint-disable-next-line no-console
      console.warn("[leaderboard] anon sign-in failed", error.message);
    }
  })();
  return anonPromise;
}

export async function getCurrentUserId(): Promise<string | null> {
  await ensureAnonSession();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getMyProfile(): Promise<{ username: string | null } | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", uid)
    .maybeSingle();
  return data ?? { username: null };
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
  await ensureAnonSession();
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
  await ensureAnonSession();
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
}

export async function fetchLeaderboard(limit = 100): Promise<LeaderboardRow[]> {
  await ensureAnonSession();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_limit: limit,
  });
  if (error || !data) return [];
  return (data as Array<Omit<LeaderboardRow, "team"> & { team: unknown }>).map((r) => ({
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