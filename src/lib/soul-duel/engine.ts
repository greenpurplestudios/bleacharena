import type { Character, Rarity } from "@/types/character";
import { BATTLEFIELDS } from "@/data/battlefields";
import { ANT_SLUG, abilityOf, duelDefOf } from "./abilities";
import { elementMultiplier, elementOf } from "@/lib/elements";
import {
  asOwner, canRelocate, hasStatus, immuneToModifiers, isFrozen, isSealed, withCaster,
} from "./effects";
import { BURN_DAMAGE, STATUS_DEFS } from "./status";
import { ultimateOf, STARTER_WEAPON } from "./ultimates";
import {
  CLASH_MARGIN, DECK_SIZE, GAUGE_MAX, HAND_SIZE, LANE_COUNT, LIMIT_MAX, MAX_PER_LANE,
  MAX_ROUNDS, REIATSU_BY_ROUND,
  type Difficulty,
  type DuelCard, type DuelLogEntry, type DuelLogKey, type DuelResult,
  type DuelState, type LaneScore, type Placement, type Side,
  type RoundRecord,
} from "./types";

/* ------------------------------------------------------------------ costs */

const COST_BY_RARITY: Record<Rarity, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6,
};

export function costOf(c: Character): number {
  return duelDefOf(c.slug)?.cost ?? COST_BY_RARITY[c.rarity] ?? 3;
}

export function reiatsuForRound(round: number): number {
  return REIATSU_BY_ROUND[Math.min(round, MAX_ROUNDS) - 1] ?? 10;
}

/* ------------------------------------------------------------------ setup */

let uidSeq = 0;
const uid = () => `d${++uidSeq}-${Math.random().toString(36).slice(2, 7)}`;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A balanced 16-card deck: a spread of costs so every round is playable. */
export function buildDeck(pool: Character[]): DuelCard[] {
  const byCost = new Map<number, Character[]>();
  for (const c of pool) {
    const k = costOf(c);
    byCost.set(k, [...(byCost.get(k) ?? []), c]);
  }
  const curve = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6];
  const picked: Character[] = [];
  const used = new Set<string>();
  for (const cost of curve) {
    const bucket = shuffle(byCost.get(cost) ?? []).find((c) => !used.has(c.id));
    const fallback = shuffle(pool).find((c) => !used.has(c.id));
    const chosen = bucket ?? fallback;
    if (!chosen) continue;
    used.add(chosen.id);
    picked.push(chosen);
  }
  return shuffle(picked)
    .slice(0, DECK_SIZE)
    .map((character) => ({ uid: uid(), character, cost: costOf(character) }));
}

export interface DuelOptions {
  difficulty?: Difficulty;
  /** Ultimate Weapon the player equipped in Nimaiya's Forge. */
  weaponId?: string;
  /** Weapon the AI brings (defaults to a themed pick). */
  opponentWeaponId?: string;
}

const AI_WEAPONS: Record<Difficulty, string[]> = {
  practice: ["zangetsu", "hado-90"],
  normal: ["hado-90", "sakanade", "enma-korogi", "daiguren-hyorinmaru"],
  nightmare: ["the-almighty", "ichimonji", "kannon-biraki", "daiguren-hyorinmaru"],
};

const emptyGauge = () => ({ charge: 0, limit: 0, pending: false, used: false });

export const emptyMods = (): DuelState["mods"] => ({
  revealUntil: {},
  blindUntil: {},
  lockedRound: {},
  laneBonus: {},
  hijack: null,
  inkedUids: [],
});

export function createDuel(pool: Character[], opts: DuelOptions = {}): DuelState {
  const difficulty: Difficulty = opts.difficulty ?? "normal";
  const lanes = shuffle(BATTLEFIELDS)
    .slice(0, LANE_COUNT)
    .map((def) => ({ def, revealed: false, closed: false }));

  const draw = (deck: DuelCard[]) => ({
    hand: deck.slice(0, HAND_SIZE),
    rest: deck.slice(HAND_SIZE),
  });
  const p = draw(buildDeck(pool));
  const o = draw(buildDeck(pool));

  return {
    round: 1,
    phase: "reveal",
    lanes,
    placements: [],
    hands: { player: p.hand, opponent: o.hand },
    decks: { player: p.rest, opponent: o.rest },
    spent: { player: 0, opponent: 0 },
    log: [],
    laneBuffs: [],
    laneLimits: [],
    gauge: { player: emptyGauge(), opponent: emptyGauge() },
    weapons: {
      player: opts.weaponId ?? STARTER_WEAPON,
      opponent:
        opts.opponentWeaponId ??
        AI_WEAPONS[difficulty][Math.floor(Math.random() * AI_WEAPONS[difficulty].length)],
    },
    difficulty,
    ultimateEvent: null,
    mods: emptyMods(),
    ultimateTargets: {},
  };
}

