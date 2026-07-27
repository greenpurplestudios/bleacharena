import { createFileRoute, Link } from "@tanstack/react-router";
import { BleachLogo } from "@/components/BleachLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { t } = useI18n();
  const { user } = useSession();
  return (
    <>
      <ReiatsuBackground count={34} />
      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <BleachLogo size="sm" />
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/settings" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground">
              {t("account")}
            </Link>
          ) : (
            <Link to="/auth" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground">
              {t("signIn")}
            </Link>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 pb-16 text-center">
        <div
          className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.4em] text-muted-foreground backdrop-blur-md"
          style={{ animation: "card-in 0.6s ease-out both" }}
        >
          Senkaimon · Reiatsu · Thousand-Year Blood War
        </div>

        <div style={{ animation: "card-in 0.7s ease-out both" }}>
          <BleachLogo size="lg" />
        </div>

        <p
          className="mt-6 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animation: "card-in 0.8s 0.1s ease-out both" }}
        >
          {t("tagline")}
        </p>

        <Link
          to="/draft"
          className="glow-orange group mt-10 inline-flex items-center gap-3 rounded-2xl bg-primary px-8 py-4 font-display text-base font-black uppercase tracking-[0.25em] text-primary-foreground transition-transform hover:scale-[1.03] active:scale-[0.98] sm:text-lg"
          style={{ animation: "pulse-glow 2.8s ease-in-out infinite, card-in 0.9s 0.2s ease-out both" }}
        >
          <span aria-hidden>卍</span>
          {t("startDraft")}
          <span aria-hidden className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">→</span>
        </Link>

        <section
          className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-3 text-start sm:grid-cols-3"
          style={{ animation: "card-in 1s 0.3s ease-out both" }}
        >
          {[
            { n: "01", k: "step1" as const },
            { n: "02", k: "step2" as const },
            { n: "03", k: "step3" as const },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md"
            >
              <span className="font-display text-xs font-bold tracking-widest text-accent">
                {s.n}
              </span>
              <p className="mt-2 text-sm text-foreground/90">{t(s.k)}</p>
            </div>
          ))}
        </section>

        <section
          className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animation: "card-in 1.1s 0.4s ease-out both" }}
        >
          {[
            { to: "/draft", key: "draft", desc: "bleachDraftDesc", icon: "卍" },
            { to: "/packs", key: "packs", desc: "packsDesc", icon: "✦" },
            { to: "/collection", key: "collection", desc: "collectionDesc", icon: "▦" },
            { to: "/store", key: "store", desc: "storeDesc", icon: "✧" },
            { to: "/quotes", key: "quotes", desc: "whoSaidThatDesc", icon: "?" },
            { to: "/quiz", key: "quizShort", desc: "quizDesc", icon: "◈" },
            { to: "/leaderboard", key: "leaderboard", desc: "leaderboardDesc", icon: "★" },
            { to: "/rivals", key: "rivals", desc: "rivalsDesc", icon: "⚔" },
            { to: "/missions", key: "missions", desc: "missionsDesc", icon: "◎" },
            { to: "/characters", key: "characters", desc: "charactersDesc", icon: "☰" },
            { to: "/settings", key: "settings", desc: "settingsDesc", icon: "⚙" },
          ].map((m) => (
            <Link
              key={m.to}
              to={m.to as "/draft"}
              className="group rounded-2xl border border-white/10 bg-card/60 p-5 text-start backdrop-blur-md transition-all hover:border-primary/40 hover:bg-white/[0.06]"
            >
              <div className="mb-2 font-display text-3xl text-primary" aria-hidden>{m.icon}</div>
              <div className="font-display text-lg font-bold">{t(m.key as "draft")}</div>
              <p className="mt-1 text-xs text-muted-foreground">{t(m.desc as "bleachDraftDesc")}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
