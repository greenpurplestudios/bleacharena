import { supabase } from "@/integrations/supabase/client";

export const REFERRAL_STORAGE_KEY = "ba:pending-ref";

export interface ReferralState {
  code: string;
  total: number;
  soulsEarned: number;
  alreadyRedeemed: boolean;
  eligible: boolean;
}

export async function getMyReferral(): Promise<ReferralState | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_my_referral");
  if (error || !data) return null;
  const p = data as {
    ok: boolean; code?: string; total?: number; souls_earned?: number;
    already_redeemed?: boolean; eligible?: boolean;
  };
  if (!p.ok || !p.code) return null;
  return {
    code: p.code,
    total: Number(p.total ?? 0),
    soulsEarned: Number(p.souls_earned ?? 0),
    alreadyRedeemed: !!p.already_redeemed,
    eligible: !!p.eligible,
  };
}

export async function redeemReferral(code: string): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("redeem_referral", { p_code: code });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string };
  return p.ok ? { ok: true } : { ok: false, error: p.error };
}

export function referralLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://bleacharena.com";
  return `${origin}/auth?ref=${code}`;
}

/** Stores a ?ref= code seen before sign-up so it can be redeemed after login. */
export function capturePendingReferral() {
  if (typeof window === "undefined") return;
  const code = new URLSearchParams(window.location.search).get("ref");
  if (code && code.trim().length === 8) {
    try { localStorage.setItem(REFERRAL_STORAGE_KEY, code.trim().toUpperCase()); } catch { /* ignore */ }
  }
}

/** Redeems a stored invite code once the user is signed in. */
export async function consumePendingReferral(): Promise<{ redeemed: boolean }> {
  if (typeof window === "undefined") return { redeemed: false };
  let code: string | null = null;
  try { code = localStorage.getItem(REFERRAL_STORAGE_KEY); } catch { /* ignore */ }
  if (!code) return { redeemed: false };
  const res = await redeemReferral(code);
  // Clear on success and on terminal failures so we don't retry forever.
  if (res.ok || ["already_redeemed", "self_referral", "invalid_code", "account_too_old"].includes(res.error ?? "")) {
    try { localStorage.removeItem(REFERRAL_STORAGE_KEY); } catch { /* ignore */ }
  }
  return { redeemed: res.ok };
}