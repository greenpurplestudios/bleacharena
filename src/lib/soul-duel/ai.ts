import { canPlay, laneIsOpen, laneTotals, playCard, remainingReiatsu } from "./engine";
import type { DuelState } from "./types";

/**
 * Opponent brain. Greedy but battlefield-aware: it spends as much Reiatsu as
 * it can, always choosing the lane where the card swings the score the most.
 */
export function takeOpponentTurn(state: DuelState): DuelState {
  let next = state;
  let guard = 0;
  while (guard++ < 8) {
    const affordable = next.hands.opponent
      .filter((c) => c.cost <= remainingReiatsu(next, "opponent"))
      .sort((a, b) => b.cost - a.cost || b.character.overall - a.character.overall);
    if (!affordable.length) break;

    let best: { uid: string; lane: number; gain: number } | null = null;
    for (const card of affordable) {
      for (let lane = 0; lane < next.lanes.length; lane++) {
        if (!laneIsOpen(next, lane, "opponent") || !canPlay(next, "opponent", card, lane)) continue;
        const before = laneTotals(next, lane);
        const after = laneTotals(playCard(next, "opponent", card.uid, lane), lane);
        const deficit = Math.max(0, before.player - before.opponent);
        // Prefer lanes that are close to flipping, then raw rating gained.
        const gain = after.opponent - before.opponent + (deficit > 0 ? 12 - Math.min(deficit, 12) : 0);
        if (!best || gain > best.gain) best = { uid: card.uid, lane, gain };
      }
    }
    if (!best) break;
    next = playCard(next, "opponent", best.uid, best.lane);
  }
  return next;
}
