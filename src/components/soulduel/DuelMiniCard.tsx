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
  inked = false,
}: {
  card: DuelCard;
  rating: number;
  hidden?: boolean;
  imprisoned?: boolean;
  entering?: boolean;
  statuses?: StatusInstance[];
  movable?: boolean;
  /** Ichimonji: this card's name was blackened — permanently marked at Rating 0. */
  inked?: boolean;
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

      {inked ? (
        <span
          aria-hidden
          title="Ichimonji"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6%]"
        >
          <span className="absolute inset-0 bg-black/35" />
          <span
            className="absolute rounded-[42%_58%_53%_47%/48%_44%_56%_52%] bg-black/92 mix-blend-multiply"
            style={{ left: "8%", top: "12%", width: "72%", height: "58%", transform: "rotate(-9deg)" }}
          />
          <span
            className="absolute rounded-[58%_42%_46%_54%/44%_56%_40%_60%] bg-black/88 mix-blend-multiply"
            style={{ left: "42%", top: "48%", width: "42%", height: "38%", transform: "rotate(18deg)" }}
          />
          <span
            className="absolute rounded-full bg-black/85 mix-blend-multiply"
            style={{ left: "18%", top: "62%", width: "16%", height: "12%" }}
          />
        </span>
      ) : null}
    </div>
  );
});