/* ------------------------------------------------------------ board access */

export function laneCards(state: DuelState, lane: number, side: Side): Placement[] {
  return state.placements.filter((p) => p.lane === lane && p.side === side);
}

/**
 * A sealed battlefield keeps its rules secret — and inert. The moment it is
 * revealed the rules apply retroactively to every card already standing there.
 */
export function rulesOf(state: DuelState, lane: number) {
  const l = state.lanes[lane];
  return l?.revealed ? l.def.rules : {};
}

export function laneIsOpen(state: DuelState, lane: number, side: Side): boolean {
  const l = state.lanes[lane];
  const cap = state.laneLimits
    .filter((x) => x.lane === lane && x.side === side)
    .reduce((n, x) => Math.min(n, x.max), MAX_PER_LANE);
  // Cards may be committed to a battlefield before it is revealed.
  return !!l && !l.closed && laneCards(state, lane, side).length < cap;
}

export function remainingReiatsu(state: DuelState, side: Side): number {
  return reiatsuForRound(state.round) - state.spent[side];
}

/* ---------------------------------------------------- Reiatsu Gauge & Ultimates */

/** True when a side may fire its Ultimate Weapon right now. */
export function canActivateUltimate(state: DuelState, side: Side): boolean {
  const g = state.gauge[side];
  return state.phase === "play" && !g.used && !g.pending && g.charge >= GAUGE_MAX;
}

/** Queues an Ultimate — it resolves when the round is settled. */
export function activateUltimate(state: DuelState, side: Side): DuelState {
  if (!canActivateUltimate(state, side)) return state;
  return { ...state, gauge: { ...state.gauge, [side]: { ...state.gauge[side], pending: true } } };
}

export function cancelUltimate(state: DuelState, side: Side): DuelState {
  return { ...state, gauge: { ...state.gauge, [side]: { ...state.gauge[side], pending: false } } };
}

function addCharge(state: DuelState, side: Side, amount: number): DuelState {
  const g = state.gauge[side];
  if (g.used) return state;
  const raw = g.charge + amount;
  const charge = Math.min(GAUGE_MAX, raw);
  const limit = Math.min(LIMIT_MAX, g.limit + Math.max(0, raw - GAUGE_MAX));
  return { ...state, gauge: { ...state.gauge, [side]: { ...g, charge, limit } } };
}

/**
 * Gauge growth rewards performance. Everyone charges enough for one Ultimate
 * by the final round; holding battlefields and out-rating the opponent gets
 * there by round 5 — or round 4 for a dominant board — and the overflow feeds
 * the Limit Breaker that decides a Reiatsu Clash.
 */
function chargeRound(state: DuelState): DuelState {
  let next = state;
  const totals = state.lanes.map((_, i) => laneTotals(state, i));
  (["player", "opponent"] as Side[]).forEach((side) => {
    const led = totals.filter((t) => t.winner === side).length;
    const advantage = totals.reduce(
      (n, t) => n + (side === "player" ? t.player - t.opponent : t.opponent - t.player),
      0,
    );
    // Soul Pressure grows ~18% faster than the original tuning so a committed
    // player reaches their Ultimate by round 5 (round 4 on a dominant board).
    const gain = Math.min(34, 20 + led * 5 + Math.max(0, Math.min(9, Math.floor(advantage / 13))));
    next = addCharge(next, side, gain);
  });
  return next;
}

function spendGauge(state: DuelState, side: Side): DuelState {
  return {
    ...state,
    gauge: { ...state.gauge, [side]: { charge: 0, limit: 0, pending: false, used: true } },
  };
}

