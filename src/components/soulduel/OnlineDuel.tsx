import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { createDuel, resolveRound } from "@/lib/soul-duel/engine";
import type { DuelState } from "@/lib/soul-duel/types";
import {
  applyMoves, extractMoves, fetchMatch, findMatch, leaveMatch, mirrorState,
  pushState, reportResult, setHostReady, submitGuestMoves, subscribeMatch,
  type DuelMatchRow,
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

  const stagedRef = useRef<DuelState | null>(null);
  const serverRef = useRef<DuelState | null>(null);
  const reported = useRef(false);
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

  /* Live updates + a slow poll so the host notices a joining guest. */
  useEffect(() => {
    if (!row?.id) return;
    const unsub = subscribeMatch(row.id, (next) => setRow(next));
    const timer = window.setInterval(() => {
      void fetchMatch(row.id).then((r) => { if (r) setRow(r); });
    }, 4000);
    return () => { unsub(); window.clearInterval(timer); };
  }, [row?.id]);

  /* Host creates the duel as soon as an opponent joins. */
  useEffect(() => {
    if (!row || !isHost || row.guest_id === null || row.state) return;
    const fresh = createDuel(pool, { difficulty: "normal", weaponId });
    void pushState(row.id, fresh);
    play("reveal");
  }, [row, isHost, pool, weaponId]);

  /* Adopt every authoritative state the host publishes. */
  useEffect(() => {
    if (!row?.state) return;
    const view = isHost ? row.state : mirrorState(row.state);
    serverRef.current = view;
    setStaged(view);
    setWaiting(false);
  }, [row?.state, isHost]);

  /* Host resolves the round once both players are ready. */
  useEffect(() => {
    if (!row || !isHost || !row.host_ready || !row.guest_ready) return;
    const base = stagedRef.current;
    if (!base) return;
    const withGuest = applyMoves(base, "opponent", row.guest_moves ?? { plays: [], relocations: [], ultimate: false });
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
        }}
      />
    </>
  );
}