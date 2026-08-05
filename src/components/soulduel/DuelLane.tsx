import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { MAX_PER_LANE, type DuelState, type LaneScore, type Placement } from "@/lib/soul-duel/types";
import { canRelocate } from "@/lib/soul-duel/effects";
import { BattlefieldCard } from "./BattlefieldCard";
import { DuelMiniCard } from "./DuelMiniCard";

function Slots({
  cards,
  state,
  ratingOf,
  hiddenSide,
  round,
  onUndo,
  onPick,
  picked,
}: {
  cards: Placement[];
  state: DuelState;
  ratingOf: (p: Placement) => number;
  hiddenSide: boolean;
  round: number;
  onUndo?: (uid: string) => void;
  onPick?: (uid: string) => void;
  picked?: string | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-1">
      {Array.from({ length: MAX_PER_LANE }).map((_, i) => {
        const p = cards[i];
        if (!p) {
          return (
            <div
              key={i}
              className="aspect-[3/4] w-full rounded-lg border border-dashed border-white/8 bg-white/[0.02]"
            />
          );
        }
        const token = (
          <DuelMiniCard
            card={p.card}
            rating={ratingOf(p)}
            hidden={hiddenSide}
            imprisoned={p.imprisoned}
            entering={p.round === round}
            statuses={hiddenSide ? [] : p.statuses}
            movable={picked === p.uid || (!!onPick && canRelocate(p) && state.phase === "play")}
          />
        );
        return onUndo && p.round === round && state.phase === "play" ? (
          <button key={p.uid} type="button" onClick={() => onUndo(p.uid)} className="tactile">
            {token}
          </button>
        ) : onPick && canRelocate(p) && state.phase === "play" ? (
          <button key={p.uid} type="button" onClick={() => onPick(p.uid)} className="tactile">
            {token}
          </button>
        ) : (
          <div key={p.uid}>{token}</div>
        );
      })}
    </div>
  );
}

/** One shared battlefield column: opponent slots, the card, player slots. */
export const DuelLane = memo(function DuelLane({
  state,
  lane,
  score,
  ratingOf,
  hiddenOpponent,
  canPlace,
  onPlace,
  onInspect,
  onUndo,
  onPickMover,
  mover,
}: {
  state: DuelState;
  lane: number;
  score: LaneScore;
  ratingOf: (p: Placement) => number;
  hiddenOpponent: boolean;
  canPlace: boolean;
  onPlace: () => void;
  onInspect: () => void;
  onUndo: (uid: string) => void;
  onPickMover?: (uid: string) => void;
  mover?: string | null;
}) {
  const { t } = useI18n();
  const l = state.lanes[lane];
  const mine = state.placements.filter((p) => p.lane === lane && p.side === "player");
  const theirs = state.placements.filter((p) => p.lane === lane && p.side === "opponent");
  const accent = l.def.accent;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Slots
        cards={theirs}
        state={state}
        ratingOf={ratingOf}
        hiddenSide={hiddenOpponent}
        round={state.round}
      />

      <button
        type="button"
        onClick={canPlace ? onPlace : onInspect}
        className="tactile relative rounded-xl transition-transform duration-200"
        style={{
          boxShadow: canPlace ? `0 0 0 2px ${accent}, 0 0 22px -4px ${accent}` : undefined,
          borderRadius: 12,
          animation: canPlace ? "pulse-glow 1.8s ease-in-out infinite" : undefined,
        }}
        data-duel-lane-drop={canPlace ? "1" : undefined}
        aria-label={l.def.name.en}
      >
        <BattlefieldCard def={l.def} revealed={l.revealed} closed={l.closed} className="w-full" />
        <span className="mt-1 flex items-center justify-center gap-1 font-display text-[10px] font-black">
          <span style={{ color: score.winner === "opponent" ? accent : undefined }}>{score.opponent}</span>
          <span className="text-muted-foreground">·</span>
          <span style={{ color: score.winner === "player" ? accent : undefined }}>{score.player}</span>
        </span>
        {l.closed ? (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-black/70 py-1 text-center font-display text-[9px] uppercase tracking-widest text-destructive">
            {t("sdClosed")}
          </span>
        ) : null}
      </button>

      <Slots
        cards={mine}
        state={state}
        ratingOf={ratingOf}
        hiddenSide={false}
        round={state.round}
        onUndo={onUndo}
        onPick={onPickMover}
        picked={mover}
      />
    </div>
  );
});
