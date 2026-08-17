import type { Character } from "@/types/character";
import { DUEL_ROSTER } from "@/data/soul-duel-roster";
import { costOf } from "./engine";

/** A Soul Duel deck is exactly twelve characters — two rows of six. */
export const DECK_CARDS = 12;

/** Five saved deck slots. */
export const DECK_SLOTS = 5;

const LEGACY_KEY = "bd:sd:deck";
const KEY = "bd:sd:decks";

interface DeckStore {
  slots: string[][];
  active: number;
}

function sanitize(slugs: unknown): string[] {
  if (!Array.isArray(slugs)) return [];
  return deckCharacters(slugs.filter((x): x is string => typeof x === "string"))
    .slice(0, DECK_CARDS)
    .map((c) => c.slug);
}

function emptyStore(): DeckStore {
  return { slots: Array.from({ length: DECK_SLOTS }, () => []), active: 0 };
}

function readStore(): DeckStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DeckStore>;
      const slots = Array.from({ length: DECK_SLOTS }, (_, i) => sanitize(parsed.slots?.[i]));
      const active = typeof parsed.active === "number" && parsed.active >= 0 && parsed.active < DECK_SLOTS
        ? parsed.active
        : 0;
      return { slots, active };
    }
    // Migrate the legacy single-deck key into slot 1.
    const legacy = localStorage.getItem(LEGACY_KEY);
    const store = emptyStore();
    if (legacy) {
      try {
        store.slots[0] = sanitize(JSON.parse(legacy));
      } catch {}
    }
    writeStore(store);
    return store;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: DeckStore) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {}
}

export function deckCharacters(slugs: string[]): Character[] {
  return slugs
    .map((s) => DUEL_ROSTER.find((c) => c.slug === s))
    .filter((c): c is Character => !!c);
}

/** Returns the currently active saved deck. */
export function loadDeck(): string[] {
  const store = readStore();
  return store.slots[store.active] ?? [];
}

/** Saves the deck into the currently active slot. */
export function saveDeck(slugs: string[]) {
  const store = readStore();
  store.slots[store.active] = slugs.slice(0, DECK_CARDS);
  writeStore(store);
}

/** All five saved slots. */
export function loadAllSlots(): string[][] {
  return readStore().slots;
}

/** Index (0-4) of the active slot. */
export function loadActiveSlot(): number {
  return readStore().active;
}

/** Saves a specific slot's deck without changing which slot is active. */
export function saveSlot(index: number, slugs: string[]) {
  const store = readStore();
  if (index < 0 || index >= DECK_SLOTS) return;
  store.slots[index] = slugs.slice(0, DECK_CARDS);
  writeStore(store);
}

/** Switches the active slot and returns its deck. */
export function setActiveSlot(index: number): string[] {
  const store = readStore();
  if (index < 0 || index >= DECK_SLOTS) return store.slots[store.active] ?? [];
  store.active = index;
  writeStore(store);
  return store.slots[index] ?? [];
}

/** Average Reiatsu cost of a deck — the headline stat of the builder. */
export function averageReiatsu(chars: Character[]): number {
  if (!chars.length) return 0;
  return Math.round((chars.reduce((n, c) => n + costOf(c), 0) / chars.length) * 10) / 10;
}

/** A playable curve: cheap openers, mid-game bodies, two finishers. */
export function autoDeck(from: Character[] = DUEL_ROSTER): string[] {
  const curve = [1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6];
  const pool = [...from].sort(() => Math.random() - 0.5);
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
