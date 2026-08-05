import type { Character, Locale } from "@/types/character";
import type { StatusInstance } from "./status";

export type Side = "player" | "opponent";

/** Declarative battlefield rules. The engine reads these — never the reverse. */
export interface BattlefieldRules {
  /** Flat rating change applied to every card on this battlefield. */
  globalRating?: number;
  /** Bonus for the very first card played on this battlefield (either side). */
  firstCardBonus?: number;
  /** Race keywords that receive a rating bonus here. */
  factionBuff?: { races: string[]; amount: number };
  /** Opponent cards stay hidden until this round. */
  hiddenUntilRound?: number;
  /** Per-round chance the battlefield closes permanently. */
  closeChance?: number;
  /** Character abilities do not trigger here. */
  disableAbilities?: boolean;
  /** Character abilities trigger twice here. */
  doubleAbilities?: boolean;
  /** One random card per side is imprisoned (Rating 0) on the final round. */
  imprisonAtFinalRound?: boolean;
  /** Chance a card played here drifts to another battlefield with space. */
  driftChance?: number;
  /** Both sides playing here in one round swap those cards. */
  swapOnContest?: boolean;
}

export interface BattlefieldDef {
  id: string;
  art: string;
  accent: string;
  name: Record<Locale, string>;
  ability: Record<Locale, string>;
  description: Record<Locale, string>;
  rules: BattlefieldRules;
}

export interface DuelCard {
  uid: string;
  character: Character;
  cost: number;
}

export interface Placement {
  uid: string;
  card: DuelCard;
  side: Side;
  lane: number;
  round: number;
  /** Set when Prison seals this card on the final round. */
  imprisoned?: boolean;
  /** Active status effects rendered on the card. */
  statuses: StatusInstance[];
  /** Persistent rating adjustments from abilities and status ticks. */
  bonus: number;
  /** Replaces the character's base rating (rating swaps / balance abilities). */
  override?: number;
  /** How many times this card relocated (abilities with a move budget). */
  movesUsed: number;
  /** Round until which negative effects cannot land (exclusive). */
  immuneUntilRound?: number;
  /** Round from which Freeze may be applied again. */
  freezeReadyRound?: number;
  /** Abilities copied so far (Tokinada). */
  copies?: number;
  /** Cards whose Rating this placement has already stolen (Yhwach). */
  stolen?: string[];
  /** Rating is forced to 0 while this round number has not passed. */
  zeroUntilRound?: number;
  /** Sakanade: this card's ability now serves the opposing side. */
  hijacked?: boolean;
}

export interface LaneState {
  def: BattlefieldDef;
  revealed: boolean;
  closed: boolean;
}

/** Match-wide modifiers written by Ultimate Weapons. Keyed by affected side. */
export interface DuelMods {
  /** This side sees through every concealment up to and including the round. */
  revealUntil: Partial<Record<Side, number>>;
  /** This side cannot see enemy cards or battlefield Ratings up to the round. */
  blindUntil: Partial<Record<Side, number>>;
  /** This side cannot play cards during the given round. */
  lockedRound: Partial<Record<Side, number>>;
  /** Flat Rating added to this side's total on every battlefield. */
  laneBonus: Partial<Record<Side, number>>;
  /** Character slugs whose abilities now serve `side` instead of their owner. */
  hijack: { side: Side; slugs: string[] } | null;
}

export type DuelPhase = "reveal" | "play" | "resolve" | "ended";

/** Opponent brains. Nightmare understands battlefields, synergies and clashes. */
export type Difficulty = "practice" | "normal" | "nightmare";

export interface GaugeState {
  /** Reiatsu Gauge, 0–100. */
  charge: number;
  /** Limit Breaker overflow, 0–30. */
  limit: number;
  /** Ultimate queued for this round's resolution. */
  pending: boolean;
  /** One Ultimate per match. */
  used: boolean;
}

export interface UltimateEvent {
  id: string;
  round: number;
  kind: "single" | "clash";
  /** Side whose Ultimate resolved (undefined on a perfect clash). */
  side?: Side;
  weaponId?: string;
  /** Both weapons plus Limit Breaker values, for the clash cinematic. */
  clash?: {
    weapons: Record<Side, string>;
    limits: Record<Side, number>;
    winner: Side | null;
  };
}

export interface DuelLogEntry {
  id: string;
  round: number;
  key: DuelLogKey;
  lane?: number;
  name?: string;
}

export type DuelLogKey =
  | "logHellClosed"
  | "logDrift"
  | "logSwap"
  | "logImprison"
  | "logRevealed"
  | "logBurn"
  | "logFreeze"
  | "logShield"
  | "logAbility"
  | "logMove"
  | "logSummon";

export interface DuelState {
  round: number;
  phase: DuelPhase;
  lanes: LaneState[];
  placements: Placement[];
  hands: Record<Side, DuelCard[]>;
  decks: Record<Side, DuelCard[]>;
  spent: Record<Side, number>;
  log: DuelLogEntry[];
  /** Queued buffs granted to the next card a side plays on a battlefield. */
  laneBuffs: { lane: number; side: Side; amount: number }[];
  /** Hard caps on how many cards a side may hold on a battlefield. */
  laneLimits: { lane: number; side: Side; max: number }[];
  /** Reiatsu Gauge / Limit Breaker per side. */
  gauge: Record<Side, GaugeState>;
  /** Ultimate Weapon equipped by each side for this match. */
  weapons: Record<Side, string>;
  /** Opponent intelligence for this match. */
  difficulty: Difficulty;
  /** Set for one resolution so the cinematic layer can stage it. */
  ultimateEvent?: UltimateEvent | null;
  /** Set once the match ends. */
  result?: DuelResult;
}

export interface LaneScore {
  player: number;
  opponent: number;
  winner: Side | "tie";
}

export interface DuelResult {
  lanes: LaneScore[];
  lanesWon: Record<Side, number>;
  total: Record<Side, number>;
  winner: Side | "tie";
}

export const MAX_ROUNDS = 6;
export const REIATSU_BY_ROUND = [2, 4, 6, 8, 10, 10];
export const DECK_SIZE = 16;
export const HAND_SIZE = 4;
export const MAX_PER_LANE = 4;
export const LANE_COUNT = 3;

/** Reiatsu Gauge ceiling — Ultimates unlock here. */
export const GAUGE_MAX = 100;
/** Limit Breaker ceiling, filled by overflow charge. */
export const LIMIT_MAX = 30;
/** Limit Breaker difference required to win a Reiatsu Clash. */
export const CLASH_MARGIN = 10;
