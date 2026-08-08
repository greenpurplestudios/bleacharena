import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { ultimateOf } from "@/lib/soul-duel/ultimates";
import { ratingOf } from "@/lib/soul-duel/engine";
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
  const [review, setReview] = useState(false);
  const [openLane, setOpenLane] = useState<number | null>(null);
  const history = state.history ?? [];
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
        className="max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/10 bg-card/80 p-6 text-center backdrop-blur-md"
        style={{ animation: "card-in 0.5s ease-out both", boxShadow: `0 0 60px -20px ${color}` }}
      >
        <h2 className="font-display text-3xl font-black" style={{ color }}>{title}</h2>
        <p className="mt-1 font-display text-xs uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
          {t("sdLanesWon")} {result.lanesWon.player} — {result.lanesWon.opponent}
        </p>

        <ul className="mt-5 space-y-2">
          {result.lanes.map((l, i) => (
            <li key={state.lanes[i].def.id} className="rounded-xl border border-white/10 bg-white/[0.03]">
              <button
                type="button"
                onClick={() => { setOpenLane((o) => (o === i ? null : i)); play("tap"); }}
                aria-expanded={openLane === i}
                className="tactile flex w-full items-center justify-between gap-2 px-3 py-2 text-start"
              >
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                  {state.lanes[i].def.name[locale]}
                </span>
                <span className="font-display text-sm font-black">
                  <span style={{ color: l.winner === "player" ? color : undefined }}>{l.player}</span>
                  <span className="mx-1 text-muted-foreground">-</span>
                  <span>{l.opponent}</span>
                </span>
                <span aria-hidden className="text-[10px] text-muted-foreground">
                  {openLane === i ? "▴" : "▾"}
                </span>
              </button>

              {openLane === i ? (
                <div
                  className="space-y-2 border-t border-white/10 px-3 py-2 text-start"
                  style={{ animation: "card-in 0.3s ease-out both" }}
                >
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    {state.lanes[i].def.ability[locale]}
                  </p>
                  {(["player", "opponent"] as const).map((side) => {
                    const cards = state.placements.filter((p) => p.lane === i && p.side === side);
                    if (!cards.length) return null;
                    return (
                      <ul key={side} className="space-y-1">
                        {cards.map((p) => (
                          <li
                            key={p.uid}
                            className="flex items-center justify-between gap-2 text-[11px]"
                          >
                            <span className="min-w-0 flex-1 truncate">
                              <span className="me-1 text-muted-foreground">
                                {side === "player" ? "▲" : "▼"}
                              </span>
                              {p.card.character.name[locale]}
                              {p.statuses.length ? (
                                <span className="ms-1">
                                  {p.statuses.map((s) => (
                                    <span key={s.kind} aria-hidden>
                                      {s.kind === "burn" ? "🔥" : s.kind === "freeze" ? "❄" : "🛡"}
                                    </span>
                                  ))}
                                </span>
                              ) : null}
                            </span>
                            <span className="font-display text-xs font-black tabular-nums">
                              {ratingOf(state, p)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  })}
                </div>
              ) : null}
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

        {review ? (
          <div className="mt-5 text-start">
            <p className="font-display text-[10px] font-black uppercase tracking-[0.28em] text-accent rtl:tracking-normal">
              {t("sdTimeline")}
            </p>
            <ol className="mt-2 space-y-2">
              {history.map((r) => {
                const lead =
                  r.total.player > r.total.opponent ? "player"
                  : r.total.player < r.total.opponent ? "opponent"
                  : "tie";
                return (
                  <li
                    key={r.round}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                    style={{ animation: "card-in 0.35s ease-out both" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground rtl:tracking-normal">
                        {t("sdRound")} {r.round}
                      </span>
                      <span className="font-display text-xs font-black tabular-nums">
                        <span style={{ color: lead === "player" ? color : undefined }}>{r.total.player}</span>
                        <span className="mx-1 text-muted-foreground">-</span>
                        <span>{r.total.opponent}</span>
                      </span>
                    </div>
                    {r.ultimate ? (
                      <p className="mt-1 text-[10px] font-bold text-primary">
                        ✦ {ultimateOf(r.ultimate.weaponId).name[locale]}
                      </p>
                    ) : null}
                    {(["player", "opponent"] as const).map((side) =>
                      r.played[side].length ? (
                        <p key={side} className="mt-1 text-[11px] leading-snug text-muted-foreground">
                          <span className="me-1">{side === "player" ? "▲" : "▼"}</span>
                          {r.played[side]
                            .map((c) => `${c.name[locale]} (${c.rating})`)
                            .join(" · ")}
                        </p>
                      ) : null,
                    )}
                    {r.events.length ? (
                      <ul className="mt-1 space-y-0.5">
                        {r.events.map((e) => (
                          <li key={e.id} className="text-[10px] text-muted-foreground/80">
                            {t(e.key)}
                            {e.lane !== undefined ? ` — ${state.lanes[e.lane].def.name[locale]}` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => { setReview((r) => !r); play("tap"); }}
          className="tactile mt-4 w-full rounded-2xl border border-white/15 bg-white/5 px-6 py-2.5 font-display text-[11px] font-black uppercase tracking-[0.22em] rtl:tracking-normal"
        >
          {t("sdBattleReview")}
        </button>

        <button
          type="button"
          onClick={onRematch}
          className="tactile glow-orange mt-2 w-full rounded-2xl bg-primary px-6 py-3 font-display text-sm font-black uppercase tracking-[0.25em] text-primary-foreground rtl:tracking-normal"
        >
          {t("sdRematch")}
        </button>
      </div>
    </div>
  );
}
