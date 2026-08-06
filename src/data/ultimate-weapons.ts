import type { Locale } from "@/types/character";
import almighty from "@/assets/weapons/the_almighty_ultimate_weapon.jpg.asset.json";
import zangetsu from "@/assets/weapons/zangetsu_ulltimate_weapon.jpg.asset.json";
import hado90 from "@/assets/weapons/hado_90_ultimate_weapon.jpg.asset.json";
import ichimonji from "@/assets/weapons/ichimonji_ultimate_weapon_card.jpg.asset.json";
import hyorinmaru from "@/assets/weapons/daigren_hyorinmaru_ultimate_weapon.jpg.asset.json";
import enmaKorogi from "@/assets/weapons/enma_krogi_ultimate_weapon.jpg.asset.json";
import kannonBiraki from "@/assets/weapons/kannon_biraki_ultimate_weapon.jpg.asset.json";
import sakanade from "@/assets/weapons/sakanade_ultimate_weapon.jpg.asset.json";
import vAlmighty from "@/assets/weapons/audio/the-almighty.mp3.asset.json";
import vZangetsu from "@/assets/weapons/audio/zangetsu.mp3.asset.json";
import vHado90 from "@/assets/weapons/audio/hado-90.mp3.asset.json";
import vIchimonji from "@/assets/weapons/audio/ichimonji.mp3.asset.json";
import vHyorinmaru from "@/assets/weapons/audio/daiguren-hyorinmaru.mp3.asset.json";
import vEnma from "@/assets/weapons/audio/enma-korogi.mp3.asset.json";
import vKannon from "@/assets/weapons/audio/kannon-biraki.mp3.asset.json";
import vSakanade from "@/assets/weapons/audio/sakanade.mp3.asset.json";

/**
 * Ultimate Weapons are a separate card class from characters. The finished
 * templates are used exactly as delivered — all text is rendered dynamically
 * on top, never baked into the art.
 */
export interface UltimateWeaponDef {
  id: string;
  /** Character slug this weapon belongs to, when it has an owner. */
  owner?: string;
  art: string;
  /** Recorded voice line played during the activation cinematic. */
  voiceUrl?: string;
  cost: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
}

export const ULTIMATE_WEAPONS: UltimateWeaponDef[] = [
  {
    id: "the-almighty",
    owner: "yhwach",
    art: almighty.url,
    voiceUrl: vAlmighty.url,
    cost: 6,
    name: { en: "The Almighty", ar: "القدير" },
    description: { en: "", ar: "" },
  },
  {
    id: "zangetsu",
    owner: "ichigo-kurosaki",
    art: zangetsu.url,
    voiceUrl: vZangetsu.url,
    cost: 5,
    name: { en: "True Zangetsu", ar: "زانغيتسو الحقيقي" },
    description: { en: "", ar: "" },
  },
  {
    id: "hado-90",
    art: hado90.url,
    voiceUrl: vHado90.url,
    cost: 4,
    name: { en: "Hadō #90: Kurohitsugi", ar: "هادو ٩٠: التابوت الأسود" },
    description: { en: "", ar: "" },
  },
  {
    id: "ichimonji",
    owner: "ichibei-hyosube",
    art: ichimonji.url,
    voiceUrl: vIchimonji.url,
    cost: 5,
    name: { en: "Ichimonji", ar: "إيتشيمونجي" },
    description: { en: "", ar: "" },
  },
  {
    id: "daiguren-hyorinmaru",
    owner: "toshiro-hitsugaya",
    art: hyorinmaru.url,
    voiceUrl: vHyorinmaru.url,
    cost: 4,
    name: { en: "Daiguren Hyōrinmaru", ar: "دايغورين هيورينمارو" },
    description: { en: "", ar: "" },
  },
  {
    id: "enma-korogi",
    owner: "shunsui-kyoraku",
    art: enmaKorogi.url,
    voiceUrl: vEnma.url,
    cost: 4,
    name: { en: "Enma Kōrogi", ar: "إنما كوروغي" },
    description: { en: "", ar: "" },
  },
  {
    id: "kannon-biraki",
    owner: "shunsui-kyoraku",
    art: kannonBiraki.url,
    voiceUrl: vKannon.url,
    cost: 5,
    name: { en: "Kannonbiraki Benihime Aratame", ar: "كانون بيراكي بينيهيمي" },
    description: { en: "", ar: "" },
  },
  {
    id: "sakanade",
    owner: "shinji-hirako",
    art: sakanade.url,
    voiceUrl: vSakanade.url,
    cost: 4,
    name: { en: "Sakanade", ar: "ساكانادي" },
    description: { en: "", ar: "" },
  },
];

export function weaponOf(slug: string): UltimateWeaponDef | undefined {
  return ULTIMATE_WEAPONS.find((w) => w.owner === slug);
}
