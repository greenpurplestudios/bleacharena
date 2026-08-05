import {
  activateUltimate, canActivateUltimate, canPlay, laneIsOpen, laneTotals, playCard,
  remainingReiatsu,
} from "./engine";
import { CLASH_MARGIN, GAUGE_MAX, MAX_ROUNDS, type DuelState } from "./types";

/**
 * Opponent brains.
 *
 * practice  — plays a couple of cards, ignores battlefield pressure.
 * normal    — greedy and battlefield-aware.
 * nightmare — values contested battlefields, abilities and battlefield rules,
 *             and times its Ultimate (including deliberate Reiatsu Clashes).
 */
export function takeOpponentTurn(state: DuelState): DuelState {
  let next = decideUltimate(state);
  const { difficulty } = next;
  const maxPlays = difficulty === "practice" ? 2 : 8;
  let guard = 0;
  while (guard++ < maxPlays) {
    const affordable = next.hands.opponent
      .filter((c) => c.cost <= remainingReiatsu(next, "opponent"))
      .sort((a, b) => b.cost - a.cost || b.character.overall - a.character.overall);
    if (!affordable.length) break;
    const pool = difficulty === "practice" ? affordable.slice(-2) : affordable;

    let best: { uid: string; lane: number; gain: number } | null = null;
    for (const card of pool) {
      for (let lane = 0; lane < next.lanes.length; lane++) {
        if (!laneIsOpen(next, lane, "opponent") || !canPlay(next, "opponent", card, lane)) continue;
        const before = laneTotals(next, lane);
        const played = playCard(next, "opponent", card.uid, lane);
        const after = laneTotals(played, lane);
        const deficit = Math.max(0, before.player - before.opponent);
        // Prefer lanes that are close to flipping, then raw rating gained.
        let gain = after.opponent - before.opponent;
        if (difficulty !== "practice") {
          gain += deficit > 0 ? 12 - Math.min(deficit, 12) : 0;
        }
        if (difficulty === "nightmare") {
          // Value ability payoff on the board, punish enemy leads harder and
          // avoid battlefields that suppress abilities or close at random.
          const rules = next.lanes[lane].def.rules;
          const swing = after.opponent - before.opponent - (after.player - before.player);
          gain += swing * 0.5;
          if (rules.doubleAbilities) gain += 6;
          if (rules.disableAbilities) gain -= 5;
          if (rules.closeChance) gain -= rules.closeChance * 14;
          if (before.opponent > before.player + 25) gain -= 8; // don't overcommit
          if (deficit > 0 && deficit <= 20) gain += 8; // flip a close battlefield
        }
        if (difficulty === "practice") gain += Math.random() * 10 - 5;
        if (!best || gain > best.gain) best = { uid: card.uid, lane, gain };
      }
    }
    if (!best) break;
    next = playCard(next, "opponent", best.uid, best.lane);
  }
  return next;
}

/** When (and whether) the AI fires its Ultimate Weapon. */
function decideUltimate(state: DuelState): DuelState {
  if (!canActivateUltimate(state, "opponent")) return state;
  const g = state.gauge;

  switch (state.difficulty) {
    case "practice":
      // Fires late and unreliably.
      return state.round >= MAX_ROUNDS && Math.random() < 0.5
        ? activateUltimate(state, "opponent")
        : state;
    case "normal":
      // Fires as soon as it is charged.
      return activateUltimate(state, "opponent");
    case "nightmare": {
      const totals = state.lanes.map((_, i) => laneTotals(state, i));
      const lanesLost = totals.filter((t) => t.winner === "player").length;
      const playerReady = g.player.charge >= GAUGE_MAX && !g.player.used;
      // If the player can answer, only clash when the Limit Breaker wins it.
      if (playerReady) {
        const edge = g.opponent.limit - g.player.limit;
        if (edge >= CLASH_MARGIN) return activateUltimate(state, "opponent");
        if (state.round < MAX_ROUNDS) return state; // wait the player out
      }
      // Otherwise strike when it swings the match or time runs out.
      if (lanesLost >= 2 || state.round >= MAX_ROUNDS - 1) {
        return activateUltimate(state, "opponent");
      }
      return state;
    }
  }
}
