import type { Locale } from "@/types/character";

export type StatusKind = "burn" | "freeze" | "shield";

export interface StatusDef {
  kind: StatusKind;
  /** Negative effects can be blocked by Shield or immunity. */
  negative: boolean;
  /** Rounds the effect lasts when applied. */
  duration: number;
  /** Rounds before the same effect can be applied again (0 = no cooldown). */
  cooldown: number;
  color: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const STATUS_DEFS: Record<StatusKind, StatusDef> = {
  burn: {
    kind: "burn",
    negative: true,
    duration: 3,
    cooldown: 0,
    color: "oklch(0.72 0.19 45)",
    name: { en: "Burn", ar: "احتراق" },
    description: {
      en: "Loses 3 Rating at the end of each round for 3 rounds.",
      ar: "يفقد ٣ من التقييم في نهاية كل جولة لمدة ٣ جولات.",
    },
  },
  freeze: {
    kind: "freeze",
    negative: true,
    duration: 1,
    cooldown: 2,
    color: "oklch(0.82 0.13 220)",
    name: { en: "Freeze", ar: "تجميد" },
    description: {
      en: "Ability cannot activate for 1 round. Cannot be frozen again for 2 rounds.",
      ar: "لا تُفعّل القدرة لمدة جولة. لا يمكن تجميدها مجدداً لجولتين.",
    },
  },
  shield: {
    kind: "shield",
    negative: false,
    duration: 1,
    cooldown: 0,
    color: "oklch(0.85 0.12 150)",
    name: { en: "Shield", ar: "درع" },
    description: {
      en: "Blocks the next negative effect. Lasts 1 round if unused.",
      ar: "يصد التأثير السلبي التالي. يدوم جولة واحدة إن لم يُستخدم.",
    },
  },
};

export interface StatusInstance {
  kind: StatusKind;
  /** Rounds left before the effect expires. */
  remaining: number;
}

export const STATUS_ORDER: StatusKind[] = ["burn", "freeze", "shield"];

/** Rating lost per round while burning. */
export const BURN_DAMAGE = 3;
