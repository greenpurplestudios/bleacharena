import { useI18n } from "@/lib/i18n";

const L = {
  heading: { en: "Support Bleach Arena", ar: "ادعم بليتش أرينا" },
  text: {
    en: "Enjoying Bleach Arena? Help us keep building and improving it.",
    ar: "استمتعت ببليتش أرينا؟ ساعدنا على الاستمرار في بنائها وتطويرها.",
  },
  cta: { en: "Support us on Ko-fi", ar: "ادعمنا على Ko-fi" },
} as const;

export function SiteFooter() {
  const { t, locale } = useI18n();
  return (
    <footer className="relative z-10 mt-auto border-t border-white/5 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-7 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="min-w-0">
          <h2 className="font-display text-base font-black uppercase tracking-widest text-foreground">
            {L.heading[locale]}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{L.text[locale]}</p>
        </div>
        <a
          href="https://ko-fi.com/greenpurplestudios"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/20"
          style={{ boxShadow: "0 12px 40px -20px var(--primary)" }}
        >
          <span aria-hidden className="text-base transition-transform group-hover:scale-110">☕</span>
          {L.cta[locale]}
        </a>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-5 text-center text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:text-start">
        © {new Date().getFullYear()} · {t("madeBy")}
      </div>
    </footer>
  );
}
