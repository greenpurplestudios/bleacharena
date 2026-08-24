import { characters } from "@/data/characters";
import { useMemo } from "react";
import { PROFILE_BADGES, PROFILE_FRAMES } from "@/lib/cosmetics";

interface Props {
  characterId?: string | null;
  frame?: string | null;
  /** Equipped profile badge id (purely cosmetic corner sigil). */
  badge?: string | null;
  size?: number;
  fallback?: string;
  className?: string;
}

const FRAME_STYLES: Record<string, { ring: string; glow: string; animated?: boolean }> = {
  frame_bronze: { ring: "#cd7f32", glow: "0 0 18px -4px #cd7f32" },
  frame_silver: { ring: "#c0c0c0", glow: "0 0 22px -4px #c0c0c0", animated: true },
  frame_gold: { ring: "#ffd700", glow: "0 0 28px -4px #ffd700", animated: true },
  frame_mythic: { ring: "oklch(0.75 0.24 300)", glow: "0 0 34px -4px oklch(0.75 0.24 300)", animated: true },
};

export function PlayerAvatar({ characterId, frame, badge, size = 48, fallback, className }: Props) {
  const char = useMemo(
    () => (characterId ? characters.find((c) => c.id === characterId) : null),
    [characterId],
  );
  const legacy = frame ? FRAME_STYLES[frame] : null;
  const modern = frame ? PROFILE_FRAMES[frame] : null;
  const b = badge ? PROFILE_BADGES[badge] : null;

  const style: React.CSSProperties = {
    width: size,
    height: size,
    boxShadow: legacy?.glow,
    outline: legacy ? `2px solid ${legacy.ring}` : undefined,
    outlineOffset: legacy ? 2 : undefined,
  };

  const avatar = (
    <div
      className={
        "relative flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 " +
        (legacy?.animated ? "animate-pulse " : "") +
        (modern ? `${modern.className} ` : "") +
        (b ? "" : (className ?? ""))
      }
      style={modern ? { ...style, ...modern.style } : style}
    >
      {char?.image ? (
        <img src={char.image} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-xs font-black text-primary">
          {fallback ?? "?"}
        </div>
      )}
    </div>
  );

  if (!b) return avatar;

  return (
    <div className={`relative flex-shrink-0 ${className ?? ""}`} style={{ width: size, height: size }}>
      {avatar}
      <span
        aria-hidden
        className="absolute -bottom-0.5 -end-0.5 flex items-center justify-center rounded-full border border-white/25 bg-background/90 font-display font-black leading-none"
        style={{
          width: Math.max(14, Math.round(size * 0.38)),
          height: Math.max(14, Math.round(size * 0.38)),
          fontSize: Math.max(8, Math.round(size * 0.22)),
          color: b.color,
          boxShadow: `0 0 10px -2px ${b.color}`,
        }}
      >
        {b.glyph}
      </span>
    </div>
  );
}
