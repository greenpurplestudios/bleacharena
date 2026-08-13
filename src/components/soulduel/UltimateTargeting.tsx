import { useI18n } from "@/lib/i18n";
import type { DuelState, Placement } from "@/lib/soul-duel/types";
import type { UltimateDef } from "@/lib/soul-duel/ultimates";
import { DuelMiniCard } from "./DuelMiniCard";

const L = {
  pick1: { en: "Choose 1 opponent card — its Rating becomes 0.", ar: "اختر بطاقة واحدة للخصم — يصبح تقييمها ٠." },
  pick3: { en: "Choose 3 cards — yours, the opponent's or both.", ar: "اختر ٣ بطاقات — لك أو للخصم أو للاثنين." },
  confirm: { en: "Confirm", ar: "تأكيد" },
  cancel: { en: "Cancel", ar: "إلغاء" },
};

/**
 * Full-screen target picker for Ultimates that require the wielder's own
 * choice (Ichimonji, Kannonbiraki). Blocks all other board interaction while
 * open — cancelling leaves the gauge charged and simply returns to play.
 */
export function UltimateTargeting({
  state,
  weapon,
  count,
  selected,
  hiddenOf,
  targetSide,
  onToggle,
  onConfirm,
  onCancel,
}: {
  state: DuelState;
  weapon: UltimateDef;
  count: number;
  selected: string[];
  hiddenOf: (p: Placement) => boolean;
  /** Restricts which side's cards can be picked (Ichimonji: opponent only). */
  targetSide?: "player" | "opponent";
  onToggle: (uid: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { locale } = useI18n();
  const targets = targetSide
    ? state.placements.filter((p) => p.side === targetSide)
    : state.placements;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={weapon.name[locale]}
      className="fixed inset-0 z-[65] flex flex-col items-center gap-4 overflow-y-auto bg-background/96 px-4 py-8 backdrop-blur-md"
      style={{ animation: "fade-in 0.22s ease-out both" }}
    >
      <h2 className="font-display text-lg font-black" style={{ color: weapon.visual.glow }}>
        {weapon.name[locale]}
      </h2>
      <p className="text-center text-sm text-muted-foreground">
        {(count === 1 ? L.pick1 : L.pick3)[locale]} · {selected.length}/{count}
      </p>

      <div className="grid w-full max-w-md grid-cols-4 gap-2">
        {targets.map((p) => {
          const hidden = hiddenOf(p);
          const isSelected = selected.includes(p.uid);
          const order = selected.indexOf(p.uid);
          return (
            <button
              key={p.uid}
              type="button"
              disabled={hidden}
              onClick={() => onToggle(p.uid)}
              className="tactile relative rounded-lg disabled:opacity-40"
              style={{ boxShadow: isSelected ? `0 0 0 3px ${weapon.visual.glow}` : undefined }}
              aria-pressed={isSelected}
            >
              <DuelMiniCard
                card={p.card}
                rating={p.override ?? p.card.character.overall}
                hidden={hidden}
              />
              {isSelected ? (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-display text-[10px] font-black text-primary-foreground"
                >
                  {order + 1}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-2 mt-2 flex w-full max-w-md gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="tactile flex-1 rounded-xl border border-white/15 bg-background/80 px-4 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground rtl:tracking-normal"
        >
          {L.cancel[locale]}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={selected.length !== count}
          className="tactile flex-1 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40 rtl:tracking-normal"
        >
          {L.confirm[locale]}
        </button>
      </div>
    </div>
  );
}
