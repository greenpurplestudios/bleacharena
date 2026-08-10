import type { Rarity } from "@/types/character";
import { RARITY_MATERIAL } from "@/lib/card-backs";

/** Universal heraldic sigil shown on the back of every card of a rarity. */
export function CardSigil({ rarity, uid }: { rarity: Rarity; uid: string }) {
  const m = RARITY_MATERIAL[rarity];
  const gid = `sigil-${uid}`;
  const pips = Array.from({ length: m.tier });

  return (
    <svg viewBox="0 0 200 200" className="h-[46cqw] w-[46cqw] max-h-[62%] max-w-[62%]">
      <defs>
        <radialGradient id={`${gid}-fill`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor={m.bright} />
          <stop offset="55%" stopColor={m.base} />
          <stop offset="100%" stopColor={m.deep} />
        </radialGradient>
        <linearGradient id={`${gid}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={m.bright} />
          <stop offset="100%" stopColor={m.base} />
        </linearGradient>
      </defs>

      {/* outer rings */}
      <circle cx="100" cy="100" r="92" fill="none" stroke={`url(#${gid}-ring)`} strokeWidth="1.6" opacity="0.7" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={`url(#${gid}-ring)`} strokeWidth="0.9" opacity="0.55" />

      {/* radiating spokes */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const x1 = 100 + Math.cos(a) * 66, y1 = 100 + Math.sin(a) * 66;
        const x2 = 100 + Math.cos(a) * 80, y2 = 100 + Math.sin(a) * 80;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={m.bright} strokeWidth="1.2" opacity="0.5" />
        );
      })}

      {/* central medallion — diamond over disc */}
      <circle cx="100" cy="100" r="58" fill={`url(#${gid}-fill)`} stroke={m.bright} strokeWidth="1.4" />
      <path
        d="M100 46 L146 100 L100 154 L54 100 Z"
        fill="none"
        stroke={m.bright}
        strokeWidth="1.6"
        opacity="0.85"
      />
      <circle cx="100" cy="100" r="20" fill="none" stroke={m.bright} strokeWidth="1.4" opacity="0.9" />
      <circle cx="100" cy="100" r="6" fill={m.bright} />

      {/* tier pips beneath the medallion, one per rarity step */}
      {pips.map((_, i) => {
        const total = pips.length;
        const spread = 10 * (total - 1);
        const cx = 100 - spread / 2 + i * 10;
        return <circle key={i} cx={cx} cy="176" r="2.6" fill={m.bright} opacity="0.9" />;
      })}
    </svg>
  );
}
