import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useI18n, type TKey } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { DEFAULT_NAV_PREFS, loadNavPrefs, saveNavPrefs, type NavPrefs } from "@/lib/nav-prefs";
import { play } from "@/lib/sound";

type Text = { en: string; ar: string };
type NavItem = {
  to: string;
  key?: TKey;
  label?: Text;
  icon: string;
  /** Flagship modes get the loudest treatment inside the Play section. */
  primary?: boolean;
};
type NavCategory = { id: string; label: Text; items: NavItem[] };
type NavSection = {
  id: string;
  labelKey?: TKey;
  label?: Text;
  icon: string;
  /** A section is either flat (`items`) or grouped (`categories`). */
  items?: NavItem[];
  categories?: NavCategory[];
  /** Rendered as the hero section of the drawer. */
  hero?: boolean;
};

const SECTIONS: NavSection[] = [
  {
    id: "play",
    labelKey: "play",
    icon: "🎮",
    hero: true,
    categories: [
      {
        id: "battle",
        label: { en: "Battle", ar: "قتال" },
        items: [
          { to: "/play", label: { en: "All Modes", ar: "كل الأوضاع" }, icon: "▶" },
          { to: "/soul-duel", key: "soulDuel", icon: "VS", primary: true },
          { to: "/draft", key: "draft", icon: "刀", primary: true },
          { to: "/rivals", key: "rivals", icon: "⚔" },
        ],
      },
      {
        id: "daily",
        label: { en: "Daily", ar: "يومي" },
        items: [
          { to: "/bleachdle", key: "bleachdle", icon: "◇" },
          { to: "/soul-links", label: { en: "Soul Links", ar: "روابط الأرواح" }, icon: "⛓" },
        ],
      },
      {
        id: "mini",
        label: { en: "Mini Games", ar: "ألعاب مصغرة" },
        items: [
          { to: "/quiz", key: "quizShort", icon: "◈" },
          { to: "/quotes", key: "quotes", icon: "?" },
        ],
      },
    ],
  },
  {
    id: "store",
    labelKey: "storeHub",
    icon: "🛒",
    items: [
      { to: "/store", label: { en: "Store", ar: "المتجر" }, icon: "🛍" },
      { to: "/shop", label: { en: "Urahara's Shop", ar: "متجر أوراهارا" }, icon: "✧" },
      { to: "/forge", key: "forge", icon: "🔨" },
      { to: "/packs", label: { en: "Kon's Kiosk", ar: "كشك كون" }, icon: "🎪" },
    ],
  },
  {
    id: "profile",
    labelKey: "profile",
    icon: "👤",
    items: [
      { to: "/profile", key: "myProfile", icon: "☯" },
      { to: "/levels", key: "levels", icon: "▲" },
      { to: "/achievements", key: "achievements", icon: "🏅" },
    ],
  },
  {
    id: "progress",
    labelKey: "navProgress",
    icon: "🎁",
    items: [
      { to: "/daily", key: "daily", icon: "☀" },
      { to: "/missions", key: "missions", icon: "◎" },
      { to: "/rewards", key: "weeklyRewards", icon: "🏆" },
    ],
  },
  {
    id: "collection",
    labelKey: "collection",
    icon: "📚",
    items: [
      { to: "/characters", key: "characters", icon: "☰" },
      { to: "/collection", key: "collection", icon: "▦" },
    ],
  },
  {
    id: "community",
    labelKey: "navCommunity",
    icon: "🏆",
    items: [
      { to: "/leaderboard", key: "leaderboard", icon: "★" },
      { to: "/friends", key: "friends", icon: "♥" },
      { to: "/clans", key: "clans", icon: "⚑" },
      { to: "/chat", key: "chat", icon: "💬" },
    ],
  },
  {
    id: "settings",
    labelKey: "settings",
    icon: "⚙️",
    items: [
      { to: "/settings", key: "settings", icon: "⚙" },
      { to: "/follow", key: "followUs", icon: "@" },
    ],
  },
];

const STORAGE_KEY = "ba:mobilenav:lastSection";