/** Resolves queued Ultimates — including the Reiatsu Clash when both fire. */
function resolveUltimates(state: DuelState): DuelState {
  const p = state.gauge.player.pending;
  const o = state.gauge.opponent.pending;
  if (!p && !o) return { ...state, ultimateEvent: null };

  const eventId = uid();

  if (p && o) {
    const limits = { player: state.gauge.player.limit, opponent: state.gauge.opponent.limit };
    const diff = Math.abs(limits.player - limits.opponent);
    const winner: Side | null =
      diff >= CLASH_MARGIN ? (limits.player > limits.opponent ? "player" : "opponent") : null;

    let next = spendGauge(spendGauge(state, "player"), "opponent");
    if (winner) next = ultimateOf(state.weapons[winner]).effect(next, winner);
    return {
      ...next,
      ultimateEvent: {
        id: eventId,
        round: state.round,
        kind: "clash",
        side: winner ?? undefined,
        weaponId: winner ? state.weapons[winner] : undefined,
        clash: { weapons: { ...state.weapons }, limits, winner },
      },
    };
  }

  const side: Side = p ? "player" : "opponent";
  const weaponId = state.weapons[side];
  const next = ultimateOf(weaponId).effect(spendGauge(state, side), side);
  return {
    ...next,
    ultimateEvent: { id: eventId, round: state.round, kind: "single", side, weaponId },
  };
}

export function canPlay(state: DuelState, side: Side, card: DuelCard, lane: number): boolean {
  return (
    state.phase === "play" &&
    !isLockedOut(state, side) &&
    laneIsOpen(state, lane, side) &&
    card.cost <= remainingReiatsu(state, side)
  );
}

/** Daiguren Hyōrinmaru freezes a side out of playing for one round. */
export function isLockedOut(state: DuelState, side: Side): boolean {
  return state.mods.lockedRound[side] === state.round;
}

/** Enma Kōrogi blinds a side: it cannot read enemy cards or battlefield Ratings. */
export function isBlinded(state: DuelState, viewer: Side): boolean {
  return state.phase !== "ended" && (state.mods.blindUntil[viewer] ?? 0) >= state.round;
}

/** Enemy cards concealed by a battlefield rule, The Almighty or Enma Kōrogi. */
export function isHidden(state: DuelState, p: Placement, viewer: Side = "player"): boolean {
  if (p.side === viewer || state.phase === "ended") return false;
  if ((state.mods.revealUntil[viewer] ?? 0) >= state.round) return false;
  if (isBlinded(state, viewer)) return true;
  const until = rulesOf(state, p.lane).hiddenUntilRound;
  return !!until && state.round < until;
}

/* ---------------------------------------------------------------- mutation */

function log(state: DuelState, key: DuelLogKey, lane?: number, name?: string): DuelLogEntry {
  return { id: uid(), round: state.round, key, lane, name };
}

export function revealLane(state: DuelState, lane: number): DuelState {
  if (state.lanes[lane]?.revealed) return state;
  const lanes = state.lanes.map((l, i) => (i === lane ? { ...l, revealed: true } : l));
  return {
    ...state,
    lanes,
    phase: "play",
    log: [...state.log, log(state, "logRevealed", lane, lanes[lane].def.id)],
  };
}

export function playCard(state: DuelState, side: Side, cardUid: string, lane: number): DuelState {
  const card = state.hands[side].find((c) => c.uid === cardUid);
  if (!card || !canPlay(state, side, card, lane)) return state;
  // Yukio's Invaders Must Die — the card is repelled straight back to hand.
  const bounce = (state.bounces ?? []).find((b) => b.lane === lane && b.side === side);
  if (bounce) {
    return {
      ...state,
      bounces: (state.bounces ?? []).filter((b) => b !== bounce),
      log: [...state.log, log(state, "logBounce", lane, card.character.slug)],
    };
  }
  const buff = state.laneBuffs.find((b) => b.lane === lane && b.side === side);
  const hijack = state.mods.hijack;
  const placement: Placement = {
    uid: card.uid,
    card,
    side,
    lane,
    round: state.round,
    statuses: [],
    bonus: buff ? buff.amount : 0,
    movesUsed: 0,
    stolen: [],
    hijacked:
      !!hijack && hijack.side !== side && hijack.slugs.includes(card.character.slug),
  };
  const next: DuelState = {
    ...state,
    hands: { ...state.hands, [side]: state.hands[side].filter((c) => c.uid !== cardUid) },
    spent: { ...state.spent, [side]: state.spent[side] + card.cost },
    placements: [...state.placements, placement],
    laneBuffs: buff ? state.laneBuffs.filter((b) => b !== buff) : state.laneBuffs,
  };
  const ability = abilityOf(card.character.slug);
  const played = next.placements[next.placements.length - 1];
  if (!ability?.onPlay) return next;
  const owner = asOwner(played);
  return withCaster(owner, () => ability.onPlay!(next, owner));
}

