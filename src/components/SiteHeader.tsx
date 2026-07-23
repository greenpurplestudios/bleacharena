import { Link } from "@tanstack/react-router";
import { BleachLogo } from "./BleachLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

export function SiteHeader() {
  const { t } = useI18n();
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
          <Link to="/leaderboard" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("leaderboard")}
          </Link>
          <Link to="/follow" className="text-muted-foreground transition-colors hover:text-foreground">
            {t("followUs")}
          </Link>
        </nav>
        <LanguageSwitcher />
      </div>
    </header>
  );
}