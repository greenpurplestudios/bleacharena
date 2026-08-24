/**
 * Urahara's cosmetic catalog — single source of truth for both the store rows
 * (generated into SQL) and the front-end renderers.
 *
 * Everything here is purely cosmetic: no gameplay effect whatsoever.
 */

export type CosmeticKind =
  | "username_color"
  | "name_effect"
  | "name_frame"
  | "frame"
  | "profile_badge"
  | "leaderboard_style";

export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface CatalogEntry {
  id: string;
  kind: CosmeticKind;
  en: string;
  ar: string;
  cost: number;
  rarity: Rarity;
  meta: Record<string, unknown>;
  sort: number;
}

const catalog: CatalogEntry[] = [];
const push = (e: CatalogEntry) => {
  catalog.push(e);
  return e;
};

/* ------------------------------------------------------------------ */
/* Name colors — 12 · 300–1,500 Souls                                  */
/* ------------------------------------------------------------------ */

export interface ColorDef {
  id: string;
  en: string;
  ar: string;
  hex: string;
  cost: number;
  rarity: Rarity;
}

export const NAME_COLORS: ColorDef[] = [
  { id: "color_shihakusho_ink", en: "Shihakushō Ink", ar: "حبر الشيهاكوشو", hex: "#9aa3b2", cost: 300, rarity: "common" },
  { id: "color_seireitei_white", en: "Seireitei White", ar: "أبيض السيريتي", hex: "#f2f5fa", cost: 300, rarity: "common" },
  { id: "color_getsuga_black", en: "Getsuga Black", ar: "أسود الغيتسوغا", hex: "#6b7280", cost: 450, rarity: "common" },
  { id: "color_hollow_bone", en: "Hollow Bone", ar: "عظم الهولو", hex: "#e8e2d4", cost: 600, rarity: "rare" },
  { id: "color_hueco_sand", en: "Hueco Sand", ar: "رمال هويكو", hex: "#d9c58c", cost: 750, rarity: "rare" },
  { id: "color_espada_teal", en: "Espada Teal", ar: "أزرق الإسبادا", hex: "#2dd4bf", cost: 900, rarity: "rare" },
  { id: "color_quincy_blau", en: "Quincy Blau", ar: "أزرق الكوينسي", hex: "#60a5fa", cost: 1050, rarity: "epic" },
  { id: "color_reiatsu_cyan", en: "Reiatsu Cyan", ar: "سماوي الريتسو", hex: "#22d3ee", cost: 1050, rarity: "epic" },
  { id: "color_senbonzakura_pink", en: "Senbonzakura Pink", ar: "وردي سينبونزاكورا", hex: "#f472b6", cost: 1200, rarity: "epic" },
  { id: "color_ryujin_ember", en: "Ryūjin Ember", ar: "جمر ريوجين", hex: "#fb923c", cost: 1350, rarity: "epic" },
  { id: "color_dangai_violet", en: "Dangai Violet", ar: "بنفسجي الدانغاي", hex: "#a78bfa", cost: 1500, rarity: "legendary" },
  { id: "color_royal_gold", en: "Royal Guard Gold", ar: "ذهب الحرس الملكي", hex: "#fbbf24", cost: 1500, rarity: "legendary" },
];

NAME_COLORS.forEach((c, i) =>
  push({
    id: c.id, kind: "username_color", en: c.en, ar: c.ar, cost: c.cost, rarity: c.rarity,
    meta: { hex: c.hex, rarity: c.rarity }, sort: 200 + i,
  }),
);

/* ------------------------------------------------------------------ */
/* Name effects — 12 standard + 5 premium animated                     */
/* ------------------------------------------------------------------ */

export interface NameEffectStyle {
  className: string;
  style: React.CSSProperties;
  animated: boolean;
  label: { en: string; ar: string };
}

interface EffectDef extends ColorDef {
  fx: string;
  animated: boolean;
}

