import { useI18n } from "@/lib/i18n";
import { notifyLogoClick } from "./EasterEggHeart";
import logoImg from "@/assets/brand/nice_logo.jpeg.asset.json";

export function BleachLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useI18n();
  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-5xl sm:text-6xl md:text-7xl",
  };
  return (
    <button
      type="button"
      onClick={notifyLogoClick}
      className="inline-flex items-center gap-3 font-display outline-none"
      aria-label="Bleach Arena"
    >
      <span
        aria-hidden
        className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-md ring-1 ring-white/10 shadow-[0_0_24px_-4px_oklch(0.75_0.18_55/0.7)]"
      >
        <img src={logoImg.url} alt="" className="h-full w-full object-cover" />
      </span>
      <span className={`${sizes[size]} font-black tracking-wider text-glow-orange`}>
        {t("brand")}
      </span>
    </button>
  );
}