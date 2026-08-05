import type { Locale } from "@/types/character";
import { ULTIMATE_WEAPONS, type UltimateWeaponDef } from "@/data/ultimate-weapons";
import { addBonus, applyStatus, baseRatingOf, highestOf, setOverride } from "./effects";
import type { DuelState, Placement, Side } from "./types";

/** Everything the cinematic layer needs to stage a weapon activation. */
export interface UltimateVisual {
  /** Voice line spoken by the wielder, shown on screen during the cinematic. */
  voice: Record<Locale, string>;
  /** Signature colour of the eruption. */
  color: string;
  /** Secondary colour used for the energy wash. */
  glow: string;
  /** Distinct cinematic treatment. */
  motion: "slash" | "descend" | "coffin" | "brush" | "frost" | "bloom" | "veil" | "mirror" | "invert";
  /** Sound identity — each weapon layers a different synth signature. */
  audio: "slash" | "empire" | "void" | "ink" | "ice" | "petal" | "blood" | "illusion" | "reverse";
}

export interface UltimateDef extends UltimateWeaponDef {
  visual: UltimateVisual;
  /** Applied to the board the moment the Ultimate resolves. */
  effect: (state: DuelState, side: Side) => DuelState;
}

const foe = (s: Side): Side => (s === "player" ? "opponent" : "player");

function enemies(state: DuelState, side: Side): Placement[] {
  return state.placements.filter((p) => p.side === foe(side));
}

function allies(state: DuelState, side: Side): Placement[] {
  return state.placements.filter((p) => p.side === side);
}

/** The battlefield where the opponent leads by the most Rating. */
function worstLane(state: DuelState, side: Side, totals: (lane: number) => { player: number; opponent: number }): number {
  let lane = 0;
  let deficit = -Infinity;
  state.lanes.forEach((_, i) => {
    const t = totals(i);
    const d = side === "player" ? t.opponent - t.player : t.player - t.opponent;
    if (d > deficit) { deficit = d; lane = i; }
  });
  return lane;
}

/** Lane totals without importing the engine (avoids a cycle). */
function roughTotals(state: DuelState) {
  return (lane: number) => {
    const sum = (s: Side) =>
      state.placements.filter((p) => p.lane === lane && p.side === s)
        .reduce((n, p) => n + baseRatingOf(p), 0);
    return { player: sum("player"), opponent: sum("opponent") };
  };
}

const EFFECTS: Record<string, (state: DuelState, side: Side) => DuelState> = {
  /* True Zangetsu — a black crescent tears through the contested battlefield. */
  zangetsu: (state, side) => {
    const lane = worstLane(state, side, roughTotals(state));
    let next = state;
    for (const e of enemies(state, side).filter((p) => p.lane === lane)) {
      next = addBonus(next, e.uid, -25);
    }
    for (const a of allies(state, side).filter((p) => p.lane === lane)) {
      next = addBonus(next, a.uid, 10);
    }
    return next;
  },

  /* The Almighty — the future is rewritten across every battlefield. */
  "the-almighty": (state, side) => {
    let next = state;
    for (const e of enemies(state, side)) next = addBonus(next, e.uid, -12);
    for (const a of allies(state, side)) next = addBonus(next, a.uid, 6);
    return next;
  },

  /* Hadō #90 — the black coffin crushes the strongest enemy. */
  "hado-90": (state, side) => {
    const target = highestOf(enemies(state, side));
    return target ? setOverride(state, target.uid, 0) : state;
  },

  /* Ichimonji — the enemy's name is blackened, halving every Rating in one lane. */
  ichimonji: (state, side) => {
    const lane = worstLane(state, side, roughTotals(state));
    let next = state;
    for (const e of enemies(state, side).filter((p) => p.lane === lane)) {
      next = setOverride(next, e.uid, Math.floor(baseRatingOf(e) / 2));
    }
    return next;
  },

  /* Daiguren Hyōrinmaru — the sky freezes over. */
  "daiguren-hyorinmaru": (state, side) => {
    let next = state;
    for (const e of enemies(state, side)) {
      next = applyStatus(next, e.uid, "freeze");
      next = addBonus(next, e.uid, -6);
    }
    return next;
  },

  /* Enma Kōrogi — the dream burns every foe. */
  "enma-korogi": (state, side) => {
    let next = state;
    for (const e of enemies(state, side)) next = applyStatus(next, e.uid, "burn");
    return next;
  },

  /* Kannonbiraki Benihime Aratame — allies restored and shielded. */
  "kannon-biraki": (state, side) => {
    let next = state;
    for (const a of allies(state, side)) {
      next = addBonus(next, a.uid, 12);
      next = applyStatus(next, a.uid, "shield");
    }
    return next;
  },

  /* Kyōka Suigetsu — perfect hypnosis swaps the two strongest cards' Ratings. */
  "kyoka-suigetsu": (state, side) => {
    const mine = highestOf(allies(state, side));
    const theirs = highestOf(enemies(state, side));
    if (!mine || !theirs) return state;
    const a = baseRatingOf(mine);
    const b = baseRatingOf(theirs);
    return setOverride(setOverride(state, mine.uid, b), theirs.uid, a);
  },

  /* Sakanade — the world inverts, mirroring the enemy board. */
  sakanade: (state, side) => {
    const enemy = foe(side);
    const left = 0;
    const right = state.lanes.length - 1;
    let next: DuelState = {
      ...state,
      placements: state.placements.map((p) =>
        p.side !== enemy ? p
        : p.lane === left ? { ...p, lane: right }
        : p.lane === right ? { ...p, lane: left }
        : p,
      ),
    };
    for (const e of enemies(next, side)) next = addBonus(next, e.uid, -8);
    return next;
  },
};

