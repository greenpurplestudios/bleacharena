import type { Rarity } from "@/types/character";
import { RARITY_MATERIAL } from "@/lib/card-backs";

/**
 * Shared ornamental chrome for both card faces: metallic bezel, corner
 * filigree, and the two signature rarity effects (legendary sheen sweep,
 * mythic lightning arcs). All GPU-cheap: transform/opacity only, plus one
 * small SVG for the lightning that animates stroke-dashoffset.
 */
export function CardChrome({ rarity, uid }: { rarity: Rarity; uid: string }) {
  const m = RARITY_MATERIAL[rarity];
  const gid = `chrome-${uid}`;

  return (
    <>
      {/* metallic bezel ring, drawn as a border gradient (cheap, no blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[6.5%]"
        style={{
          padding: "1.6cqw",
          background: `linear-gradient(155deg, ${m.bright} 0%, ${m.base} 24%, ${m.deep} 48%, ${m.base} 72%, ${m.bright} 100%)`,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* hairline inner edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute rounded-[5.6%]"
        style={{ inset: "1.6cqw", boxShadow: `inset 0 0 0 0.12cqw ${m.deep}, inset 0 0 2cqw rgba(0,0,0,0.55)` }}
      />

      {/* corner filigree */}
      {[
        { x: 0, y: 0, r: 0 },
        { x: 1, y: 0, r: 90 },
        { x: 1, y: 1, r: 180 },
        { x: 0, y: 1, r: 270 },
      ].map((c, i) => (
        <svg
          key={i}
          aria-hidden
          viewBox="0 0 100 100"
          className="pointer-events-none absolute"
          style={{
            width: "13cqw",
            height: "13cqw",
            left: `${c.x * 100}%`,
            top: `${c.y * 100}%`,
            transform: `translate(${c.x ? "-100%" : "0"}, ${c.y ? "-100%" : "0"}) rotate(${c.r}deg)`,
          }}
        >
          <path
            d="M4 4 L4 34 Q4 42 12 44 L34 46 M4 4 L34 4 Q42 4 44 12 L46 34"
            fill="none"
            stroke={m.bright}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.85"
          />
          <circle cx="4" cy="4" r="4.5" fill={m.bright} opacity="0.9" />
        </svg>
      ))}

      {/* LEGENDARY — sweeping metallic sheen */}
      {rarity === "legendary" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[6.5%]"
        >
          <div
            className="absolute inset-y-0 legendary-sheen"
            style={{
              left: "-60%",
              width: "45%",
              background:
                "linear-gradient(100deg, transparent 0%, rgba(255,244,214,0.05) 25%, rgba(255,248,224,0.85) 50%, rgba(255,244,214,0.05) 75%, transparent 100%)",
              mixBlendMode: "screen",
            }}
          />
        </div>
      )}

      {/* MYTHIC lightning is rendered outside the clipped face (MythicLightning). */}
      {gid ? null : null}
    </>
  );
}
