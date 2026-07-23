import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function MobileNav() {
  const { t, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setOpen(false); }, [pathname]);

  const items = [
    { to: "/" as const, key: "home" as const, icon: "⌂" },
    { to: "/draft" as const, key: "draft" as const, icon: "卍" },
    { to: "/quotes" as const, key: "quotes" as const, icon: "?" },
    { to: "/leaderboard" as const, key: "leaderboard" as const, icon: "★" },
    { to: "/follow" as const, key: "followUs" as const, icon: "@" },
  ];

  const corner = dir === "rtl" ? "left-4" : "right-4";

  return (
    <>
      <button
        type="button"
        aria-label={t("menu")}
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-5 ${corner} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.75_0.18_55/0.7)] transition-transform hover:scale-105 active:scale-95`}
      >
        <span className="text-2xl font-black">{open ? "×" : "≡"}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav
            className={`fixed bottom-24 ${corner} z-50 flex w-64 flex-col overflow-hidden rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur-xl`}
            style={{ animation: "card-in 0.25s ease-out both" }}
          >
            <div className="border-b border-white/10 px-4 py-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {t("menu")}
            </div>
            <ul className="flex flex-col">
              {items.map((it) => {
                const active = pathname === it.to;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        active ? "bg-primary/15 text-primary" : "text-foreground hover:bg-white/5"
                      }`}
                    >
                      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 font-display text-sm font-bold">
                        {it.icon}
                      </span>
                      <span className="font-medium">{t(it.key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}