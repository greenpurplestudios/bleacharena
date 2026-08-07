import type { Character } from "@/types/character";
import { ANT_SLUG, duelDefOf } from "./abilities";
import { STATUS_DEFS, type StatusKind } from "./status";
import type { DuelCard, DuelState, Placement, Side } from "./types";

let tokenSeq = 0;

/* --------------------------------------------------------------- queries */

/** Rating a card contributes before auras — base value plus persistent bonuses. */
export function baseRatingOf(p: Placement): number {
  return Math.max(0, (p.override ?? p.card.character.overall) + p.bonus);
}

export function immuneToModifiers(p: Placement): boolean {
  // The Black Ant is absolute: no buff, debuff, status or battlefield rule.
  if (p.card.character.slug === ANT_SLUG) return true;
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

/* ------------------------------------------------- lane-wide ability slugs */

export const ZANGETSU_SLUG = "zangetsu";
export const HIERRO_SLUG = "nnoitra-gilga";
export const REFLECT_SLUG = "jushiro-ukitake";

/** True when an un-frozen ally with `slug` shares the target's battlefield. */
function allySlugIn(state: DuelState, target: Placement, slug: string): boolean {
  return state.placements.some(
    (x) =>
      x.lane === target.lane &&
      x.side === target.side &&
      x.card.character.slug === slug &&
      !isFrozen(x),
  );
}

/**
 * Zangetsu doubles every buff and debuff on his battlefield; Nnoitra's Hierro
 * halves incoming debuffs. Applied in that order, then rounded.
 */
function scaleAmount(state: DuelState, target: Placement, amount: number): number {
  let amt = amount;
  if (allySlugIn(state, target, ZANGETSU_SLUG)) amt *= 2;
  if (amt < 0 && allySlugIn(state, target, HIERRO_SLUG)) amt /= 2;
  return amt < 0 ? -Math.round(-amt) : Math.round(amt);
}

/**
 * Sakanade hands an enemy ability to its caster. Abilities always read
 * `self.side`, so a hijacked card is handed to them with its side flipped —
 * the card stays where it is, only its ability changes allegiance.
 */
export function asOwner(p: Placement): Placement {
  if (!p.hijacked) return p;
  return { ...p, side: p.side === "player" ? "opponent" : "player" };
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

interface EffectOpts {
  /** Set while resolving a reflected effect so it cannot bounce again. */
  noReflect?: boolean;
  /** Skip Zangetsu / Hierro scaling (the amount is already final). */
  raw?: boolean;
}

/**
 * Ukitake's Sōgyo no Kotowari: once per round, the next negative effect aimed
 * at an ally on his battlefield is bounced onto the strongest enemy there.
 * Returns the new state when the effect was reflected (or simply negated).
 */
function tryReflect(
  state: DuelState,
  target: Placement,
  apply: (s: DuelState, victim: Placement) => DuelState,
  opts?: EffectOpts,
): DuelState | null {
  if (opts?.noReflect) return null;
  const guard = state.placements.find(
    (x) =>
      x.lane === target.lane &&
      x.side === target.side &&
      x.card.character.slug === REFLECT_SLUG &&
      !isFrozen(x) &&
      x.reflectUsedRound !== state.round,
  );
  if (!guard) return null;
  const spent = patch(state, guard.uid, (p) => ({ ...p, reflectUsedRound: state.round }));
  const victim = highestOf(
    spent.placements.filter((p) => p.lane === target.lane && p.side !== target.side),
  );
  return victim ? apply(spent, victim) : spent;
}

export function addBonus(
  state: DuelState,
  uid: string,
  amount: number,
  opts?: EffectOpts,
): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target || immuneToModifiers(target) || !amount) return state;
  const amt = opts?.raw ? amount : scaleAmount(state, target, amount);
  if (!amt) return state;
  if (amt < 0) {
    if (target.noReduce) return state;
    const bounced = tryReflect(
      state,
      target,
      (s, victim) => addBonus(s, victim.uid, amt, { noReflect: true, raw: true }),
      opts,
    );
    if (bounced) return bounced;
    if (blocksNegative(state, target)) return consumeShield(state, uid);
  }
  return patch(state, uid, (p) => ({ ...p, bonus: p.bonus + amt }));
}

export function setOverride(state: DuelState, uid: string, rating: number): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target || immuneToModifiers(target)) return state;
  // Unbreakable Loyalty never lets a Rating drop.
  if (target.noReduce && rating < baseRatingOf(target)) return state;
  return patch(state, uid, (p) => ({ ...p, override: rating }));
}

export function consumeShield(state: DuelState, uid: string): DuelState {
  return patch(state, uid, (p) => ({
    ...p,
    statuses: p.statuses.filter((s) => s.kind !== "shield"),
  }));
}

export function applyStatus(
  state: DuelState,
  uid: string,
  kind: StatusKind,
  opts?: EffectOpts,
): DuelState {
  const target = state.placements.find((p) => p.uid === uid);
  if (!target) return state;
  const def = STATUS_DEFS[kind];

  if (def.negative) {
    if (immuneToModifiers(target)) return state;
    // Burn eats Rating — Unbreakable Loyalty blocks it outright.
    if (target.noReduce && kind === "burn") return state;
    const bounced = tryReflect(
      state,
      target,
      (s, victim) => applyStatus(s, victim.uid, kind, { noReflect: true }),
      opts,
    );
    if (bounced) return bounced;
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
  if (victim.noReduce) return mark(state);
  if ((victim.immuneUntilRound ?? 0) > state.round) return mark(state);
  if (hasStatus(victim, "shield")) return mark(consumeShield(state, victimUid));

  const amount = baseRatingOf(victim);
  if (amount <= 0) return mark(state);

  let next = patch(state, victimUid, (p) => ({ ...p, bonus: p.bonus - amount }));
  next = patch(next, thiefUid, (p) => ({ ...p, bonus: p.bonus + amount }));
  return mark(next);
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
