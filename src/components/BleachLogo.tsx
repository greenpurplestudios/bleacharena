import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { playScream } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { notifyLogoClick } from "./EasterEggHeart";
import logoImg from "@/assets/brand/nice_logo.jpeg.asset.json";

export function BleachLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useI18n();
  const [scream, setScream] = useState(false);
  const taps = useRef(0);
  const brand = t("brand");
  /* Easter egg: tap the first "A" in the wordmark five times. */
  const aIndex = brand.indexOf("A") >= 0 ? brand.indexOf("A") : brand.indexOf("ا");
  const onTapA = (e: React.MouseEvent) => {
    e.stopPropagation();
    taps.current += 1;
    if (taps.current < 5) return;
    taps.current = 0;
    playScream();
    haptic("error");
    setScream(true);
    window.setTimeout(() => setScream(false), 900);
  };
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
      <span
        className={`${sizes[size]} font-black tracking-wider text-glow-orange`}
        style={{ animation: scream ? "ult-shake 0.12s linear 6" : undefined }}
      >
        {aIndex >= 0 ? (
          <>
            {brand.slice(0, aIndex)}
            <span role="presentation" onClick={onTapA}>
              {brand[aIndex]}
            </span>
            {brand.slice(aIndex + 1)}
          </>
        ) : (
          brand
        )}
      </span>
    </button>
  );
}