const EFFECT_DEFS: EffectDef[] = [
  { id: "fx_reiatsu_glow", en: "Reiatsu Glow", ar: "توهج الريتسو", hex: "#38bdf8", cost: 1500, rarity: "rare", fx: "ce-glow", animated: false },
  { id: "fx_hollow_glow", en: "Hollow Glow", ar: "توهج الهولو", hex: "#ef4444", cost: 1650, rarity: "rare", fx: "ce-glow", animated: false },
  { id: "fx_zanpakuto_edge", en: "Zanpakutō Edge", ar: "حد الزانباكوتو", hex: "#e5e7eb", cost: 1800, rarity: "rare", fx: "ce-outline", animated: false },
  { id: "fx_gotei_steel", en: "Gotei Steel", ar: "فولاذ الغوتي", hex: "#94a3b8", cost: 2100, rarity: "rare", fx: "ce-outline", animated: false },
  { id: "fx_quincy_spark", en: "Quincy Spark", ar: "شرارة الكوينسي", hex: "#7dd3fc", cost: 2400, rarity: "epic", fx: "ce-shimmer", animated: true },
  { id: "fx_arrancar_frost", en: "Arrancar Frost", ar: "صقيع الأرانكار", hex: "#a5f3fc", cost: 2700, rarity: "epic", fx: "ce-frost", animated: true },
  { id: "fx_ember_drift", en: "Ember Drift", ar: "انجراف الجمر", hex: "#fb923c", cost: 3000, rarity: "epic", fx: "ce-ember", animated: true },
  { id: "fx_hueco_haze", en: "Hueco Haze", ar: "ضباب هويكو", hex: "#c4b5fd", cost: 3300, rarity: "epic", fx: "ce-haze", animated: true },
  { id: "fx_bankai_pulse", en: "Bankai Pulse", ar: "نبض البانكاي", hex: "#f97316", cost: 3600, rarity: "legendary", fx: "ce-pulse", animated: true },
  { id: "fx_sternritter_flicker", en: "Sternritter Flicker", ar: "وميض الشتيرنريتر", hex: "#dbeafe", cost: 3900, rarity: "legendary", fx: "ce-flicker", animated: true },
  { id: "fx_dangai_gradient", en: "Dangai Gradient", ar: "تدرّج الدانغاي", hex: "#a78bfa", cost: 4200, rarity: "legendary", fx: "ce-gradient", animated: true },
  { id: "fx_soul_king_aura", en: "Soul King Aura", ar: "هالة ملك الأرواح", hex: "#fde68a", cost: 4500, rarity: "legendary", fx: "ce-aura", animated: true },
  /* premium animated */
  { id: "fx_prem_getsuga", en: "Getsuga Tenshō", ar: "غيتسوغا تينشو", hex: "#38bdf8", cost: 6000, rarity: "mythic", fx: "ce-gradient ce-pulse", animated: true },
  { id: "fx_prem_ryujin", en: "Ryūjin Jakka Blaze", ar: "لهيب ريوجين جاكا", hex: "#f97316", cost: 7500, rarity: "mythic", fx: "ce-ember ce-pulse", animated: true },
  { id: "fx_prem_hyorinmaru", en: "Hyōrinmaru Frostwind", ar: "رياح هيورينمارو", hex: "#7dd3fc", cost: 9000, rarity: "mythic", fx: "ce-frost ce-shimmer", animated: true },
  { id: "fx_prem_almighty", en: "The Almighty", ar: "القدير", hex: "#fde68a", cost: 12000, rarity: "mythic", fx: "ce-aura ce-shimmer", animated: true },
  { id: "fx_prem_soul_king", en: "Soul King Radiance", ar: "إشراق ملك الأرواح", hex: "#ffffff", cost: 15000, rarity: "mythic", fx: "ce-rainbow", animated: true },
];

export const NAME_EFFECTS: Record<string, NameEffectStyle> = {};
EFFECT_DEFS.forEach((d, i) => {
  NAME_EFFECTS[d.id] = {
    className: d.fx,
    style: { ["--ce-color" as string]: d.hex },
    animated: d.animated,
    label: { en: d.en, ar: d.ar },
  };
  push({
    id: d.id, kind: "name_effect", en: d.en, ar: d.ar, cost: d.cost, rarity: d.rarity,
    meta: { fx: d.fx, hex: d.hex, animated: d.animated, rarity: d.rarity }, sort: 300 + i,
  });
});

/* ------------------------------------------------------------------ */
/* Name frames (boxes) — 16 · 1,500–7,500 Souls                        */
/* ------------------------------------------------------------------ */

const nfBase =
  "relative inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-0.5 align-middle";

interface FrameDef {
  id: string; en: string; ar: string; cost: number; rarity: Rarity;
  border: string; bg: string; extra?: string; glow?: string; sheen?: string;
}

