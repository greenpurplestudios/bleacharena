import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { PACK_COLOR, PACK_LABEL, type PackTier } from "@/lib/packs";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

const L = {
  hold: { en: "Hold to tear open", ar: "اضغط مطولاً للفتح" },
};

const HOLD_MS = 620;

/**
 * Tactile pack-opening gesture: hold (or tap) to tear the foil, then a burst
 * of light plays before the caller reveals the actual character card.
 */
export function PackTear({ tier, onTorn }: { tier: PackTier; onTorn: () => void }) {
  const { locale } = useI18n();
  const color = PACK_COLOR[tier];
  const [progress, setProgress] = useState(0);
  const [torn, setTorn] = useState(false);
  const raf = useRef<number | null>(null);
  const start = useRef<number | null>(null);
  const done = useRef(false);

  const stop = useCallback(() => {
    start.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (!done.current) setProgress(0);
  }, []);

  const tick = useCallback((t: number) => {
    if (start.current === null) start.current = t;
    const p = Math.min(1, (t - start.current) / HOLD_MS);
    setProgress(p);
    if (p >= 1) {
      done.current = true;
      setTorn(true);
      play("reveal");
      haptic("pack");
      window.setTimeout(onTorn, 460);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }, [onTorn]);

  const begin = useCallback(() => {
    if (done.current) return;
    play("press");
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => () => { if (raf.current) cancelAnimationFrame(raf.current); }, []);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col items-center gap-4 select-none"
    >
      <div
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        className="relative flex h-64 w-44 cursor-pointer touch-none items-center justify-center overflow-hidden rounded-[1.2rem] border-2"
        style={{
          borderColor: `${color}aa`,
          background: `linear-gradient(155deg, ${color}33 0%, #14100c 32%, #1c1712 55%, ${color}22 78%, #0d0a08 100%)`,
          boxShadow: `0 0 ${40 + progress * 60}px -8px ${color}`,
          transform: `scale(${1 + progress * 0.04})`,
        }}
      >
        {/* Left/right halves separate when torn */}
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 w-1/2 border-e border-white/10 transition-transform duration-500"
          style={{ transform: torn ? "translateX(-115%) rotate(-8deg)" : "translateX(0)" }}
        />
        <span
          aria-hidden
          className="absolute inset-y-0 end-0 w-1/2 transition-transform duration-500"
          style={{ transform: torn ? "translateX(115%) rotate(8deg)" : "translateX(0)" }}
        />
        {/* Rip seam glow that grows with progress */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2"
          style={{
            background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
            opacity: torn ? 0 : 0.35 + progress * 0.6,
            boxShadow: `0 0 ${8 + progress * 20}px ${color}`,
          }}
        />
        <span aria-hidden className="pointer-events-none font-display text-5xl font-black opacity-40" style={{ color }}>
          霊
        </span>
        {/* Light burst */}
        {torn && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[1.2rem]"
            style={{
              background: `radial-gradient(circle, white 0%, ${color} 35%, transparent 72%)`,
              animation: "pack-burst 0.5s ease-out forwards",
            }}
          />
        )}
        {/* Progress ring */}
        {!torn && (
          <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 140">
            <rect
              x="2" y="2" width="96" height="136" rx="18"
              fill="none" stroke={color} strokeWidth="3"
              strokeDasharray={2 * (96 + 136)}
              strokeDashoffset={2 * (96 + 136) * (1 - progress)}
              style={{ opacity: progress > 0 ? 0.9 : 0, transition: "opacity 0.15s" }}
            />
          </svg>
        )}
      </div>
      {!torn && (
        <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color }}>
          {L.hold[locale]}
        </p>
      )}
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {PACK_LABEL[tier][locale]}
      </p>
    </div>
  );
}
