import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { RARITY_COLOR } from "@/lib/rarity";
import { framingOf } from "@/lib/portrait";
import { BATTLEFIELD_BACK } from "@/data/battlefields";
import type { DuelCard } from "@/lib/soul-duel/types";
import type { StatusInstance } from "@/lib/soul-duel/status";
import { StatusBadges } from "./StatusIcon";

/** Compact battlefield token: portrait, rarity ink and live rating. */
export const DuelMiniCard = memo(function DuelMiniCard({
  card,
  rating,
  hidden = false,
  imprisoned = false,
  entering = false,
  statuses = [],
  movable = false,
}: {
  card: DuelCard;
  rating: number;
  hidden?: boolean;
  imprisoned?: boolean;
  entering?: boolean;
  statuses?: StatusInstance[];
  movable?: boolean;
}) {
  const { locale } = useI18n();
  const c = card.character;
  const color = RARITY_COLOR[c.rarity];
  const f = framingOf(c.slug);

  if (hidden) {
    return (
      <div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-white/10"
        style={{ animation: entering ? "card-in 0.4s ease-out both" : undefined }}
      >
        <img src={BATTLEFIELD_BACK} alt="" aria-hidden className="h-full w-full object-cover opacity-80" />
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-black/60"
      style={{
        borderColor: `${color}`,
        boxShadow: movable ? `0 0 0 2px ${color}, 0 0 14px -2px ${color}` : `0 0 10px -2px ${color}`,
        animation: entering ? "card-in 0.4s ease-out both" : undefined,
        opacity: imprisoned ? 0.55 : 1,
      }}
    >
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
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92), transparent)" }}
      />
      <span
        className="absolute inset-x-0 bottom-0 text-center font-display text-[10px] font-black leading-tight"
        style={{ color, textShadow: "0 1px 2px #000" }}
      >
        {imprisoned ? 0 : rating}
      </span>
      <StatusBadges statuses={statuses} size={10} className="absolute start-0.5 top-0.5 flex-col" />
      {imprisoned ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-purple-500/25" />
      ) : null}
    </div>
  );
});
