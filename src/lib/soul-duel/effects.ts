import type { Character } from "@/types/character";
import { duelDefOf } from "./abilities";
import { STATUS_DEFS, type StatusKind } from "./status";
import type { DuelCard, DuelState, Placement, Side } from "./types";

let tokenSeq = 0;

/* --------------------------------------------------------------- queries */

/** Rating a card contributes before auras — base value plus persistent bonuses. */
export function baseRatingOf(p: Placement): number {
  return Math.max(0, (p.override ?? p.card.character.overall) + p.bonus);
}

export function immuneToModifiers(p: Placement): boolean {
  return !!duelDefOf(p.card.character.slug)?.immuneToModifiers;
}

export function movesAllowed(p: Placement): number {
  return duelDefOf(p.card.character.slug)?.moves ?? 0;
}

export function canRelocate(p: Placement): boolean {
  return p.movesUsed < movesAllowed(p);
}

export function hasStatus(p: Placement, kind: StatusKind): boolean {
  return p.statuses.some((s) => s.kind === kind && s.remaining > 0);
}

export function isFrozen(p: Placement): boolean {
  return hasStatus(p, "freeze");
}

export function enemiesIn(state: DuelState, self: Placement): Placement[] {
  return state.placements.filter((p) => p.lane === self.lane && p.side !== self.side);
}

export function alliesIn(state: DuelState, self: Placement, includeSelf: boolean): Placement[] {
  return state.placements.filter(
    (p) => p.lane === self.lane && p.side === self.side && (includeSelf || p.uid !== self.uid),
  );
}

export function highestOf(list: Placement[]): Placement | undefined {
  return list.slice().sort((a, b) => baseRatingOf(b) - baseRatingOf(a))[0];
}

export function lowestOf(list: Placement[]): Placement | undefined {
  return list.slice().sort((a, b) => baseRatingOf(a) - baseRatingOf(b))[0];
}

/* -------------------------------------------------------------- mutations */

function patch(
  state: DuelState,
  uid: string,
  fn: (p: Placement) => Placement,
): DuelState {
  return { ...state, placements: state.placements.map((p) => (p.uid === uid ? fn(p) : p)) };
}

/** True when a negative effect bounces off immunity or a Shield. */
function blocksNegative(state: DuelState, p: Placement): boolean {
  return immuneToModifiers(p) || (p.immuneUntilRound ?? 0) > state.round || hasStatus(p, "shield");
}

export function addBonus(state: DuelState, uid: string, amount: number): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target || immuneToModifiers(target)) return state;
  if (amount < 0 && blocksNegative(state, target)) return consumeShield(state, uid);
  return patch(state, uid, (p) => ({ ...p, bonus: p.bonus + amount }));
}

export function setOverride(state: DuelState, uid: string, rating: number): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target || immuneToModifiers(target)) return state;
  return patch(state, uid, (p) => ({ ...p, override: rating }));
}

export function consumeShield(state: DuelState, uid: string): DuelState {
  return patch(state, uid, (p) => ({
    ...p,
    statuses: p.statuses.filter((s) => s.kind !== "shield"),
  }));
}

export function applyStatus(state: DuelState, uid: string, kind: StatusKind): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target) return state;
  const def = STATUS_DEFS[kind];

  if (def.negative) {
    if (immuneToModifiers(target)) return state;
    if ((target.immuneUntilRound ?? 0) > state.round) return state;
    if (hasStatus(target, "shield")) return consumeShield(state, uid);
    if (kind === "freeze" && (target.freezeReadyRound ?? 0) > state.round) return state;
  }

  return patch(state, uid, (p) => ({
    ...p,
    statuses: [
      ...p.statuses.filter((s) => s.kind !== kind),
      { kind, remaining: def.duration },
    ],
    freezeReadyRound:
      kind === "freeze" ? state.round + def.duration + def.cooldown : p.freezeReadyRound,
  }));
}

export function clearNegatives(state: DuelState, uid: string): DuelState {
  return patch(state, uid, (p) => ({
    ...p,
    statuses: p.statuses.filter((s) => !STATUS_DEFS[s.kind].negative),
  }));
}

export function grantImmunity(state: DuelState, uid: string): DuelState {
  return patch(state, uid, (p) => ({ ...p, immuneUntilRound: state.round + 1 }));
}

export function laneBuff(state: DuelState, lane: number, side: Side, amount: number): DuelState {
  return { ...state, laneBuffs: [...state.laneBuffs, { lane, side, amount }] };
}

/**
 * Moves Rating from one card to another — never duplicates it. The thief only
 * gains what the victim actually loses, and each victim can be robbed once.
 */
export function stealRating(state: DuelState, thiefUid: string, victimUid: string): DuelState {
  const thief = state.placements.find((p) => p.uid === thiefUid);
  const victim = state.placements.find((p) => p.uid === victimUid);
  if (!thief || !victim || thief.uid === victim.uid) return state;
  if ((thief.stolen ?? []).includes(victim.uid)) return state;

  const mark = (s: DuelState) =>
    patch(s, thiefUid, (p) => ({ ...p, stolen: [...(p.stolen ?? []), victimUid] }));

  // Shields and immunity stop the theft outright (the shield is spent).
  if (immuneToModifiers(victim)) return mark(state);
  if ((victim.immuneUntilRound ?? 0) > state.round) return mark(state);
  if (hasStatus(victim, "shield")) return mark(consumeShield(state, victimUid));

  const amount = baseRatingOf(victim);
  if (amount <= 0) return mark(state);

  let next = patch(state, victimUid, (p) => ({ ...p, bonus: p.bonus - amount }));
  next = patch(next, thiefUid, (p) => ({ ...p, bonus: p.bonus + amount }));
  return mark(next);
}

export function laneBuffLegacy(state: DuelState, lane: number, side: Side, amount: number): DuelState {
  return { ...state, laneBuffs: [...state.laneBuffs, { lane, side, amount }] };
}

export function laneLimit(state: DuelState, lane: number, side: Side, max: number): DuelState {
  return { ...state, laneLimits: [...state.laneLimits, { lane, side, max }] };
}

/** Drops a summoned token card onto a battlefield. */
export function makeToken(
  state: DuelState,
  character: Character,
  side: Side,
  lane: number,
): DuelState {
  const card: DuelCard = { uid: `t${++tokenSeq}-${character.slug}`, character, cost: 0 };
  const placement: Placement = {
    uid: card.uid,
    card,
    side,
    lane,
    round: state.round,
    statuses: [],
    bonus: 0,
    movesUsed: 0,
  };
  return { ...state, placements: [...state.placements, placement] };
}