/** Abilities with a move budget (Urahara, Yoruichi) relocate a placed card. */
export function canMove(state: DuelState, uid: string, lane: number): boolean {
  const p = state.placements.find((x) => x.uid === uid);
  if (!p || state.phase !== "play" || p.lane === lane) return false;
  return canRelocate(p) && laneIsOpen(state, lane, p.side);
}

export function moveCard(state: DuelState, uid: string, lane: number): DuelState {
  if (!canMove(state, uid, lane)) return state;
  return {
    ...state,
    placements: state.placements.map((p) =>
      p.uid === uid ? { ...p, lane, movesUsed: p.movesUsed + 1 } : p,
    ),
    log: [...state.log, log(state, "logMove", lane)],
  };
}

/** Take a staged card back into hand (only in the round it was played). */
export function undoCard(state: DuelState, side: Side, cardUid: string): DuelState {
  const p = state.placements.find((x) => x.uid === cardUid && x.side === side);
  if (!p || p.round !== state.round || state.phase !== "play") return state;
  return {
    ...state,
    hands: { ...state.hands, [side]: [...state.hands[side], p.card] },
    spent: { ...state.spent, [side]: Math.max(0, state.spent[side] - p.card.cost) },
    placements: state.placements.filter((x) => x.uid !== cardUid),
  };
}

/* -------------------------------------------------------------- resolution */

function applyDrift(state: DuelState): DuelState {
  let placements = state.placements;
  const entries: DuelLogEntry[] = [];
  for (const p of placements.filter((x) => x.round === state.round)) {
    const chance = rulesOf(state, p.lane).driftChance;
    if (!chance || Math.random() > chance) continue;
    const targets = state.lanes
      .map((_, i) => i)
      .filter(
        (i) =>
          i !== p.lane &&
          !state.lanes[i].closed &&
          placements.filter((x) => x.lane === i && x.side === p.side).length < MAX_PER_LANE,
      );
    if (!targets.length) continue;
    const dest = targets[Math.floor(Math.random() * targets.length)];
    placements = placements.map((x) => (x.uid === p.uid ? { ...x, lane: dest } : x));
    entries.push(log(state, "logDrift", dest, p.card.character.slug));
  }
  return { ...state, placements, log: [...state.log, ...entries] };
}

function applySwap(state: DuelState): DuelState {
  let placements = state.placements;
  const entries: DuelLogEntry[] = [];
  state.lanes.forEach((lane, i) => {
    if (!lane.revealed || !lane.def.rules.swapOnContest) return;
    const mine = placements.find((p) => p.lane === i && p.side === "player" && p.round === state.round);
    const theirs = placements.find((p) => p.lane === i && p.side === "opponent" && p.round === state.round);
    if (!mine || !theirs) return;
    placements = placements.map((p) =>
      p.uid === mine.uid ? { ...p, side: "opponent" as Side }
      : p.uid === theirs.uid ? { ...p, side: "player" as Side }
      : p,
    );
    entries.push(log(state, "logSwap", i));
  });
  return { ...state, placements, log: [...state.log, ...entries] };
}

function applyClosures(state: DuelState): DuelState {
  const entries: DuelLogEntry[] = [];
  const lanes = state.lanes.map((l, i) => {
    const chance = l.def.rules.closeChance;
    if (!l.revealed || l.closed || !chance || Math.random() > chance) return l;
    entries.push(log(state, "logHellClosed", i));
    return { ...l, closed: true };
  });
  return { ...state, lanes, log: [...state.log, ...entries] };
}

