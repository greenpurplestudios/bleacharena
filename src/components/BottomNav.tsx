import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { loadNavPrefs, openNavDrawer, type NavPrefs } from "@/lib/nav-prefs";
import { play, playDuelClash } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Tab = {
  id: string;
  to?: "/play" | "/store" | "/collection" | "/profile";
  label: { en: string; ar: string };
  glyph: string;
  /** Matches these path prefixes for the active state. */
  match: string[];
};

/** Crossed swords — the Play tab's hero icon. */
function SwordsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M14.5 17.5 20 22l2-2-4.5-5.5" />
      <path d="m3 2 9.5 9.5" />
      <path d="M20 2h-3l-9 9" />
      <path d="M9.5 17.5 4 22l-2-2 4.5-5.5" />
      <path d="M4 2h3l2.5 2.5" />
      <path d="m13 13 3 3" />
    </svg>
  );
}

/** Simple user silhouette for the Profile tab. */
function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.9 3.6-6.5 8-6.5s8 2.6 8 6.5v1H4v-1Z" />
    </svg>
  );
}

const TABS: Tab[] = [
  { id: "play", to: "/play", label: { en: "Play", ar: "العب" }, glyph: "▶", match: ["/play", "/soul-duel", "/draft", "/rivals", "/bleachdle", "/soul-links", "/quiz", "/quotes"] },
  { id: "store", to: "/store", label: { en: "Store", ar: "المتجر" }, glyph: "✧", match: ["/store", "/shop", "/forge", "/packs"] },
  { id: "collection", to: "/collection", label: { en: "Collection", ar: "المجموعة" }, glyph: "▦", match: ["/collection", "/characters"] },
  { id: "profile", to: "/profile", label: { en: "Profile", ar: "الملف" }, glyph: "☯", match: ["/profile", "/levels", "/achievements", "/settings"] },
  { id: "more", label: { en: "More", ar: "المزيد" }, glyph: "≡", match: [] },
];

/**
 * Fixed mobile-game style tab bar. It is anchored to the viewport (not the
 * document) so it never scrolls with content, and it respects the iOS home
 * indicator via `env(safe-area-inset-bottom)`.
 */
export function BottomNav() {
  const { locale } = useI18n();
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [prefs, setPrefs] = useState<NavPrefs>(() => loadNavPrefs());
  const [clash, setClash] = useState(0);
  const clashAt = useRef(0);

  useEffect(() => {
    const onPrefs = (e: Event) => setPrefs((e as CustomEvent<NavPrefs>).detail ?? loadNavPrefs());
    window.addEventListener("ba:nav-prefs", onPrefs as EventListener);
    setPrefs(loadNavPrefs());
    return () => window.removeEventListener("ba:nav-prefs", onPrefs as EventListener);
  }, []);

  const hiddenRoute = pathname === "/" || pathname.startsWith("/auth") || pathname === "/follow";
  const show = prefs.mode === "bottom" && !!user && !hiddenRoute;

  // Keep page content clear of the bar without every page needing padding.
  useEffect(() => {
    const el = document.body;
    if (show) el.classList.add("has-bottom-nav");
    else el.classList.remove("has-bottom-nav");
    return () => el.classList.remove("has-bottom-nav");
  }, [show]);

  if (!show) return null;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/25 bg-[#080604]/95 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        boxShadow:
          "0 -18px 40px -22px oklch(0 0 0 / 1), inset 0 1px 0 color-mix(in oklab, var(--color-primary) 30%, transparent)",
      }}
    >
      {/* Hot orange hairline along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-primary) 85%, transparent), transparent)",
        }}
      />
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
          const isPlay = tab.id === "play";
          const inner = (
            <>
              <span
                aria-hidden
                className={`flex items-center justify-center rounded-2xl font-display transition-all duration-200 ${
                  isPlay
                    ? "h-11 w-11 -mt-5 border border-primary/70 text-primary-foreground shadow-[0_10px_26px_-8px_oklch(0.75_0.18_55/0.85)] group-active:scale-90"
                    : active
                      ? "h-8 w-12 bg-primary/15 text-primary"
                      : "h-8 w-12 text-muted-foreground"
                }`}
                style={
                  isPlay
                    ? {
                        background:
                          "linear-gradient(180deg, color-mix(in oklab, var(--color-primary) 92%, white 8%), color-mix(in oklab, var(--color-primary) 70%, black 30%))",
                      }
                    : undefined
                }
              >
                {isPlay ? (
                  <SwordsIcon className="h-6 w-6" />
                ) : tab.id === "profile" ? (
                  <UserIcon className="h-[18px] w-[18px]" />
                ) : (
                  <span className="text-base">{tab.glyph}</span>
                )}
              </span>
              <span
                className={`mt-0.5 block truncate text-[10px] font-bold uppercase tracking-wider ${
                  isPlay ? "text-primary" : active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label[locale]}
              </span>
            </>
          );
          return (
            <li key={tab.id} className="group min-w-0">
              {tab.to ? (
                <Link
                  to={tab.to}
                  onClick={() => {
                    if (isPlay) {
                      const now = Date.now();
                      if (now - clashAt.current > 700) {
                        clashAt.current = now;
                        playDuelClash();
                        haptic("pack");
                        setClash((n) => n + 1);
                      }
                    } else {
                      play("tap");
                    }
                  }}
                  className="flex min-h-14 flex-col items-center justify-center px-1 py-1.5 transition-transform active:scale-90"
                >
                  {inner}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => { play("tap"); openNavDrawer(); }}
                  className="flex min-h-14 w-full flex-col items-center justify-center px-1 py-1.5 transition-transform active:scale-90"
                >
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
