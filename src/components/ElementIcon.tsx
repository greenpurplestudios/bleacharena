import type { ElementKey } from "@/lib/elements";

/** The ONE official element icon set — used on cards, filters, the element
 *  guide, profiles and any future Soul Duel surface. Never redraw these. */
export const ELEMENT_PATH: Record<ElementKey, string> = {
  light:
    "M32 6 L36.5 21.5 L52 14 L44.5 29.5 L60 34 L44.5 38.5 L52 54 L36.5 46.5 L32 62 L27.5 46.5 L12 54 L19.5 38.5 L4 34 L19.5 29.5 L12 14 L27.5 21.5 Z M32 24 a10 10 0 1 0 0.1 0 Z",
  shadow: "M42 6 a28 28 0 1 0 16 50 a22 22 0 1 1 -16 -50 Z",
  nature:
    "M54 8 C28 8 10 24 10 44 c0 6 2 10 4 13 l-6 6 3 3 6-6 c3 2 7 4 13 4 20 0 30-18 30-44 0-6 0-10 -6-12 Z M22 50 C28 34 38 24 50 18 40 30 32 40 22 50 Z",
  fire:
    "M34 4 c4 12 -6 16 -10 26 -3 8 1 14 5 16 -2 -6 0 -11 4 -14 -1 8 6 10 6 18 0 5 -3 8 -6 10 12 -1 21 -10 21 -22 0 -14 -12 -22 -20 -34 Z M24 34 c-6 6 -10 12 -10 20 0 8 5 14 12 16 -4 -4 -6 -8 -6 -13 0 -9 4 -15 4 -23 Z",
  water:
    "M32 4 C20 22 12 32 12 42 a20 20 0 0 0 40 0 C52 32 44 22 32 4 Z M24 40 a8 14 0 0 0 10 16 a12 12 0 0 1 -10 -16 Z",
  lightning: "M38 2 L14 34 h12 L22 62 L50 26 H36 Z",
};

/** Signature colour per element (filters and guide; cards use rarity ink). */
export const ELEMENT_COLOR: Record<ElementKey, string> = {
  fire: "#ff7a3c",
  water: "#4bb8ff",
  nature: "#4fdc8a",
  lightning: "#ffd45c",
  shadow: "#a97bff",
  light: "#fff2c2",
};

export function ElementIcon({
  element,
  className,
  color,
  glow = true,
}: {
  element: ElementKey;
  className?: string;
  color?: string;
  glow?: boolean;
}) {
  const c = color ?? ELEMENT_COLOR[element];
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={className}
      style={glow ? { filter: `drop-shadow(0 0 6px ${c}88)` } : undefined}
    >
      <path d={ELEMENT_PATH[element]} fill={c} />
    </svg>
  );
}