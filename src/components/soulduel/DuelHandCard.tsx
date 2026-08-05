import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { RARITY_COLOR } from "@/lib/rarity";
import { framingOf } from "@/lib/portrait";
import { abilityOf } from "@/lib/soul-duel/abilities";
import type { DuelCard } from "@/lib/soul-duel/types";

/** A card in the player's hand: portrait, cost, rating and ability blurb. */
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
  const { locale } = useI18n();
  const c = card.character;
  const color = RARITY_COLOR[c.rarity];
  const f = framingOf(c.slug);
  const ability = abilityOf(c.slug);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className="tactile relative w-[92px] shrink-0 overflow-hidden rounded-xl border bg-card/70 text-start backdrop-blur-sm transition-transform duration-200 disabled:opacity-40 sm:w-[104px]"
      style={{
        borderColor: selected ? color : "rgba(255,255,255,0.12)",
        boxShadow: selected ? `0 0 18px -4px ${color}` : undefined,
        transform: selected ? "translateY(-8px)" : undefined,
      }}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        {c.image ? (
          <img
            src={c.image}
            alt={c.name[locale]}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: `${f.x}% ${f.y}%`, transform: `scale(${f.scale})` }}
          />
        ) : null}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95), transparent)" }}
        />
        <span
          className="absolute start-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/90 font-display text-[10px] font-black text-primary-foreground"
        >
          {card.cost}
        </span>
        <span
          className="absolute end-1 top-1 rounded-md bg-black/70 px-1 font-display text-[10px] font-black"
          style={{ color }}
        >
          {c.overall}
        </span>
        <span className="absolute inset-x-1 bottom-0.5 line-clamp-2 text-center text-[9px] font-bold leading-tight text-foreground">
          {c.name[locale]}
        </span>
      </div>
      <p className="line-clamp-2 min-h-[26px] px-1.5 py-1 text-[8px] leading-tight text-muted-foreground">
        {ability ? ability.description[locale] : ""}
      </p>
    </button>
  );
});
