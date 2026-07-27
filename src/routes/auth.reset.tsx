import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { BleachLogo } from "@/components/BleachLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({
    meta: [
      { title: "Reset password — Bleach Arena" },
      { name: "description", content: "Choose a new password for your Bleach Arena account." },
      { property: "og:title", content: "Reset password — Bleach Arena" },
      { property: "og:description", content: "Choose a new password for your Bleach Arena account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  useEffect(() => {
    // Supabase auto-consumes recovery hash and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg({ kind: "ok", text: t("authPasswordUpdated") });
      setTimeout(() => nav({ to: "/" }), 1200);
    } catch (e: unknown) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ReiatsuBackground count={18} />
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center"><BleachLogo size="sm" /></Link>
        <LanguageSwitcher />
      </header>
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col items-center justify-center px-4">
        <form onSubmit={submit} className="w-full rounded-2xl border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur-xl">
          <h1 className="font-display text-2xl font-black text-glow-orange">{t("authResetPassword")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{ready ? t("authChooseNewPassword") : t("authOpenFromEmail")}</p>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!ready}
            className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none disabled:opacity-50"
            placeholder="••••••••"
          />
          {msg && <p className={`mt-3 text-xs ${msg.kind === "err" ? "text-red-400" : "text-accent"}`}>{msg.text}</p>}
          <button
            type="submit"
            disabled={busy || !ready}
            className="glow-orange mt-4 w-full rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : t("authUpdatePassword")}
          </button>
        </form>
      </main>
    </>
  );
}