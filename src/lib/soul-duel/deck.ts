import type { Character } from "@/types/character";
import { DUEL_ROSTER } from "@/data/soul-duel-roster";
import { costOf } from "./engine";

/** A Soul Duel deck is exactly twelve characters — two rows of six. */
export const DECK_CARDS = 12;

const KEY = "bd:sd:deck";

export function deckCharacters(slugs: string[]): Character[] {
  return slugs
    .map((s) => DUEL_ROSTER.find((c) => c.slug === s))
    .filter((c): c is Character => !!c);
}

export function loadDeck(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return deckCharacters(parsed.filter((x): x is string => typeof x === "string"))
      .slice(0, DECK_CARDS)
      .map((c) => c.slug);
  } catch {
    return [];
  }
}

export function saveDeck(slugs: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(slugs.slice(0, DECK_CARDS)));
  } catch {}
}

/** Average Reiatsu cost of a deck — the headline stat of the builder. */
export function averageReiatsu(chars: Character[]): number {
  if (!chars.length) return 0;
  return Math.round((chars.reduce((n, c) => n + costOf(c), 0) / chars.length) * 10) / 10;
}

/** A playable curve: cheap openers, mid-game bodies, two finishers. */
export function autoDeck(): string[] {
  const curve = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6];
  const pool = [...DUEL_ROSTER].sort(() => Math.random() - 0.5);
  const used = new Set<string>();
  const picked: string[] = [];
  for (const cost of curve) {
    const exact = pool.find((c) => !used.has(c.slug) && costOf(c) === cost);
    const near = pool
      .filter((c) => !used.has(c.slug))
      .sort((a, b) => Math.abs(costOf(a) - cost) - Math.abs(costOf(b) - cost))[0];
    const chosen = exact ?? near;
    if (!chosen) break;
    used.add(chosen.slug);
    picked.push(chosen.slug);
  }
  return picked;
}