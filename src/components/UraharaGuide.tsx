import { useEffect, useMemo, useState } from "react";
import { useI18n, type TKey } from "@/lib/i18n";
import uraharaPortrait from "@/assets/characters/urahara.jpeg.asset.json";
import uraharaShop from "@/assets/brand/urahara_shop.jpeg.asset.json";

const TIPS: TKey[] = [
  "uraharaTip1",
  "uraharaTip2",
  "uraharaTip3",
  "uraharaTip4",
  "uraharaTip5",
  "uraharaTip6",
];

/**
 * Kisuke Urahara — the Arena's shopkeeper/guide.
 * Rotates short tips every ~9s with a soft fade.
 */
export function UraharaGuide({
  art = "portrait",
  greeting,
  className = "",
}: {
  art?: "portrait" | "shop";
  greeting?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % TIPS.length);
        setVisible(true);
      }, 320);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  const src = useMemo(
    () => (art === "shop" ? uraharaShop.url : uraharaPortrait.url),
    [art],
  );

  return (
    <div
      className={`relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(120px 120px at 12% 50%, oklch(0.75 0.18 55 / 0.18), transparent 70%)",
        }}
      />
      <div className="relative shrink-0">
        <img
          src={src}
          alt={t("uraharaName")}
          loading="lazy"
          className="h-16 w-16 rounded-xl object-cover ring-1 ring-primary/40 sm:h-20 sm:w-20"
          style={{ animation: "guide-bob 5s ease-in-out infinite" }}
        />
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl"
          style={{ boxShadow: "0 0 28px -8px oklch(0.75 0.18 55 / 0.9)" }}
        />
      </div>
      <div className="relative min-w-0 text-start">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-sm font-black">{t("uraharaName")}</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {t("uraharaRole")}
          </span>
        </div>
        <p
          className="mt-1 text-sm leading-relaxed text-foreground/90 transition-opacity duration-300"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {greeting && visible && idx === 0 ? greeting : t(TIPS[idx])}
        </p>
      </div>
    </div>
  );
}