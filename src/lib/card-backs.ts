import type { Rarity } from "@/types/character";

/**
 * Universal (character-agnostic) card materials & sigil geometry per rarity.
 * The card BACK — and the frame chrome on the FRONT — are rendered entirely
 * in CSS/SVG from these tokens. No jpeg templates, no card-back art.
 */
export interface RarityMaterial {
  /** Deep base tone of the metal/lacquer. */
  base: string;
  /** Bright highlight used for bezel sheen & rim light. */
  bright: string;
  /** Darkest shade, used for engraving shadow & bezel recess. */
  deep: string;
  /** Soft ambient glow colour (rgba). */
  glow: string;
  /** Crisp ink/text colour that reads well over the material. */
  ink: string;
  /** Number of sigil rings drawn on the universal back (rarity tier, 1-6). */
  tier: number;
}

export const RARITY_MATERIAL: Record<Rarity, RarityMaterial> = {
  common: {
    base: "#5b6472", bright: "#e7ecf3", deep: "#242a33",
    glow: "rgba(180,195,215,0.45)", ink: "#eef2f7", tier: 1,
  },
  uncommon: {
    base: "#1f7a49", bright: "#a9f3c4", deep: "#0a2a19",
    glow: "rgba(70,220,130,0.5)", ink: "#e3fff0", tier: 2,
  },
  rare: {
    base: "#22579e", bright: "#a9d6ff", deep: "#0a1f3d",
    glow: "rgba(70,150,255,0.5)", ink: "#e6f2ff", tier: 3,
  },
  epic: {
    base: "#6a2aa8", bright: "#dcb3ff", deep: "#280f45",
    glow: "rgba(170,90,255,0.55)", ink: "#f4e6ff", tier: 4,
  },
  legendary: {
    base: "#9c7418", bright: "#fff0bd", deep: "#3c2a04",
    glow: "rgba(255,195,80,0.6)", ink: "#fff6dd", tier: 5,
  },
  mythic: {
    base: "#9c2318", bright: "#ffb3a2", deep: "#3d0a06",
    glow: "rgba(255,70,50,0.6)", ink: "#ffe9e4", tier: 6,
  },
};

/** @deprecated legacy alias retained for grep-ability; use RARITY_MATERIAL. */
export const CARD_BACK = RARITY_MATERIAL;
