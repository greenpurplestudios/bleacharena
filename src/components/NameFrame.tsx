import type { ReactNode } from "react";

export interface NameFrameStyle {
  /** wrapper classes */
  className: string;
  /** inline style for the wrapper */
  style: React.CSSProperties;
  animated: boolean;
  label: { en: string; ar: string };
  /** collectible grouping shown in the shop / profile */
  collection?: "classic" | "element" | "bleach";
}

const base =
  "relative inline-flex max-w-full items-center gap-1 rounded-lg border px-2 py-0.5 align-middle";

export const NAME_FRAMES: Record<string, NameFrameStyle> = {
  nf_ash: {
    className: `${base} border-[#8a6a4f]/70`,
    style: { background: "linear-gradient(135deg,rgba(60,40,25,0.75),rgba(20,14,10,0.6))" },
    animated: false,
    label: { en: "Ash Ember", ar: "جمر الرماد" },
  },
  nf_seireitei: {
    className: `${base} border-white/50`,
    style: {
      background: "linear-gradient(135deg,rgba(255,255,255,0.18),rgba(180,190,210,0.06))",
      boxShadow: "inset 0 0 12px rgba(255,255,255,0.18)",
    },
    animated: false,
    label: { en: "Seireitei Marble", ar: "رخام السيريتي" },
  },
  nf_academy: {
    className: `${base} border-sky-300/50`,
    style: { background: "linear-gradient(135deg,rgba(56,120,180,0.28),rgba(10,20,35,0.5))" },
    animated: false,
    label: { en: "Academy Crest", ar: "شعار الأكاديمية" },
  },
  nf_hollow: {
    className: `${base} nf-pulse border-red-500/60`,
    style: {
      background: "linear-gradient(135deg,rgba(120,10,10,0.45),rgba(0,0,0,0.7))",
      ["--nf-glow" as string]: "rgba(239,68,68,0.65)",
    },
    animated: true,
    label: { en: "Hollow Mask", ar: "قناع الهولو" },
  },
  nf_quincy: {
    className: `${base} nf-shimmer border-sky-300/70`,
    style: {
      background: "linear-gradient(135deg,rgba(120,190,255,0.25),rgba(10,20,40,0.6))",
      ["--nf-sheen" as string]: "rgba(190,230,255,0.55)",
    },
    animated: true,
    label: { en: "Quincy Light", ar: "ضوء الكوينسي" },
  },
  nf_gotei: {
    className: `${base} nf-shimmer border-white/70`,
    style: {
      background:
        "repeating-linear-gradient(135deg,rgba(255,255,255,0.12) 0 6px,rgba(0,0,0,0.45) 6px 12px)",
      ["--nf-sheen" as string]: "rgba(255,255,255,0.5)",
    },
    animated: true,
    label: { en: "Gotei 13 Banner", ar: "راية الغوتي ١٣" },
  },
  nf_zangetsu: {
    className: `${base} nf-pulse border-neutral-200/70`,
    style: {
      background: "linear-gradient(135deg,rgba(0,0,0,0.8),rgba(180,30,20,0.45))",
      ["--nf-glow" as string]: "rgba(255,80,40,0.7)",
    },
    animated: true,
    label: { en: "Zangetsu Edge", ar: "حد زانغيتسو" },
  },
  nf_bankai: {
    className: `${base} nf-shimmer nf-pulse border-orange-400/80`,
    style: {
      background: "linear-gradient(135deg,rgba(255,120,20,0.35),rgba(20,10,0,0.75))",
      ["--nf-glow" as string]: "rgba(255,150,40,0.75)",
      ["--nf-sheen" as string]: "rgba(255,220,150,0.6)",
    },
    animated: true,
    label: { en: "Bankai Aura", ar: "هالة البانكاي" },
  },
  nf_soul_king: {
    className: `${base} nf-rainbow border-white/60`,
    style: {},
    animated: true,
    label: { en: "Soul King Throne", ar: "عرش ملك الأرواح" },
  },

  /* ---------- Element Collection ---------- */
  np_fire: {
    className: `${base} nf-flow nf-sparks nf-pulse border-orange-400/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(255,110,20,0.42),rgba(120,20,0,0.6),rgba(255,160,40,0.42))",
      ["--nf-glow" as string]: "rgba(255,120,30,0.7)",
      ["--nf-particle" as string]: "rgba(255,200,120,0.95)",
    },
    animated: true,
    collection: "element",
    label: { en: "Flame Nameplate", ar: "لوحة اللهب" },
  },
  np_water: {
    className: `${base} nf-flow nf-mist border-cyan-300/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(30,140,200,0.42),rgba(5,30,60,0.65),rgba(80,200,230,0.4))",
      ["--nf-mist-color" as string]: "rgba(150,230,255,0.32)",
    },
    animated: true,
    collection: "element",
    label: { en: "Tide Nameplate", ar: "لوحة المد" },
  },
  np_lightning: {
    className: `${base} nf-shimmer nf-pulse border-yellow-200/70`,
    style: {
      background: "linear-gradient(100deg,rgba(240,220,90,0.3),rgba(20,20,40,0.7))",
      ["--nf-glow" as string]: "rgba(250,230,120,0.75)",
      ["--nf-sheen" as string]: "rgba(255,255,200,0.75)",
    },
    animated: true,
    collection: "element",
    label: { en: "Storm Nameplate", ar: "لوحة العاصفة" },
  },
  np_nature: {
    className: `${base} nf-flow nf-petals border-emerald-300/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(40,160,90,0.4),rgba(8,32,20,0.65),rgba(120,210,140,0.35))",
      ["--nf-particle" as string]: "rgba(190,255,200,0.85)",
    },
    animated: true,
    collection: "element",
    label: { en: "Verdant Nameplate", ar: "لوحة الخضرة" },
  },
  np_shadow: {
    className: `${base} nf-mist nf-pulse border-violet-400/60`,
    style: {
      background: "linear-gradient(100deg,rgba(60,20,90,0.6),rgba(0,0,0,0.85))",
      ["--nf-glow" as string]: "rgba(150,80,220,0.6)",
      ["--nf-mist-color" as string]: "rgba(160,100,230,0.3)",
    },
    animated: true,
    collection: "element",
    label: { en: "Umbra Nameplate", ar: "لوحة الظل" },
  },
  np_light: {
    className: `${base} nf-shimmer nf-sparks border-amber-100/80`,
    style: {
      background: "linear-gradient(100deg,rgba(255,245,200,0.3),rgba(90,70,20,0.45))",
      ["--nf-sheen" as string]: "rgba(255,250,220,0.8)",
      ["--nf-particle" as string]: "rgba(255,250,210,0.9)",
    },
    animated: true,
    collection: "element",
    label: { en: "Radiance Nameplate", ar: "لوحة الإشراق" },
  },

  /* ---------- Bleach Collection ---------- */
  np_zangetsu: {
    className: `${base} nf-flow nf-pulse border-neutral-100/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(0,0,0,0.85),rgba(190,30,20,0.5),rgba(0,0,0,0.85))",
      ["--nf-glow" as string]: "rgba(255,90,50,0.7)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Zangetsu", ar: "زانغيتسو" },
  },
  np_senbonzakura: {
    className: `${base} nf-petals border-pink-300/70`,
    style: {
      background: "linear-gradient(100deg,rgba(230,120,170,0.32),rgba(30,10,25,0.7))",
      ["--nf-particle" as string]: "rgba(255,190,220,0.95)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Senbonzakura", ar: "سينبونزاكورا" },
  },
  np_kyoka: {
    className: `${base} nf-mist nf-shimmer border-fuchsia-300/60`,
    style: {
      background: "linear-gradient(100deg,rgba(120,40,150,0.4),rgba(10,10,30,0.75))",
      ["--nf-mist-color" as string]: "rgba(220,170,255,0.3)",
      ["--nf-sheen" as string]: "rgba(240,200,255,0.6)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Kyōka Suigetsu", ar: "كيوكا سويغيتسو" },
  },
  np_ryujin: {
    className: `${base} nf-flow nf-sparks nf-pulse border-red-400/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(180,40,0,0.55),rgba(255,150,30,0.4),rgba(60,10,0,0.7))",
      ["--nf-glow" as string]: "rgba(255,120,20,0.75)",
      ["--nf-particle" as string]: "rgba(255,210,140,0.95)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Ryūjin Jakka", ar: "ريوجين جاكا" },
  },
  np_hyorinmaru: {
    className: `${base} nf-petals nf-pulse border-sky-200/70`,
    style: {
      background: "linear-gradient(100deg,rgba(120,200,255,0.3),rgba(10,30,60,0.75))",
      ["--nf-glow" as string]: "rgba(150,220,255,0.6)",
      ["--nf-particle" as string]: "rgba(230,250,255,0.95)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Hyōrinmaru", ar: "هيورينمارو" },
  },
  np_nozarashi: {
    className: `${base} border-stone-300/60`,
    style: {
      background:
        "repeating-linear-gradient(115deg,rgba(120,120,120,0.25) 0 4px,rgba(15,15,15,0.7) 4px 10px)",
    },
    animated: false,
    collection: "bleach",
    label: { en: "Nozarashi", ar: "نوزاراشي" },
  },
  np_hollow_mask: {
    className: `${base} nf-sparks nf-pulse border-red-500/70`,
    style: {
      background: "linear-gradient(100deg,rgba(240,240,240,0.18),rgba(90,0,0,0.7))",
      ["--nf-glow" as string]: "rgba(255,40,40,0.7)",
      ["--nf-particle" as string]: "rgba(255,120,120,0.9)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Hollow Mask", ar: "قناع الهولو" },
  },
  np_quincy_cross: {
    className: `${base} nf-shimmer border-sky-200/80`,
    style: {
      background: "linear-gradient(100deg,rgba(200,230,255,0.28),rgba(10,20,45,0.7))",
      ["--nf-sheen" as string]: "rgba(220,245,255,0.75)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Quincy Cross", ar: "صليب الكوينسي" },
  },
  np_gotei13: {
    className: `${base} border-white/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(255,255,255,0.14),rgba(0,0,0,0.7) 55%,rgba(255,255,255,0.14))",
    },
    animated: false,
    collection: "bleach",
    label: { en: "Gotei 13", ar: "الغوتي ١٣" },
  },
  np_sternritter: {
    className: `${base} nf-flow nf-pulse border-slate-100/70`,
    style: {
      background:
        "linear-gradient(100deg,rgba(230,235,245,0.22),rgba(20,25,45,0.8),rgba(150,190,255,0.25))",
      ["--nf-glow" as string]: "rgba(180,215,255,0.6)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Sternritter", ar: "الشتيرنريتر" },
  },
  np_espada: {
    className: `${base} nf-mist nf-pulse border-emerald-200/60`,
    style: {
      background: "linear-gradient(100deg,rgba(240,240,240,0.16),rgba(0,25,20,0.8))",
      ["--nf-glow" as string]: "rgba(120,255,210,0.5)",
      ["--nf-mist-color" as string]: "rgba(180,255,235,0.25)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Espada", ar: "الإسبادا" },
  },
  np_soul_society: {
    className: `${base} border-amber-100/60`,
    style: {
      background: "linear-gradient(100deg,rgba(255,240,210,0.16),rgba(30,25,15,0.75))",
    },
    animated: false,
    collection: "bleach",
    label: { en: "Soul Society", ar: "سوسايتي الأرواح" },
  },
  np_hueco_mundo: {
    className: `${base} nf-petals border-indigo-200/60`,
    style: {
      background: "linear-gradient(100deg,rgba(190,200,255,0.18),rgba(5,5,20,0.85))",
      ["--nf-particle" as string]: "rgba(230,235,255,0.85)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Hueco Mundo", ar: "هويكو موندو" },
  },
  np_royal_palace: {
    className: `${base} nf-flow nf-shimmer nf-sparks border-amber-200/80`,
    style: {
      background:
        "linear-gradient(100deg,rgba(255,215,120,0.4),rgba(60,40,0,0.7),rgba(255,240,190,0.35))",
      ["--nf-sheen" as string]: "rgba(255,245,200,0.8)",
      ["--nf-particle" as string]: "rgba(255,240,190,0.95)",
    },
    animated: true,
    collection: "bleach",
    label: { en: "Royal Palace", ar: "القصر الملكي" },
  },
};

export function NameFrame({
  frame,
  children,
  className,
}: {
  frame?: string | null;
  children: ReactNode;
  className?: string;
}) {
  const f = frame ? NAME_FRAMES[frame] : null;
  if (!f) return <span className={className}>{children}</span>;
  return (
    <span className={`${f.className} ${className ?? ""}`} style={f.style}>
      <span className="relative z-[1] min-w-0 truncate">{children}</span>
    </span>
  );
}