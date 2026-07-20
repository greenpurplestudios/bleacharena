import type { Character, Rarity } from "@/types/character";

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 45,
  rare: 28,
  epic: 15,
  legendary: 8,
  ultra: 4,
};

export const RARITY_LABEL: Record<Rarity, { en: string; ar: string }> = {
  common: { en: "Common", ar: "عادي" },
  rare: { en: "Rare", ar: "نادر" },
  epic: { en: "Epic", ar: "ملحمي" },
  legendary: { en: "Legendary", ar: "أسطوري" },
  ultra: { en: "Ultra Rare", ar: "نادر جداً" },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "oklch(0.75 0.02 250)",
  rare: "oklch(0.75 0.14 200)",
  epic: "oklch(0.7 0.2 300)",
  legendary: "oklch(0.8 0.18 80)",
  ultra: "oklch(0.75 0.22 25)",
};

export function pickWeighted<T extends { rarity: Rarity }>(
  pool: T[],
  rand: () => number = Math.random,
): T | null {
  if (pool.length === 0) return null;
  const weights = pool.map((c) => RARITY_WEIGHTS[c.rarity] ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export type { Character };