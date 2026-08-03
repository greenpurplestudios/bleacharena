/**
 * Per-character art composition.
 * Hand-tuned focal points so each portrait is framed around the face /
 * signature feature instead of a uniform rectangular crop.
 * x/y = object-position (%), z = zoom multiplier.
 */
export type Composition = { x: number; y: number; z: number };

const DEFAULT: Composition = { x: 50, y: 26, z: 1.1 };

const MAP: Record<string, Composition> = {
  "ichigo-kurosaki": { x: 50, y: 22, z: 1.14 },
  "rukia-kuchiki": { x: 50, y: 24, z: 1.12 },
  "byakuya-kuchiki": { x: 50, y: 24, z: 1.08 },
  "kenpachi-zaraki": { x: 48, y: 20, z: 1.16 },
  "toshiro-hitsugaya": { x: 50, y: 22, z: 1.12 },
  "renji-abarai": { x: 50, y: 22, z: 1.14 },
  "uryu-ishida": { x: 50, y: 24, z: 1.1 },
  "yoruichi-shihoin": { x: 50, y: 26, z: 1.12 },
  "kisuke-urahara": { x: 50, y: 28, z: 1.06 },
  "shunsui-kyoraku": { x: 50, y: 26, z: 1.06 },
  "grimmjow-jaegerjaquez": { x: 50, y: 22, z: 1.16 },
  "ulquiorra-cifer": { x: 50, y: 24, z: 1.12 },
  "hanataro-yamada": { x: 50, y: 26, z: 1.08 },
  "ikkaku-madarame": { x: 50, y: 24, z: 1.12 },
  "orihime-inoue": { x: 50, y: 26, z: 1.1 },
  "chad-yasutora": { x: 50, y: 24, z: 1.1 },
  yhwach: { x: 50, y: 22, z: 1.08 },
  "aizen-sosuke": { x: 50, y: 22, z: 1.1 },
  "genryusai-yamamoto": { x: 50, y: 24, z: 1.06 },
  "gin-ichimaru": { x: 50, y: 24, z: 1.12 },
  "coyote-starrk": { x: 50, y: 24, z: 1.1 },
  "shinji-hirako": { x: 50, y: 24, z: 1.12 },
  "lille-barro": { x: 50, y: 22, z: 1.1 },
  "askin-nakk-le-vaar": { x: 50, y: 24, z: 1.1 },
  "jugram-haschwalth": { x: 50, y: 22, z: 1.1 },
  "shuhei-hisagi": { x: 50, y: 24, z: 1.12 },
  "oetsu-nimaiya": { x: 50, y: 24, z: 1.08 },
  "ichibei-hyosube": { x: 50, y: 26, z: 1.04 },
  kon: { x: 50, y: 34, z: 1.02 },
  "mayuri-kurotsuchi": { x: 50, y: 24, z: 1.08 },
  "rangiku-matsumoto": { x: 50, y: 24, z: 1.1 },
  "yumichika-ayasegawa": { x: 50, y: 24, z: 1.12 },
  "tite-kubo": { x: 50, y: 28, z: 1.04 },
  "ganju-shiba": { x: 50, y: 26, z: 1.08 },
  "don-kanonji": { x: 50, y: 26, z: 1.06 },
  "senjumaru-shutara": { x: 50, y: 26, z: 1.04 },
  "soi-fon": { x: 50, y: 24, z: 1.12 },
  "baraggan-louisenbairn": { x: 50, y: 26, z: 1.04 },
  "gerard-valkyrie": { x: 50, y: 22, z: 1.02 },
  "pernida-parnkgjas": { x: 50, y: 30, z: 1.0 },
  "tokinada-tsunayashiro": { x: 50, y: 24, z: 1.08 },
  "tier-harribel": { x: 50, y: 24, z: 1.1 },
  "sajin-komamura": { x: 50, y: 22, z: 1.04 },
  "izuru-kira": { x: 50, y: 24, z: 1.12 },
  "soul-king": { x: 50, y: 26, z: 1.0 },
  "retsu-unohana": { x: 50, y: 24, z: 1.08 },
  "kugo-ginjo": { x: 50, y: 24, z: 1.1 },
  "shukuro-tsukishima": { x: 50, y: 24, z: 1.1 },
  "kirio-hikifune": { x: 50, y: 26, z: 1.04 },
  "tenjiro-kirinji": { x: 50, y: 24, z: 1.08 },
  "aura-michibane": { x: 50, y: 24, z: 1.06 },
  "nelliel-tu-odelschwanck": { x: 50, y: 24, z: 1.1 },
  "jushiro-ukitake": { x: 50, y: 24, z: 1.08 },
  "nanao-ise": { x: 50, y: 24, z: 1.1 },
  "azashiro-soya": { x: 50, y: 24, z: 1.08 },
  "nemu-kurotsuchi": { x: 50, y: 24, z: 1.1 },
  "bambietta-basterbine": { x: 50, y: 24, z: 1.1 },
  "bazz-b": { x: 50, y: 22, z: 1.12 },
  ikomikidomoe: { x: 50, y: 30, z: 1.0 },
  "kaname-tosen": { x: 50, y: 24, z: 1.1 },
  "szayelaporro-granz": { x: 50, y: 24, z: 1.1 },
  qais: { x: 50, y: 28, z: 1.06 },
};

export function getComposition(slug?: string): Composition {
  return (slug && MAP[slug]) || DEFAULT;
}