const VISUALS: Record<string, UltimateVisual> = {
  zangetsu: {
    voice: { en: "Getsuga Tenshō!", ar: "!غيتسوغا تينشو" },
    color: "oklch(0.28 0.09 300)", glow: "oklch(0.75 0.2 20)", motion: "slash", audio: "slash",
  },
  "the-almighty": {
    voice: { en: "The Almighty.", ar: "القدير." },
    color: "oklch(0.55 0.2 300)", glow: "oklch(0.9 0.14 95)", motion: "descend", audio: "empire",
  },
  "hado-90": {
    voice: { en: "Hadō #90: Kurohitsugi.", ar: "هادو ٩٠: التابوت الأسود." },
    color: "oklch(0.2 0.05 300)", glow: "oklch(0.65 0.22 300)", motion: "coffin", audio: "void",
  },
  ichimonji: {
    voice: { en: "Shirafude Ichimonji.", ar: "شيرافودي إيتشيمونجي." },
    color: "oklch(0.22 0.02 260)", glow: "oklch(0.95 0.02 90)", motion: "brush", audio: "ink",
  },
  "daiguren-hyorinmaru": {
    voice: { en: "Bankai — Daiguren Hyōrinmaru!", ar: "!بانكاي — دايغورين هيورينمارو" },
    color: "oklch(0.5 0.13 230)", glow: "oklch(0.92 0.09 210)", motion: "frost", audio: "ice",
  },
  "enma-korogi": {
    voice: { en: "Katen Kyōkotsu — Enma Kōrogi.", ar: "كاتن كيوكوتسو — إنما كوروغي." },
    color: "oklch(0.35 0.12 20)", glow: "oklch(0.8 0.16 30)", motion: "bloom", audio: "petal",
  },
  "kannon-biraki": {
    voice: { en: "Kannonbiraki Benihime Aratame!", ar: "!كانون بيراكي بينيهيمي أراتامي" },
    color: "oklch(0.42 0.16 15)", glow: "oklch(0.85 0.15 10)", motion: "veil", audio: "blood",
  },
  "kyoka-suigetsu": {
    voice: { en: "Shatter, Kyōka Suigetsu.", ar: "تحطّمي، كيوكا سويغيتسو." },
    color: "oklch(0.45 0.1 190)", glow: "oklch(0.9 0.08 180)", motion: "mirror", audio: "illusion",
  },
  sakanade: {
    voice: { en: "Collapse, Sakanade.", ar: "انهاري، ساكانادي." },
    color: "oklch(0.4 0.14 330)", glow: "oklch(0.85 0.14 320)", motion: "invert", audio: "reverse",
  },
};

export const ULTIMATES: UltimateDef[] = ULTIMATE_WEAPONS.map((w) => ({
  ...w,
  visual: VISUALS[w.id] ?? VISUALS.zangetsu,
  effect: EFFECTS[w.id] ?? EFFECTS.zangetsu,
}));

const BY_ID = new Map(ULTIMATES.map((u) => [u.id, u]));

export const STARTER_WEAPON = "zangetsu";

export function ultimateOf(id: string | undefined): UltimateDef {
  return (id && BY_ID.get(id)) || BY_ID.get(STARTER_WEAPON)!;
}

/** Short rules blurb shown in the Forge and the pre-duel loadout. */
export const ULTIMATE_EFFECT_TEXT: Record<string, Record<Locale, string>> = {
  zangetsu: {
    en: "Tears the contested battlefield: −25 Rating to every enemy there, +10 to your cards.",
    ar: "يمزق الساحة المتنازع عليها: −٢٥ لكل عدو هناك، +١٠ لبطاقاتك.",
  },
  "the-almighty": {
    en: "Rewrites the future: −12 Rating to every enemy card, +6 to all of yours.",
    ar: "يعيد كتابة المستقبل: −١٢ لكل بطاقة معادية، +٦ لكل بطاقاتك.",
  },
  "hado-90": {
    en: "Crushes the strongest enemy card to 0 Rating.",
    ar: "يسحق أقوى بطاقة معادية إلى تقييم ٠.",
  },
  ichimonji: {
    en: "Blackens names: halves the Rating of every enemy on the contested battlefield.",
    ar: "يسوّد الأسماء: يقسم تقييم كل عدو في الساحة المتنازع عليها.",
  },
  "daiguren-hyorinmaru": {
    en: "Freezes every enemy card and drains 6 Rating from each.",
    ar: "يجمّد كل بطاقات الخصم ويستنزف ٦ من تقييم كل منها.",
  },
  "enma-korogi": {
    en: "Inflicts Burn on every enemy card on the board.",
    ar: "يصيب كل بطاقات الخصم بالاحتراق.",
  },
  "kannon-biraki": {
    en: "Restores your whole board: +12 Rating and a Shield for every ally.",
    ar: "يعيد ترميم لوحك: +١٢ تقييم ودرع لكل حليف.",
  },
  "kyoka-suigetsu": {
    en: "Perfect hypnosis: swaps the Rating of the strongest ally and strongest enemy.",
    ar: "تنويم كامل: يبادل تقييم أقوى حليف مع أقوى عدو.",
  },
  sakanade: {
    en: "Inverts the enemy board between the outer battlefields and drains 8 Rating each.",
    ar: "يقلب لوح الخصم بين الساحتين الطرفيتين ويستنزف ٨ من كل بطاقة.",
  },
};