const FRAME_DEFS: FrameDef[] = [
  { id: "nfx_rukongai", en: "Rukongai Wood", ar: "خشب الروكونغاي", cost: 1500, rarity: "common", border: "border-[#8b6b45]/70", bg: "linear-gradient(135deg,rgba(90,65,40,0.6),rgba(20,15,10,0.6))" },
  { id: "nfx_shihakusho", en: "Shihakushō", ar: "الشيهاكوشو", cost: 1800, rarity: "common", border: "border-white/25", bg: "linear-gradient(135deg,rgba(20,20,24,0.85),rgba(45,45,55,0.6))" },
  { id: "nfx_urahara_awning", en: "Urahara Awning", ar: "مظلة أوراهارا", cost: 2100, rarity: "common", border: "border-emerald-300/50", bg: "repeating-linear-gradient(135deg,rgba(16,185,129,0.22) 0 8px,rgba(10,20,18,0.6) 8px 16px)" },
  { id: "nfx_squad_barracks", en: "Squad Barracks", ar: "ثكنات الفرقة", cost: 2400, rarity: "rare", border: "border-slate-200/50", bg: "linear-gradient(135deg,rgba(200,210,230,0.16),rgba(15,18,28,0.7))" },
  { id: "nfx_kido_seal", en: "Kidō Seal", ar: "ختم الكيدو", cost: 2700, rarity: "rare", border: "border-amber-200/60", bg: "linear-gradient(135deg,rgba(250,204,21,0.22),rgba(35,25,5,0.7))", extra: "nf-shimmer", sheen: "rgba(255,240,190,0.55)" },
  { id: "nfx_hollow_hole", en: "Hollow Hole", ar: "ثقب الهولو", cost: 3000, rarity: "rare", border: "border-red-500/50", bg: "radial-gradient(120% 120% at 20% 50%,rgba(0,0,0,0.9),rgba(120,10,10,0.5))", extra: "nf-pulse", glow: "rgba(239,68,68,0.55)" },
  { id: "nfx_arrancar_bone", en: "Arrancar Bone", ar: "عظم الأرانكار", cost: 3300, rarity: "rare", border: "border-stone-100/60", bg: "linear-gradient(135deg,rgba(240,236,220,0.22),rgba(30,28,24,0.75))" },
  { id: "nfx_quincy_vollstandig", en: "Vollständig", ar: "فولشتانديغ", cost: 3600, rarity: "epic", border: "border-sky-200/70", bg: "linear-gradient(135deg,rgba(190,225,255,0.28),rgba(8,16,40,0.72))", extra: "nf-shimmer", sheen: "rgba(220,245,255,0.7)" },
  { id: "nfx_espada_rank", en: "Espada Rank", ar: "رتبة الإسبادا", cost: 3900, rarity: "epic", border: "border-emerald-200/60", bg: "linear-gradient(135deg,rgba(240,240,240,0.14),rgba(0,28,22,0.82))", extra: "nf-mist" },
  { id: "nfx_zaraki_scar", en: "Zaraki Scar", ar: "ندبة زاراكي", cost: 4200, rarity: "epic", border: "border-red-300/60", bg: "repeating-linear-gradient(115deg,rgba(180,30,20,0.35) 0 5px,rgba(12,12,12,0.75) 5px 12px)" },
  { id: "nfx_dangai_current", en: "Dangai Current", ar: "تيار الدانغاي", cost: 4800, rarity: "epic", border: "border-violet-300/60", bg: "linear-gradient(100deg,rgba(120,60,200,0.4),rgba(10,8,25,0.8),rgba(160,120,255,0.35))", extra: "nf-flow" },
  { id: "nfx_squad13_crest", en: "Squad 13 Crest", ar: "شعار الفرقة ١٣", cost: 5400, rarity: "epic", border: "border-white/70", bg: "linear-gradient(100deg,rgba(255,255,255,0.16),rgba(0,0,0,0.72),rgba(255,255,255,0.16))", extra: "nf-shimmer", sheen: "rgba(255,255,255,0.5)" },
  { id: "nfx_hueco_night", en: "Hueco Night", ar: "ليل هويكو", cost: 6000, rarity: "legendary", border: "border-indigo-200/60", bg: "linear-gradient(100deg,rgba(190,200,255,0.16),rgba(4,4,18,0.9))", extra: "nf-petals" },
  { id: "nfx_reiatsu_storm", en: "Reiatsu Storm", ar: "عاصفة الريتسو", cost: 6600, rarity: "legendary", border: "border-cyan-200/70", bg: "linear-gradient(100deg,rgba(34,211,238,0.32),rgba(6,20,35,0.8))", extra: "nf-flow nf-pulse", glow: "rgba(103,232,249,0.6)" },
  { id: "nfx_bankai_seal", en: "Bankai Seal", ar: "ختم البانكاي", cost: 7000, rarity: "legendary", border: "border-orange-300/80", bg: "linear-gradient(100deg,rgba(255,140,30,0.38),rgba(25,10,0,0.8))", extra: "nf-shimmer nf-pulse", glow: "rgba(255,150,40,0.7)", sheen: "rgba(255,220,150,0.6)" },
  { id: "nfx_zero_division", en: "Zero Division", ar: "الفرقة صفر", cost: 7500, rarity: "mythic", border: "border-amber-100/80", bg: "linear-gradient(100deg,rgba(255,225,150,0.42),rgba(55,38,0,0.75),rgba(255,245,205,0.35))", extra: "nf-flow nf-shimmer nf-sparks", sheen: "rgba(255,245,200,0.8)" },
];

