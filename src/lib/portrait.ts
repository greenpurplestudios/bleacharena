/** Per-character portrait framing inside the card art window.
 *  x/y are object-position percentages, scale zooms the artwork. */
export interface PortraitFraming {
  x: number;
  y: number;
  scale: number;
}

const DEFAULT: PortraitFraming = { x: 50, y: 26, scale: 1.06 };

const MAP: Record<string, Partial<PortraitFraming>> = {
  "isshin-kurosaki": { x: 56, y: 14, scale: 1.18 },
  "masaki-kurosaki": { x: 60, y: 32, scale: 1.3 },
  zangetsu: { x: 50, y: 34, scale: 1.02 },
  "as-nodt": { x: 46, y: 10, scale: 1.25 },
  "gremmy-thoumeaux": { x: 22, y: 26, scale: 1.35 },
  "ichigo-kurosaki": { y: 22, scale: 1.1 },
  "rukia-kuchiki": { y: 20 },
  "byakuya-kuchiki": { y: 22 },
  "kenpachi-zaraki": { y: 20, scale: 1.12 },
  "toshiro-hitsugaya": { y: 20 },
  "renji-abarai": { y: 22 },
  "uryu-ishida": { y: 20 },
  "yoruichi-shihoin": { y: 24 },
  "kisuke-urahara": { y: 20, scale: 1.04 },
  "shunsui-kyoraku": { y: 22 },
  "grimmjow-jaegerjaquez": { y: 22, scale: 1.08 },
  "ulquiorra-cifer": { y: 20 },
  "hanataro-yamada": { y: 24 },
  "ikkaku-madarame": { y: 22 },
  "orihime-inoue": { y: 22 },
  "chad-yasutora": { y: 24 },
  yhwach: { y: 20, scale: 1.05 },
  "aizen-sosuke": { y: 20 },
  "genryusai-yamamoto": { y: 22, scale: 1.05 },
  "gin-ichimaru": { y: 20 },
  "coyote-starrk": { y: 22 },
  "shinji-hirako": { y: 20 },
  "lille-barro": { y: 22 },
  "askin-nakk-le-vaar": { y: 22 },
  "jugram-haschwalth": { y: 20 },
  "shuhei-hisagi": { y: 22 },
  "oetsu-nimaiya": { y: 22 },
  "ichibei-hyosube": { y: 24, scale: 1.02 },
  kon: { y: 34, scale: 1.0 },
  "mayuri-kurotsuchi": { y: 22 },
  "rangiku-matsumoto": { y: 22 },
  "yumichika-ayasegawa": { y: 20 },
  "tite-kubo": { y: 28, scale: 1.0 },
  "ganju-shiba": { y: 24 },
  "don-kanonji": { y: 26 },
  "senjumaru-shutara": { y: 24 },
  "soi-fon": { y: 20 },
  "baraggan-louisenbairn": { y: 26, scale: 1.04 },
  "gerard-valkyrie": { y: 24, scale: 1.02 },
  "pernida-parnkgjas": { y: 30, scale: 1.0 },
  "tokinada-tsunayashiro": { y: 22 },
  "tier-harribel": { y: 24 },
  "sajin-komamura": { y: 24, scale: 1.04 },
  "izuru-kira": { y: 20 },
  "soul-king": { y: 26, scale: 1.02 },
  "retsu-unohana": { y: 22 },
  "kugo-ginjo": { y: 22 },
  "shukuro-tsukishima": { y: 20 },
  "kirio-hikifune": { y: 24 },
  "tenjiro-kirinji": { y: 22 },
  "aura-michibane": { y: 24 },
  "nelliel-tu-odelschwanck": { y: 22 },
  "jushiro-ukitake": { y: 22 },
  "nanao-ise": { y: 22 },
  "azashiro-soya": { y: 22 },
  "nemu-kurotsuchi": { y: 22 },
  "bambietta-basterbine": { y: 22 },
  "bazz-b": { y: 22 },
  ikomikidomoe: { y: 30, scale: 1.0 },
  "kaname-tosen": { y: 22 },
  "szayelaporro-granz": { y: 22 },
  qais: { y: 26, scale: 1.0 },
};

export function framingOf(slug: string): PortraitFraming {
  return { ...DEFAULT, ...(MAP[slug] ?? {}) };
}
