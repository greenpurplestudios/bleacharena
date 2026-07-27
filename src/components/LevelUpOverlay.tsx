import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";

interface Props {
  level: number;
  onClose: () => void;
}

export function LevelUpOverlay({ level, onClose }: Props) {
  const { t } = useI18n();
  useEffect(() => {
    play("rare");
    const t1 = setTimeout(onClose, 3500);
    return () => clearTimeout(t1);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center gap-4 rounded-3xl border border-primary/60 bg-card/95 px-10 py-12 text-center shadow-2xl"
        style={{
          animation: "card-in 0.5s ease-out both",
          boxShadow: "0 0 120px -10px oklch(0.75 0.18 55)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* particles */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-primary"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 71) % 100}%`,
                animation: `pulse-glow ${1 + (i % 5) * 0.2}s ease-in-out infinite`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">{t("levelUp")}</p>
        <div className="font-display text-7xl font-black text-glow-orange">{level}</div>
        <p className="text-sm text-muted-foreground">{t("levelUpDesc")}</p>
      </div>
    </div>
  );
}