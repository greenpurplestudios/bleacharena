import type { Character, Locale } from "@/types/character";

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
}

export interface LaneState {
  def: BattlefieldDef;
  revealed: boolean;
  closed: boolean;
}

export type DuelPhase = "reveal" | "play" | "resolve" | "ended";

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
  | "logRevealed";

export interface DuelState {
  round: number;
  phase: DuelPhase;
  lanes: LaneState[];
  placements: Placement[];
  hands: Record<Side, DuelCard[]>;
  decks: Record<Side, DuelCard[]>;
  spent: Record<Side, number>;
  log: DuelLogEntry[];
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
