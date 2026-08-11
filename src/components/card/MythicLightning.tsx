import { memo, useMemo } from "react";

/**
 * MYTHIC rarity signature: aggressive, branching red lightning that crawls the
 * whole perimeter of the card — corners included — glows, and arcs slightly
 * beyond the frame. Geometry is generated once per card (deterministic from the
 * card uid) and animated purely with opacity + stroke-dashoffset, so the GPU
 * cost stays flat no matter how many mythics are on screen.
 */

const W = 200;
const H = 248;

/** Point + outward normal at perimeter distance t (0..P). */
function perimeter(t: number) {
  const P = 2 * (W + H);
  let d = ((t % P) + P) % P;
  if (d < W) return { x: d, y: 0, nx: 0, ny: -1, tx: 1, ty: 0 };
  d -= W;
  if (d < H) return { x: W, y: d, nx: 1, ny: 0, tx: 0, ty: 1 };
  d -= H;
  if (d < W) return { x: W - d, y: H, nx: 0, ny: 1, tx: -1, ty: 0 };
  d -= W;
  return { x: 0, y: H - d, nx: -1, ny: 0, tx: 0, ty: -1 };
}

function seeded(uid: string) {
  let s = 2166136261;
  for (let i = 0; i < uid.length; i++) {
    s ^= uid.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

interface Bolt { d: string; w: number; delay: number; dur: number; }

function buildBolts(uid: string): Bolt[] {
  const rnd = seeded(uid);
  const P = 2 * (W + H);
  const bolts: Bolt[] = [];
  const COUNT = 9;

  for (let b = 0; b < COUNT; b++) {
    // spread starts around the perimeter so corners are always covered
    const start = (b / COUNT) * P + rnd() * 22;
    const span = 42 + rnd() * 46;
    const steps = 7 + Math.floor(rnd() * 4);
    let d = "";
    const pts: { x: number; y: number; nx: number; ny: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = perimeter(start + (span * i) / steps);
      // jitter along the outward normal — the zig-zag that reads as lightning
      const amp = i === 0 || i === steps ? 0 : (rnd() - 0.35) * 9;
      pts.push({ x: p.x + p.nx * amp, y: p.y + p.ny * amp, nx: p.nx, ny: p.ny });
    }
    d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

    // 1–2 forks shooting outward past the frame edge
    const forks = 1 + Math.floor(rnd() * 2);
    for (let f = 0; f < forks; f++) {
      const at = pts[2 + Math.floor(rnd() * (pts.length - 3))];
      if (!at) continue;
      const len = 5 + rnd() * 11;
      const mx = at.x + at.nx * len * 0.55 + (rnd() - 0.5) * 9;
      const my = at.y + at.ny * len * 0.55 + (rnd() - 0.5) * 9;
      const ex = at.x + at.nx * len + (rnd() - 0.5) * 13;
      const ey = at.y + at.ny * len + (rnd() - 0.5) * 13;
      d += ` M${at.x.toFixed(1)} ${at.y.toFixed(1)} L${mx.toFixed(1)} ${my.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }

    bolts.push({
      d,
      w: 0.9 + rnd() * 1.1,
      delay: rnd() * 2.4,
      dur: 1.6 + rnd() * 1.8,
    });
  }
  return bolts;
}

export const MythicLightning = memo(function MythicLightning({
  uid,
  active = true,
}: {
  uid: string;
  /** When false the arcs hold a dim static state (off-screen / reduced motion). */
  active?: boolean;
}) {
  const bolts = useMemo(() => buildBolts(uid), [uid]);
  const gid = `myth-${uid}`;

  return (
    <svg
      aria-hidden
      viewBox={`-14 -14 ${W + 28} ${H + 28}`}
      preserveAspectRatio="none"
      className="pointer-events-none absolute"
      style={{ inset: "-5.6%", width: "111.2%", height: "111.2%" }}
    >
      <defs>
        <filter id={`${gid}-g`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.4" result="b1" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`${gid}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a72" />
          <stop offset="45%" stopColor="#ff2d16" />
          <stop offset="100%" stopColor="#ffd0c4" />
        </linearGradient>
      </defs>

      {/* diffuse crimson charge hugging the frame */}
      <rect
        x="1" y="1" width={W - 2} height={H - 2} rx="13"
        fill="none" stroke="#ff2d16" strokeWidth="3.2" opacity="0.28"
        filter={`url(#${gid}-g)`}
      />

      <g filter={`url(#${gid}-g)`}>
        {bolts.map((b, i) => (
          <path
            key={`g${i}`}
            d={b.d}
            fill="none"
            stroke="#ff2412"
            strokeWidth={b.w * 2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.55"
            className={active ? "mythic-bolt" : undefined}
            style={active ? { animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` } : { opacity: 0.3 }}
          />
        ))}
      </g>

      {bolts.map((b, i) => (
        <path
          key={`c${i}`}
          d={b.d}
          fill="none"
          stroke={`url(#${gid}-s)`}
          strokeWidth={b.w}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={active ? "mythic-bolt" : undefined}
          style={active ? { animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` } : { opacity: 0.45 }}
        />
      ))}
    </svg>
  );
});