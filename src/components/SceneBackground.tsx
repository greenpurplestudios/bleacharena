import { useMemo } from "react";

/**
 * SceneBackground — layered atmospheric backdrop for each major screen.
 * Fixed, pointer-events-none, -z-10. Pure CSS/SVG, transform/opacity-only
 * animation, prefers-reduced-motion aware, low element count.
 */
export type Scene =
  | "home"
  | "draft"
  | "collection"
  | "duel"
  | "store"
  | "social"
  | "profile"
  | "generic";

function Grain() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-overlay" aria-hidden>
      <filter id="ba-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#ba-grain)" />
    </svg>
  );
}

function Vignette() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse at center, transparent 35%, oklch(0.14 0.015 260 / 0.92) 100%)",
      }}
    />
  );
}

function ReiatsuStreaks({ n = 3, hue = "220" }: { n?: number; hue?: string }) {
  const streaks = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        i,
        top: 12 + i * (70 / n) + (i % 2) * 6,
        delay: i * 3.4,
        dur: 14 + i * 4,
      })),
    [n],
  );
  return (
    <>
      {streaks.map((s) => (
        <span
          key={s.i}
          className="absolute h-px w-[70%] scene-streak"
          style={{
            top: `${s.top}%`,
            insetInlineStart: "-20%",
            background: `linear-gradient(90deg, transparent, oklch(0.82 0.12 ${hue} / 0.35), transparent)`,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </>
  );
}

function LightPools({ pools }: { pools: { x: string; y: string; size: string; color: string; delay?: number }[] }) {
  return (
    <>
      {pools.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-[90px] scene-orb"
          style={{
            insetInlineStart: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, ${p.color}, transparent 70%)`,
            animationDelay: `${p.delay ?? 0}s`,
          }}
        />
      ))}
    </>
  );
}

function HomeArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[42vh] w-full opacity-[0.22]"
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* Soul Society tiled rooftops */}
      <g fill="oklch(0.08 0.02 260)">
        <path d="M0 130 L40 100 L80 130 Z" />
        <path d="M60 140 L110 100 L160 140 Z" />
        <path d="M140 130 L190 95 L240 130 Z" />
        <path d="M220 140 L270 100 L320 140 Z" />
        <path d="M300 130 L350 100 L400 130 Z" />
        <rect x="0" y="128" width="400" height="32" />
      </g>
      {/* Torii gate */}
      <g stroke="oklch(0.75 0.18 55 / 0.6)" strokeWidth="3" fill="none">
        <line x1="150" y1="70" x2="150" y2="130" />
        <line x1="250" y1="70" x2="250" y2="130" />
        <line x1="138" y1="70" x2="262" y2="70" />
        <line x1="132" y1="82" x2="268" y2="82" />
      </g>
    </svg>
  );
}

function DraftArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[46vh] w-full opacity-[0.18]"
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* crossed sword silhouettes */}
      <g fill="oklch(0.08 0.02 260)">
        <rect x="196" y="10" width="8" height="150" transform="rotate(18 200 85)" />
        <polygon points="200,4 210,20 190,20" transform="rotate(18 200 85)" />
        <rect x="196" y="10" width="8" height="150" transform="rotate(-18 200 85)" />
        <polygon points="200,4 210,20 190,20" transform="rotate(-18 200 85)" />
      </g>
      <rect x="0" y="180" width="400" height="20" fill="oklch(0.08 0.02 260)" />
    </svg>
  );
}

function CollectionArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[44vh] w-full opacity-[0.2]"
      viewBox="0 0 400 180"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* Seireitei towers */}
      <g fill="oklch(0.08 0.02 260)">
        <rect x="20" y="70" width="26" height="90" />
        <rect x="12" y="60" width="42" height="12" />
        <rect x="90" y="40" width="30" height="120" />
        <rect x="80" y="28" width="50" height="14" />
        <rect x="180" y="90" width="24" height="70" />
        <rect x="172" y="80" width="40" height="12" />
        <rect x="260" y="55" width="32" height="105" />
        <rect x="250" y="44" width="52" height="14" />
        <rect x="340" y="75" width="26" height="85" />
        <rect x="332" y="65" width="42" height="12" />
      </g>
    </svg>
  );
}

function DuelArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[48vh] w-full opacity-[0.22]"
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* Hueco Mundo crescent moon + dunes */}
      <circle cx="330" cy="34" r="26" fill="oklch(0.9 0.05 220 / 0.5)" />
      <circle cx="342" cy="28" r="24" fill="oklch(0.05 0.02 260)" />
      <g fill="oklch(0.07 0.02 260)">
        <path d="M0 150 Q100 110 200 150 T400 150 V200 H0 Z" />
        <path d="M0 175 Q120 140 240 175 T400 165 V200 H0 Z" opacity="0.7" />
      </g>
    </svg>
  );
}

function StoreArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[40vh] w-full opacity-[0.2]"
      viewBox="0 0 400 160"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* shop awning + hanging lanterns */}
      <g fill="oklch(0.08 0.02 260)">
        <rect x="0" y="60" width="400" height="14" />
        <path d="M0 74 L400 74 L380 100 L20 100 Z" />
      </g>
      <g fill="oklch(0.75 0.18 55 / 0.45)">
        <ellipse cx="90" cy="122" rx="10" ry="14" />
        <ellipse cx="200" cy="128" rx="10" ry="14" />
        <ellipse cx="310" cy="122" rx="10" ry="14" />
      </g>
      <g stroke="oklch(0.08 0.02 260)" strokeWidth="2">
        <line x1="90" y1="100" x2="90" y2="108" />
        <line x1="200" y1="100" x2="200" y2="114" />
        <line x1="310" y1="100" x2="310" y2="108" />
      </g>
    </svg>
  );
}

function SocialArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[38vh] w-full opacity-[0.18]"
      viewBox="0 0 400 150"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      {/* distant sekkiseki walls */}
      <g fill="oklch(0.08 0.02 260)">
        <rect x="0" y="90" width="400" height="60" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={i * 40} y="70" width="34" height="24" opacity={i % 2 ? 0.7 : 1} />
        ))}
      </g>
    </svg>
  );
}

function ProfileArt() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 h-[38vh] w-full opacity-[0.18]"
      viewBox="0 0 400 150"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden
    >
      <g fill="oklch(0.08 0.02 260)">
        <rect x="0" y="100" width="400" height="50" />
        <rect x="30" y="60" width="60" height="40" />
        <rect x="150" y="50" width="80" height="50" />
        <rect x="280" y="65" width="70" height="35" />
      </g>
    </svg>
  );
}

const SCENE_CONFIG: Record<
  Scene,
  { pools: { x: string; y: string; size: string; color: string; delay?: number }[]; hue: string; Art: () => JSX.Element | null }
> = {
  home: {
    hue: "55",
    pools: [
      { x: "-10%", y: "-10%", size: "50vh", color: "oklch(0.75 0.18 55 / 0.22)" },
      { x: "70%", y: "20%", size: "45vh", color: "oklch(0.82 0.12 220 / 0.16)", delay: 6 },
    ],
    Art: HomeArt,
  },
  draft: {
    hue: "55",
    pools: [
      { x: "10%", y: "0%", size: "42vh", color: "oklch(0.75 0.18 55 / 0.18)" },
      { x: "60%", y: "35%", size: "42vh", color: "oklch(0.7 0.15 300 / 0.14)", delay: 5 },
    ],
    Art: DraftArt,
  },
  collection: {
    hue: "220",
    pools: [
      { x: "0%", y: "10%", size: "44vh", color: "oklch(0.82 0.12 220 / 0.18)" },
      { x: "65%", y: "0%", size: "40vh", color: "oklch(0.75 0.18 55 / 0.12)", delay: 4 },
    ],
    Art: CollectionArt,
  },
  duel: {
    hue: "300",
    pools: [
      { x: "60%", y: "-5%", size: "46vh", color: "oklch(0.82 0.12 220 / 0.2)" },
      { x: "-5%", y: "40%", size: "40vh", color: "oklch(0.7 0.15 300 / 0.16)", delay: 3 },
    ],
    Art: DuelArt,
  },
  store: {
    hue: "55",
    pools: [
      { x: "5%", y: "5%", size: "40vh", color: "oklch(0.75 0.18 55 / 0.2)" },
      { x: "70%", y: "25%", size: "38vh", color: "oklch(0.82 0.12 220 / 0.14)", delay: 5 },
    ],
    Art: StoreArt,
  },
  social: {
    hue: "220",
    pools: [
      { x: "10%", y: "10%", size: "40vh", color: "oklch(0.82 0.12 220 / 0.14)" },
      { x: "65%", y: "10%", size: "36vh", color: "oklch(0.75 0.18 55 / 0.12)", delay: 4 },
    ],
    Art: SocialArt,
  },
  profile: {
    hue: "220",
    pools: [
      { x: "-5%", y: "0%", size: "40vh", color: "oklch(0.82 0.12 220 / 0.16)" },
      { x: "70%", y: "30%", size: "38vh", color: "oklch(0.75 0.18 55 / 0.12)", delay: 6 },
    ],
    Art: ProfileArt,
  },
  generic: {
    hue: "220",
    pools: [
      { x: "0%", y: "0%", size: "40vh", color: "oklch(0.75 0.18 55 / 0.16)" },
      { x: "65%", y: "20%", size: "38vh", color: "oklch(0.82 0.12 220 / 0.14)", delay: 4 },
    ],
    Art: () => null,
  },
};

export function SceneBackground({ scene = "generic", className = "" }: { scene?: Scene; className?: string }) {
  const cfg = SCENE_CONFIG[scene] ?? SCENE_CONFIG.generic;
  const Art = cfg.Art;
  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-background" />
      <LightPools pools={cfg.pools} />
      <ReiatsuStreaks hue={cfg.hue} n={3} />
      <Art />
      <Grain />
      <Vignette />
    </div>
  );
}
