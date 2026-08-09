import type { Locale } from "@/types/character";
import { ULTIMATE_WEAPONS, type UltimateWeaponDef } from "@/data/ultimate-weapons";
import { applyStatus, baseRatingOf, highestOf } from "./effects";
import { abilityOf } from "./abilities";
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
  motion: "slash" | "descend" | "coffin" | "brush" | "frost" | "bloom" | "veil" | "invert";
  /** Sound identity — each weapon layers a different synth signature. */
  audio: "slash" | "empire" | "void" | "ink" | "ice" | "petal" | "blood" | "reverse";
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

const MAX_LANE = 4;

/** Cards a side may still fit on a battlefield. */
function laneRoom(state: DuelState, lane: number, side: Side): number {
  const l = state.lanes[lane];
  if (!l || l.closed) return 0;
  return MAX_LANE - state.placements.filter((p) => p.lane === lane && p.side === side).length;
}

/** Board advantage for a side, using base Ratings (no engine import: no cycle). */
function advantage(state: DuelState, side: Side): number {
  return state.lanes.reduce((n, _l, lane) => {
    const t = roughTotals(state)(lane);
    return n + (side === "player" ? t.player - t.opponent : t.opponent - t.player);
  }, 0);
}

function relocate(state: DuelState, uid: string, lane: number): DuelState {
  return {
    ...state,
    placements: state.placements.map((p) => (p.uid === uid ? { ...p, lane } : p)),
  };
}

/** Ultimates override immunity — they are the strongest effects in the game. */
function forceZero(state: DuelState, uid: string): DuelState {
  return {
    ...state,
    placements: state.placements.map((p) =>
      p.uid === uid ? { ...p, override: 0, bonus: 0 } : p,
    ),
  };
}

const EFFECTS: Record<string, (state: DuelState, side: Side) => DuelState> = {
  /* True Zangetsu — every battlefield surges with the wielder's reiatsu. */
  zangetsu: (state, side) => ({
    ...state,
    mods: {
      ...state.mods,
      laneBonus: { ...state.mods.laneBonus, [side]: (state.mods.laneBonus[side] ?? 0) + 30 },
    },
  }),

  /* The Almighty — the future is laid bare for two rounds. */
  "the-almighty": (state, side) => ({
    ...state,
    mods: { ...state.mods, revealUntil: { ...state.mods.revealUntil, [side]: state.round + 1 } },
  }),

  /* Kannonbiraki Benihime Aratame — Urahara rearranges the board, up to 3 cards. */
  "kannon-biraki": (state, side) => {
    let next = state;
    for (let n = 0; n < 3; n++) {
      let best: { uid: string; lane: number; gain: number } | null = null;
      const before = advantage(next, side);
      for (const p of next.placements) {
        for (let lane = 0; lane < next.lanes.length; lane++) {
          if (lane === p.lane || laneRoom(next, lane, p.side) <= 0) continue;
          const gain = advantage(relocate(next, p.uid, lane), side) - before;
          if (!best || gain > best.gain) best = { uid: p.uid, lane, gain };
        }
      }
      if (!best || best.gain <= 0) break;
      next = relocate(next, best.uid, best.lane);
    }
    return next;
  },

  /* Sakanade — three enemy abilities are inverted and now serve the wielder. */
  sakanade: (state, side) => {
    const enemy = foe(side);
    const pool = [
      ...state.placements.filter((p) => p.side === enemy).map((p) => p.card.character.slug),
      ...state.hands[enemy].map((c) => c.character.slug),
      ...state.decks[enemy].map((c) => c.character.slug),
    ].filter((slug, i, arr) => arr.indexOf(slug) === i && !!abilityOf(slug));

    const picked: string[] = [];
    const bag = pool.slice();
    while (picked.length < 3 && bag.length) {
      picked.push(...bag.splice(Math.floor(Math.random() * bag.length), 1));
    }
    const slugs = [...(state.mods.hijack?.slugs ?? []), ...picked];

    return {
      ...state,
      mods: { ...state.mods, hijack: { side, slugs } },
      placements: state.placements.map((p) =>
        p.side === enemy && slugs.includes(p.card.character.slug) ? { ...p, hijacked: true } : p,
      ),
    };
  },

  /* Daiguren Hyōrinmaru — the sky freezes; the opponent's round is over. */
  "daiguren-hyorinmaru": (state, side) => {
    const enemy = foe(side);
    let next: DuelState = {
      ...state,
      mods: { ...state.mods, lockedRound: { ...state.mods.lockedRound, [enemy]: state.round } },
      placements: state.placements.map((p) =>
        p.side === enemy && p.round === state.round ? { ...p, zeroUntilRound: state.round } : p,
      ),
    };
    for (const e of next.placements.filter((p) => p.side === enemy && p.round === state.round)) {
      next = applyStatus(next, e.uid, "freeze");
    }
    return next;
  },

  /* Hadō #90: Kurohitsugi — black coffins scatter the enemy across the field. */
  "hado-90": (state, side) => {
    const enemy = foe(side);
    let next = state;
    for (const p of state.placements.filter((x) => x.side === enemy)) {
      const options = next.lanes
        .map((_l, i) => i)
        .filter((i) => i === p.lane || laneRoom(next, i, enemy) > 0);
      if (!options.length) continue;
      next = relocate(next, p.uid, options[Math.floor(Math.random() * options.length)]);
    }
    return next;
  },

  /* Ichimonji — a name is blackened and the card is reduced to nothing. */
  ichimonji: (state, side) => {
    const target = highestOf(enemies(state, side));
    return target ? forceZero(state, target.uid) : state;
  },

  /* Enma Kōrogi — the dream falls; the opponent duels blind for two rounds. */
  "enma-korogi": (state, side) => ({
    ...state,
    mods: {
      ...state.mods,
      blindUntil: { ...state.mods.blindUntil, [foe(side)]: state.round + 1 },
    },
  }),
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
    en: "All three battlefields gain +30 Rating for you.",
    ar: "الساحات الثلاث كلها تكسب +٣٠ تقييم لصالحك.",
  },
  "the-almighty": {
    en: "Reveals every opponent card for the next 2 rounds.",
    ar: "يكشف كل بطاقات الخصم خلال الجولتين القادمتين.",
  },
  "kannon-biraki": {
    en: "Moves up to 3 cards — yours, the opponent's or both — between battlefields.",
    ar: "ينقل حتى ٣ بطاقات — لك أو للخصم أو للاثنين — بين الساحات.",
  },
  sakanade: {
    en: "Three random enemy abilities serve you instead for the rest of the match.",
    ar: "ثلاث قدرات عشوائية من الخصم تعمل لصالحك حتى نهاية المباراة.",
  },
  "daiguren-hyorinmaru": {
    en: "The opponent cannot play this round; cards they already played are Frozen at 0 Rating.",
    ar: "لا يستطيع الخصم اللعب هذه الجولة، وبطاقاته الملعوبة تتجمد بتقييم ٠.",
  },
  "hado-90": {
    en: "Shuffles every opponent card randomly between the battlefields.",
    ar: "يخلط كل بطاقات الخصم عشوائياً بين الساحات.",
  },
  ichimonji: {
    en: "Chooses one enemy card — its Rating becomes 0.",
    ar: "يختار بطاقة معادية واحدة — يصبح تقييمها ٠.",
  },
  "enma-korogi": {
    en: "The opponent cannot see your played cards or battlefield Ratings for 2 rounds.",
    ar: "لا يرى الخصم بطاقاتك الملعوبة ولا تقييم الساحات لجولتين.",
  },
};
