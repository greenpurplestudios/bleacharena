/**
 * Soul Links puzzle bank. Each puzzle is 4 canon groups of exactly 4
 * characters, ordered easiest (0) to hardest (3). Slugs must exist in
 * `src/data/characters.ts` — `validatePuzzles()` in `src/lib/soul-links.ts`
 * drops any group referencing an unknown slug so the mode can never crash.
 */
export interface LinkGroup {
  id: string;
  label: { en: string; ar: string };
  slugs: string[];
}

export interface LinkPuzzle {
  id: string;
  /** Easiest first — index doubles as the difficulty colour. */
  groups: [LinkGroup, LinkGroup, LinkGroup, LinkGroup];
}

const g = (id: string, en: string, ar: string, slugs: string[]): LinkGroup => ({
  id,
  label: { en, ar },
  slugs,
});

export const SOUL_LINK_PUZZLES: LinkPuzzle[] = [
  {
    id: "sl-01",
    groups: [
      g("kurosaki", "The Kurosaki household", "بيت كوروساكي", ["ichigo-kurosaki", "isshin-kurosaki", "masaki-kurosaki", "kon"]),
      g("espada-a", "Espada", "الإسبادا", ["grimmjow-jaegerjaquez", "ulquiorra-cifer", "coyote-starrk", "tier-harribel"]),
      g("zero-a", "Royal Guard (Squad Zero)", "الحرس الملكي (الفرقة صفر)", ["oetsu-nimaiya", "ichibei-hyosube", "senjumaru-shutara", "tenjiro-kirinji"]),
      g("lieut-a", "Lieutenants of the Gotei 13", "ملازمو الغوتي ١٣", ["renji-abarai", "rangiku-matsumoto", "izuru-kira", "shuhei-hisagi"]),
    ],
  },
  {
    id: "sl-02",
    groups: [
      g("stern-a", "Sternritter", "الشترنريتر", ["askin-nakk-le-vaar", "lille-barro", "jugram-haschwalth", "bambietta-basterbine"]),
      g("xcution", "Fullbringers of Xcution", "أعضاء إكسكيوشن", ["kugo-ginjo", "shukuro-tsukishima", "riruka-dokugamine", "yukio-vorarlberna"]),
      g("captains-a", "Captains of the Gotei 13", "قادة الغوتي ١٣", ["byakuya-kuchiki", "toshiro-hitsugaya", "soi-fon", "sajin-komamura"]),
      g("traitors-a", "Turned against Soul Society", "انقلبوا على السوسايتي", ["aizen-sosuke", "gin-ichimaru", "kaname-tosen", "azashiro-soya"]),
    ],
  },
  {
    id: "sl-03",
    groups: [
      g("karakura", "Karakura classmates", "زملاء كاراكورا", ["ichigo-kurosaki", "orihime-inoue", "chad-yasutora", "uryu-ishida"]),
      g("science", "Researchers and inventors", "علماء ومخترعون", ["mayuri-kurotsuchi", "nemu-kurotsuchi", "szayelaporro-granz", "kisuke-urahara"]),
      g("soulking", "The Soul King and his pieces", "ملك الأرواح وأجزاؤه", ["soul-king", "yhwach", "pernida-parnkgjas", "gerard-valkyrie"]),
      g("healers", "Healers", "المعالجون", ["hanataro-yamada", "retsu-unohana", "kirio-hikifune", "tenjiro-kirinji"]),
    ],
  },
  {
    id: "sl-04",
    groups: [
      g("noble", "Born into noble houses", "من العائلات النبيلة", ["byakuya-kuchiki", "ganju-shiba", "tokinada-tsunayashiro", "nanao-ise"]),
      g("bloodlust", "Live for the fight", "يعيشون للقتال", ["kenpachi-zaraki", "ikkaku-madarame", "yumichika-ayasegawa", "nnoitra-gilga"]),
      g("quincy-a", "Quincy", "الكوينسي", ["uryu-ishida", "bazz-b", "as-nodt", "masaki-kurosaki"]),
      g("hueco-a", "Arrancar of Hueco Mundo", "أراكار هويكو موندو", ["nelliel-tu-odelschwanck", "baraggan-louisenbairn", "szayelaporro-granz", "grimmjow-jaegerjaquez"]),
    ],
  },
  {
    id: "sl-05",
    groups: [
      g("exiled", "Left the Gotei 13 behind", "غادروا الغوتي ١٣", ["shinji-hirako", "isshin-kurosaki", "kisuke-urahara", "yoruichi-shihoin"]),
      g("oddities", "Not exactly Shinigami", "ليسوا شينيغامي تماماً", ["zangetsu", "kon", "ikomikidomoe", "qais"]),
      g("stern-b", "Sternritter", "الشترنريتر", ["gremmy-thoumeaux", "jugram-haschwalth", "bambietta-basterbine", "askin-nakk-le-vaar"]),
      g("espada-b", "Top-ranked Espada", "أعلى رتب الإسبادا", ["coyote-starrk", "baraggan-louisenbairn", "tier-harribel", "ulquiorra-cifer"]),
    ],
  },
  {
    id: "sl-06",
    groups: [
      g("women", "Women of the Gotei 13", "نساء الغوتي ١٣", ["soi-fon", "retsu-unohana", "rangiku-matsumoto", "nemu-kurotsuchi"]),
      g("hueco-invade", "Invaded Hueco Mundo", "غزوا هويكو موندو", ["chad-yasutora", "uryu-ishida", "renji-abarai", "rukia-kuchiki"]),
      g("zero-b", "Royal Guard (Squad Zero)", "الحرس الملكي (الفرقة صفر)", ["ichibei-hyosube", "senjumaru-shutara", "kirio-hikifune", "oetsu-nimaiya"]),
      g("wanden", "Wandenreich elite", "نخبة الفاندنرايش", ["yhwach", "jugram-haschwalth", "lille-barro", "pernida-parnkgjas"]),
    ],
  },
  {
    id: "sl-07",
    groups: [
      g("vs-ichigo", "Fought Ichigo one on one", "قاتلوا إيتشيغو وجهاً لوجه", ["grimmjow-jaegerjaquez", "ulquiorra-cifer", "byakuya-kuchiki", "kenpachi-zaraki"]),
      g("ryoka", "The Ryoka invasion", "غزو الريوكا", ["orihime-inoue", "chad-yasutora", "uryu-ishida", "ganju-shiba"]),
      g("espada-c", "Espada", "الإسبادا", ["nnoitra-gilga", "szayelaporro-granz", "baraggan-louisenbairn", "nelliel-tu-odelschwanck"]),
      g("squad1", "Squad One and its legacy", "الفرقة الأولى وإرثها", ["genryusai-yamamoto", "shunsui-kyoraku", "jushiro-ukitake", "nanao-ise"]),
    ],
  },
  {
    id: "sl-08",
    groups: [
      g("exiled-b", "Exiles of Soul Society", "منفيو السوسايتي", ["shinji-hirako", "yoruichi-shihoin", "kisuke-urahara", "isshin-kurosaki"]),
      g("stern-c", "Sternritter", "الشترنريتر", ["as-nodt", "gremmy-thoumeaux", "bazz-b", "bambietta-basterbine"]),
      g("lieut-b", "Lieutenants of the Gotei 13", "ملازمو الغوتي ١٣", ["izuru-kira", "shuhei-hisagi", "rangiku-matsumoto", "renji-abarai"]),
      g("nonfighters", "Never meant to be fighters", "ليسوا مقاتلين أصلاً", ["tite-kubo", "qais", "don-kanonji", "kon"]),
    ],
  },
  {
    id: "sl-09",
    groups: [
      g("quincy-b", "Quincy blood", "دم الكوينسي", ["uryu-ishida", "masaki-kurosaki", "yhwach", "bazz-b"]),
      g("captains-b", "Captains in the Blood War", "قادة حرب الدم", ["sajin-komamura", "soi-fon", "mayuri-kurotsuchi", "kenpachi-zaraki"]),
      g("hueco-b", "Rulers of Hueco Mundo", "حكام هويكو موندو", ["tier-harribel", "nelliel-tu-odelschwanck", "grimmjow-jaegerjaquez", "coyote-starrk"]),
      g("zero-c", "Royal Guard (Squad Zero)", "الحرس الملكي (الفرقة صفر)", ["tenjiro-kirinji", "kirio-hikifune", "senjumaru-shutara", "oetsu-nimaiya"]),
    ],
  },
  {
    id: "sl-10",
    groups: [
      g("beyond", "Beyond the Gotei 13", "خارج الغوتي ١٣", ["zangetsu", "tite-kubo", "ikomikidomoe", "soul-king"]),
      g("support", "Healing and kidō", "الشفاء والكيدو", ["orihime-inoue", "hanataro-yamada", "retsu-unohana", "nanao-ise"]),
      g("traitors-b", "Betrayed their own", "خانوا أهلهم", ["aizen-sosuke", "gin-ichimaru", "kaname-tosen", "tokinada-tsunayashiro"]),
      g("xcution-b", "Xcution", "إكسكيوشن", ["kugo-ginjo", "shukuro-tsukishima", "riruka-dokugamine", "yukio-vorarlberna"]),
    ],
  },
];
