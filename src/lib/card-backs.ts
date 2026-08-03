import type { Rarity } from "@/types/character";
import commonBack from "@/assets/cardbacks/common.jpeg.asset.json";
import uncommonBack from "@/assets/cardbacks/uncommon.jpeg.asset.json";
import rareBack from "@/assets/cardbacks/rare.jpeg.asset.json";
import epicBack from "@/assets/cardbacks/epic.jpeg.asset.json";
import legendaryBack from "@/assets/cardbacks/legendary.jpeg.asset.json";
import mythicBack from "@/assets/cardbacks/mythic.jpeg.asset.json";

/** Official card back per rarity. */
export const CARD_BACK: Record<Rarity, string> = {
  common: commonBack.url,
  uncommon: uncommonBack.url,
  rare: rareBack.url,
  epic: epicBack.url,
  legendary: legendaryBack.url,
  mythic: mythicBack.url,
};