import { characters } from "@/data/characters";
import { useMemo } from "react";

interface Props {
  characterId?: string | null;
  frame?: string | null;
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

export function PlayerAvatar({ characterId, frame, size = 48, fallback, className }: Props) {
  const char = useMemo(
    () => (characterId ? characters.find((c) => c.id === characterId) : null),
    [characterId],
  );
  const f = frame ? FRAME_STYLES[frame] : null;
  const style: React.CSSProperties = {
    width: size, height: size,
    boxShadow: f?.glow,
    outline: f ? `2px solid ${f.ring}` : undefined,
    outlineOffset: f ? 2 : undefined,
  };
  return (
    <div
      className={
        "relative flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 " +
        (f?.animated ? "animate-pulse " : "") +
        (className ?? "")
      }
      style={style}
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
}