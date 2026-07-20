import { useI18n } from "@/lib/i18n";

export function BleachLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useI18n();
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl sm:text-6xl md:text-7xl",
  };
  return (
    <div className="inline-flex items-center gap-3 font-display">
      <span
        aria-hidden
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_24px_-4px_oklch(0.75_0.18_55/0.7)]"
      >
        <span className="text-sm font-black">卍</span>
      </span>
      <span className={`${sizes[size]} font-black tracking-wider text-glow-orange`}>
        {t("brand")}
      </span>
    </div>
  );
}