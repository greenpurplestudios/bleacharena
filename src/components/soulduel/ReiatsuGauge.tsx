import { useI18n } from "@/lib/i18n";
import { GAUGE_MAX, LIMIT_MAX, type GaugeState } from "@/lib/soul-duel/types";

/**
 * The Reiatsu Gauge (0–100) with the Limit Breaker overflow (0–30) rendered as
 * a second, hotter bar that only appears once the gauge is full.
 */
export function ReiatsuGauge({
  gauge,
  compact = false,
  label,
}: {
  gauge: GaugeState;
  compact?: boolean;
  label?: string;
}) {
  const { t } = useI18n();
  const pct = Math.min(100, (gauge.charge / GAUGE_MAX) * 100);
  const limitPct = Math.min(100, (gauge.limit / LIMIT_MAX) * 100);
  const full = gauge.charge >= GAUGE_MAX && !gauge.used;

  return (
    <div className="min-w-0 flex-1">
      {!compact ? (
        <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground rtl:tracking-normal">
          <span>{label ?? t("sdGauge")}</span>
          <span className={full ? "text-accent" : undefined}>
            {gauge.used ? t("sdUltSpent") : `${Math.round(gauge.charge)}/${GAUGE_MAX}`}
          </span>
        </div>
      ) : null}
      <div
        className="relative h-2 overflow-hidden rounded-full bg-white/8"
        style={full ? { boxShadow: "0 0 14px oklch(0.8 0.16 220 / 0.55)" } : undefined}
      >
        <span
          className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: full
              ? "linear-gradient(90deg, oklch(0.75 0.18 230), oklch(0.9 0.16 200))"
              : "linear-gradient(90deg, oklch(0.55 0.14 250), oklch(0.8 0.16 220))",
            animation: full ? "gauge-pulse 1.6s ease-in-out infinite" : undefined,
          }}
        />
      </div>
      {gauge.limit > 0 && !gauge.used ? (
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-[8px] font-black uppercase tracking-[0.18em] text-primary rtl:tracking-normal">
            {t("sdLimitBreaker")}
          </span>
          <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/8">
            <span
              className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700"
              style={{
                width: `${limitPct}%`,
                background: "linear-gradient(90deg, oklch(0.7 0.2 30), oklch(0.88 0.19 60))",
              }}
            />
          </span>
          <span className="text-[9px] font-black text-primary">+{Math.round(gauge.limit)}</span>
        </div>
      ) : null}
    </div>
  );
}