import type { BattlefieldDef } from "@/lib/soul-duel/types";
import soulSociety from "@/assets/battlefields/soul_society.jpg.asset.json";
import huecoMundo from "@/assets/battlefields/hueco_mundo.jpg.asset.json";
import hell from "@/assets/battlefields/hell.jpg.asset.json";
import prison from "@/assets/battlefields/prison.jpg.asset.json";
import soulKingPalace from "@/assets/battlefields/soul_king_palace.jpg.asset.json";
import karakura from "@/assets/battlefields/karakura_town.jpg.asset.json";
import dangai from "@/assets/battlefields/dangai.jpg.asset.json";
import wandenreich from "@/assets/battlefields/wandenriech.jpg.asset.json";
import back from "@/assets/battlefields/back.jpg.asset.json";

/** The single shared face-down art for every battlefield. */
export const BATTLEFIELD_BACK = back.url;

/**
 * Battlefields are pure data. Adding a new one never requires touching the
 * engine — declare its art, copy and rule flags here and it enters rotation.
 */
export const BATTLEFIELDS: BattlefieldDef[] = [
  {
    id: "soul-society",
    art: soulSociety.url,
    accent: "#5aa9ff",
    name: { en: "Soul Society", ar: "سوسايتي الأرواح" },
    ability: { en: "The Pride of the Gotei", ar: "كبرياء الغوتي" },
    description: {
      en: "The first card played here gains +15 Rating. Shinigami gain +5 Rating.",
      ar: "أول بطاقة تُلعب هنا تكسب +15 تقييم. الشينيغامي يكسبون +5 تقييم.",
    },
    rules: { firstCardBonus: 15, factionBuff: { races: ["Shinigami", "Visored"], amount: 5 } },
  },
  {
    id: "hueco-mundo",
    art: huecoMundo.url,
    accent: "#9fd0ff",
    name: { en: "Hueco Mundo", ar: "ويكو موندو" },
    ability: { en: "Endless Night", ar: "الليل الأبدي" },
    description: {
      en: "Cards played here stay hidden from the opponent until Round 4. Hollows and Arrancar gain +5 Rating.",
      ar: "البطاقات الملعوبة هنا تبقى مخفية عن الخصم حتى الجولة ٤. الهولو والأرانكار يكسبون +5 تقييم.",
    },
    rules: { hiddenUntilRound: 4, factionBuff: { races: ["Hollow", "Arrancar"], amount: 5 } },
  },
  {
    id: "hell",
    art: hell.url,
    accent: "#c05bff",
    name: { en: "Hell", ar: "الجحيم" },
    ability: { en: "Hell's Door", ar: "باب الجحيم" },
    description: {
      en: "Each round there is a 50% chance this battlefield closes forever. All cards here receive -5 Rating.",
      ar: "في كل جولة هناك احتمال ٥٠٪ أن تُغلق هذه الساحة للأبد. كل البطاقات هنا تفقد 5 من التقييم.",
    },
    rules: { closeChance: 0.5, globalRating: -5 },
  },
  {
    id: "prison",
    art: prison.url,
    accent: "#a07bd8",
    name: { en: "Prison", ar: "السجن" },
    ability: { en: "Seal of the Judge", ar: "ختم القاضي" },
    description: {
      en: "Character abilities are disabled here. At Round 6 one random character of each player is imprisoned and its Rating becomes 0.",
      ar: "قدرات الشخصيات معطلة هنا. في الجولة ٦ تُسجن شخصية عشوائية لكل لاعب ويصبح تقييمها 0.",
    },
    rules: { disableAbilities: true, imprisonAtFinalRound: true },
  },
  {
    id: "soul-king-palace",
    art: soulKingPalace.url,
    accent: "#7fc4ff",
    name: { en: "Soul King Palace", ar: "قصر ملك الأرواح" },
    ability: { en: "Soul King's Blessing", ar: "بركة ملك الأرواح" },
    description: {
      en: "Every character activates its ability twice. All cards here gain +5 Rating.",
      ar: "كل شخصية تُفعّل قدرتها مرتين. كل البطاقات هنا تكسب +5 تقييم.",
    },
    rules: { doubleAbilities: true, globalRating: 5 },
  },
  {
    id: "karakura-town",
    art: karakura.url,
    accent: "#6fd6ff",
    name: { en: "Karakura Town", ar: "مدينة كاراكورا" },
    ability: { en: "Natural Battlefield", ar: "ساحة طبيعية" },
    description: {
      en: "An ordinary town under an ordinary sky. No special effects.",
      ar: "مدينة عادية تحت سماء عادية. لا توجد تأثيرات خاصة.",
    },
    rules: {},
  },
  {
    id: "dangai",
    art: dangai.url,
    accent: "#b98cff",
    name: { en: "Dangai", ar: "الدانغاي" },
    ability: { en: "Warped Time & Space", ar: "زمان ومكان ملتويان" },
    description: {
      en: "Cards played here have a 75% chance to slip into another battlefield with space. Fullbringers gain +5 Rating.",
      ar: "البطاقات الملعوبة هنا لديها احتمال ٧٥٪ للانتقال إلى ساحة أخرى بها مساحة. أصحاب الفولبرينغ يكسبون +5 تقييم.",
    },
    rules: { driftChance: 0.75, factionBuff: { races: ["Fullbringer", "Human"], amount: 5 } },
  },
  {
    id: "wandenreich",
    art: wandenreich.url,
    accent: "#e6d5a8",
    name: { en: "Wandenreich", ar: "فاندنرايش" },
    ability: { en: "Bankai Steal", ar: "سرقة البانكاي" },
    description: {
      en: "If both players play here in the same round, those cards are swapped. Quincy gain +5 Rating.",
      ar: "إذا لعب اللاعبان هنا في نفس الجولة، تُبدَّل تلك البطاقتان. الكوينسي يكسبون +5 تقييم.",
    },
    rules: { swapOnContest: true, factionBuff: { races: ["Quincy"], amount: 5 } },
  },
];

export function battlefieldById(id: string): BattlefieldDef | undefined {
  return BATTLEFIELDS.find((b) => b.id === id);
}
