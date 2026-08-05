import { useI18n } from "@/lib/i18n";
import { CharacterCard } from "@/components/CharacterCard";
import { ElementIcon, ELEMENT_COLOR } from "@/components/ElementIcon";
import { ELEMENT_LABEL, elementOf } from "@/lib/elements";
import { RARITY_COLOR } from "@/lib/rarity";
import { abilityOf, duelDefOf, ANT_SLUG } from "@/lib/soul-duel/abilities";
import { baseRatingOf, canRelocate } from "@/lib/soul-duel/effects";
import { STATUS_DEFS } from "@/lib/soul-duel/status";
import type { DuelState, Placement } from "@/lib/soul-duel/types";
import { StatusIcon } from "./StatusIcon";

/**
 * Premium detail sheet for any card on a battlefield: portrait, live Rating,
 * where every point comes from, statuses, element, faction and ability.
 */
export function CardInspector({
  state,
  placement,
  rating,
  onClose,
  onUndo,
  onRelocate,
}: {
  state: DuelState;
  placement: Placement;
  rating: number;
  onClose: () => void;
  onUndo?: () => void;
  onRelocate?: () => void;
}) {
  const { t, locale } = useI18n();
  const c = placement.card.character;
  const el = elementOf(c.slug);
  const def = duelDefOf(c.slug);
  const ability = abilityOf(c.slug);
  const isAnt = c.slug === ANT_SLUG;

  const base = placement.override ?? c.overall;
  const flat = placement.bonus;
  const field = rating - baseRatingOf(placement);
  const rarity = RARITY_COLOR[c.rarity];

  const rows: { label: string; value: number }[] = [
    { label: t("sdBaseRating"), value: base },
  ];
  if (flat) rows.push({ label: flat > 0 ? t("sdBuffs") : t("sdDebuffs"), value: flat });
  if (field) rows.push({ label: t("sdBattlefield"), value: field });

  return (
    <div
      role="dialog"
      aria-label={t("sdInspect")}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/88 px-4 pb-6 pt-10 backdrop-blur-md sm:items-center"
      style={{ animation: "fade-in 0.22s ease-out both" }}
      onClick={onClose}
    >
      <div
        className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/12 bg-card/85 p-4 shadow-2xl"
        style={{ animation: "inspect-in 0.32s cubic-bezier(0.16,1,0.3,1) both", boxShadow: `0 0 60px -24px ${rarity}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <div className="w-[38%] shrink-0">
            <CharacterCard character={c} interactive={false} className="w-full" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-black leading-tight" style={{ color: rarity }}>
              {c.name[locale]}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rtl:tracking-normal"
                style={{ borderColor: `${ELEMENT_COLOR[el]}55`, color: ELEMENT_COLOR[el] }}
              >
                <ElementIcon element={el} className="h-3 w-3" />
                {ELEMENT_LABEL[el][locale]}
              </span>
              <span className="rounded-full border border-white/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground rtl:tracking-normal">
                {def?.faction?.[locale] ?? c.faction ?? "—"}
              </span>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
                {t("sdCurrentRating")}
              </p>
              <p className="font-display text-3xl font-black leading-none" style={{ color: rarity }}>
                {rating}
              </p>
              <ul className="mt-2 space-y-0.5">
                {rows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span
                      className="font-display font-black tabular-nums"
                      style={{
                        color:
                          r.value > 0 && r.label !== t("sdBaseRating")
                            ? "oklch(0.8 0.16 150)"
                            : r.value < 0
                              ? "oklch(0.7 0.2 25)"
                              : undefined,
                      }}
                    >
                      {r.label === t("sdBaseRating") || r.value < 0 ? r.value : `+${r.value}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
            {t("sdStatuses")}
          </p>
          {placement.statuses.length ? (
            <ul className="mt-1.5 space-y-1.5">
              {placement.statuses.map((s) => (
                <li key={s.kind} className="flex items-center gap-2">
                  <StatusIcon status={s} size={14} />
                  <span className="text-[11px] font-bold" style={{ color: STATUS_DEFS[s.kind].color }}>
                    {STATUS_DEFS[s.kind].name[locale]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {STATUS_DEFS[s.kind].description[locale]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">{t("sdNoStatuses")}</p>
          )}
        </div>

        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-accent rtl:tracking-normal">
            {t("sdAbility")}
          </p>
          {isAnt ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("sdAntLocked")}</p>
          ) : ability ? (
            <>
              <p className="mt-0.5 font-display text-sm font-black">{ability.name[locale]}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {ability.description[locale]}
              </p>
            </>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">{t("sdNoAbility")}</p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {onUndo && placement.round === state.round && state.phase === "play" ? (
            <button
              type="button"
              onClick={onUndo}
              className="tactile flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest rtl:tracking-normal"
            >
              {t("sdReturnHand")}
            </button>
          ) : null}
          {onRelocate && canRelocate(placement) && state.phase === "play" ? (
            <button
              type="button"
              onClick={onRelocate}
              className="tactile flex-1 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-accent rtl:tracking-normal"
            >
              {t("sdRelocateCard")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="tactile flex-1 rounded-xl bg-primary px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground rtl:tracking-normal"
          >
            {t("sdCloseCard")}
          </button>
        </div>
      </div>
    </div>
  );
}
