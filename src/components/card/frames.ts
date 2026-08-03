import type { Rarity } from "@/types/character";
import cF from "@/assets/cards/common_front.png.asset.json";
import cB from "@/assets/cards/common_back.png.asset.json";
import uF from "@/assets/cards/uncommon_front.png.asset.json";
import uB from "@/assets/cards/uncommon_back.png.asset.json";
import rF from "@/assets/cards/rare_front.png.asset.json";
import rB from "@/assets/cards/rare_back.png.asset.json";
import eF from "@/assets/cards/epic_front.png.asset.json";
import eB from "@/assets/cards/epic_back.png.asset.json";
import lF from "@/assets/cards/legendary_front.png.asset.json";
import lB from "@/assets/cards/legendary_back.png.asset.json";
import mF from "@/assets/cards/mythic_front.png.asset.json";
import mB from "@/assets/cards/mythic_back.png.asset.json";

export const CARD_FRONT: Record<Rarity, string> = {
  common: cF.url, uncommon: uF.url, rare: rF.url,
  epic: eF.url, legendary: lF.url, mythic: mF.url,
};

export const CARD_BACK: Record<Rarity, string> = {
  common: cB.url, uncommon: uB.url, rare: rB.url,
  epic: eB.url, legendary: lB.url, mythic: mB.url,
};

export const RARITY_STARS: Record<Rarity, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6,
};
