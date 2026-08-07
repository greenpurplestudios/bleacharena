import { supabase } from "@/integrations/supabase/client";
import { activateUltimate, moveCard, playCard } from "./engine";
import type { DuelResult, DuelState, LaneScore, Side } from "./types";

export interface DuelMatchRow {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: string;
  state: DuelState | null;
  guest_moves: RoundMoves | null;
  host_ready: boolean;
  guest_ready: boolean;
  winner: string | null;
}

export interface RoundMoves {
  plays: { uid: string; lane: number }[];
  relocations: { uid: string; lane: number }[];
  ultimate: boolean;
}

export const EMPTY_MOVES: RoundMoves = { plays: [], relocations: [], ultimate: false };

/* -------------------------------------------------------------- mirroring */

const flip = (s: Side): Side => (s === "player" ? "opponent" : "player");
const swap = <T,>(r: Record<Side, T>): Record<Side, T> => ({ player: r.opponent, opponent: r.player });
const swapPartial = <T,>(r: Partial<Record<Side, T>>): Partial<Record<Side, T>> => ({
  player: r.opponent,
  opponent: r.player,
});
const mirrorLane = (l: LaneScore): LaneScore => ({
  player: l.opponent,
  opponent: l.player,
  winner: l.winner === "tie" ? "tie" : flip(l.winner),
});
const mirrorResult = (r: DuelResult): DuelResult => ({
  lanes: r.lanes.map(mirrorLane),
  lanesWon: swap(r.lanesWon),
  total: swap(r.total),
  winner: r.winner === "tie" ? "tie" : flip(r.winner),
});

/**
 * Turns the host's authoritative state into the guest's point of view (and
 * back — the transform is its own inverse), so both clients render the very
 * same board with themselves on the bottom row.
 */
export function mirrorState(s: DuelState): DuelState {
  return {
    ...s,
    placements: s.placements.map((p) => ({ ...p, side: flip(p.side) })),
    hands: swap(s.hands),
    decks: swap(s.decks),
    spent: swap(s.spent),
    gauge: swap(s.gauge),
    weapons: swap(s.weapons),
    laneBuffs: s.laneBuffs.map((b) => ({ ...b, side: flip(b.side) })),
    laneLimits: s.laneLimits.map((b) => ({ ...b, side: flip(b.side) })),
    mods: {
      revealUntil: swapPartial(s.mods.revealUntil),
      blindUntil: swapPartial(s.mods.blindUntil),
      lockedRound: swapPartial(s.mods.lockedRound),
      laneBonus: swapPartial(s.mods.laneBonus),
      hijack: s.mods.hijack ? { ...s.mods.hijack, side: flip(s.mods.hijack.side) } : null,
    },
    ultimateEvent: s.ultimateEvent
      ? {
          ...s.ultimateEvent,
          side: s.ultimateEvent.side ? flip(s.ultimateEvent.side) : undefined,
          clash: s.ultimateEvent.clash
            ? {
                weapons: swap(s.ultimateEvent.clash.weapons),
                limits: swap(s.ultimateEvent.clash.limits),
                winner: s.ultimateEvent.clash.winner ? flip(s.ultimateEvent.clash.winner) : null,
              }
            : undefined,
        }
      : s.ultimateEvent,
    history: s.history?.map((r) => ({
      ...r,
      lanes: r.lanes.map(mirrorLane),
      total: swap(r.total),
      played: swap(r.played),
      ultimate: r.ultimate
        ? {
            ...r.ultimate,
            side: r.ultimate.side ? flip(r.ultimate.side) : undefined,
            winner: r.ultimate.winner ? flip(r.ultimate.winner) : r.ultimate.winner,
          }
        : undefined,
    })),
    result: s.result ? mirrorResult(s.result) : undefined,
  };
}

/* ----------------------------------------------------------------- moves */

/** Everything the local player staged since the last authoritative state. */
export function extractMoves(server: DuelState, local: DuelState): RoundMoves {
  const known = new Map(
    server.placements.filter((p) => p.side === "player").map((p) => [p.uid, p.lane]),
  );
  const mine = local.placements.filter((p) => p.side === "player");
  return {
    plays: mine.filter((p) => !known.has(p.uid)).map((p) => ({ uid: p.uid, lane: p.lane })),
    relocations: mine
      .filter((p) => known.has(p.uid) && known.get(p.uid) !== p.lane)
      .map((p) => ({ uid: p.uid, lane: p.lane })),
    ultimate: local.gauge.player.pending && !server.gauge.player.pending,
  };
}

/** Replays a side's submitted moves on the host's authoritative state. */
export function applyMoves(state: DuelState, side: Side, moves: RoundMoves): DuelState {
  let next = state;
  if (moves.ultimate) next = activateUltimate(next, side);
  for (const m of moves.plays) next = playCard(next, side, m.uid, m.lane);
  for (const m of moves.relocations) next = moveCard(next, m.uid, m.lane);
  return next;
}

/* ------------------------------------------------------------ networking */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export async function findMatch(): Promise<DuelMatchRow | null> {
  const { data, error } = await db.rpc("duel_find_match");
  if (error) return null;
  return (Array.isArray(data) ? data[0] : data) as DuelMatchRow | null;
}

export async function fetchMatch(id: string): Promise<DuelMatchRow | null> {
  const { data } = await db.from("duel_matches").select("*").eq("id", id).maybeSingle();
  return (data as DuelMatchRow | null) ?? null;
}

export async function leaveMatch(id: string): Promise<void> {
  await db.rpc("duel_leave_match", { p_match: id });
}

export async function pushState(id: string, state: DuelState): Promise<void> {
  await db
    .from("duel_matches")
    .update({
      state,
      host_ready: false,
      guest_ready: false,
      guest_moves: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function submitGuestMoves(id: string, moves: RoundMoves): Promise<void> {
  await db
    .from("duel_matches")
    .update({ guest_moves: moves, guest_ready: true, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function setHostReady(id: string, ready: boolean): Promise<void> {
  await db
    .from("duel_matches")
    .update({ host_ready: ready, updated_at: new Date().toISOString() })
    .eq("id", id);
}

export async function reportResult(id: string, winner: "host" | "guest" | "tie"): Promise<void> {
  await db.rpc("duel_report_result", { p_match: id, p_winner: winner });
}

export function subscribeMatch(id: string, onRow: (row: DuelMatchRow) => void) {
  const channel = supabase
    .channel(`duel-match-${id}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "duel_matches", filter: `id=eq.${id}` },
      (payload) => onRow(payload.new as unknown as DuelMatchRow),
    )
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export interface DuelRankRow {
  user_id: string;
  username: string | null;
  name_frame: string | null;
  username_color: string | null;
  avatar_character_id: string | null;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
}

export async function fetchDuelLeaderboard(limit = 50): Promise<DuelRankRow[]> {
  const { data, error } = await db.rpc("duel_leaderboard", { p_limit: limit });
  if (error || !data) return [];
  return data as DuelRankRow[];
}