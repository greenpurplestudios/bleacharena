import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="relative z-10 mt-auto border-t border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row">
        <span className="tracking-wider">
          © {new Date().getFullYear()} · {t("madeBy")}
        </span>
        <Link
          to="/follow"
          className="font-semibold uppercase tracking-[0.25em] text-accent transition-colors hover:text-primary"
        >
          {t("followUs")} →
        </Link>
      </div>
    </footer>
  );
}