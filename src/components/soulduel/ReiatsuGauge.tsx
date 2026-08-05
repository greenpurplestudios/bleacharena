import { useEffect, useRef, useState } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { playGaugeTier } from "@/lib/sound";
import { GAUGE_MAX, LIMIT_MAX, type GaugeState } from "@/lib/soul-duel/types";

/** Visual stage of the gauge — colour, label and intensity all key off this. */
function tierOf(charge: number): 0 | 1 | 2 | 3 | 4 {
  const pct = (charge / GAUGE_MAX) * 100;
  if (pct >= 100) return 4;
  if (pct >= 75) return 3;
  if (pct >= 50) return 2;
  if (pct >= 25) return 1;
  return 0;
}

const TIER_LABEL: Record<number, TKey> = {
  0: "sdGaugeDormant",
  1: "sdGaugeStirring",
  2: "sdGaugeRising",
  3: "sdGaugeSurging",
  4: "sdUltReady",
};

const TIER_COLOR: Record<number, { from: string; to: string; glow: string }> = {
  0: { from: "oklch(0.45 0.08 250)", to: "oklch(0.6 0.1 240)", glow: "oklch(0.6 0.1 240)" },
  1: { from: "oklch(0.5 0.12 250)", to: "oklch(0.72 0.14 230)", glow: "oklch(0.72 0.14 230)" },
  2: { from: "oklch(0.55 0.15 250)", to: "oklch(0.82 0.16 215)", glow: "oklch(0.82 0.16 215)" },
  3: { from: "oklch(0.62 0.18 300)", to: "oklch(0.86 0.17 200)", glow: "oklch(0.86 0.17 200)" },
  4: { from: "oklch(0.75 0.2 55)", to: "oklch(0.93 0.17 95)", glow: "oklch(0.9 0.18 75)" },
};

/**
 * The headline HUD element: the Reiatsu Gauge (0-100) with the Limit Breaker
 * overflow (0-30). It changes colour, texture and label at 25/50/75/100% so a
 * player can read their progress toward the Ultimate Weapon at a glance.
 */
export function ReiatsuGauge({
  gauge,
  label,
  compact = false,
}: {
  gauge: GaugeState;
  label?: string;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const pct = Math.min(100, (gauge.charge / GAUGE_MAX) * 100);
  const limitPct = Math.min(100, (gauge.limit / LIMIT_MAX) * 100);
  const full = gauge.charge >= GAUGE_MAX && !gauge.used;
  const tier = gauge.used ? 0 : tierOf(gauge.charge);
  const colors = TIER_COLOR[tier];
  const [flash, setFlash] = useState(0);
  const lastTier = useRef(tier);

  useEffect(() => {
    if (tier === lastTier.current) return;
    if (tier > lastTier.current) {
      playGaugeTier(tier);
      haptic(tier >= 4 ? "reward" : "tap");
      setFlash((n) => n + 1);
    }
    lastTier.current = tier;
  }, [tier]);

  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground rtl:tracking-normal">
          {label ?? t("sdGauge")}
        </span>
        <span
          className="shrink-0 font-display text-[10px] font-black tabular-nums"
          style={{ color: full ? colors.glow : undefined }}
        >
          {gauge.used ? t("sdUltSpent") : `${Math.round(gauge.charge)}/${GAUGE_MAX}`}
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-full border border-white/10 bg-black/50"
        style={{
          height: compact ? 8 : 14,
          boxShadow: full
            ? `0 0 20px -2px ${colors.glow}, inset 0 0 12px ${colors.glow}55`
            : `inset 0 0 8px ${colors.glow}22`,
        }}
        role="progressbar"
        aria-valuenow={Math.round(gauge.charge)}
        aria-valuemin={0}
        aria-valuemax={GAUGE_MAX}
        aria-label={t("sdGauge")}
      >
        {[25, 50, 75].map((n) => (
          <span
            key={n}
            aria-hidden
            className="absolute inset-y-0 z-10 w-px"
            style={{
              insetInlineStart: `${n}%`,
              background: pct >= n ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.14)",
            }}
          />
        ))}

        <span
          className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
            boxShadow: `0 0 12px ${colors.glow}88`,
            animation: full ? "gauge-pulse 1.5s ease-in-out infinite" : undefined,
          }}
        />

        {pct > 0 && !gauge.used ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/4"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
              animation: `gauge-sweep ${full ? 1.4 : 2.6}s linear infinite`,
              maskImage: `linear-gradient(90deg, #000 ${pct}%, transparent ${pct}%)`,
              WebkitMaskImage: `linear-gradient(90deg, #000 ${pct}%, transparent ${pct}%)`,
            }}
          />
        ) : null}

        {flash > 0 ? (
          <span
            key={flash}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: `${colors.glow}55`, animation: "gauge-tier 0.6s ease-out both" }}
          />
        ) : null}
      </div>

      <div className="mt-1 flex items-center gap-1.5">
        <span
          className="text-[8px] font-black uppercase tracking-[0.18em] rtl:tracking-normal"
          style={{ color: colors.glow }}
        >
          {t(TIER_LABEL[tier])}
        </span>
        {!gauge.used ? (
          <>
            <span className="ms-auto text-[8px] font-black uppercase tracking-[0.18em] text-primary rtl:tracking-normal">
              {t("sdLimitBreaker")}
            </span>
            <span className="relative h-1.5 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-black/50">
              <span
                className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700"
                style={{
                  width: `${limitPct}%`,
                  background: "linear-gradient(90deg, oklch(0.7 0.2 30), oklch(0.9 0.19 65))",
                  boxShadow: limitPct > 0 ? "0 0 10px oklch(0.85 0.19 55 / 0.8)" : undefined,
                  animation: limitPct > 0 ? "gauge-spark 1.6s ease-in-out infinite" : undefined,
                }}
              />
            </span>
            <span className="w-7 shrink-0 text-end font-display text-[9px] font-black tabular-nums text-primary">
              +{Math.round(gauge.limit)}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
