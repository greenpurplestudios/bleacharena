import { characters } from "@/data/characters";
import { SOUL_LINK_PUZZLES, type LinkGroup, type LinkPuzzle } from "@/data/soul-links";
import { serverDayKey } from "@/lib/server-time";
import type { Character } from "@/types/character";

export const MAX_MISTAKES = 4;

export const GROUP_COLOR = [
  "oklch(0.78 0.15 145)", // easiest
  "oklch(0.8 0.16 220)",
  "oklch(0.72 0.18 300)",
  "oklch(0.75 0.2 30)", // hardest
];

const bySlug = new Map(characters.map((c) => [c.slug, c] as const));

/** Puzzles whose every slug resolves — a bad slug can never crash the board. */
const VALID: LinkPuzzle[] = SOUL_LINK_PUZZLES.filter((p) =>
  p.groups.every((g) => g.slugs.length === 4 && g.slugs.every((s) => bySlug.has(s))),
);

/** Deterministic 32-bit hash so every player gets the same daily puzzle. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface LinkTile {
  slug: string;
  character: Character;
  groupIndex: number;
}

export interface DailyLinks {
  dayKey: string;
  puzzleNumber: number;
  puzzle: LinkPuzzle;
  tiles: LinkTile[];
}

/** Today's puzzle in Saudi server time, with a stable shuffled board. */
export function dailyLinks(dayKey = serverDayKey()): DailyLinks {
  const seed = hash(`soul-links:${dayKey}`);
  const puzzle = VALID[seed % VALID.length];
  const rnd = mulberry(seed);
  const tiles = shuffle(
    puzzle.groups.flatMap((g, gi) =>
      g.slugs.map((slug) => ({ slug, character: bySlug.get(slug)!, groupIndex: gi })),
    ),
    rnd,
  );
  return { dayKey, puzzleNumber: (seed % VALID.length) + 1, puzzle, tiles };
}

export function groupOf(puzzle: LinkPuzzle, index: number): LinkGroup {
  return puzzle.groups[index];
}

/** 4 selected slugs → the solved group index, "one away", or null. */
export function evaluate(
  puzzle: LinkPuzzle,
  selection: string[],
): { solved: number } | { oneAway: true } | null {
  if (selection.length !== 4) return null;
  let best = 0;
  let bestIdx = -1;
  puzzle.groups.forEach((g, i) => {
    const hits = selection.filter((s) => g.slugs.includes(s)).length;
    if (hits > best) { best = hits; bestIdx = i; }
  });
  if (best === 4) return { solved: bestIdx };
  if (best === 3) return { oneAway: true };
  return null;
}

// ---------------- persistence (per server day) ----------------

export interface LinksProgress {
  dayKey: string;
  solved: number[];
  mistakes: number;
  hintUsed: boolean;
  finished: boolean;
  won: boolean;
  /** Order of guesses for the spoiler-free share grid. */
  history: number[][];
}

const KEY = "ba:soul-links";

export function emptyProgress(dayKey: string): LinksProgress {
  return { dayKey, solved: [], mistakes: 0, hintUsed: false, finished: false, won: false, history: [] };
}

export function loadProgress(dayKey: string): LinksProgress {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyProgress(dayKey);
    const p = JSON.parse(raw) as LinksProgress;
    if (p.dayKey !== dayKey) return emptyProgress(dayKey);
    return { ...emptyProgress(dayKey), ...p };
  } catch {
    return emptyProgress(dayKey);
  }
}

export function saveProgress(p: LinksProgress): void {
  try { window.localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

const SQUARE = ["🟩", "🟦", "🟪", "🟧"];

export function shareText(d: DailyLinks, p: LinksProgress, locale: "en" | "ar"): string {
  const head = locale === "ar"
    ? `روابط الأرواح #${d.puzzleNumber} — ${p.won ? `${p.mistakes} أخطاء` : "خسارة"}`
    : `Soul Links #${d.puzzleNumber} — ${p.won ? `${p.mistakes} mistakes` : "lost"}`;
  const grid = p.history.map((row) => row.map((g) => SQUARE[g] ?? "⬛").join("")).join("\n");
  return `${head}\n${grid}\nbleacharena.com`;
}