export interface ExtraNameFrame {
  className: string;
  style: React.CSSProperties;
  animated: boolean;
  label: { en: string; ar: string };
}

export const EXTRA_NAME_FRAMES: Record<string, ExtraNameFrame> = {};
FRAME_DEFS.forEach((d, i) => {
  const style: Record<string, unknown> = { background: d.bg };
  if (d.glow) style["--nf-glow"] = d.glow;
  if (d.sheen) style["--nf-sheen"] = d.sheen;
  EXTRA_NAME_FRAMES[d.id] = {
    className: `${nfBase} ${d.extra ?? ""} ${d.border}`,
    style: style as React.CSSProperties,
    animated: !!d.extra,
    label: { en: d.en, ar: d.ar },
  };
  push({
    id: d.id, kind: "name_frame", en: d.en, ar: d.ar, cost: d.cost, rarity: d.rarity,
    meta: { animated: !!d.extra, rarity: d.rarity }, sort: 400 + i,
  });
});

/* ------------------------------------------------------------------ */
/* Profile frames — 16 · 2,250–9,000 Souls                             */
/* ------------------------------------------------------------------ */

export interface ProfileFrameStyle {
  className: string;
  style: React.CSSProperties;
  label: { en: string; ar: string };
}

interface PFDef { id: string; en: string; ar: string; cost: number; rarity: Rarity; ring: string; glow?: string; animated?: boolean }

