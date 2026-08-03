import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Ambient page atmosphere: parallax glow orbs + drifting motes.
 * Decorative only, pointer-events-none, transform/opacity animations.
 * Respects prefers-reduced-motion.
 */
export type AtmosphereVariant = "reiatsu" | "mist" | "petals" | "sparks";

const PALETTE: Record<AtmosphereVariant, string[]> = {
  reiatsu: ["oklch(0.9 0.2 55)", "oklch(0.9 0.14 220)"],
  mist: ["oklch(0.9 0.03 240)", "oklch(0.85 0.05 220)"],
  petals: ["oklch(0.85 0.12 20)", "oklch(0.9 0.08 350)"],
  sparks: ["oklch(0.92 0.2 75)", "oklch(0.85 0.19 40)"],
};

export function Atmosphere({
  variant = "reiatsu",
  count = 22,
  parallax = true,
}: {
  variant?: AtmosphereVariant;
  count?: number;
  parallax?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!parallax || reduced) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const el = ref.current;
        if (!el) return;
        el.style.setProperty("--par-slow", `${y * -0.04}px`);
        el.style.setProperty("--par-fast", `${y * -0.11}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [parallax, reduced]);

  const motes = useMemo(() => {
    const [a, b] = PALETTE[variant];
    return Array.from({ length: count }, (_, i) => ({
      i,
      size: variant === "petals" ? 5 + Math.random() * 7 : 2 + Math.random() * 4,
      left: Math.random() * 100,
      delay: Math.random() * 16,
      duration:
        variant === "sparks"
          ? 7 + Math.random() * 7
          : variant === "mist"
            ? 18 + Math.random() * 16
            : 12 + Math.random() * 14,
      drift: (Math.random() - 0.5) * 140,
      color: Math.random() > 0.5 ? a : b,
    }));
  }, [variant, count]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-24 top-[-10%] h-[46vh] w-[46vh] rounded-full blur-[90px]"
        style={{
          background: "radial-gradient(circle, oklch(0.75 0.18 55 / 0.28), transparent 70%)",
          transform: "translate3d(0, var(--par-slow, 0px), 0)",
          animation: reduced ? undefined : "orb-drift 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-24 top-[30%] h-[52vh] w-[52vh] rounded-full blur-[110px]"
        style={{
          background: "radial-gradient(circle, oklch(0.82 0.12 220 / 0.24), transparent 70%)",
          transform: "translate3d(0, var(--par-fast, 0px), 0)",
          animation: reduced ? undefined : "orb-drift 24s ease-in-out infinite reverse",
        }}
      />
      {!reduced &&
        motes.map((p) => (
          <span
            key={p.i}
            className="absolute bottom-[-10vh]"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: variant === "petals" ? p.size * 0.6 : p.size,
              borderRadius: variant === "petals" ? "60% 0 60% 0" : "9999px",
              background:
                variant === "petals"
                  ? p.color
                  : `radial-gradient(circle, ${p.color} 0%, transparent 70%)`,
              filter: variant === "mist" ? "blur(3px)" : "blur(0.5px)",
              opacity: 0,
              animation: `reiatsu-float ${p.duration}s linear ${p.delay}s infinite`,
              ["--drift" as string]: `${p.drift}px`,
            }}
          />
        ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_38%,oklch(0.14_0.015_260/0.88)_100%)]" />
    </div>
  );
}