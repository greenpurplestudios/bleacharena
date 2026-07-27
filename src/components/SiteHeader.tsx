import { Link, useNavigate } from "@tanstack/react-router";
import { BleachLogo } from "./BleachLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function SiteHeader() {
  const { t } = useI18n();
  const { user } = useSession();
  const nav = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center">
          <BleachLogo size="sm" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("home")}
          </Link>
          <Link to="/draft" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("draft")}
          </Link>
          <Link to="/quotes" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("quotes")}
          </Link>
          <Link to="/quiz" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("quizShort")}
          </Link>
          <Link to="/leaderboard" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("leaderboard")}
          </Link>
          <Link to="/characters" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("characters")}
          </Link>
          <Link to="/settings" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("settings")}
          </Link>
          <Link to="/follow" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("followUs")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={signOut}
              className="hidden rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground sm:block"
            >
              {t("signOut")}
            </button>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-lg bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground sm:block"
            >
              {t("signIn")}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}