const PROFILE_FRAME_DEFS: PFDef[] = [
  { id: "pf_academy", en: "Shin'ō Academy", ar: "أكاديمية شينؤ", cost: 2250, rarity: "common", ring: "ring-2 ring-sky-300/50" },
  { id: "pf_rukongai", en: "Rukongai Rope", ar: "حبل الروكونغاي", cost: 2400, rarity: "common", ring: "ring-2 ring-amber-700/60" },
  { id: "pf_shinigami", en: "Shinigami Black", ar: "أسود الشينيغامي", cost: 2700, rarity: "common", ring: "ring-2 ring-white/30" },
  { id: "pf_squad_seal", en: "Squad Seal", ar: "ختم الفرقة", cost: 3000, rarity: "rare", ring: "ring-2 ring-slate-200/60" },
  { id: "pf_kido_ring", en: "Kidō Ring", ar: "حلقة الكيدو", cost: 3300, rarity: "rare", ring: "ring-2 ring-amber-300/70", glow: "rgba(252,211,77,0.45)" },
  { id: "pf_hollow_mask", en: "Hollow Mask", ar: "قناع الهولو", cost: 3600, rarity: "rare", ring: "ring-2 ring-red-500/60", glow: "rgba(239,68,68,0.45)" },
  { id: "pf_arrancar", en: "Arrancar Fragment", ar: "شظية الأرانكار", cost: 3900, rarity: "rare", ring: "ring-2 ring-stone-100/60" },
  { id: "pf_quincy_cross", en: "Quincy Cross", ar: "صليب الكوينسي", cost: 4500, rarity: "epic", ring: "ring-2 ring-sky-200/70", glow: "rgba(125,211,252,0.5)" },
  { id: "pf_espada", en: "Espada Crest", ar: "شعار الإسبادا", cost: 5100, rarity: "epic", ring: "ring-2 ring-emerald-200/70", glow: "rgba(45,212,191,0.45)" },
  { id: "pf_captain_haori", en: "Captain's Haori", ar: "هاوري القائد", cost: 5700, rarity: "epic", ring: "ring-2 ring-white/80", glow: "rgba(255,255,255,0.45)" },
  { id: "pf_zanpakuto", en: "Zanpakutō Guard", ar: "حارس الزانباكوتو", cost: 6300, rarity: "epic", ring: "ring-2 ring-neutral-200/70" },
  { id: "pf_hueco_moon", en: "Hueco Moon", ar: "قمر هويكو", cost: 6900, rarity: "legendary", ring: "ring-2 ring-indigo-200/70", glow: "rgba(165,180,252,0.5)" },
  { id: "pf_dangai", en: "Dangai Rift", ar: "شق الدانغاي", cost: 7500, rarity: "legendary", ring: "ring-2 ring-violet-300/70", glow: "rgba(167,139,250,0.55)", animated: true },
  { id: "pf_bankai", en: "Bankai Aura", ar: "هالة البانكاي", cost: 8100, rarity: "legendary", ring: "ring-2 ring-orange-300/80", glow: "rgba(251,146,60,0.6)", animated: true },
  { id: "pf_sternritter", en: "Sternritter Sigil", ar: "ختم الشتيرنريتر", cost: 8500, rarity: "legendary", ring: "ring-2 ring-blue-100/80", glow: "rgba(219,234,254,0.55)", animated: true },
  { id: "pf_soul_king", en: "Soul King Halo", ar: "هالة ملك الأرواح", cost: 9000, rarity: "mythic", ring: "ring-2 ring-amber-100/90", glow: "rgba(253,230,138,0.7)", animated: true },
];

export const PROFILE_FRAMES: Record<string, ProfileFrameStyle> = {};
PROFILE_FRAME_DEFS.forEach((d, i) => {
  PROFILE_FRAMES[d.id] = {
    className: `${d.ring} ${d.animated ? "ce-pulse" : ""}`,
    style: (d.glow ? { boxShadow: `0 0 18px -4px ${d.glow}` } : {}) as React.CSSProperties,
    label: { en: d.en, ar: d.ar },
  };
  push({
    id: d.id, kind: "frame", en: d.en, ar: d.ar, cost: d.cost, rarity: d.rarity,
    meta: { animated: !!d.animated, rarity: d.rarity }, sort: 500 + i,
  });
});

/* ------------------------------------------------------------------ */
/* Profile badges — 16 · 750–4,500 Souls                               */
/* ------------------------------------------------------------------ */

export interface ProfileBadgeStyle {
  glyph: string;
  color: string;
  label: { en: string; ar: string };
}

interface BadgeDef { id: string; en: string; ar: string; cost: number; rarity: Rarity; glyph: string; color: string }

