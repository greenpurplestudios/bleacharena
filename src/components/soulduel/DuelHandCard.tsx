import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { RARITY_COLOR } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import { abilityOf } from "@/lib/soul-duel/abilities";
import type { DuelCard } from "@/lib/soul-duel/types";
import { STATUS_DEFS } from "@/lib/soul-duel/status";
import { StatusIcon } from "./StatusIcon";

/** A card in hand: the Bleach Arena card design plus its duel cost and ability. */
export const DuelHandCard = memo(function DuelHandCard({
  card,
  selected,
  disabled,
  onSelect,
}: {
  card: DuelCard;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { locale, t } = useI18n();
  const c = card.character;
  const color = RARITY_COLOR[c.rarity];
  const ability = abilityOf(c.slug);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${c.name[locale]} — ${card.cost}`}
      data-duel-hand-card=""
      className="tactile relative w-[104px] shrink-0 rounded-xl border bg-card/70 p-1 text-start backdrop-blur-sm transition-transform duration-200 disabled:opacity-40 sm:w-[116px]"
      style={{
        borderColor: selected ? color : "rgba(255,255,255,0.12)",
        boxShadow: selected ? `0 0 18px -4px ${color}` : undefined,
        transform: selected ? "translateY(-8px)" : undefined,
      }}
    >
      <span className="relative block">
        <CharacterCard character={c} interactive={false} className="w-full" />
        <span
          className="absolute -top-1 start-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-display text-[10px] font-black text-primary-foreground shadow-lg"
          aria-hidden
        >
          {card.cost}
        </span>
      </span>

      <span className="mt-1 block min-h-[38px] px-0.5">
        {ability ? (
          <>
            <span
              className="block truncate text-center font-display text-[8px] font-black uppercase tracking-wide rtl:tracking-normal"
              style={{ color }}
            >
              {ability.name[locale]}
            </span>
            <span className="line-clamp-2 block text-center text-[8px] leading-tight text-muted-foreground">
              {ability.description[locale]}
            </span>
            {ability.applies?.length ? (
              <span className="mt-0.5 flex items-center justify-center gap-1">
                {ability.applies.map((k) => (
                  <StatusIcon
                    key={k}
                    status={{ kind: k, remaining: STATUS_DEFS[k].duration }}
                    size={9}
                    showDuration={false}
                  />
                ))}
              </span>
            ) : null}
          </>
        ) : (
          <span className="block text-center text-[8px] leading-tight text-muted-foreground">
            {t("sdNoAbility")}
          </span>
        )}
      </span>
    </button>
  );
});
