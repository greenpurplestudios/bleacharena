import type { Character, Rarity } from "@/types/character";
import { BATTLEFIELDS } from "@/data/battlefields";
import { abilityOf, duelDefOf } from "./abilities";
import {
  addBonus, baseRatingOf, canRelocate, hasStatus, immuneToModifiers, isFrozen,
} from "./effects";
import { BURN_DAMAGE, STATUS_DEFS } from "./status";
import {
  DECK_SIZE, HAND_SIZE, LANE_COUNT, MAX_PER_LANE, MAX_ROUNDS, REIATSU_BY_ROUND,
  type DuelCard, type DuelLogEntry, type DuelLogKey, type DuelResult,
  type DuelState, type LaneScore, type Placement, type Side,
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

export function createDuel(pool: Character[]): DuelState {
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
  };
}

/* ------------------------------------------------------------ board access */

export function laneCards(state: DuelState, lane: number, side: Side): Placement[] {
  return state.placements.filter((p) => p.lane === lane && p.side === side);
}

export function laneIsOpen(state: DuelState, lane: number, side: Side): boolean {
  const l = state.lanes[lane];
  const cap = state.laneLimits
    .filter((x) => x.lane === lane && x.side === side)
    .reduce((n, x) => Math.min(n, x.max), MAX_PER_LANE);
  return !!l && l.revealed && !l.closed && laneCards(state, lane, side).length < cap;
}

export function remainingReiatsu(state: DuelState, side: Side): number {
  return reiatsuForRound(state.round) - state.spent[side];
}

export function canPlay(state: DuelState, side: Side, card: DuelCard, lane: number): boolean {
  return (
    state.phase === "play" &&
    laneIsOpen(state, lane, side) &&
    card.cost <= remainingReiatsu(state, side)
  );
}

/** Opponent cards on a hidden battlefield stay concealed until its reveal round. */
export function isHidden(state: DuelState, p: Placement): boolean {
  if (p.side === "player") return false;
  const until = state.lanes[p.lane]?.def.rules.hiddenUntilRound;
  return !!until && state.round < until && state.phase !== "ended";
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
  const buff = state.laneBuffs.find((b) => b.lane === lane && b.side === side);
  const placement: Placement = {
    uid: card.uid,
    card,
    side,
    lane,
    round: state.round,
    statuses: [],
    bonus: buff ? buff.amount : 0,
    movesUsed: 0,
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
  return ability?.onPlay ? ability.onPlay(next, played) : next;
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
    const chance = state.lanes[p.lane]?.def.rules.driftChance;
    if (!chance || Math.random() > chance) continue;
    const targets = state.lanes
      .map((_, i) => i)
      .filter(
        (i) =>
          i !== p.lane &&
          state.lanes[i].revealed &&
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
    if (!lane.def.rules.swapOnContest) return;
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
    if (!lane.def.rules.imprisonAtFinalRound) return;
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

/** End of round: resolve battlefield effects, then advance or finish. */
export function resolveRound(state: DuelState): DuelState {
  let next = applyDrift(state);
  next = applySwap(next);
  next = applyClosures(next);

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

/* ----------------------------------------------------------------- scoring */

function raceMatches(character: Character, races: string[]): boolean {
  const race = `${character.race ?? ""} ${character.faction ?? ""}`.toLowerCase();
  return races.some((r) => race.includes(r.toLowerCase()));
}

/** Final rating of a single placed card, with every active modifier applied. */
export function ratingOf(state: DuelState, p: Placement): number {
  if (p.imprisoned) return 0;
  const lane = state.lanes[p.lane];
  const rules = lane?.def.rules ?? {};
  let rating = p.card.character.overall;

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
    const own = abilityOf(p.card.character.slug);
    if (own?.selfRating) rating += mult * own.selfRating({ self: p, state, board });
    for (const other of board) {
      if (other.uid === p.uid) continue;
      const otherRules = state.lanes[other.lane]?.def.rules ?? {};
      if (otherRules.disableAbilities) continue;
      const ab = abilityOf(other.card.character.slug);
      if (!ab?.aura) continue;
      const otherMult = otherRules.doubleAbilities ? 2 : 1;
      rating += otherMult * ab.aura({ self: other, state, board }, p);
    }
  }

  return Math.max(0, Math.round(rating));
}

export function laneTotals(state: DuelState, lane: number): LaneScore {
  const sum = (side: Side) =>
    laneCards(state, lane, side).reduce((n, p) => n + ratingOf(state, p), 0);
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
