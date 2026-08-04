// Warms the browser cache for every card template and card back so the first
// flip never shows a blank face or shifts layout.
import { CARD_BACK } from "@/lib/card-backs";
import commonTpl from "@/assets/cards/common.jpeg.asset.json";
import uncommonTpl from "@/assets/cards/uncommon.jpeg.asset.json";
import rareTpl from "@/assets/cards/rare.jpeg.asset.json";
import epicTpl from "@/assets/cards/epic.jpeg.asset.json";
import legendaryTpl from "@/assets/cards/legendary.jpeg.asset.json";
import mythicTpl from "@/assets/cards/mythic.jpeg.asset.json";
import type { Rarity } from "@/types/character";

export const CARD_TEMPLATE: Record<Rarity, string> = {
  common: commonTpl.url,
  uncommon: uncommonTpl.url,
  rare: rareTpl.url,
  epic: epicTpl.url,
  legendary: legendaryTpl.url,
  mythic: mythicTpl.url,
};

let done = false;

/** Idle-time preload of all 12 card surfaces. Safe to call many times. */
export function preloadCardArt() {
  if (done || typeof window === "undefined") return;
  done = true;
  const urls = [...Object.values(CARD_TEMPLATE), ...Object.values(CARD_BACK)];
  const run = () => urls.forEach((u) => { const i = new Image(); i.decoding = "async"; i.src = u; });
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
  if (ric) ric(run); else window.setTimeout(run, 400);
}
