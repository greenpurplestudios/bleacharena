import type { Character, Rarity } from "@/types/character";

// Dynamic rarity purely from Overall (OVR):
//   Mythic     95-100
//   Legendary  90-94
//   Epic       85-89
//   Rare       80-84
//   Uncommon   75-79
//   Common     <= 74
export function rarityFromOverall(ovr: number): Rarity {
  if (ovr >= 95) return "mythic";
  if (ovr >= 90) return "legendary";
  if (ovr >= 85) return "epic";
  if (ovr >= 80) return "rare";
  if (ovr >= 75) return "uncommon";
  return "common";
}

export const RARITY_ORDER: Rarity[] = [
  "common", "uncommon", "rare", "epic", "legendary", "mythic",
];

// Weighted pull chances — weaker rarities are the most common.
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 13,
  epic: 7,
  legendary: 4,
  mythic: 1,
};

export const RARITY_LABEL: Record<Rarity, { en: string; ar: string }> = {
  common: { en: "Common", ar: "عادي" },
  uncommon: { en: "Uncommon", ar: "غير مألوف" },
  rare: { en: "Rare", ar: "نادر" },
  epic: { en: "Epic", ar: "ملحمي" },
  legendary: { en: "Legendary", ar: "أسطوري" },
  mythic: { en: "Mythic", ar: "أسطوري خارق" },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "oklch(0.75 0.02 250)",
  uncommon: "oklch(0.78 0.14 150)",
  rare: "oklch(0.75 0.16 220)",
  epic: "oklch(0.7 0.22 300)",
  legendary: "oklch(0.82 0.18 80)",
  mythic: "oklch(0.72 0.24 25)",
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