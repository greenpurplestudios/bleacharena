export type ElementKey = "light" | "shadow" | "nature" | "fire" | "water" | "lightning";

export const ELEMENT_LABEL: Record<ElementKey, { en: string; ar: string }> = {
  light: { en: "Light", ar: "نور" },
  shadow: { en: "Shadow", ar: "ظل" },
  nature: { en: "Nature", ar: "طبيعة" },
  fire: { en: "Fire", ar: "نار" },
  water: { en: "Water", ar: "ماء" },
  lightning: { en: "Lightning", ar: "برق" },
};

const BY_ELEMENT: Record<ElementKey, string[]> = {
  light: [
    "soul-king", "tite-kubo", "orihime-inoue", "lille-barro", "jugram-haschwalth",
    "ichibei-hyosube", "senjumaru-shutara", "kirio-hikifune", "tenjiro-kirinji",
    "jushiro-ukitake", "oetsu-nimaiya", "masaki-kurosaki",
  ],
  shadow: [
    "yhwach", "aizen-sosuke", "mayuri-kurotsuchi", "baraggan-louisenbairn",
    "szayelaporro-granz", "tokinada-tsunayashiro", "askin-nakk-le-vaar",
    "pernida-parnkgjas", "kugo-ginjo", "don-kanonji", "shunsui-kyoraku",
    "as-nodt", "gremmy-thoumeaux",
  ],
  fire: [
    "genryusai-yamamoto", "bazz-b", "renji-abarai", "ikkaku-madarame",
    "ganju-shiba", "kenpachi-zaraki", "isshin-kurosaki",
  ],
  water: [
    "ichigo-kurosaki", "rukia-kuchiki", "toshiro-hitsugaya", "grimmjow-jaegerjaquez",
    "nelliel-tu-odelschwanck", "coyote-starrk", "hanataro-yamada", "zangetsu",
  ],
  lightning: [
    "kisuke-urahara", "yoruichi-shihoin", "soi-fon", "gin-ichimaru", "uryu-ishida",
    "shuhei-hisagi", "izuru-kira", "rangiku-matsumoto", "yumichika-ayasegawa", "kon",
  ],
  nature: [
    "byakuya-kuchiki", "retsu-unohana", "gerard-valkyrie", "aura-michibane",
    "azashiro-soya", "ikomikidomoe", "ulquiorra-cifer", "tier-harribel",
    "shinji-hirako", "sajin-komamura", "nemu-kurotsuchi", "bambietta-basterbine",
    "kaname-tosen", "shukuro-tsukishima", "nanao-ise", "chad-yasutora", "qais",
  ],
};

const SLUG_TO_ELEMENT: Record<string, ElementKey> = Object.fromEntries(
  (Object.entries(BY_ELEMENT) as [ElementKey, string[]][]).flatMap(([el, slugs]) =>
    slugs.map((s) => [s, el] as const),
  ),
) as Record<string, ElementKey>;

export function elementOf(slug: string): ElementKey {
  return SLUG_TO_ELEMENT[slug] ?? "nature";
}
