import { memo } from "react";
import { useI18n } from "@/lib/i18n";
import { BATTLEFIELD_BACK } from "@/data/battlefields";
import type { BattlefieldDef } from "@/lib/soul-duel/types";

/**
 * Renders an official battlefield card. The artwork is never modified and no
 * text is baked in — the name and ability are typeset dynamically, per locale,
 * inside the plaques the template already provides.
 */
const TYPO = {
  en: { family: "'Cinzel', serif", nameLs: "0.06em", abilityLs: "0.16em", upper: "none" as const },
  ar: { family: "'Amiri', 'Cairo', serif", nameLs: "0", abilityLs: "0", upper: "none" as const },
};

function fit(len: number, base: number, min: number) {
  if (len <= 12) return base;
  return Math.max(min, base - (len - 12) * (base - min) / 18);
}

export const BattlefieldCard = memo(function BattlefieldCard({
  def,
  revealed = true,
  closed = false,
  className,
}: {
  def: BattlefieldDef;
  revealed?: boolean;
  closed?: boolean;
  className?: string;
}) {
  const { locale } = useI18n();
  const ty = TYPO[locale];
  const name = def.name[locale];
  const ability = def.ability[locale];
  const engrave = {
    fontFamily: ty.family,
    color: "#f3ead4",
    textShadow:
      "0 0.12cqw 0.1cqw rgba(0,0,0,0.85), 0 0 0.9cqw rgba(255,231,180,0.35)",
    textTransform: ty.upper,
  } as const;

  return (
    <div
      className={className}
      style={{ containerType: "inline-size", perspective: "1400px" }}
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: "1024 / 1536",
          transformStyle: "preserve-3d",
          transform: revealed ? "rotateY(0deg)" : "rotateY(180deg)",
          transition: "transform 0.95s cubic-bezier(0.2,0.85,0.25,1)",
          willChange: "transform",
        }}
      >
        {/* FRONT */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[3.5%] bg-black"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img
            src={def.art}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* name plaque */}
          <span
            className="absolute flex items-center justify-center px-[2cqw] text-center font-bold leading-tight"
            style={{
              left: "58%", top: "8.9%", width: "60%", height: "7.4%",
              transform: "translate(-50%, -50%)",
              fontSize: `${fit(name.length, locale === "ar" ? 6.4 : 5.8, 3.4)}cqw`,
              letterSpacing: ty.nameLs,
              lineHeight: locale === "ar" ? 1.35 : 1.1,
              ...engrave,
            }}
          >
            <span className="line-clamp-2">{name}</span>
          </span>

          {/* ability plaque */}
          <span
            className="absolute flex items-center justify-center px-[2cqw] text-center leading-tight"
            style={{
              left: "58.5%", top: "91.4%", width: "62%", height: "6.4%",
              transform: "translate(-50%, -50%)",
              fontSize: `${fit(ability.length, locale === "ar" ? 5.4 : 4.4, 2.9)}cqw`,
              letterSpacing: ty.abilityLs,
              lineHeight: locale === "ar" ? 1.4 : 1.15,
              opacity: 0.95,
              ...engrave,
            }}
          >
            <span className="line-clamp-2">{ability}</span>
          </span>

          {/* soft rarity-style aura tinted with the battlefield accent */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(120% 70% at 50% 40%, ${def.accent}22, transparent 70%)`,
              mixBlendMode: "screen",
            }}
          />

          {closed ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-black/65 backdrop-grayscale"
            />
          ) : null}
        </div>

        {/* BACK */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[3.5%] bg-black"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <img
            src={BATTLEFIELD_BACK}
            alt=""
            aria-hidden
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
});
