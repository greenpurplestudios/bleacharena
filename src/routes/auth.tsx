import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { BleachLogo } from "@/components/BleachLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { signInAsGuest, upgradeGuest, isGuestUser } from "@/lib/guest";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup", "reset"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Bleach Arena" },
      { name: "description", content: "Sign in or create a Bleach Arena account to save your collection, packs, souls and rivals progress." },
      { property: "og:title", content: "Sign in — Bleach Arena" },
      { property: "og:description", content: "Create your permanent Bleach Arena account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "reset";

const L = {
  guest: { en: "Play as Guest", ar: "العب كضيف" },
  guestDesc: {
    en: "Jump straight in. Your progress is saved on this device and can be turned into a full account any time.",
    ar: "ابدأ اللعب فورًا. يتم حفظ تقدمك على هذا الجهاز ويمكنك تحويله إلى حساب كامل في أي وقت.",
  },
  upgradeTitle: { en: "Save your guest progress", ar: "احفظ تقدّمك كضيف" },
  upgradeDesc: {
    en: "You're playing as a guest. Add an email and password to keep everything on any device.",
    ar: "أنت تلعب كضيف. أضف بريدًا وكلمة مرور للاحتفاظ بكل شيء على أي جهاز.",
  },
  upgrade: { en: "Save account", ar: "حفظ الحساب" },
  upgraded: {
    en: "Almost there — check your email to confirm the address. Your progress is already linked.",
    ar: "بقي القليل — تحقق من بريدك لتأكيد العنوان. تقدّمك مرتبط بالفعل.",
  },
  keepPlaying: { en: "Keep playing", ar: "متابعة اللعب" },
} as const;

function safeRedirect(raw: string | undefined): string {
  if (!raw) return "/home";
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return "/home";
    if (url.pathname === "/") return "/home";
    return url.pathname + url.search + url.hash;
  } catch {
    return raw.startsWith("/") ? raw : "/home";
  }
}

function AuthPage() {
  const { t, dir, locale } = useI18n();
  const nav = useNavigate();
  const search = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<Mode>(search.mode ?? "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [guest, setGuest] = useState(false);

  // Redirect away if already signed in (guests stay so they can upgrade).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (!data.session) return;
      if (isGuestUser(data.session.user)) { setGuest(true); return; }
      nav({ to: safeRedirect(search.redirect) as "/" });
    });
    return () => { cancelled = true; };
  }, [nav, search.redirect]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (guest) {
        const res = await upgradeGuest(email, password);
        if (!res.ok) throw new Error(res.error);
        setMsg({ kind: "ok", text: L.upgraded[locale] });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Remember Me: if unchecked, drop the persisted session on tab close by
        // clearing storage flag. persistSession is on by default; we honor the
        // user's preference by scoping via sessionStorage swap.
        if (!remember) {
          try { localStorage.removeItem("bd:remember"); } catch {}
        } else {
          try { localStorage.setItem("bd:remember", "1"); } catch {}
        }
        nav({ to: safeRedirect(search.redirect) as "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: t("authCheckEmail") });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        setMsg({ kind: "ok", text: t("authResetSent") });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setMsg({ kind: "err", text: message });
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const redirect = `${window.location.origin}/auth`;
      const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirect });
      if (res.error) throw res.error;
    } catch (e: unknown) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Google sign-in failed" });
    } finally {
      setBusy(false);
    }
  };

  const playAsGuest = async () => {
    setBusy(true);
    setMsg(null);
    const res = await signInAsGuest();
    setBusy(false);
    if (!res.ok) {
      setMsg({ kind: "err", text: res.error ?? "Guest sign-in failed" });
      return;
    }
    nav({ to: safeRedirect(search.redirect) as "/" });
  };

  return (
    <>
      <ReiatsuBackground count={22} />
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center"><BleachLogo size="sm" /></Link>
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center px-4 pb-16" dir={dir}>
        <div className="w-full rounded-2xl border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur-xl" style={{ animation: "card-in 0.5s ease-out both" }}>
          <h1 className="font-display text-2xl font-black text-glow-orange">
            {guest ? L.upgradeTitle[locale]
              : mode === "signin" ? t("authSignIn")
              : mode === "signup" ? t("authCreateAccount") : t("authResetPassword")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {guest ? L.upgradeDesc[locale]
              : mode === "signin" ? t("authSignInDesc")
              : mode === "signup" ? t("authSignUpDesc") : t("authResetDesc")}
          </p>

          {!guest && mode !== "reset" && (
            <button
              type="button"
              onClick={google}
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
            >
              <span aria-hidden className="text-lg">G</span>
              {t("authContinueGoogle")}
            </button>
          )}

          {!guest && mode !== "reset" && (
            <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <span className="h-px flex-1 bg-white/10" /> {t("or")} <span className="h-px flex-1 bg-white/10" />
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">{t("email")}</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder="you@example.com"
            />
            {(guest || mode !== "reset") && (
              <>
                <label className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{t("password")}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={guest || mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </>
            )}
            {!guest && mode === "signin" && (
              <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                {t("authRememberMe")}
              </label>
            )}
            {msg && (
              <p className={`text-xs ${msg.kind === "err" ? "text-red-400" : "text-accent"}`}>{msg.text}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="glow-orange mt-2 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
            >
              {busy ? "…"
                : guest ? L.upgrade[locale]
                : mode === "signin" ? t("authSignIn")
                : mode === "signup" ? t("authCreateAccount") : t("authSendResetLink")}
            </button>
          </form>

          {!guest && (
            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <button
                type="button"
                onClick={playAsGuest}
                disabled={busy}
                className="w-full rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 font-display text-sm font-black uppercase tracking-widest text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
              >
                {L.guest[locale]}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{L.guestDesc[locale]}</p>
            </div>
          )}

          {guest ? (
            <div className="mt-5 text-center">
              <Link to="/home" className="text-xs text-muted-foreground hover:text-foreground">
                {L.keepPlaying[locale]}
              </Link>
            </div>
          ) : (
          <div className="mt-5 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
            {mode !== "signin" ? (
              <button type="button" onClick={() => { setMode("signin"); setMsg(null); }} className="hover:text-foreground">{t("authHaveAccount")}</button>
            ) : (
              <button type="button" onClick={() => { setMode("signup"); setMsg(null); }} className="hover:text-foreground">{t("authNewHere")}</button>
            )}
            {mode !== "reset" ? (
              <button type="button" onClick={() => { setMode("reset"); setMsg(null); }} className="hover:text-foreground">{t("authForgot")}</button>
            ) : (
              <button type="button" onClick={() => { setMode("signin"); setMsg(null); }} className="hover:text-foreground">{t("authBackToSignIn")}</button>
            )}
          </div>
          )}
        </div>
      </main>
    </>
  );
}