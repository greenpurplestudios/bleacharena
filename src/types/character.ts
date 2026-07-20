export type Rarity = "common" | "rare" | "epic" | "legendary" | "ultra";

export interface CharacterStats {
  attack: number;
  defense: number;
  speed: number;
  reiatsu: number;
  intelligence: number;
  technique: number;
  potential: number;
}

export interface Character {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  race?: string;
  faction?: string;
  division?: string | null;
  rank?: string | null;
  arc?: string;
  shikai?: string | null;
  bankai?: string | null;
  image?: string | null;
  rarity: Rarity;
  stats: CharacterStats;
  overall: number;
  tags?: string[];
}

export type Locale = "en" | "ar";