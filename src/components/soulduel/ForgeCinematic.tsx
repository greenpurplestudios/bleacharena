import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { playForge } from "@/lib/sound";
import { ultimateOf } from "@/lib/soul-duel/ultimates";

/**
 * Nimaiya hammers the fragments: sparks fly, blue flames rise, the reiatsu
 * erupts and the finished Ultimate Weapon is revealed.
 */
export function ForgeCinematic({ weaponId, onDone }: { weaponId: string; onDone: () => void }) {
  const { t, locale } = useI18n();
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const weapon = ultimateOf(weaponId);

  useEffect(() => {
    playForge();
    haptic("press");
    const timers = [
      window.setTimeout(() => { setStage(1); haptic("draft"); }, 2300),
      window.setTimeout(() => setStage(2), 2900),
      window.setTimeout(onDone, 6200),
    ];
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaponId]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden bg-black/94 px-6 text-center"
      style={{ animation: "fade-in 0.3s ease-out both" }}
      role="dialog"
      aria-live="assertive"
    >
      {/* blue forge flames */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 100%, oklch(0.8 0.16 220 / 0.5), transparent 70%), radial-gradient(40% 80% at 50% 100%, oklch(0.95 0.12 200 / 0.45), transparent 70%)",
          animation: "forge-flame 1.1s ease-in-out infinite",
        }}
      />

      {stage < 2 ? (
        <>
          {/* hammer */}
          <span
            aria-hidden
            className="relative text-6xl"
            style={{ animation: "forge-strike 0.35s ease-in-out infinite" }}
          >
            🔨
          </span>
          {/* sparks */}
          <span aria-hidden className="relative mt-2 block h-10 w-40">
            {Array.from({ length: 14 }).map((_, i) => (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-accent"
                style={{
                  ["--sx" as string]: `${(Math.random() - 0.5) * 160}px`,
                  ["--sy" as string]: `${-30 - Math.random() * 90}px`,
                  animation: `forge-spark ${0.7 + Math.random() * 0.6}s ${Math.random() * 1.6}s linear infinite`,
                }}
              />
            ))}
          </span>
          <p className="relative mt-6 font-display text-sm font-black uppercase tracking-[0.35em] text-accent rtl:tracking-normal">
            {t("forgeWorking")}
          </p>
        </>
      ) : (
        <div className="relative flex flex-col items-center" style={{ animation: "ult-zoom 2.4s ease-out both" }}>
          <span
            aria-hidden
            className="pointer-events-none absolute h-64 w-64 rounded-full"
            style={{
              background: `radial-gradient(circle, ${weapon.visual.glow}66, transparent 70%)`,
              animation: "forge-erupt 1.4s ease-out both",
            }}
          />
          <img
            src={weapon.art}
            alt={weapon.name[locale]}
            className="w-[min(60vw,220px)] rounded-2xl border"
            style={{
              borderColor: `${weapon.visual.glow}66`,
              boxShadow: `0 0 70px ${weapon.visual.glow}55`,
            }}
          />
          <p className="mt-5 font-display text-[10px] font-black uppercase tracking-[0.45em] text-accent rtl:tracking-normal">
            {t("forgeDone")}
          </p>
          <h2
            className="mt-2 font-display text-2xl font-black"
            style={{ color: weapon.visual.glow, textShadow: `0 0 24px ${weapon.visual.glow}88` }}
          >
            {weapon.name[locale]}
          </h2>
          <button
            type="button"
            onClick={onDone}
            className="tactile mt-6 rounded-2xl border border-white/15 px-6 py-2.5 font-display text-xs font-black uppercase tracking-[0.25em] rtl:tracking-normal"
          >
            {t("close")}
          </button>
        </div>
      )}
    </div>
  );
}