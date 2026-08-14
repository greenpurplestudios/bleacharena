import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Guest play uses a real (anonymous) backend identity instead of a local
 * shadow profile. That keeps every RPC, RLS policy and progression table
 * working unchanged, keeps guest data fully isolated from real accounts
 * (separate user id), survives refreshes through the persisted session, and
 * allows a lossless upgrade later via `supabase.auth.updateUser`.
 */

const GUEST_KEY = "ba:guest";

export function isGuestUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const u = user as User & { is_anonymous?: boolean };
  if (u.is_anonymous === true) return true;
  return !user.email && (user.app_metadata?.provider ?? "") === "anonymous";
}

export function guestFlag(): boolean {
  try { return window.localStorage.getItem(GUEST_KEY) === "1"; } catch { return false; }
}

function setGuestFlag(on: boolean) {
  try {
    if (on) window.localStorage.setItem(GUEST_KEY, "1");
    else window.localStorage.removeItem(GUEST_KEY);
  } catch { /* ignore */ }
}

function randomGuestName(): string {
  return `Guest${1000 + Math.floor(Math.random() * 9000)}`;
}

/** Creates (or reuses) an anonymous identity and gives it a unique Guest name. */
export async function signInAsGuest(): Promise<{ ok: boolean; error?: string }> {
  const existing = await supabase.auth.getSession();
  if (!existing.data.session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return { ok: false, error: error?.message ?? "guest_failed" };
    }
  }
  setGuestFlag(true);

  // Unique username, retried on collision.
  for (let i = 0; i < 8; i += 1) {
    const { data } = await supabase.rpc("set_username", { p_username: randomGuestName() });
    const payload = (data ?? {}) as { ok?: boolean };
    if (payload.ok) break;
  }
  return { ok: true };
}

/** Converts the current guest identity into a permanent email account. */
export async function upgradeGuest(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; confirmEmail?: boolean }> {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) return { ok: false, error: error.message };
  setGuestFlag(false);
  return { ok: true, confirmEmail: true };
}

export function clearGuestFlag() { setGuestFlag(false); }
