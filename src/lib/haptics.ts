// Mobile haptics. Everything is gated behind the user's preference and
// silently no-ops on devices without the Vibration API (iOS Safari).
import { loadPrefs } from "@/lib/sound";
import type { Rarity } from "@/types/character";

export type HapticKind =
  | "tap"
  | "press"
  | "flip"
  | "draft"
  | "pack"
  | "reward"
  | "error";

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  press: 14,
  flip: [10, 40, 22],
  draft: [18, 50, 30],
  pack: [12, 30, 12, 30, 40],
  reward: [20, 40, 20, 40, 60],
  error: [40, 60, 40],
};

const RARITY_PATTERN: Record<Rarity, number | number[]> = {
  common: 10,
  uncommon: [10, 40, 14],
  rare: [14, 40, 20],
  epic: [16, 40, 24, 40, 24],
  legendary: [20, 40, 28, 40, 36, 50, 44],
  mythic: [26, 40, 34, 40, 42, 50, 60, 60, 90],
};

function fire(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (loadPrefs().haptics === false) return;
  try { navigator.vibrate(pattern); } catch { /* ignore */ }
}

export function haptic(kind: HapticKind) {
  fire(PATTERNS[kind]);
}

export function hapticRarity(rarity: Rarity) {
  fire(RARITY_PATTERN[rarity]);
}
