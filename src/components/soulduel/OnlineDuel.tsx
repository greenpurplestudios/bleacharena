import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { createDuel, resolveRound } from "@/lib/soul-duel/engine";
import type { DuelState } from "@/lib/soul-duel/types";
import {
  applyMoves, EMPTY_MOVES, extractMoves, fetchMatch, findMatch, leaveMatch, mirrorState,
  fetchOpponentName, pushInitialState, pushState, reportResult, setGuestWeapon, setHostReady, submitGuestMoves,
  subscribeMatch, type DuelMatchRow,
} from "@/lib/soul-duel/pvp";
import { supabase } from "@/integrations/supabase/client";
import { DuelBoard } from "./DuelBoard";

/**
 * Real-time 1v1 Soul Duel. The host owns the authoritative state; the guest
 * submits its round moves and renders a mirrored copy of the same board.
 */
export function OnlineDuel({
  pool,
  weaponId,
  onExit,
}: {
  pool: Character[];
  weaponId?: string;
  onExit: () => void;
}) {
  const { t } = useI18n();
  const [me, setMe] = useState<string | null>(null);
  const [row, setRow] = useState<DuelMatchRow | null>(null);
  const [staged, setStaged] = useState<DuelState | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);

  const stagedRef = useRef<DuelState | null>(null);
  const serverRef = useRef<DuelState | null>(null);
  const reported = useRef(false);
  /** Match id for which the host has already pushed (or is pushing) the
   * initial state — guards against re-firing the init effect. */
  const hostInitRef = useRef<string | null>(null);
  /** Match id for which the guest has already reported its weapon. */
  const guestWeaponSentRef = useRef<string | null>(null);
  /** Last server `state` JSON we actually adopted, so identical row updates
   * (host_ready toggles, unchanged polls) never clobber staged local moves. */
  const lastServerJsonRef = useRef<string | null>(null);
  /** `${matchId}:${round}` of the round the host has already resolved. */
  const resolvedRef = useRef<string | null>(null);
  stagedRef.current = staged;

  const isHost = !!row && !!me && row.host_id === me;

  /* Join the queue once. */
  useEffect(() => {
    let alive = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMe(data.user?.id ?? null);
      const m = await findMatch();
      if (alive) setRow(m);
    })();
    return () => { alive = false; };
  }, []);

  /* Live updates + a slow poll so the host notices a joining guest. Both
   * feed the same guard so an older/duplicate row can never step backwards. */
  const applyRow = useCallback((next: DuelMatchRow) => {
    setRow((prev) => {
      if (prev && prev.id === next.id && prev.updated_at && next.updated_at &&
          next.updated_at < prev.updated_at) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!row?.id) return;
    const matchId = row.id;
    const unsub = subscribeMatch(matchId, applyRow);
    const timer = window.setInterval(() => {
      void fetchMatch(matchId).then((r) => { if (r) applyRow(r); });
    }, 4000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [row?.id, applyRow]);

  /* The guest reports its equipped weapon once, right after joining, so the
   * host can build the match with both real loadouts. */
  useEffect(() => {
    if (!row || isHost || !row.guest_id || row.state) return;
    if (guestWeaponSentRef.current === row.id) return;
    guestWeaponSentRef.current = row.id;
    void setGuestWeapon(row.id, weaponId ?? "zangetsu");
  }, [row, isHost, weaponId]);

  /* Host creates the duel exactly once per match, as soon as an opponent has
   * joined — waiting briefly for the guest's weapon before falling back. */
  useEffect(() => {
    if (!row || !isHost || row.guest_id === null || row.state) return;
    if (hostInitRef.current === row.id) return;

    const create = (opponentWeaponId?: string) => {
      if (hostInitRef.current === row.id) return;
      hostInitRef.current = row.id;
      const fresh = createDuel(pool, { difficulty: "normal", weaponId, opponentWeaponId });
      void pushInitialState(row.id, fresh).then((ok) => {
        if (!ok) hostInitRef.current = null; // someone else already initialised it
      });
      play("reveal");
    };

    if (row.guest_weapon_id) {
      create(row.guest_weapon_id);
      return;
    }
    const timer = window.setTimeout(() => create(undefined), 2500);
    return () => window.clearTimeout(timer);
  }, [row, isHost, pool, weaponId]);

  /* Adopt an authoritative state only when it's genuinely new — never when
   * an unrelated column changed (host_ready toggle, an unchanged poll). */
  useEffect(() => {
    if (!row?.state) return;
    const json = JSON.stringify(row.state);
    if (json === lastServerJsonRef.current) return;
    lastServerJsonRef.current = json;
    const view = isHost ? row.state : mirrorState(row.state);
    serverRef.current = view;
    setStaged(view);
    setWaiting(false);
  }, [row?.state, isHost]);

  /* Host resolves the round exactly once per round, once both are ready. */
  useEffect(() => {
    if (!row || !isHost || !row.host_ready || !row.guest_ready || !row.state) return;
    const key = `${row.id}:${row.state.round}`;
    if (resolvedRef.current === key) return;
    const base = stagedRef.current;
    if (!base) return;
    resolvedRef.current = key;
    const withGuest = applyMoves(base, "opponent", row.guest_moves ?? EMPTY_MOVES);
    const resolved = resolveRound(withGuest);
    void pushState(row.id, resolved);
  }, [row, isHost]);

  /* Host reports the final score for the weekly ranking. */
  useEffect(() => {
    const result = row?.state?.result;
    if (!row || !isHost || !result || reported.current) return;
    reported.current = true;
    void reportResult(
      row.id,
      result.winner === "tie" ? "tie" : result.winner === "player" ? "host" : "guest",
    );
  }, [row, isHost]);

  useEffect(() => {
    if (row?.status === "ended" && !row.state?.result) setNotice(t("sdOpponentLeft"));
  }, [row?.status, row?.state?.result, t]);

  /* Resolve the opponent's public username once both seats are filled, and
   * keep retrying briefly in case their profile row lands a moment later. */
  useEffect(() => {
    const id = row?.id;
    if (!id || !row?.guest_id) return;
    let alive = true;
    let tries = 0;
    const load = async () => {
      const name = await fetchOpponentName(id);
      if (!alive) return;
      if (name) setOpponentName(name);
      else if (++tries < 5) window.setTimeout(load, 1500);
    };
    void load();
    return () => { alive = false; };
  }, [row?.id, row?.guest_id]);

  const quit = useCallback(() => {
    if (row) void leaveMatch(row.id);
    onExit();
  }, [row, onExit]);

  const endRound = useCallback(() => {
    if (!row || !staged || !serverRef.current) return;
    setWaiting(true);
    haptic("flip");
    if (isHost) void setHostReady(row.id, true);
    else void submitGuestMoves(row.id, extractMoves(serverRef.current, staged));
  }, [row, staged, isHost]);

  if (!row || !staged) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
        <span
          className="h-14 w-14 rounded-full border-2 border-primary/30 border-t-primary"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <p className="font-display text-sm font-black uppercase tracking-[0.25em] text-muted-foreground rtl:tracking-normal">
          {notice ?? (row?.guest_id ? t("sdMatchFound") : t("sdSearching"))}
        </p>
        <button
          type="button"
          onClick={quit}
          className="tactile rounded-xl border border-white/15 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground rtl:tracking-normal"
        >
          {t("sdCancelSearch")}
        </button>
      </div>
    );
  }

  return (
    <>
      {notice ? (
        <p className="mb-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-[11px] text-destructive">
          {notice}
        </p>
      ) : null}
      <DuelBoard
        pool={pool}
        onExit={quit}
        weaponId={weaponId}
        online={{
          state: staged,
          setState: (updater) => setStaged((s) => (s ? updater(s) : s)),
          onEndRound: endRound,
          waiting,
          opponentName: opponentName ?? undefined,
        }}
      />
    </>
  );
}