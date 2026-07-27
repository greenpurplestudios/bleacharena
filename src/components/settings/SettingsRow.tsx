import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";

/**
 * RTL-aware settings primitives.
 *
 * Rules baked in so future settings pick up correct layout automatically:
 * - Row uses `flex` (which reverses via `dir="rtl"` on <html>? No — flex does NOT
 *   auto-reverse) so we use logical `justify-between` + `gap-6` (24px) which
 *   guarantees min spacing between label and control in both directions.
 * - Text alignment uses `text-start` (logical) so Arabic right-aligns naturally.
 * - Controls (Toggle/Slider) are always on the opposite side of the label,
 *   consistently across LTR/RTL, because `justify-between` places the two
 *   children at each end of the inline axis.
 * - Rows share a minimum height (`min-h-14`) and identical vertical padding for
 *   consistent rhythm.
 */

type BaseProps = {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  className?: string;
};

export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  className = "",
}: BaseProps & { children: ReactNode }) {
  return (
    <div
      className={`flex min-h-14 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5 ${className}`}
    >
      <div className="min-w-0 flex-1 text-start">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
            {label}
          </label>
        ) : (
          <span className="block text-sm font-medium text-foreground">{label}</span>
        )}
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingToggle({
  label,
  description,
  value,
  onChange,
}: BaseProps & { value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  return (
    <SettingRow label={label} description={description}>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        aria-label={typeof label === "string" ? label : undefined}
        className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition-colors ${
          value ? "border-primary/60 bg-primary/30" : "border-white/15 bg-white/5"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            value
              ? "translate-x-8 rtl:-translate-x-8"
              : "translate-x-1 rtl:-translate-x-1"
          }`}
        />
        <span className="sr-only">{value ? t("on") : t("off")}</span>
      </button>
    </SettingRow>
  );
}

export function SettingSlider({
  label,
  description,
  value,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  onChange,
  onCommit,
}: BaseProps & {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (v: number) => string;
  onChange: (v: number) => void;
  onCommit?: () => void;
}) {
  const { dir } = useI18n();
  const display = formatValue ? formatValue(value) : `${value}`;
  return (
    <div className="py-2.5">
      <div className="mb-2 flex items-center justify-between gap-x-6 text-sm">
        <span className="text-start text-foreground">{label}</span>
        <span className="shrink-0 font-mono text-xs text-foreground">{display}</span>
      </div>
      {description ? (
        <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      ) : null}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        dir={dir}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="w-full accent-[oklch(0.75_0.18_55)]"
      />
    </div>
  );
}

export function SettingsSection({
  title,
  action,
  children,
  className = "",
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 className="text-start font-display text-lg font-bold">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-3 divide-y divide-white/5">{children}</div>
    </section>
  );
}

// Small helper re-export so pages don't need to import from '@/lib/sound' just
// to wire the slider's commit sound.
export const playSound = play;