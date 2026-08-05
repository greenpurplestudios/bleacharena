import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { RARITY_COLOR } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import { BATTLEFIELD_BACK } from "@/data/battlefields";
import type { DuelCard } from "@/lib/soul-duel/types";
import type { StatusInstance } from "@/lib/soul-duel/status";
import { StatusBadges } from "./StatusIcon";

/**
 * A card on a battlefield. Soul Duel uses the same card design as the rest of
 * Bleach Arena — the official template, engraved typography and rarity glow —
 * with the live duel Rating and status effects layered on top.
 */
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

  if (hidden) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-[6%] border border-white/10"
        style={{
          aspectRatio: "1128 / 1394",
          animation: entering ? "card-in 0.4s ease-out both" : undefined,
        }}
      >
        <img src={BATTLEFIELD_BACK} alt="" aria-hidden className="h-full w-full object-cover opacity-80" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{
        animation: entering ? "card-in 0.4s ease-out both" : undefined,
        opacity: imprisoned ? 0.6 : 1,
        filter: movable ? `drop-shadow(0 0 6px ${color})` : undefined,
      }}
    >
      <CharacterCard character={c} interactive={false} className="w-full" />

      <span
        className="pointer-events-none absolute -bottom-1 start-1/2 -translate-x-1/2 rounded-md border px-1.5 font-display text-[10px] font-black leading-tight rtl:translate-x-1/2"
        style={{
          color,
          borderColor: `${color}66`,
          background: "rgba(0,0,0,0.82)",
          textShadow: "0 1px 2px #000",
        }}
        aria-label={`${c.name[locale]} ${imprisoned ? 0 : rating}`}
      >
        {imprisoned ? 0 : rating}
      </span>

      <StatusBadges statuses={statuses} size={10} className="absolute start-0.5 top-0.5 flex-col" />

      {imprisoned ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[6%] bg-purple-500/25"
        />
      ) : null}
    </div>
  );
});
