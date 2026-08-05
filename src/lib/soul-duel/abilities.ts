import type { DuelState, Placement } from "./types";
import type { Locale } from "@/types/character";

export interface AbilityCtx {
  self: Placement;
  state: DuelState;
  /** Every placement currently resolved on the board. */
  board: Placement[];
}

export interface AbilityDef {
  slug: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  /** Rating this character adds to itself. */
  selfRating?: (ctx: AbilityCtx) => number;
  /** Rating this character adds to another card on the board. */
  aura?: (ctx: AbilityCtx, other: Placement) => number;
}

const sameLane = (a: Placement, b: Placement) => a.lane === b.lane;

/**
 * Character abilities are pure data + pure functions. Adding one is a single
 * entry here; the engine discovers it by slug and applies Prison / Soul King
 * Palace modifiers automatically.
 */
export const ABILITIES: AbilityDef[] = [
  {
    slug: "ichigo-kurosaki",
    name: { en: "Getsuga Tenshō", ar: "غيتسوغا تينشو" },
    description: {
      en: "+4 Rating for each other ally on this battlefield.",
      ar: "+4 تقييم لكل حليف آخر في هذه الساحة.",
    },
    selfRating: ({ self, board }) =>
      4 * board.filter((p) => p !== self && p.side === self.side && sameLane(p, self)).length,
  },
  {
    slug: "aizen-sosuke",
    name: { en: "Kyōka Suigetsu", ar: "كيوكا سويغيتسو" },
    description: {
      en: "Enemy cards on this battlefield lose 5 Rating.",
      ar: "بطاقات الخصم في هذه الساحة تفقد 5 من التقييم.",
    },
    aura: ({ self }, other) => (other.side !== self.side && sameLane(other, self) ? -5 : 0),
  },
  {
    slug: "yhwach",
    name: { en: "The Almighty", ar: "القدير" },
    description: {
      en: "+12 Rating during the final round.",
      ar: "+12 تقييم في الجولة الأخيرة.",
    },
    selfRating: ({ state }) => (state.round >= 6 ? 12 : 0),
  },
  {
    slug: "kenpachi-zaraki",
    name: { en: "Battle Lust", ar: "شهوة القتال" },
    description: {
      en: "+3 Rating for each enemy on this battlefield.",
      ar: "+3 تقييم لكل عدو في هذه الساحة.",
    },
    selfRating: ({ self, board }) =>
      3 * board.filter((p) => p.side !== self.side && sameLane(p, self)).length,
  },
  {
    slug: "orihime-inoue",
    name: { en: "Santen Kesshun", ar: "سانتن كيشون" },
    description: {
      en: "Allies on this battlefield gain +4 Rating.",
      ar: "الحلفاء في هذه الساحة يكسبون +4 تقييم.",
    },
    aura: ({ self }, other) =>
      other.side === self.side && sameLane(other, self) ? 4 : 0,
  },
  {
    slug: "kisuke-urahara",
    name: { en: "Shopkeeper's Plan", ar: "خطة صاحب المتجر" },
    description: {
      en: "+8 Rating if played on the first three rounds.",
      ar: "+8 تقييم إذا لُعبت في الجولات الثلاث الأولى.",
    },
    selfRating: ({ self }) => (self.round <= 3 ? 8 : 0),
  },
  {
    slug: "byakuya-kuchiki",
    name: { en: "Senbonzakura", ar: "سينبونزاكورا" },
    description: {
      en: "+6 Rating when alone on this battlefield.",
      ar: "+6 تقييم عند الانفراد في هذه الساحة.",
    },
    selfRating: ({ self, board }) =>
      board.filter((p) => p.side === self.side && sameLane(p, self)).length === 1 ? 6 : 0,
  },
  {
    slug: "ulquiorra-cifer",
    name: { en: "Segunda Etapa", ar: "الطور الثاني" },
    description: {
      en: "+10 Rating when this battlefield is full for your side.",
      ar: "+10 تقييم عندما تمتلئ هذه الساحة من جانبك.",
    },
    selfRating: ({ self, board }) =>
      board.filter((p) => p.side === self.side && sameLane(p, self)).length >= 4 ? 10 : 0,
  },
];

const BY_SLUG = new Map(ABILITIES.map((a) => [a.slug, a]));

export function abilityOf(slug: string): AbilityDef | undefined {
  return BY_SLUG.get(slug);
}
