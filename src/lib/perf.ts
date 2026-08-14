/**
 * Performance preferences. "Lag Reducer" disables the expensive decorative
 * effects (Legendary sheen sweep, Mythic lightning, rotating card-back rays,
 * ambient scene drift) by toggling a single class on <html>, so no component
 * has to re-render for it to take effect.
 */
const KEY = "ba:perf";
const CLASS = "lag-reduced";

export interface PerfPrefs {
  /** Disable non-essential animated effects for smoother frame rates. */
  lagReducer: boolean;
}

export const DEFAULT_PERF: PerfPrefs = { lagReducer: false };

export function loadPerf(): PerfPrefs {
  if (typeof window === "undefined") return DEFAULT_PERF;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PERF;
    const p = JSON.parse(raw) as Partial<PerfPrefs>;
    return { lagReducer: p.lagReducer === true };
  } catch {
    return DEFAULT_PERF;
  }
}

export function applyPerf(p: PerfPrefs): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(CLASS, p.lagReducer);
}

export function savePerf(p: PerfPrefs): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
  applyPerf(p);
}

/** Called once on boot (client only). */
export function initPerf(): void {
  applyPerf(loadPerf());
}