const BADGE_DEFS: BadgeDef[] = [
  { id: "pb_academy", en: "Academy Cadet", ar: "متدرب الأكاديمية", cost: 750, rarity: "common", glyph: "刀", color: "#93c5fd" },
  { id: "pb_rukongai", en: "Rukongai Wanderer", ar: "تائه الروكونغاي", cost: 900, rarity: "common", glyph: "旅", color: "#d6b98c" },
  { id: "pb_soul_reaper", en: "Soul Reaper", ar: "شينيغامي", cost: 1050, rarity: "common", glyph: "死", color: "#e5e7eb" },
  { id: "pb_kido_corps", en: "Kidō Corps", ar: "فيلق الكيدو", cost: 1200, rarity: "rare", glyph: "鬼", color: "#fbbf24" },
  { id: "pb_onmitsu", en: "Onmitsukidō", ar: "أونميتسوكيدو", cost: 1500, rarity: "rare", glyph: "隠", color: "#a3a3a3" },
  { id: "pb_squad_seal", en: "Gotei 13", ar: "الغوتي ١٣", cost: 1800, rarity: "rare", glyph: "十", color: "#f3f4f6" },
  { id: "pb_hollow", en: "Hollow", ar: "هولو", cost: 2100, rarity: "rare", glyph: "虚", color: "#ef4444" },
  { id: "pb_arrancar", en: "Arrancar", ar: "أرانكار", cost: 2400, rarity: "epic", glyph: "破", color: "#e7e5e4" },
  { id: "pb_espada", en: "Espada", ar: "إسبادا", cost: 2700, rarity: "epic", glyph: "十刃", color: "#2dd4bf" },
  { id: "pb_quincy", en: "Quincy", ar: "كوينسي", cost: 3000, rarity: "epic", glyph: "滅", color: "#7dd3fc" },
  { id: "pb_sternritter", en: "Sternritter", ar: "شتيرنريتر", cost: 3300, rarity: "epic", glyph: "星", color: "#dbeafe" },
  { id: "pb_visored", en: "Visored", ar: "فايزورد", cost: 3600, rarity: "epic", glyph: "仮", color: "#c4b5fd" },
  { id: "pb_captain", en: "Captain", ar: "قائد", cost: 3900, rarity: "legendary", glyph: "隊", color: "#ffffff" },
  { id: "pb_bankai", en: "Bankai", ar: "بانكاي", cost: 4200, rarity: "legendary", glyph: "解", color: "#fb923c" },
  { id: "pb_zero", en: "Zero Division", ar: "الفرقة صفر", cost: 4400, rarity: "legendary", glyph: "零", color: "#fde68a" },
  { id: "pb_soul_king", en: "Soul King", ar: "ملك الأرواح", cost: 4500, rarity: "mythic", glyph: "王", color: "#fff7c2" },
];

export const PROFILE_BADGES: Record<string, ProfileBadgeStyle> = {};
BADGE_DEFS.forEach((d, i) => {
  PROFILE_BADGES[d.id] = { glyph: d.glyph, color: d.color, label: { en: d.en, ar: d.ar } };
  push({
    id: d.id, kind: "profile_badge", en: d.en, ar: d.ar, cost: d.cost, rarity: d.rarity,
    meta: { glyph: d.glyph, color: d.color, rarity: d.rarity }, sort: 600 + i,
  });
});

/* ------------------------------------------------------------------ */
/* Leaderboard styles — 12 standard + 4 premium animated               */
/* ------------------------------------------------------------------ */

export interface LeaderboardStyleDef {
  className: string;
  style: React.CSSProperties;
  animated: boolean;
  label: { en: string; ar: string };
}

interface LbDef {
  id: string; en: string; ar: string; cost: number; rarity: Rarity;
  bg: string; border: string; extra?: string; glow?: string;
}

