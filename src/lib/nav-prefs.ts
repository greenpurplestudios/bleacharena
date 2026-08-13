/** Preferences for the floating navigation button (position + on/off). */
export interface NavPrefs {
  /** Floating menu button enabled. When off, use the header menu button. */
  floating: boolean;
  /** Edge the button snaps to. */
  side: "start" | "end";
  /** Vertical position as a 0..1 fraction of the viewport height. */
  y: number;
}

const KEY = "ba:nav:prefs";

export const DEFAULT_NAV_PREFS: NavPrefs = { floating: true, side: "end", y: 0.82 };

export function loadNavPrefs(): NavPrefs {
  if (typeof window === "undefined") return DEFAULT_NAV_PREFS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_NAV_PREFS;
    const p = JSON.parse(raw) as Partial<NavPrefs>;
    return {
      floating: p.floating !== false,
      side: p.side === "start" ? "start" : "end",
      y: typeof p.y === "number" ? Math.min(0.92, Math.max(0.08, p.y)) : DEFAULT_NAV_PREFS.y,
    };
  } catch {
    return DEFAULT_NAV_PREFS;
  }
}

export function saveNavPrefs(p: NavPrefs): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent("ba:nav-prefs", { detail: p }));
}

/** Opens the navigation drawer from anywhere (header button, shortcuts). */
export function openNavDrawer(): void {
  window.dispatchEvent(new Event("ba:open-nav"));
}
