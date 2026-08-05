import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { play, playDuelClash, playDuelPlace } from "@/lib/sound";
import { takeOpponentTurn } from "@/lib/soul-duel/ai";
import { awardFragments, fragmentReward } from "@/lib/forge";
import { ultimateOf } from "@/lib/soul-duel/ultimates";
import {
  activateUltimate, canActivateUltimate, canMove, canPlay, cancelUltimate, createDuel,
  isBlinded, isHidden, isLockedOut, laneTotals, moveCard, playCard,
  ratingOf as ratingFor, remainingReiatsu, resolveRound, revealLane,
} from "@/lib/soul-duel/engine";
import {
  LANE_COUNT, MAX_ROUNDS, type Difficulty, type DuelState, type Placement,
} from "@/lib/soul-duel/types";
import { BattlefieldCard } from "./BattlefieldCard";
import { BattlefieldReveal } from "./BattlefieldReveal";
import { DuelHandCard } from "./DuelHandCard";
import { DuelLane } from "./DuelLane";
import { DuelResultPanel } from "./DuelResultPanel";
import { ReiatsuGauge } from "./ReiatsuGauge";
import { UltimateOverlay } from "./UltimateOverlay";

export function DuelBoard({
  pool,
  onExit,
  difficulty = "normal",
  weaponId,
}: {
  pool: Character[];
  onExit: () => void;
  difficulty?: Difficulty;
  weaponId?: string;
}) {
  const { t, locale } = useI18n();
  const [state, setState] = useState<DuelState>(() => createDuel(pool, { difficulty, weaponId }));
  const [selected, setSelected] = useState<string | null>(null);
  const [mover, setMover] = useState<string | null>(null);
  const [inspect, setInspect] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [cinematic, setCinematic] = useState<DuelState["ultimateEvent"]>(null);
  const [fragments, setFragments] = useState<number | null>(null);
  const rewarded = useRef(false);

  const weapon = ultimateOf(state.weapons.player);
  const gauge = state.gauge.player;
  const ultReady = canActivateUltimate(state, "player");

  /* Play the cinematic whenever the engine emits an Ultimate event. */
  useEffect(() => {
    if (state.ultimateEvent) setCinematic(state.ultimateEvent);
  }, [state.ultimateEvent?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Broken Sword Fragments are awarded once, when the match ends. */
  useEffect(() => {
    if (!state.result || rewarded.current) return;
    rewarded.current = true;
    const amount = fragmentReward(
      state.difficulty,
      state.result.winner === "player",
      state.result.winner === "tie",
    );
    setFragments(amount);
    void awardFragments(amount);
  }, [state.result, state.difficulty]);

  /* Enma Kōrogi blinds a side: enemy cards and lane Ratings go dark. */
  const blinded = isBlinded(state, "player");
  const scores = useMemo(
    () =>
      state.lanes.map((_, i) => {
        const t = laneTotals(state, i);
        return blinded ? { ...t, opponent: null } : t;
      }),
    [state, blinded],
  );
  const rate = useCallback((p: Placement) => ratingFor(state, p), [state]);
  const hiddenFor = useCallback(
    (lane: number) =>
      blinded ||
      state.placements.some((p) => p.lane === lane && p.side === "opponent" && isHidden(state, p)),
    [state, blinded],
  );

  const reiatsu = remainingReiatsu(state, "player");
  const max = state.round <= MAX_ROUNDS ? reiatsu + state.spent.player : 10;
  const selectedCard = state.hands.player.find((c) => c.uid === selected) ?? null;

  const place = useCallback(
    (lane: number) => {
      if (mover) {
        if (!canMove(state, mover, lane)) {
          play("error");
          haptic("error");
          return;
        }
        setState((s) => moveCard(s, mover, lane));
        setMover(null);
        playDuelPlace();
        haptic("press");
        return;
      }
      if (isLockedOut(state, "player") || !selectedCard || !canPlay(state, "player", selectedCard, lane)) {
        play("error");
        haptic("error");
        return;
      }
      setState((s) => playCard(s, "player", selectedCard.uid, lane));
      setSelected(null);
      playDuelPlace();
      haptic("press");
    },
    [mover, selectedCard, state],
  );

  const undo = useCallback((uid: string) => {
    setState((s) => {
      const p = s.placements.find((x) => x.uid === uid);
      if (!p || p.round !== s.round) return s;
      haptic("tap");
      return {
        ...s,
        hands: { ...s.hands, player: [...s.hands.player, p.card] },
        spent: { ...s.spent, player: Math.max(0, s.spent.player - p.card.cost) },
        placements: s.placements.filter((x) => x.uid !== uid),
      };
    });
  }, []);

  const endRound = useCallback(() => {
    if (busy || state.phase !== "play") return;
    setBusy(true);
    setSelected(null);
    setMover(null);
    playDuelClash();
    haptic("flip");
    window.setTimeout(() => {
      setState((s) => resolveRound(takeOpponentTurn(s)));
      setBusy(false);
    }, 560);
  }, [busy, state.phase]);

  const rematch = useCallback(() => {
    rewarded.current = false;
    setFragments(null);
    setState(createDuel(pool, { difficulty, weaponId }));
    setSelected(null);
    setMover(null);
    play("reveal");
  }, [pool, difficulty, weaponId]);

  const revealIndex = state.phase === "reveal" ? Math.min(state.round, LANE_COUNT) - 1 : -1;

  return (
    <div className="relative overflow-x-clip">
      {/* header */}
      <div className="sticky top-0 z-20 mb-3 rounded-b-2xl border border-white/10 bg-background/80 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExit}
            className="tactile rounded-xl border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground rtl:tracking-normal"
          >
            {t("sdLeave")}
          </button>
          <p className="font-display text-xs font-black uppercase tracking-[0.28em] rtl:tracking-normal">
            {t("sdRound")} {Math.min(state.round, MAX_ROUNDS)} / {MAX_ROUNDS}
          </p>
          <p className="font-display text-xs font-black text-accent">
            {reiatsu}/{max}
          </p>
        </div>
        <div className="mt-1.5 flex items-center gap-1" aria-label={t("sdReiatsu")}>
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
              style={{
                background:
                  i < reiatsu ? "oklch(0.8 0.16 220)"
                  : i < max ? "oklch(0.8 0.16 220 / 0.25)"
                  : "oklch(1 0 0 / 0.07)",
              }}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ReiatsuGauge gauge={gauge} />
          <button
            type="button"
            onClick={() => {
              if (gauge.pending) {
                setState((s) => cancelUltimate(s, "player"));
                play("tap");
                return;
              }
              if (!ultReady) return;
              setState((s) => activateUltimate(s, "player"));
              play("reveal");
              haptic("flip");
            }}
            disabled={!ultReady && !gauge.pending}
            aria-label={t("sdUltActivate")}
            className="tactile shrink-0 rounded-xl border px-3 py-2 font-display text-[9px] font-black uppercase tracking-[0.18em] disabled:opacity-40 rtl:tracking-normal"
            style={{
              borderColor: gauge.pending ? weapon.visual.glow : "oklch(1 0 0 / 0.12)",
              color: ultReady || gauge.pending ? weapon.visual.glow : undefined,
              boxShadow: ultReady && !gauge.pending ? `0 0 18px ${weapon.visual.glow}55` : undefined,
              animation: ultReady && !gauge.pending ? "gauge-pulse 1.8s ease-in-out infinite" : undefined,
            }}
          >
            {gauge.used ? t("sdUltSpent")
              : gauge.pending ? t("sdUltCancel")
              : ultReady ? t("sdUltReady")
              : t("sdUltCharging")}
          </button>
        </div>
        {gauge.pending ? (
          <p className="mt-1 text-center text-[10px] font-bold" style={{ color: weapon.visual.glow }}>
            {t("sdUltArmed")} — {weapon.name[locale]}
          </p>
        ) : null}
      </div>

      {/* lanes */}
      <div className="grid grid-cols-3 gap-2">
        {state.lanes.map((l, i) => (
          <DuelLane
            key={l.def.id}
            state={state}
            lane={i}
            score={scores[i]}
            ratingOf={rate}
            hiddenOpponent={hiddenFor(i)}
            canPlace={
              mover ? canMove(state, mover, i)
              : !!selectedCard && canPlay(state, "player", selectedCard, i)
            }
            onPlace={() => place(i)}
            onInspect={() => { setInspect(i); play("tap"); }}
            onUndo={undo}
            onPickMover={(uid) => {
              setMover((m) => (m === uid ? null : uid));
              setSelected(null);
              play("tap");
              haptic("tap");
            }}
            mover={mover}
          />
        ))}
      </div>

      {/* hand */}
      <div className="mt-4 w-full min-w-0">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
            {t("sdHand")}
          </h2>
          <span className="text-[10px] text-muted-foreground">
            {t("sdDeck")}: {state.decks.player.length}
          </span>
        </div>
        <div className="flex w-[calc(100vw-2rem)] max-w-full gap-2 overflow-x-auto pb-2 sm:w-full">
          {state.hands.player.map((c) => (
            <DuelHandCard
              key={c.uid}
              card={c}
              selected={selected === c.uid}
              disabled={state.phase !== "play" || c.cost > reiatsu}
              onSelect={() => {
                setSelected((s) => (s === c.uid ? null : c.uid));
                play("tap");
                haptic("tap");
              }}
            />
          ))}
          {state.hands.player.length === 0 ? (
            <p className="py-6 text-xs text-muted-foreground">{t("sdHandEmpty")}</p>
          ) : null}
        </div>
      </div>

      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        {mover ? t("sdMoveHint") : selectedCard ? t("sdTapLane") : t("sdSelectCard")}
      </p>

      <button
        type="button"
        onClick={endRound}
        disabled={busy || state.phase !== "play"}
        className="tactile glow-orange mt-3 w-full rounded-2xl bg-primary px-6 py-3.5 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-50 rtl:tracking-normal"
      >
        {busy ? t("sdResolving") : t("sdEndRound")}
      </button>

      {/* battlefield log */}
      {state.log.length ? (
        <ul className="mt-4 space-y-1">
          {state.log.slice(-4).reverse().map((e) => (
            <li key={e.id} className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="text-accent">R{e.round}</span>{" "}
              {t(e.key)}
              {e.lane !== undefined ? ` — ${state.lanes[e.lane].def.name[locale]}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      {revealIndex >= 0 ? (
        <BattlefieldReveal
          def={state.lanes[revealIndex].def}
          index={revealIndex}
          onDone={() => setState((s) => revealLane(s, revealIndex))}
        />
      ) : null}

      {inspect !== null ? (
        <button
          type="button"
          onClick={() => setInspect(null)}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-background/92 px-6 backdrop-blur-md"
          style={{ animation: "fade-in 0.25s ease-out both" }}
        >
          <div className="w-[min(60vw,230px)]">
            <BattlefieldCard
              def={state.lanes[inspect].def}
              revealed={state.lanes[inspect].revealed}
              closed={state.lanes[inspect].closed}
              className="w-full"
            />
          </div>
          <div className="max-w-sm rounded-2xl border border-white/10 bg-card/70 p-4 text-center">
            <h3 className="font-display text-base font-black" style={{ color: state.lanes[inspect].def.accent }}>
              {state.lanes[inspect].def.name[locale]}
            </h3>
            <p className="mt-1 font-display text-[11px] uppercase tracking-[0.28em] text-accent rtl:tracking-normal">
              {state.lanes[inspect].def.ability[locale]}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {state.lanes[inspect].def.description[locale]}
            </p>
          </div>
        </button>
      ) : null}

      {cinematic ? (
        <UltimateOverlay event={cinematic} onDone={() => setCinematic(null)} />
      ) : null}

      {state.result && !cinematic ? (
        <DuelResultPanel
          state={state}
          result={state.result}
          onRematch={rematch}
          fragments={fragments ?? undefined}
        />
      ) : null}
    </div>
  );
}