const LB_DEFS: LbDef[] = [
  { id: "lb_seireitei", en: "Seireitei Stone", ar: "حجر السيريتي", cost: 2250, rarity: "common", bg: "linear-gradient(90deg,rgba(220,225,235,0.12),transparent)", border: "border-white/25" },
  { id: "lb_rukongai", en: "Rukongai Dusk", ar: "غسق الروكونغاي", cost: 2500, rarity: "common", bg: "linear-gradient(90deg,rgba(120,85,45,0.22),transparent)", border: "border-amber-700/40" },
  { id: "lb_urahara", en: "Urahara Shop", ar: "متجر أوراهارا", cost: 3000, rarity: "common", bg: "repeating-linear-gradient(120deg,rgba(16,185,129,0.16) 0 10px,transparent 10px 20px)", border: "border-emerald-300/40" },
  { id: "lb_kido", en: "Kidō Array", ar: "دائرة الكيدو", cost: 3500, rarity: "rare", bg: "linear-gradient(90deg,rgba(250,204,21,0.2),transparent)", border: "border-amber-300/50" },
  { id: "lb_hollow", en: "Hollow Depths", ar: "أعماق الهولو", cost: 4000, rarity: "rare", bg: "linear-gradient(90deg,rgba(140,10,10,0.35),transparent)", border: "border-red-500/40" },
  { id: "lb_arrancar", en: "Arrancar Ivory", ar: "عاج الأرانكار", cost: 4500, rarity: "rare", bg: "linear-gradient(90deg,rgba(240,236,220,0.18),transparent)", border: "border-stone-100/40" },
  { id: "lb_quincy", en: "Quincy Cathedral", ar: "كاتدرائية الكوينسي", cost: 5000, rarity: "epic", bg: "linear-gradient(90deg,rgba(96,165,250,0.25),transparent)", border: "border-sky-300/50" },
  { id: "lb_espada", en: "Las Noches", ar: "لاس نوتشيس", cost: 5750, rarity: "epic", bg: "linear-gradient(90deg,rgba(45,212,191,0.22),rgba(0,0,0,0.4))", border: "border-emerald-200/50" },
  { id: "lb_hueco", en: "Hueco Mundo", ar: "هويكو موندو", cost: 6500, rarity: "epic", bg: "linear-gradient(90deg,rgba(190,200,255,0.16),rgba(3,3,15,0.6))", border: "border-indigo-200/40" },
  { id: "lb_gotei", en: "Gotei 13 Banner", ar: "راية الغوتي ١٣", cost: 7250, rarity: "epic", bg: "linear-gradient(90deg,rgba(255,255,255,0.16),rgba(0,0,0,0.45))", border: "border-white/50" },
  { id: "lb_bankai", en: "Bankai Flame", ar: "لهب البانكاي", cost: 8000, rarity: "legendary", bg: "linear-gradient(90deg,rgba(255,140,30,0.3),transparent)", border: "border-orange-300/60" },
  { id: "lb_dangai", en: "Dangai Rift", ar: "شق الدانغاي", cost: 9000, rarity: "legendary", bg: "linear-gradient(90deg,rgba(139,92,246,0.3),transparent)", border: "border-violet-300/60" },
  /* premium animated */
  { id: "lb_prem_reiatsu", en: "Reiatsu Surge", ar: "اندفاع الريتسو", cost: 6000, rarity: "mythic", bg: "linear-gradient(100deg,rgba(34,211,238,0.3),rgba(6,20,35,0.6),rgba(34,211,238,0.3))", border: "border-cyan-200/60", extra: "nf-flow" },
  { id: "lb_prem_getsuga", en: "Getsuga Wave", ar: "موجة الغيتسوغا", cost: 9000, rarity: "mythic", bg: "linear-gradient(100deg,rgba(0,0,0,0.7),rgba(56,189,248,0.35),rgba(0,0,0,0.7))", border: "border-sky-200/70", extra: "nf-flow nf-shimmer" },
  { id: "lb_prem_sternritter", en: "Sternritter Judgement", ar: "حكم الشتيرنريتر", cost: 12000, rarity: "mythic", bg: "linear-gradient(100deg,rgba(230,235,245,0.22),rgba(20,25,45,0.75),rgba(150,190,255,0.28))", border: "border-blue-100/70", extra: "nf-flow nf-pulse", glow: "rgba(180,215,255,0.6)" },
  { id: "lb_prem_soul_king", en: "Soul King Throne", ar: "عرش ملك الأرواح", cost: 15000, rarity: "mythic", bg: "linear-gradient(100deg,rgba(255,225,150,0.4),rgba(55,38,0,0.7),rgba(255,245,205,0.35))", border: "border-amber-100/80", extra: "nf-flow nf-shimmer nf-sparks" },
];

export const LEADERBOARD_STYLES: Record<string, LeaderboardStyleDef> = {};
LB_DEFS.forEach((d, i) => {
  const style: Record<string, unknown> = { background: d.bg };
  if (d.glow) style["--nf-glow"] = d.glow;
  LEADERBOARD_STYLES[d.id] = {
    className: `${d.border} ${d.extra ?? ""}`,
    style: style as React.CSSProperties,
    animated: !!d.extra,
    label: { en: d.en, ar: d.ar },
  };
  push({
    id: d.id, kind: "leaderboard_style", en: d.en, ar: d.ar, cost: d.cost, rarity: d.rarity,
    meta: { animated: !!d.extra, rarity: d.rarity }, sort: 700 + i,
  });
});

export const COSMETIC_CATALOG = catalog;

export const RARITY_LABEL: Record<Rarity, { en: string; ar: string }> = {
  common: { en: "Common", ar: "عادي" },
  rare: { en: "Rare", ar: "نادر" },
  epic: { en: "Epic", ar: "ملحمي" },
  legendary: { en: "Legendary", ar: "أسطوري" },
  mythic: { en: "Mythic", ar: "خرافي" },
};

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#9ca3af",
  rare: "#60a5fa",
  epic: "#a78bfa",
  legendary: "#fbbf24",
  mythic: "#f472b6",
};
