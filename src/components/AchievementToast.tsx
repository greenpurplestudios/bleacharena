import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import type { AchievementUnlock } from "@/lib/progression";

const RARITY_COLOR: Record<string, string> = {
  common: "#94a3b8",
  rare: "#38bdf8",
  epic: "#a78bfa",
  legendary: "#f59e0b",
  mythic: "#e879f9",
};

export function AchievementToast({ ach, onClose }: { ach: AchievementUnlock; onClose: () => void }) {
  const { t, locale } = useI18n();
  useEffect(() => {
    const id = setTimeout(onClose, 4500);
    return () => clearTimeout(id);
  }, [onClose]);
  const color = RARITY_COLOR[ach.rarity] ?? "#94a3b8";
  return (
    <div
      className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-xl"
      style={{ borderColor: `${color}66`, boxShadow: `0 0 40px -10px ${color}`, animation: "card-in 0.35s ease-out both", minWidth: 260, maxWidth: 340 }}
      onClick={onClose}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-display text-lg font-black"
        style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}
      >
        ★
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest" style={{ color }}>
          {t("achievementUnlocked")}
        </div>
        <div className="truncate font-display text-sm font-black">
          {locale === "ar" ? ach.name_ar : ach.name_en}
        </div>
        <div className="text-[10px] text-muted-foreground">
          +{ach.xp_reward} XP{ach.soul_reward > 0 ? ` · +${ach.soul_reward} ✦` : ""}
        </div>
      </div>
    </div>
  );
}