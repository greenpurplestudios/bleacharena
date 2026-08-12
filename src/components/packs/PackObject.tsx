import { useI18n } from "@/lib/i18n";
import { PACK_LABEL, PACK_COLOR, PACK_DESCRIPTION, type PackTier } from "@/lib/packs";
import { play } from "@/lib/sound";

const L = {
  open: { en: "Tear open", ar: "افتح" },
  openAll: { en: "Open all", ar: "افتح الكل" },
  empty: { en: "Empty", ar: "فارغة" },
};

/** A rune/kanji sigil embossed on the pack foil, per tier. */
const TIER_SIGIL: Record<PackTier, string> = {
  bronze: "始",
  silver: "銀",
  gold: "金",
  ultra: "極",
  legend: "伝",
};

export function PackObject({
  tier,
  count,
  disabled,
  onOpen,
  onOpenAll,
  index = 0,
}: {
  tier: PackTier;
  count: number;
  disabled?: boolean;
  onOpen: () => void;
  onOpenAll?: () => void;
  index?: number;
}) {
  const { locale } = useI18n();
  const color = PACK_COLOR[tier];
  const empty = count < 1;

  return (
    <div
      className="group relative flex flex-col items-center"
      style={{ animation: `card-in 0.45s ease-out ${index * 0.06}s both` }}
    >
      <button
        type="button"
        onClick={() => { if (!empty && !disabled) { play("tap"); onOpen(); } }}
        disabled={empty || disabled}
        aria-label={`${PACK_LABEL[tier][locale]} — ${empty ? L.empty[locale] : L.open[locale]}`}
        className="relative h-52 w-36 shrink-0 select-none rounded-[1.1rem] outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-35 sm:h-60 sm:w-40"
        style={{
          animation: empty ? undefined : "pack-float 3.6s ease-in-out infinite",
          animationDelay: `${index * 0.3}s`,
        }}
      >
        {/* Foil body */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-[1.1rem] border transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-1"
          style={{
            borderColor: `${color}88`,
            background: `linear-gradient(155deg, ${color}33 0%, #14100c 32%, #1c1712 55%, ${color}22 78%, #0d0a08 100%)`,
            boxShadow: empty
              ? "inset 0 0 30px rgba(0,0,0,0.6)"
              : `0 14px 34px -12px ${color}99, inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -12px 24px -8px rgba(0,0,0,0.55)`,
          }}
        />
        {/* Torn crimp edges */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-3 opacity-80"
          style={{
            background: `repeating-linear-gradient(110deg, ${color}aa 0 6px, transparent 6px 12px)`,
            clipPath:
              "polygon(0% 0%,100% 0%,100% 60%,92% 100%,84% 55%,76% 100%,68% 55%,60% 100%,52% 55%,44% 100%,36% 55%,28% 100%,20% 55%,12% 100%,4% 55%,0% 100%)",
          }}
        />
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-3 rotate-180 opacity-80"
          style={{
            background: `repeating-linear-gradient(110deg, ${color}aa 0 6px, transparent 6px 12px)`,
            clipPath:
              "polygon(0% 0%,100% 0%,100% 60%,92% 100%,84% 55%,76% 100%,68% 55%,60% 100%,52% 55%,44% 100%,36% 55%,28% 100%,20% 55%,12% 100%,4% 55%,0% 100%)",
          }}
        />
        {/* Embossed sigil */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-6xl font-black opacity-25"
          style={{ color, textShadow: "0 2px 0 rgba(0,0,0,0.5)" }}
        >
          {TIER_SIGIL[tier]}
        </span>
        {/* Center seal */}
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-2xl font-black"
          style={{ borderColor: color, background: `${color}22`, color, boxShadow: `0 0 22px -4px ${color}` }}
        >
          卍
        </span>
        {/* Shine sweep */}
        {!empty && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.1rem]"
          >
            <span
              className="absolute -inset-y-10 -left-1/2 w-1/3 rotate-12 bg-white/25 blur-[2px]"
              style={{ animation: "pack-shine 3.2s ease-in-out infinite", animationDelay: `${index * 0.4}s` }}
            />
          </span>
        )}
        {/* Count badge */}
        <span
          className="absolute -end-2 -top-2 flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 font-display text-sm font-black shadow-lg"
          style={{ borderColor: `${color}aa`, background: `${color}dd`, color: "#0a0806" }}
        >
          ×{count}
        </span>
      </button>

      <div className="mt-3 text-center">
        <div className="font-display text-sm font-black uppercase tracking-widest" style={{ color }}>
          {PACK_LABEL[tier][locale]}
        </div>
        <p className="mx-auto mt-0.5 max-w-[10rem] text-[10px] leading-snug text-muted-foreground">
          {PACK_DESCRIPTION[tier][locale]}
        </p>
      </div>

      {!empty && count > 1 && onOpenAll && (
        <button
          onClick={() => { play("tap"); onOpenAll(); }}
          disabled={disabled}
          className="mt-2 rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{ borderColor: `${color}66`, background: `${color}1a`, color }}
        >
          {L.openAll[locale]} ×{count}
        </button>
      )}
    </div>
  );
}
