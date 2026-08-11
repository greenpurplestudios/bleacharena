import { memo } from "react";
import type { Rarity } from "@/types/character";
import { RARITY_MATERIAL } from "@/lib/card-backs";

/**
 * Layered energy + ornamental geometry behind the universal rarity sigil on
 * the card back. Purely decorative, CSS/SVG only, and deliberately restrained:
 * depth and lighting rather than clutter.
 */
export const CardBackPattern = memo(function CardBackPattern({
  rarity,
  uid,
  active = true,
}: {
  rarity: Rarity;
  uid: string;
  active?: boolean;
}) {
  const m = RARITY_MATERIAL[rarity];
  const gid = `back-${uid}`;

  return (
    <>
      {/* deep lighting pool */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(70% 50% at 50% 34%, ${m.glow}, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      {/* woven guilloche lattice */}
      <svg
        aria-hidden
        viewBox="0 0 200 248"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ opacity: 0.22 }}
      >
        <defs>
          <pattern id={`${gid}-w`} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 7 H14 M7 0 V14" stroke={m.bright} strokeWidth="0.4" fill="none" />
          </pattern>
          <radialGradient id={`${gid}-fade`} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id={`${gid}-m`}>
            <rect width="200" height="248" fill={`url(#${gid}-fade)`} />
          </mask>
        </defs>
        <rect width="200" height="248" fill={`url(#${gid}-w)`} mask={`url(#${gid}-m)`} />
      </svg>

      {/* slow rotating energy rays */}
      <span
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-[42%] aspect-square w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full ${active ? "card-back-rays" : ""}`}
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, ${m.glow} 6deg, transparent 16deg, transparent 45deg, ${m.glow} 51deg, transparent 62deg, transparent 120deg, ${m.glow} 126deg, transparent 138deg, transparent 200deg, ${m.glow} 206deg, transparent 218deg, transparent 300deg, ${m.glow} 306deg, transparent 318deg)`,
          opacity: 0.18,
          maskImage: "radial-gradient(circle, #000 20%, transparent 68%)",
          WebkitMaskImage: "radial-gradient(circle, #000 20%, transparent 68%)",
        }}
      />

      {/* concentric ornamental rings */}
      <svg
        aria-hidden
        viewBox="0 0 200 248"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <g fill="none" stroke={m.bright} opacity="0.3">
          <rect x="12" y="12" width="176" height="224" rx="10" strokeWidth="0.5" />
          <rect x="18" y="18" width="164" height="212" rx="8" strokeWidth="0.3" strokeDasharray="3 5" />
        </g>
      </svg>

      {/* rarity-specific energy signature */}
      {rarity === "legendary" && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[6.5%]`}
        >
          <span
            className={active ? "legendary-sheen absolute inset-y-0" : "absolute inset-y-0"}
            style={{
              left: "-60%",
              width: "45%",
              background:
                "linear-gradient(100deg, transparent 0%, rgba(255,240,190,0.05) 30%, rgba(255,248,224,0.55) 50%, rgba(255,240,190,0.05) 70%, transparent 100%)",
              mixBlendMode: "screen",
            }}
          />
        </span>
      )}
      {rarity === "mythic" && (
        <svg
          aria-hidden
          viewBox="0 0 200 248"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <filter id={`${gid}-lg`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g stroke="#ff3a22" fill="none" strokeLinecap="round" filter={`url(#${gid}-lg)`} opacity="0.75">
            <path d="M32 26 L44 62 L34 66 L52 104" strokeWidth="1" className={active ? "mythic-bolt" : undefined} />
            <path d="M168 30 L154 68 L166 72 L146 112" strokeWidth="1" className={active ? "mythic-bolt" : undefined} style={{ animationDelay: "0.7s" }} />
            <path d="M38 222 L52 186 L40 180 L60 142" strokeWidth="0.8" className={active ? "mythic-bolt" : undefined} style={{ animationDelay: "1.3s" }} />
            <path d="M164 226 L150 190 L162 184 L142 148" strokeWidth="0.8" className={active ? "mythic-bolt" : undefined} style={{ animationDelay: "1.9s" }} />
          </g>
        </svg>
      )}
    </>
  );
});