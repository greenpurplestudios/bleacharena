import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { playReiatsuClash, playUltimate } from "@/lib/sound";
import { ULTIMATE_EFFECT_TEXT, ultimateOf } from "@/lib/soul-duel/ultimates";
import type { UltimateEvent } from "@/lib/soul-duel/types";

/**
 * Full-screen cinematic for an Ultimate Weapon activation and for the Reiatsu
 * Clash. Everything is transform/opacity driven so it stays at 60 FPS on
 * mobile, and the whole sequence auto-dismisses.
 */
export function UltimateOverlay({
  event,
  onDone,
}: {
  event: UltimateEvent;
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const [stage, setStage] = useState(0);
  const done = useRef(false);

  const clash = event.kind === "clash";
  const winner = event.side;
  const weapon = ultimateOf(event.weaponId);
  const playerWeapon = ultimateOf(event.clash?.weapons.player);
  const enemyWeapon = ultimateOf(event.clash?.weapons.opponent);
  const duration = clash ? 4200 : 3400;

  useEffect(() => {
    if (clash) { playReiatsuClash(); haptic("draft"); }
    else { playUltimate(weapon.visual.audio); haptic("draft"); }

    const timers = [
      window.setTimeout(() => setStage(1), 700),
      window.setTimeout(() => { setStage(2); haptic("press"); }, clash ? 1500 : 1200),
      window.setTimeout(() => setStage(3), clash ? 2600 : 2200),
      window.setTimeout(() => {
        if (done.current) return;
        done.current = true;
        onDone();
      }, duration),
    ];
    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  const accent = clash ? "oklch(0.85 0.16 90)" : weapon.visual.color;
  const glow = clash ? "oklch(0.9 0.14 210)" : weapon.visual.glow;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden bg-black/92"
      style={{ animation: "fade-in 0.28s ease-out both" }}
      role="dialog"
      aria-live="assertive"
      aria-label={clash ? t("sdClash") : weapon.name[locale]}
    >
      {/* energy wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(60vmax 60vmax at 50% 55%, ${glow}33, transparent 65%), radial-gradient(40vmax 40vmax at 50% 20%, ${accent}44, transparent 70%)`,
          animation: "ult-wash 3.4s ease-out both",
        }}
      />
      {/* screen distortion bands */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${glow}22 0 2px, transparent 2px 7px)`,
          animation: "ult-distort 0.9s steps(9) infinite",
          opacity: stage >= 1 ? 0.5 : 0,
          transition: "opacity 0.4s",
        }}
      />

      <div
        className="relative flex w-full max-w-md flex-col items-center px-6 text-center"
        style={{ animation: clash ? "ult-shake 0.5s ease-in-out 1.2s 3" : "ult-zoom 3.2s ease-out both" }}
      >
        {clash ? (
          <>
            <p
              className="font-display text-[11px] font-black uppercase tracking-[0.5em] text-accent rtl:tracking-normal"
              style={{ animation: "fade-in 0.4s ease-out both" }}
            >
              {t("sdClash")}
            </p>
            <div className="mt-4 flex w-full items-center justify-between gap-3">
              <ClashCard art={playerWeapon.art} name={playerWeapon.name[locale]}
                limit={event.clash?.limits.player ?? 0} side="start"
                dimmed={!!winner && winner !== "player"} />
              <span
                aria-hidden
                className="h-16 w-16 shrink-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${glow}, transparent 70%)`,
                  animation: "ult-collide 1.4s ease-out infinite",
                }}
              />
              <ClashCard art={enemyWeapon.art} name={enemyWeapon.name[locale]}
                limit={event.clash?.limits.opponent ?? 0} side="end"
                dimmed={!!winner && winner !== "opponent"} />
            </div>
            {stage >= 2 ? (
              <p
                className="mt-6 max-w-xs text-balance font-display text-sm font-black"
                style={{ animation: "scale-in 0.35s ease-out both", color: accent }}
              >
                {winner === "player" ? t("sdClashWon")
                  : winner === "opponent" ? t("sdClashLost")
                  : t("sdClashPerfect")}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p
              className="font-display text-[10px] font-black uppercase tracking-[0.5em] rtl:tracking-normal"
              style={{ color: glow }}
            >
              {t("sdUltimate")}
            </p>
            <div
              className="relative mt-4 w-[min(62vw,240px)] overflow-hidden rounded-2xl border"
              style={{
                borderColor: `${glow}66`,
                boxShadow: `0 0 60px ${glow}55, 0 0 140px ${accent}44`,
                animation: `ult-card-${weapon.visual.motion} 2.6s cubic-bezier(0.16,1,0.3,1) both`,
              }}
            >
              <img
                src={weapon.art}
                alt={weapon.name[locale]}
                className="w-full"
                draggable={false}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(120deg, transparent 35%, ${glow}66 50%, transparent 65%)`,
                  animation: "ult-sheen 1.6s 0.6s ease-out both",
                }}
              />
            </div>
            <h2
              className="mt-5 font-display text-2xl font-black"
              style={{ color: glow, textShadow: `0 0 24px ${glow}88` }}
            >
              {weapon.name[locale]}
            </h2>
            {stage >= 1 ? (
              <p
                className="mt-2 text-balance font-display text-lg font-black text-foreground"
                style={{ animation: "ult-voice 0.6s ease-out both" }}
              >
                “{weapon.visual.voice[locale]}”
              </p>
            ) : null}
            {stage >= 2 ? (
              <p
                className="mt-3 max-w-xs text-balance text-xs leading-relaxed text-muted-foreground"
                style={{ animation: "fade-in 0.4s ease-out both" }}
              >
                {event.side === "player" ? "" : "⚔ "}
                {ULTIMATE_EFFECT_TEXT[weapon.id]?.[locale] ?? ""}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ClashCard({
  art, name, limit, side, dimmed,
}: { art: string; name: string; limit: number; side: "start" | "end"; dimmed: boolean }) {
  return (
    <div
      className="min-w-0 flex-1"
      style={{
        animation: `ult-clash-${side} 1.3s cubic-bezier(0.16,1,0.3,1) both`,
        opacity: dimmed ? 0.32 : 1,
        filter: dimmed ? "grayscale(0.8)" : undefined,
        transition: "opacity 0.5s, filter 0.5s",
      }}
    >
      <img src={art} alt={name} className="w-full rounded-xl border border-white/15" draggable={false} />
      <p className="mt-1.5 truncate text-[10px] font-bold">{name}</p>
      <p className="font-display text-xs font-black text-primary">+{Math.round(limit)}</p>
    </div>
  );
}