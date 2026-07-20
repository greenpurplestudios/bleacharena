import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      role="group"
      aria-label={t("language")}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      {(["en", "ar"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={
            "px-3 py-1 text-xs font-medium rounded-full transition-all " +
            (locale === l
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_oklch(0.75_0.18_55/0.7)]"
              : "text-muted-foreground hover:text-foreground")
          }
          aria-pressed={locale === l}
        >
          {l === "en" ? "EN" : "ع"}
        </button>
      ))}
    </div>
  );
}