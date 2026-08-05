import { useI18n } from "@/lib/i18n";
import type { DuelResult, DuelState } from "@/lib/soul-duel/types";

export function DuelResultPanel({
  state,
  result,
  onRematch,
  fragments,
}: {
  state: DuelState;
  result: DuelResult;
  onRematch: () => void;
  /** Broken Sword Fragments earned from this duel. */
  fragments?: number;
}) {
  const { t, locale } = useI18n();
  const title =
    result.winner === "player" ? t("sdVictory")
    : result.winner === "opponent" ? t("sdDefeat")
    : t("sdDrawResult");
  const color =
    result.winner === "player" ? "oklch(0.82 0.18 80)"
    : result.winner === "opponent" ? "oklch(0.65 0.22 25)"
    : "oklch(0.8 0.02 250)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/92 px-5 backdrop-blur-md"
      style={{ animation: "fade-in 0.4s ease-out both" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-card/80 p-6 text-center backdrop-blur-md"
        style={{ animation: "card-in 0.5s ease-out both", boxShadow: `0 0 60px -20px ${color}` }}
      >
        <h2 className="font-display text-3xl font-black" style={{ color }}>{title}</h2>
        <p className="mt-1 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
          {t("sdLanesWon")} {result.lanesWon.player} — {result.lanesWon.opponent}
        </p>

        <ul className="mt-5 space-y-2">
          {result.lanes.map((l, i) => (
            <li
              key={state.lanes[i].def.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-start"
            >
              <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                {state.lanes[i].def.name[locale]}
              </span>
              <span className="font-display text-sm font-black">
                <span style={{ color: l.winner === "player" ? color : undefined }}>{l.player}</span>
                <span className="mx-1 text-muted-foreground">-</span>
                <span>{l.opponent}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          {t("sdTotalRating")}: {result.total.player} — {result.total.opponent}
        </p>

        {fragments ? (
          <p
            className="mt-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 font-display text-xs font-black text-accent"
            style={{ animation: "scale-in 0.4s 0.3s ease-out both" }}
          >
            +{fragments} {t("sdFragmentsShort")}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onRematch}
          className="tactile glow-orange mt-5 w-full rounded-2xl bg-primary px-6 py-3 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground rtl:tracking-normal"
        >
          {t("sdRematch")}
        </button>
      </div>
    </div>
  );
}
