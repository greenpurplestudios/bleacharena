export type Rarity = "common" | "rare" | "epic" | "legendary" | "ultra";

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
  overall: number;
  tags?: string[];
  traits?: Partial<Record<TraitKey, number>>;
}

export type Locale = "en" | "ar";

export type TraitKey =
  | "courage"
  | "intellect"
  | "discipline"
  | "chaos"
  | "compassion"
  | "ambition"
  | "loyalty"
  | "humor";