function applyImprisonment(state: DuelState): DuelState {
  let placements = state.placements;
  const entries: DuelLogEntry[] = [];
  state.lanes.forEach((lane, i) => {
    if (!lane.revealed || !lane.def.rules.imprisonAtFinalRound) return;
    (["player", "opponent"] as Side[]).forEach((side) => {
      const pool = placements.filter((p) => p.lane === i && p.side === side);
      if (!pool.length) return;
      const victim = pool[Math.floor(Math.random() * pool.length)];
      placements = placements.map((p) => (p.uid === victim.uid ? { ...p, imprisoned: true } : p));
      entries.push(log(state, "logImprison", i, victim.card.character.slug));
    });
  });
  return { ...state, placements, log: [...state.log, ...entries] };
}

function drawFor(state: DuelState): DuelState {
  const hands = { ...state.hands };
  const decks = { ...state.decks };
  (["player", "opponent"] as Side[]).forEach((side) => {
    if (hands[side].length >= 7 || !decks[side].length) return;
    hands[side] = [...hands[side], decks[side][0]];
    decks[side] = decks[side].slice(1);
  });
  return { ...state, hands, decks };
}

/** End-of-round ability triggers, then status ticks (burn damage, expiry). */
function applyAbilityTicks(state: DuelState): DuelState {
  let next = state;
  for (const p of state.placements) {
    const current = next.placements.find((x) => x.uid === p.uid);
    if (!current || isFrozen(current) || isSealed(next, current)) continue;
    if (rulesOf(next, current.lane).disableAbilities) continue;
    const ability = abilityOf(current.card.character.slug);
    if (ability?.onRoundEnd) {
      const owner = asOwner(current);
      next = withCaster(owner, () => ability.onRoundEnd!(next, owner));
    }
  }
  return next;
}

function tickStatuses(state: DuelState): DuelState {
  const entries: DuelLogEntry[] = [];
  const placements = state.placements.map((p) => {
    if (!p.statuses.length) return p;
    let bonus = p.bonus;
    if (hasStatus(p, "burn") && !immuneToModifiers(p) && !p.noReduce) {
      bonus -= BURN_DAMAGE;
      entries.push(log(state, "logBurn", p.lane, p.card.character.slug));
    }
    const statuses = p.statuses
      .map((s) => ({ ...s, remaining: s.remaining - 1 }))
      .filter((s) => s.remaining > 0 && STATUS_DEFS[s.kind]);
    return { ...p, bonus, statuses };
  });
  return { ...state, placements, log: [...state.log, ...entries] };
}

/** End of round: resolve battlefield effects, then advance or finish. */
export function resolveRound(state: DuelState): DuelState {
  let next = resolveUltimates(state);
  next = applyAbilityTicks(next);
  next = applyDrift(next);
  next = applySwap(next);
  next = applyClosures(next);
  next = tickStatuses(next);
  next = chargeRound(next);
  next = recordRound(state, next);

  if (next.round >= MAX_ROUNDS) {
    next = applyImprisonment(next);
    const ended: DuelState = { ...next, phase: "ended" };
    return { ...ended, result: scoreMatch(ended) };
  }

  next = drawFor(next);
  return {
    ...next,
    round: next.round + 1,
    spent: { player: 0, opponent: 0 },
    phase: next.round + 1 <= LANE_COUNT ? "reveal" : "play",
  };
}

/** Snapshots the round for the post-match Battle Review. */
function recordRound(before: DuelState, state: DuelState): DuelState {
  const round = state.round;
  const lanes = state.lanes.map((_l, i) => laneTotals(state, i));
  const played = (side: Side) =>
    state.placements
      .filter((p) => p.side === side && p.round === round)
      .map((p) => ({ name: p.card.character.name, rating: ratingOf(state, p), lane: p.lane }));
  const record: RoundRecord = {
    round,
    lanes,
    total: {
      player: lanes.reduce((n, l) => n + l.player, 0),
      opponent: lanes.reduce((n, l) => n + l.opponent, 0),
    },
    played: { player: played("player"), opponent: played("opponent") },
    events: state.log.slice(before.log.length),
    ultimate: state.ultimateEvent
      ? {
          kind: state.ultimateEvent.kind,
          side: state.ultimateEvent.side,
          weaponId: state.ultimateEvent.weaponId,
          winner: state.ultimateEvent.clash?.winner ?? undefined,
        }
      : undefined,
  };
  return { ...state, history: [...(state.history ?? []), record] };
}

