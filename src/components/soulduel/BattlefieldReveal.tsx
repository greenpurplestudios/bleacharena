import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { playBattlefieldReveal } from "@/lib/sound";
import { BattlefieldCard } from "./BattlefieldCard";
import type { BattlefieldDef } from "@/lib/soul-duel/types";

/**
 * Signature moment: the battlefield card lands face-down, charges, flips and
 * its ability is typeset beneath it. Tap (or wait) to continue.
 */
export function BattlefieldReveal({
  def,
  index,
  onDone,
}: {
  def: BattlefieldDef;
  index: number;
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const [flipped, setFlipped] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    setFlipped(false);
    setShowText(false);
    const a = window.setTimeout(() => {
      setFlipped(true);
      playBattlefieldReveal();
      haptic("reward");
    }, 650);
    const b = window.setTimeout(() => setShowText(true), 1500);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [def.id, index]);

  return (
    <div
      role="dialog"
      aria-label={def.name[locale]}
      onClick={() => flipped && onDone()}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/92 px-5 py-8 backdrop-blur-md"
      style={{ animation: "fade-in 0.35s ease-out both" }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(600px 380px at 50% 42%, ${def.accent}33, transparent 72%)`,
          animation: "pulse-glow 3.4s ease-in-out infinite",
        }}
      />

      <p className="relative font-display text-[10px] uppercase tracking-[0.45em] text-accent">
        {t("sdBattlefield")} {index + 1}
      </p>

      <div className="relative w-[min(62vw,240px)]" style={{ animation: "card-in 0.6s ease-out both" }}>
        <BattlefieldCard def={def} revealed={flipped} />
      </div>

      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-card/70 p-4 text-center backdrop-blur-md"
        style={{
          opacity: showText ? 1 : 0,
          transform: showText ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        }}
      >
        <h2 className="font-display text-lg font-black" style={{ color: def.accent }}>
          {def.name[locale]}
        </h2>
        <p className="mt-1 font-display text-[11px] uppercase tracking-[0.28em] text-accent rtl:tracking-normal">
          {def.ability[locale]}
        </p>
        <p className="mt-2 text-balance text-sm leading-relaxed text-muted-foreground">
          {def.description[locale]}
        </p>
      </div>

      <button
        type="button"
        onClick={onDone}
        disabled={!flipped}
        className="tactile relative rounded-2xl bg-primary px-6 py-3 font-display text-xs font-black uppercase tracking-[0.25em] text-primary-foreground disabled:opacity-40"
      >
        {t("sdContinue")}
      </button>
    </div>
  );
}
