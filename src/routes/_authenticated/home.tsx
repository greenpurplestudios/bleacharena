import { createFileRoute, Link } from "@tanstack/react-router";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";
import { UraharaGuide } from "@/components/UraharaGuide";
import { NewsFeed, NewsNotification } from "@/components/NewsFeed";
import { BleachLogo } from "@/components/BleachLogo";
import { useI18n, type TKey } from "@/lib/i18n";
import { play, startAmbient } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import duelBanner from "@/assets/soulduel/soul_duel_banner.jpg";
import duelLogo from "@/assets/soulduel/soul_duel_logo.png";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Bleach Arena" },
      {
        name: "description",
        content:
          "Your Bleach Arena hub: Draft, Bleachdle, daily rewards, missions, Urahara's Shop, collection, clans, leaderboards and the upcoming Soul Duel.",
      },
      { property: "og:title", content: "Bleach Arena — Home" },
      { property: "og:description", content: "Every Bleach Arena mode in one premium hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomeHub,
});

type Tile = {
  to: string;
  key: TKey;
  desc: TKey;
  icon: string;
  tone: "orange" | "blue" | "violet";
  soon?: boolean;
  fresh?: boolean;
};

const TILES: Tile[] = [
  { to: "/bleachdle", key: "bleachdle", desc: "bleachdleDesc", icon: "◇", tone: "blue" },
  { to: "/daily", key: "dailyLogin", desc: "dailyLoginDesc", icon: "☀", tone: "orange" },
  { to: "/missions", key: "missions", desc: "missionsDesc", icon: "◎", tone: "blue" },
  { to: "/rewards", key: "weeklyRewards", desc: "weeklyRewardsDesc", icon: "🏆", tone: "orange" },
  { to: "/store", key: "store", desc: "storeDesc", icon: "✧", tone: "orange" },
  { to: "/collection", key: "collection", desc: "collectionDesc", icon: "▦", tone: "blue" },
  { to: "/friends", key: "friendsAndClans", desc: "friendsAndClansDesc", icon: "♥", tone: "violet" },
  { to: "/leaderboard", key: "leaderboard", desc: "leaderboardDesc", icon: "★", tone: "blue" },
  { to: "/soul-duel", key: "soulDuel", desc: "soulDuelShort", icon: "⚔", tone: "violet", fresh: true },
];

const TONE: Record<Tile["tone"], string> = {
  orange: "hover:border-primary/50 group-hover:text-primary",
  blue: "hover:border-accent/50 group-hover:text-accent",
  violet: "hover:border-[oklch(0.7_0.15_300)]/50",
};

function HomeHub() {
  const { t } = useI18n();

  return (
    <>
      <Atmosphere variant="reiatsu" count={26} />
      <SiteHeader />

      <main className="page-enter mx-auto max-w-5xl px-4 pb-24 pt-8 sm:pt-12">
        <section className="text-center">
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {t("homeHubKicker")}
          </span>
          <div className="mt-3 flex justify-center">
            <BleachLogo size="lg" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-black text-glow-orange sm:text-3xl">
            {t("homeWelcome")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-balance text-sm text-muted-foreground">
            {t("homeSubtitle")}
          </p>
        </section>

        {/* Primary CTA */}
        <Link
          to="/draft"
          onClick={() => { play("sword"); startAmbient(); }}
          className="tactile glow-orange group relative mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-primary px-6 py-6 text-primary-foreground sm:px-9 sm:py-8"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-white/25 blur-md"
            style={{ animation: "gate-sweep 4.5s ease-in-out infinite" }}
          />
          <span className="relative text-start">
            <span className="block font-display text-2xl font-black uppercase tracking-[0.18em] sm:text-3xl">
              {t("playDraft")}
            </span>
            <span className="mt-1 block text-xs font-semibold opacity-80 sm:text-sm">
              {t("bleachDraftDesc")}
            </span>
          </span>
          <span aria-hidden className="relative font-display text-4xl sm:text-5xl">卍</span>
        </Link>

        {/* Soul Duel launch banner */}
        <Link
          to="/soul-duel"
          onClick={() => { play("sword"); haptic("draft"); startAmbient(); }}
          className="tactile group relative mt-4 block overflow-hidden rounded-3xl border border-white/12"
          style={{ boxShadow: "0 0 44px -20px oklch(0.7 0.15 300)" }}
        >
          <img
            src={duelBanner}
            alt=""
            aria-hidden
            className="h-36 w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-44"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, oklch(0.12 0.02 280 / 0.25), oklch(0.08 0.02 280 / 0.9))",
            }}
          />
          <span className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <img src={duelLogo} alt={t("soulDuel")} className="h-14 w-auto sm:h-16" />
            <span className="mt-2 rounded-full border border-primary/50 bg-primary/20 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.25em] text-primary rtl:tracking-normal">
              {t("sdNewBadge")}
            </span>
            <span className="mt-2 font-display text-[11px] font-black uppercase tracking-[0.25em] text-accent rtl:tracking-normal">
              {t("newsPlayNow")}
            </span>
          </span>
        </Link>

        {/* Latest announcement */}
        <NewsNotification className="mt-5" />

        {/* Urahara guide */}
        <UraharaGuide className="mt-5" />

        <h2 className="mt-10 text-start font-display text-lg font-bold">
          {t("homeExplore")}
        </h2>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile, i) => (
            <Link
              key={tile.to + tile.key}
              to={tile.to as "/draft"}
              onClick={() => play("press")}
              className={`tactile group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-5 text-start backdrop-blur-md ${TONE[tile.tone]}`}
              style={{ animation: `card-in 0.5s ${0.04 * i}s ease-out both` }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "oklch(0.75 0.18 55 / 0.35)" }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="font-display text-3xl text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden>
                  {tile.icon}
                </span>
                {tile.fresh && (
                  <span className="rounded-full border border-primary/50 bg-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary">
                    {t("sdNewBadge")}
                  </span>
                )}
                {tile.soon && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-accent">
                    {t("comingSoon")}
                  </span>
                )}
              </div>
              <div className="relative mt-3 font-display text-lg font-bold">{t(tile.key)}</div>
              <p className="relative mt-1 text-xs text-muted-foreground">{t(tile.desc)}</p>
            </Link>
          ))}
        </section>
        <NewsFeed className="mt-12" />
      </main>
    </>
  );
}