function sectionItems(s: NavSection): NavItem[] {
  return s.items ?? (s.categories ?? []).flatMap((c) => c.items);
}

export function MobileNav() {
  const { t, dir, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const nav = useNavigate();
  const qc = useQueryClient();

  // Start from defaults so SSR and the first client render agree; stored
  // preferences are applied after mount.
  const [prefs, setPrefs] = useState<NavPrefs>(DEFAULT_NAV_PREFS);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  const activeSectionId = useMemo(() => {
    for (const s of SECTIONS) {
      if (sectionItems(s).some((it) => it.to === pathname)) return s.id;
    }
    return null;
  }, [pathname]);

  const [expanded, setExpanded] = useState<string | null>("play");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && SECTIONS.some((s) => s.id === stored)) setExpanded(stored);
      else if (activeSectionId) setExpanded(activeSectionId);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Preferences can change from the Settings page while this is mounted.
  useEffect(() => {
    const onPrefs = (e: Event) => setPrefs((e as CustomEvent<NavPrefs>).detail ?? loadNavPrefs());
    const onOpen = () => setOpen(true);
    setPrefs(loadNavPrefs());
    window.addEventListener("ba:nav-prefs", onPrefs as EventListener);
    window.addEventListener("ba:open-nav", onOpen);
    return () => {
      window.removeEventListener("ba:nav-prefs", onPrefs as EventListener);
      window.removeEventListener("ba:open-nav", onOpen);
    };
  }, []);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  const toggleSection = (id: string) => {
    setExpanded((cur) => {
      const next = cur === id ? null : id;
      try {
        if (next) window.localStorage.setItem(STORAGE_KEY, next);
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
      return next;
    });
  };

  /* ---------------- draggable floating button ---------------- */

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    dragging.current = true;
    moved.current = false;
    btnRef.current?.setPointerCapture(e.pointerId);
    setDrag({ x: e.clientX, y: e.clientY });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    setDrag((d) => {
      if (d && (Math.abs(e.clientX - d.x) > 6 || Math.abs(e.clientY - d.y) > 6)) moved.current = true;
      return { x: e.clientX, y: e.clientY };
    });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    btnRef.current?.releasePointerCapture?.(e.pointerId);
    const wasMoved = moved.current;
    const x = e.clientX;
    const y = e.clientY;
    setDrag(null);
    if (wasMoved) {
      // Snap to whichever vertical edge is closest; keep the vertical spot.
      const nearStart = dir === "rtl" ? x > window.innerWidth / 2 : x < window.innerWidth / 2;
      const next: NavPrefs = {
        ...prefs,
        side: nearStart ? "start" : "end",
        y: Math.min(0.92, Math.max(0.08, y / Math.max(1, window.innerHeight))),
      };
      setPrefs(next);
      saveNavPrefs(next);
      return;
    }
    play("tap");
    setOpen((v) => !v);
  }, [dir, prefs]);

  const edge = prefs.side === "start"
    ? (dir === "rtl" ? { right: 16 } : { left: 16 })
    : (dir === "rtl" ? { left: 16 } : { right: 16 });

  const floatStyle: React.CSSProperties = drag
    ? { left: drag.x - 28, top: drag.y - 28, touchAction: "none" }
    : { ...edge, top: `min(calc(100vh - 6rem), max(4.5rem, ${prefs.y * 100}vh))`, touchAction: "none" };

  const panelEdge = prefs.side === "start"
    ? (dir === "rtl" ? "right-4" : "left-4")
    : (dir === "rtl" ? "left-4" : "right-4");

  const renderItem = (it: NavItem, emphasis = false) => {
    const active = pathname === it.to;
    const label = it.label ? it.label[locale] : t(it.key as TKey);
    return (
      <Link
        key={it.to + (it.key ?? it.label?.en ?? "")}
        to={it.to}
        className={`flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors active:scale-[0.98] ${
          emphasis ? "py-3 font-display font-black uppercase tracking-[0.16em] rtl:tracking-normal" : "py-2.5 text-sm"
        } ${
          active
            ? "bg-primary/20 text-primary shadow-[inset_0_1px_0_oklch(1_0_0/0.1)]"
            : emphasis
              ? "border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] text-foreground hover:border-primary/40"
              : "text-foreground/90 hover:bg-white/5"
        }`}
      >
        <span
          aria-hidden
          className={`flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 font-display font-bold ${
            emphasis ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs"
          }`}
        >
          {it.icon}
        </span>
        <span className="min-w-0 truncate">{label}</span>
      </Link>
    );
  };

  const renderSection = (s: NavSection) => {
    const isOpen = expanded === s.id;
    const hasActive = sectionItems(s).some((it) => it.to === pathname);
    const title = s.label ? s.label[locale] : t(s.labelKey as TKey);
    return (
      <li key={s.id} className="border-b border-white/5 last:border-b-0">
        <button
          type="button"
          onClick={() => toggleSection(s.id)}
          aria-expanded={isOpen}
          className={`flex w-full items-center gap-3 px-4 text-start transition-colors active:scale-[0.98] ${
            s.hero ? "py-3.5" : "py-3"
          } min-h-11 ${hasActive ? "text-primary" : "text-foreground hover:bg-white/5"}`}
          style={
            s.hero
              ? {
                  background:
                    "linear-gradient(100deg, oklch(0.75 0.18 55 / 0.18), oklch(0.75 0.18 55 / 0.02) 65%)",
                }
              : undefined
          }
        >
          <span
            aria-hidden
            className={`flex shrink-0 items-center justify-center rounded-lg border text-base shadow-[inset_0_1px_0_oklch(1_0_0/0.08)] ${
              s.hero ? "h-10 w-10 border-primary/50 bg-primary/15" : "h-9 w-9 border-white/10 bg-white/5"
            }`}
          >
            {s.icon}
          </span>
          <span
            className={`flex-1 min-w-0 truncate font-display font-bold uppercase tracking-[0.18em] rtl:tracking-normal ${
              s.hero ? "text-base text-primary" : "text-sm"
            }`}
          >
            {title}
          </span>
          <span
            aria-hidden
            className={`shrink-0 text-xs text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
          >
            ▸
          </span>
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            {s.categories ? (
              <div className="space-y-3 px-2 pb-3 pt-1">
                {s.categories.map((cat) => (
                  <div key={cat.id}>
                    <div className="px-2 pb-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground rtl:tracking-normal">
                      {cat.label[locale]}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {cat.items.map((it) => renderItem(it, !!it.primary))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-1 px-2 pb-2">
                {(s.items ?? []).map((it) => (
                  <li key={it.to + (it.key ?? "")}>{renderItem(it)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <>
      {prefs.floating && (
        <button
          ref={btnRef}
          type="button"
          aria-label={t("menu")}
          aria-expanded={open}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="fixed z-50 flex h-14 w-14 select-none items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.35),0_10px_30px_-8px_oklch(0.75_0.18_55/0.7)] transition-transform duration-150 active:scale-90"
          style={floatStyle}
        >
          <span className="text-2xl font-black">{open ? "×" : "≡"}</span>
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            style={{ animation: "fade-in 0.2s ease-out both" }}
          />
          <nav
            className={`panel fixed ${panelEdge} z-50 flex max-h-[74vh] w-[min(21rem,calc(100vw-2rem))] flex-col overflow-hidden bg-card/95 backdrop-blur-xl`}
            style={{ animation: "scale-in 0.22s ease-out both", bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("menu")}</span>
              <Link
                to="/"
                className={`rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  pathname === "/" ? "border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("home")}
              </Link>
            </div>
            <ul className="flex flex-col overflow-y-auto overscroll-contain">
              {SECTIONS.map(renderSection)}
              <li className="border-t border-white/10">
                {user ? (
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-white/5"
                  >
                    <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 font-display text-sm font-bold">↩</span>
                    <span className="font-medium">{t("signOut")}</span>
                  </button>
                ) : (
                  <Link to="/auth" className="flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-white/5">
                    <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 font-display text-sm font-bold">✦</span>
                    <span className="font-medium">{t("signIn")}</span>
                  </Link>
                )}
              </li>
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
