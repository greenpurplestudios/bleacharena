import { characters } from "@/data/characters";
import { DUEL_CHARACTERS } from "@/lib/soul-duel/abilities";
import type { Character } from "@/types/character";

/**
 * Soul Duel launch roster — exactly the 30 agreed characters.
 * Nothing else from the Bleach Arena collection enters a duel deck.
 */
const ROSTER_SLUGS = DUEL_CHARACTERS.map((d) => d.slug);

export const DUEL_ROSTER: Character[] = ROSTER_SLUGS
  .map((slug) => characters.find((c) => c.slug === slug))
  .filter((c): c is Character => !!c);
