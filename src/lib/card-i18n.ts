import type { Locale } from "@/types/character";

/**
 * Card-face localisation. Every value printed on a character card has an
 * Arabic counterpart here so an Arabic card never shows Latin text (and
 * vice-versa). Unknown values fall back to the source string.
 */

const FACTION: Record<string, string> = {
  "Allies": "الحلفاء",
  "Gotei 13": "غوتي 13",
  "Allies / Wandenreich": "الحلفاء / فاندنرايش",
  "Espada": "الإسبادا",
  "Wandenreich": "فاندنرايش",
  "Antagonist": "الخصوم",
  "Zero Division": "الفرقة صفر",
  "Beyond the Story": "خارج القصة",
  "Comedic Relief": "الطابع الكوميدي",
  "Royal Palace": "القصر الملكي",
  "Xcution": "إكسكيوشن",
  "Developer": "المطور",
};

const RANK: Record<string, string> = {
  "Substitute": "شينيغامي بديل",
  "Captain": "قائد فرقة",
  "Lieutenant": "نائب قائد",
  "Former Captain": "قائد سابق",
  "Captain-Commander": "القائد الأعلى",
  "Sexta Espada": "الإسبادا السادس",
  "Cuarta Espada": "الإسبادا الرابع",
  "Primera Espada": "الإسبادا الأول",
  "Segunda Espada": "الإسبادا الثاني",
  "Tres Espada": "الإسبادا الثالث",
  "Former Tres Espada": "الإسبادا الثالث سابقاً",
  "Octava Espada": "الإسبادا الثامن",
  "7th Seat": "المقعد السابع",
  "3rd Seat": "المقعد الثالث",
  "5th Seat": "المقعد الخامس",
  "Emperor": "الإمبراطور",
  "Sovereign": "الملك",
  "Leader": "الزعيم",
  "Noble Head": "رأس العائلة النبيلة",
  "Zero Division": "الفرقة صفر",
  "Monk of the Zero Division": "راهب الفرقة صفر",
  "Sword Guardian": "حارس السيف",
  "The Author": "المؤلف",
  "Karakura Superhero": "بطل كاراكورا",
  "Developer": "المطور",
  "Sternritter A": "شترنريتر A",
  "Sternritter B / Grandmaster": "شترنريتر B / الكبير",
  "Sternritter C": "شترنريتر C",
  "Sternritter D": "شترنريتر D",
  "Sternritter E": "شترنريتر E",
  "Sternritter H": "شترنريتر H",
  "Sternritter M": "شترنريتر M",
  "Sternritter X": "شترنريتر X",
};

const ARC: Record<string, string> = {
  "Thousand-Year Blood War": "حرب الدم الألفية",
  "Soul Society": "سوسايتي الأرواح",
  "Arrancar": "الأرانكار",
  "Hueco Mundo": "ويكو موندو",
  "Fake Karakura": "كاراكورا المزيفة",
  "Agent of the Shinigami": "وكيل الشينيغامي",
  "All Arcs": "كل الأقواس",
  "Can't Fear Your Own World": "لا تخف من عالمك",
  "Lost Substitute Shinigami": "الشينيغامي البديل المفقود",
  "Hell Verse": "جحيم الأنشودة",
  "Bount": "الباونت",
  "Behind the Scenes": "خلف الكواليس",
};

const RACE: Record<string, string> = {
  "Human / Substitute Shinigami": "بشري / شينيغامي بديل",
  "Shinigami": "شينيغامي",
  "Quincy": "كوينسي",
  "Arrancar": "أرانكار",
  "Human / Fullbringer": "بشري / فولبرينغر",
  "Shinigami / Hōgyoku": "شينيغامي / هوغيوكو",
  "Shinigami / Visored": "شينيغامي / فايزورد",
  "Shinigami / Royal Guard": "شينيغامي / الحرس الملكي",
  "Modified Soul": "روح معدّلة",
  "Mangaka / Writer": "مانغاكا / كاتب",
  "Human / Shiba": "بشري / شيبا",
  "Human / Spiritualist": "بشري / روحاني",
  "Quincy / Soul King's Left Hand": "كوينسي / يد ملك الأرواح اليسرى",
  "Shinigami / Noble": "شينيغامي / نبيل",
  "Werewolf / Shinigami": "مستذئب / شينيغامي",
  "Soul King": "ملك الأرواح",
  "Shinigami / Reikon Kyuuban": "شينيغامي / رايكون كيوبان",
  "Shinigami / Modified": "شينيغامي / معدّل",
  "Zanpakutō Spirit": "روح زانباكوتو",
  "Developer": "المطور",
};

