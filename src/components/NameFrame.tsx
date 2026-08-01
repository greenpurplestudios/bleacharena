import type { ReactNode } from "react";

export interface NameFrameStyle {
  /** wrapper classes */
  className: string;
  /** inline style for the wrapper */
  style: React.CSSProperties;
  animated: boolean;
  label: { en: string; ar: string };
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