/* ----------------------------------------------------------------- scoring */

function raceMatches(character: Character, races: string[]): boolean {
  const race = `${character.race ?? ""} ${character.faction ?? ""}`.toLowerCase();
  return races.some((r) => race.includes(r.toLowerCase()));
}

/** Final rating of a single placed card, with every active modifier applied. */
export function ratingOf(state: DuelState, p: Placement): number {
  // The Black Ant never changes — not by ability, battlefield or Ultimate.
  if (p.card.character.slug === ANT_SLUG) return 1;
  if (p.imprisoned) return 0;
  if ((p.zeroUntilRound ?? 0) >= state.round) return 0;
  const base = p.override ?? p.card.character.overall;
  if (immuneToModifiers(p)) return Math.max(0, Math.round(base));
  const rules = rulesOf(state, p.lane);
  let rating = base + p.bonus;

  if (rules.globalRating) rating += rules.globalRating;
  if (rules.factionBuff && raceMatches(p.card.character, rules.factionBuff.races)) {
    rating += rules.factionBuff.amount;
  }
  if (rules.firstCardBonus) {
    const first = state.placements
      .filter((x) => x.lane === p.lane)
      .sort((a, b) => a.round - b.round)[0];
    if (first?.uid === p.uid) rating += rules.firstCardBonus;
  }

  if (!rules.disableAbilities) {
    const mult = rules.doubleAbilities ? 2 : 1;
    const board = state.placements;
    const owned = asOwner(p);
    const sealed = isSealed(state, p);
    const own = isFrozen(p) || sealed ? undefined : abilityOf(p.card.character.slug);
    // A hijacked card no longer boosts itself for its original owner.
    if (own?.selfRating && !p.hijacked) {
      rating += mult * own.selfRating({ self: owned, state, board });
    }
    for (const other of board) {
      if (other.uid === p.uid || isFrozen(other) || isSealed(state, other)) continue;
      const otherRules = rulesOf(state, other.lane);
      if (otherRules.disableAbilities) continue;
      const ab = abilityOf(other.card.character.slug);
      if (!ab?.aura) continue;
      const otherMult = otherRules.doubleAbilities ? 2 : 1;
      const caster = asOwner(other);
      const raw = ab.aura({ self: caster, state, board }, p);
      // Sealed cards are inert; elemental advantage scales cross-side effects.
      if (!raw || sealed) continue;
      const elem =
        caster.side === p.side
          ? 1
          : elementMultiplier(
              elementOf(other.card.character.slug),
              elementOf(p.card.character.slug),
            );
      rating += otherMult * raw * elem;
    }

    // Renji rewrites his own Rating from the weakest enemy on his battlefield.
    if (own?.overrideRating) {
      const forced = own.overrideRating({ self: owned, state, board });
      if (typeof forced === "number") rating = forced;
    }
  }

  return Math.max(0, Math.round(rating));
}

export function laneTotals(state: DuelState, lane: number): LaneScore {
  const sum = (side: Side) =>
    laneCards(state, lane, side).reduce((n, p) => n + ratingOf(state, p), 0) +
    (state.mods.laneBonus[side] ?? 0);
  const player = sum("player");
  const opponent = sum("opponent");
  return {
    player,
    opponent,
    winner: player === opponent ? "tie" : player > opponent ? "player" : "opponent",
  };
}

export function scoreMatch(state: DuelState): DuelResult {
  const lanes = state.lanes.map((_, i) => laneTotals(state, i));
  const lanesWon = {
    player: lanes.filter((l) => l.winner === "player").length,
    opponent: lanes.filter((l) => l.winner === "opponent").length,
  };
  const total = {
    player: lanes.reduce((n, l) => n + l.player, 0),
    opponent: lanes.reduce((n, l) => n + l.opponent, 0),
  };
  let winner: Side | "tie" = "tie";
  if (lanesWon.player !== lanesWon.opponent) {
    winner = lanesWon.player > lanesWon.opponent ? "player" : "opponent";
  } else if (total.player !== total.opponent) {
    winner = total.player > total.opponent ? "player" : "opponent";
  }
  return { lanes, lanesWon, total, winner };
}