/** Zanpakutō names are proper nouns — transliterated, never left in Latin. */
const BLADE: Record<string, string> = {
  "Zangetsu": "زانغيتسو", "Tensa Zangetsu": "تينسا زانغيتسو",
  "Sode no Shirayuki": "سودي نو شيرايوكي", "Hakka no Togame": "هاكا نو توغامي",
  "Senbonzakura": "سينبونزاكورا", "Senbonzakura Kageyoshi": "سينبونزاكورا كاغييوشي",
  "Nozarashi": "نوزاراشي", "Unnamed": "بلا اسم",
  "Hyōrinmaru": "هيورينمارو", "Daiguren Hyōrinmaru": "دايغورين هيورينمارو",
  "Zabimaru": "زابيمارو", "Sōō Zabimaru": "سو-أو زابيمارو",
  "Benihime": "بينيهيمي", "Kannonbiraki Benihime Aratame": "كانونبيراكي بينيهيمي أراتامي",
  "Katen Kyōkotsu": "كاتين كيوكوتسو",
  "Katen Kyōkotsu: Karamatsu Shinjū": "كاتين كيوكوتسو: كاراماتسو شينجو",
  "Pantera": "بانتيرا", "Murciélago": "مورسيلاغو",
  "Hisagomaru": "هيساغومارو", "Hōzukimaru": "هوزوكيمارو",
  "Ryūmon Hōzukimaru": "ريومون هوزوكيمارو",
  "Kyōka Suigetsu": "كيوكا سويغيتسو",
  "Ryūjin Jakka": "ريوجين جاكا", "Zanka no Tachi": "زانكا نو تاتشي",
  "Shinsō": "شينسو", "Kamishini no Yari": "كاميشيني نو ياري",
  "Los Lobos": "لوس لوبوس", "Sakanade": "ساكانادي",
  "Sakashima Yokoshima Happōfusagari": "ساكاشيما يوكوشيما هابوفوساغاري",
  "Kazeshini": "كازيشيني", "Sayafushi": "سايافوشي",
  "Ichimonji": "إيتشيمونجي", "Shirafude Ichimonji": "شيرافودي إيتشيمونجي",
  "Ashisogi Jizō": "أشيسوغي جيزو", "Konjiki Ashisogi Jizō": "كونجيكي أشيسوغي جيزو",
  "Haineko": "هاينيكو", "Ruri'iro Kujaku": "روري-إيرو كوجاكو",
  "Pen of Creation": "قلم الخلق", "Final Chapter": "الفصل الأخير",
  "Suzumebachi": "سوزوميباتشي", "Jakuhō Raikōben": "جاكوهو رايكوبين",
  "Arrogante": "أروغانتي", "Nejibana": "نيجيبانا",
  "Tiburón": "تيبورون", "Tenken": "تينكين",
  "Kokujō Tengen Myō'ō": "كوكوجو تينغين ميو-أو",
  "Wabisuke": "وابيسوكي", "Minazuki": "ميناتزوكي",
  "Cross of Scaffold": "صليب المشنقة", "Book of the End": "كتاب النهاية",
  "Gamuza": "غاموزا", "Sōgyo no Kotowari": "سوغيو نو كوتواري",
  "Shinken Hakkyōken": "شينكين هاكيوكين",
  "Suzumushi": "سوزوموشي", "Suzumushi Tsuishiki: Enma Kōrogi": "سوزوموشي تسويشيكي: إنما كوروغي",
  "Fushi no Kōjō": "فوشي نو كوجو", "Fornicarás": "فورنيكاراس",
};

const ORDINAL_AR: Record<string, string> = {
  "1": "الأولى", "2": "الثانية", "3": "الثالثة", "4": "الرابعة", "5": "الخامسة",
  "6": "السادسة", "7": "السابعة", "8": "الثامنة", "9": "التاسعة", "10": "العاشرة",
  "11": "الحادية عشرة", "12": "الثانية عشرة", "13": "الثالثة عشرة",
};

function tr(map: Record<string, string>, v: string, locale: Locale) {
  if (locale === "en") return v;
  return map[v] ?? v;
}

export const localizeFaction = (v: string, l: Locale) => tr(FACTION, v, l);
export const localizeRank = (v: string, l: Locale) => tr(RANK, v, l);
export const localizeArc = (v: string, l: Locale) => tr(ARC, v, l);
export const localizeRace = (v: string, l: Locale) => tr(RACE, v, l);
export const localizeBlade = (v: string, l: Locale) => tr(BLADE, v, l);

export function localizeDivision(v: string, l: Locale) {
  const n = v.replace(/\D/g, "");
  if (l === "en") return /\d(st|nd|rd|th)/.test(v) ? `${v} Division` : v;
  return n ? `الفرقة ${ORDINAL_AR[n] ?? n}` : v;
}

/** Static labels printed on the card frame. */
export const CARD_LABEL = {
  rarity: { en: "Rarity", ar: "الندرة" },
  rating: { en: "Rating", ar: "التقييم" },
  stars: { en: "Stars", ar: "النجوم" },
  element: { en: "Element", ar: "العنصر" },
  affiliation: { en: "Affiliation", ar: "الانتماء" },
  rank: { en: "Rank", ar: "الرتبة" },
  zanpakuto: { en: "Zanpakutō", ar: "الزانباكوتو" },
  arc: { en: "Arc", ar: "القوس" },
  race: { en: "Race", ar: "العِرق" },
} as const;
