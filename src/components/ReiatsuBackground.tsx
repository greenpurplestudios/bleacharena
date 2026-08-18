import { useMemo } from "react";

export function ReiatsuBackground({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // deterministic pseudo-random so SSR and client markup match
        let seed = (i + 1) * 9301;
        const rnd = () => {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
        const size = 2 + rnd() * 4;
        const left = rnd() * 100;
        const delay = rnd() * 14;
        const duration = 12 + rnd() * 14;
        const drift = (rnd() - 0.5) * 120;
        const blue = rnd() > 0.55;
        return { i, size, left, delay, duration, drift, blue };
      }),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ transform: "translateZ(0)", contain: "strict" }}
    >
      {particles.map((p) => (
        <span
          key={p.i}
          className="absolute bottom-[-10vh] rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.blue
              ? "radial-gradient(circle, oklch(0.9 0.14 220) 0%, oklch(0.82 0.12 220 / 0) 70%)"
              : "radial-gradient(circle, oklch(0.9 0.2 55) 0%, oklch(0.75 0.18 55 / 0) 70%)",
            filter: "blur(0.5px)",
            animation: `reiatsu-float ${p.duration}s linear ${p.delay}s infinite`,
            ["--drift" as string]: `${p.drift}px`,
            opacity: 0,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.14_0.015_260/0.85)_100%)]" />
    </div>
  );
}