import { ElementIcon, ELEMENT_COLOR } from "@/components/ElementIcon";
import { ELEMENT_LABEL, type ElementKey } from "@/lib/elements";
import { useI18n } from "@/lib/i18n";

const CORE: ElementKey[] = ["fire", "nature", "lightning", "water"];

/** Positions on a 300x300 board for the core cycle. */
const POS: Record<string, { x: number; y: number }> = {
  fire: { x: 150, y: 34 },
  nature: { x: 266, y: 150 },
  lightning: { x: 150, y: 266 },
  water: { x: 34, y: 150 },
};

/** from -> to (beats). */
const BEATS: [ElementKey, ElementKey][] = [
  ["water", "fire"],
  ["fire", "nature"],
  ["nature", "lightning"],
  ["lightning", "water"],
];

function edge(a: { x: number; y: number }, b: { x: number; y: number }, pad = 34) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  return {
    x1: a.x + ux * pad, y1: a.y + uy * pad,
    x2: b.x - ux * pad, y2: b.y - uy * pad,
  };
}

function Node({ el, size = 44 }: { el: ElementKey; size?: number }) {
  const { locale } = useI18n();
  const c = ELEMENT_COLOR[el];
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className="flex items-center justify-center rounded-full border backdrop-blur-md"
        style={{
          width: size, height: size,
          borderColor: `${c}88`,
          background: `radial-gradient(circle at 50% 35%, ${c}33, transparent 70%)`,
          boxShadow: `0 0 18px -6px ${c}`,
        }}
      >
        <ElementIcon element={el} className="h-1/2 w-1/2" />
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: c }}>
        {ELEMENT_LABEL[el][locale]}
      </span>
    </div>
  );
}

export function ElementGuide() {
  const { locale } = useI18n();
  const rtl = locale === "ar";

  return (
    <section
      dir={rtl ? "rtl" : "ltr"}
      className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur-md sm:p-6"
    >
      <h2 className="text-center font-display text-lg font-black uppercase tracking-[0.25em] text-primary">
        {locale === "ar" ? "دليل العناصر" : "Element Guide"}
      </h2>

      {/* Core cycle */}
      <div className="relative mx-auto mt-4 aspect-square w-full max-w-[320px]">
        <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
          <defs>
            {CORE.map((el) => (
              <marker
                key={el}
                id={`arrow-${el}`}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L10 5 L0 10 z" fill={ELEMENT_COLOR[el]} />
              </marker>
            ))}
          </defs>
          {BEATS.map(([from, to]) => {
            const e = edge(POS[from], POS[to]);
            return (
              <line
                key={`${from}-${to}`}
                {...e}
                stroke={ELEMENT_COLOR[from]}
                strokeWidth={2}
                strokeOpacity={0.85}
                markerEnd={`url(#arrow-${from})`}
              />
            );
          })}
        </svg>
        {CORE.map((el) => (
          <div
            key={el}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${(POS[el].x / 300) * 100}%`, top: `${(POS[el].y / 300) * 100}%` }}
          >
            <Node el={el} />
          </div>
        ))}
      </div>

      {/* Shadow & Light tiers */}
      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Node el="shadow" size={40} />
          <span className="font-display text-lg font-black text-muted-foreground">&gt;</span>
          <div className="flex gap-3">
            {CORE.map((el) => <Node key={el} el={el} size={34} />)}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <Node el="light" size={40} />
          <span className="font-display text-lg font-black text-muted-foreground">&gt;</span>
          <Node el="shadow" size={40} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-px w-6 bg-foreground/60" />
          {locale === "ar" ? "يتفوق على" : "Beats"}
        </span>
      </div>

      <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
        {locale === "ar"
          ? "ميزة العنصر تضاعف تأثير القدرة على الخصم، والضعف يقلّصه إلى النصف."
          : "An elemental advantage doubles an ability's effect on the enemy; a disadvantage halves it."}
      </p>
    </section>
  );
}
