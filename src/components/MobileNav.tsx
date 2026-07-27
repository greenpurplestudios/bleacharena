import { useEffect, useMemo, useState } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useI18n, type TKey } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = { to: string; key: TKey; icon: string };
type NavGroup = { id: string; labelKey: TKey; icon: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    id: "play",
    labelKey: "play",
    icon: "🎮",
    items: [
      { to: "/draft", key: "draft", icon: "卍" },
      { to: "/bleachdle", key: "bleachdle", icon: "◇" },
      { to: "/rivals", key: "rivals", icon: "⚔" },
      { to: "/quotes", key: "quotes", icon: "?" },
      { to: "/quiz", key: "quizShort", icon: "◈" },
    ],
  },
  {
    id: "profile",
    labelKey: "profile",
    icon: "👤",
    items: [
      { to: "/profile", key: "myProfile", icon: "☯" },
      { to: "/profile", key: "statistics", icon: "📊" },
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
      { to: "/packs", key: "packs", icon: "✦" },
    ],
  },
  {
    id: "community",
    labelKey: "navCommunity",
    icon: "🏆",
    items: [
      { to: "/leaderboard", key: "leaderboard", icon: "★" },
    ],
  },
  {
    id: "store",
    labelKey: "store",
    icon: "🛒",
    items: [
      { to: "/store", key: "store", icon: "✧" },
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

const STORAGE_KEY = "ba:mobilenav:lastGroup";

export function MobileNav() {
  const { t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();
  const nav = useNavigate();
  const qc = useQueryClient();

  const activeGroupId = useMemo(() => {
    for (const g of GROUPS) {
      if (g.items.some((it) => it.to === pathname)) return g.id;
    }
    return null;
  }, [pathname]);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState<Set<string>>(new Set());

  // Restore last opened group from storage; fall back to active group.
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored && GROUPS.some((g) => g.id === stored)) setExpanded(stored);
      else if (activeGroupId) setExpanded(activeGroupId);
    } catch {
      if (activeGroupId) setExpanded(activeGroupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // Ensure the group containing the current route is open when nav opens.
  useEffect(() => {
    if (open && activeGroupId) {
      setExpanded((cur) => cur ?? activeGroupId);
      setDesktopOpen((cur) => {
        if (cur.has(activeGroupId)) return cur;
        const next = new Set(cur);
        next.add(activeGroupId);
        return next;
      });
    }
  }, [open, activeGroupId]);

  const corner = dir === "rtl" ? "left-4" : "right-4";

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  };

  const toggleMobile = (id: string) => {
    setExpanded((cur) => {
      const next = cur === id ? null : id;
      try {
        if (next) window.localStorage.setItem(STORAGE_KEY, next);
        else window.localStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
      return next;
    });
  };

  const toggleDesktop = (id: string) => {
    setDesktopOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try { window.localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  };

  const renderGroup = (g: NavGroup, isOpen: boolean, onToggle: () => void) => {
    const hasActive = g.items.some((it) => it.to === pathname);
    return (
      <li key={g.id} className="border-b border-white/5 last:border-b-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors ${
            hasActive ? "text-primary" : "text-foreground hover:bg-white/5"
          }`}
        >
          <span
            aria-hidden
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base ${
              hasActive
                ? "border-primary/40 bg-primary/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            {g.icon}
          </span>
          <span className="flex-1 min-w-0 truncate font-display text-sm font-bold uppercase tracking-[0.18em]">
            {t(g.labelKey)}
          </span>
          <span
            aria-hidden
            className={`shrink-0 text-xs text-muted-foreground transition-transform duration-300 ${
              isOpen ? "rotate-90" : ""
            } ${dir === "rtl" ? "rotate-180" : ""} ${isOpen && dir === "rtl" ? "rotate-90" : ""}`}
          >
            ▸
          </span>
        </button>
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <ul className="flex flex-col pb-2">
              {g.items.map((it) => {
                const active = pathname === it.to;
                return (
                  <li key={`${g.id}:${it.key}`}>
                    <Link
                      to={it.to}
                      className={`mx-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-foreground/90 hover:bg-white/5"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 font-display text-xs font-bold"
                      >
                        {it.icon}
                      </span>
                      <span className="min-w-0 truncate font-medium">{t(it.key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </li>
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 ${corner} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.75_0.18_55/0.7)] transition-transform hover:scale-105 active:scale-95`}
      >
        <span className="text-2xl font-black">{open ? "×" : "≡"}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            style={{ animation: "fade-in 0.2s ease-out both" }}
          />
          <nav
            className={`fixed bottom-24 ${corner} z-50 flex max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-72`}
            style={{ animation: "scale-in 0.22s ease-out both" }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {t("menu")}
              </span>
              <Link
                to="/"
                className={`rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                  pathname === "/" ? "text-primary border-primary/40 bg-primary/10" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("home")}
              </Link>
            </div>
            <ul className="flex flex-col overflow-y-auto overscroll-contain">
              {/* Mobile: single-open accordion. Desktop: multi-open. */}
              {GROUPS.map((g) => (
                <div key={g.id} className="contents">
                  <div className="contents sm:hidden">
                    {renderGroup(g, expanded === g.id, () => toggleMobile(g.id))}
                  </div>
                  <div className="hidden sm:contents">
                    {renderGroup(g, desktopOpen.has(g.id), () => toggleDesktop(g.id))}
                  </div>
                </div>
              ))}
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
                  <Link
                    to="/auth"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-white/5"
                  >
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