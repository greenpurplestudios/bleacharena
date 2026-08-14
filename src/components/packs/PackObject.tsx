import { useI18n } from "@/lib/i18n";
import { PACK_LABEL, PACK_COLOR, PACK_DESCRIPTION, PACK_PRICE, type PackTier } from "@/lib/packs";
import { play } from "@/lib/sound";

const L = {
  open: { en: "Tear open", ar: "افتح" },
  openAll: { en: "Open all", ar: "افتح الكل" },
  empty: { en: "Empty", ar: "فارغة" },
  buy: { en: "Buy", ar: "شراء" },
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
  onBuy,
  canAfford = true,
}: {
  tier: PackTier;
  count: number;
  disabled?: boolean;
  onOpen: () => void;
  onOpenAll?: () => void;
  index?: number;
  onBuy?: () => void;
  canAfford?: boolean;
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
        className={`relative h-52 w-36 shrink-0 select-none rounded-[1.1rem] outline-none transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed sm:h-60 sm:w-40 ${
          empty ? "saturate-[0.55] brightness-[0.8]" : ""
        }`}
        style={{
          animation: empty ? undefined : "pack-float 3.6s ease-in-out infinite",
          animationDelay: `${index * 0.3}s`,
        }}
      >
        {/* Solid pack body — opaque card stock, never see-through */}
        <span
          aria-hidden
          className="absolute inset-0 overflow-hidden rounded-[1.1rem] border-2 transition-transform duration-300 group-hover:-translate-y-1"
          style={{
            borderColor: `${color}cc`,
            backgroundColor: "#0b0806",
            backgroundImage: `linear-gradient(160deg, ${color} 0%, #1d150e 34%, #120d09 62%, ${color}88 100%)`,
            boxShadow: empty
              ? "inset 0 0 40px rgba(0,0,0,0.85)"
              : `0 18px 40px -14px ${color}aa, inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -18px 30px -10px rgba(0,0,0,0.8)`,
          }}
        >
          {/* top foil crimp band */}
          <span
            className="absolute inset-x-0 top-0 h-6"
            style={{
              background: `linear-gradient(180deg, ${color}dd, ${color}22)`,
              borderBottom: `1px dashed rgba(0,0,0,0.5)`,
            }}
          />
          {/* bottom foil crimp band */}
          <span
            className="absolute inset-x-0 bottom-0 h-6"
            style={{
              background: `linear-gradient(0deg, ${color}dd, ${color}22)`,
              borderTop: `1px dashed rgba(0,0,0,0.5)`,
            }}
          />
          {/* diagonal sheen band */}
          <span
            className="absolute -inset-x-6 top-1/2 h-16 -translate-y-1/2 -rotate-12 opacity-30"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />
        </span>
        {/* Preserved kiosk logo: reiatsu seal over the tier kanji */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-7xl font-black opacity-20"
          style={{ color, textShadow: "0 2px 0 rgba(0,0,0,0.6)" }}
        >
          {TIER_SIGIL[tier]}
        </span>
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-display text-2xl font-black"
          style={{
            borderColor: color,
            backgroundColor: "#0d0a07",
            color,
            boxShadow: `0 0 26px -4px ${color}, inset 0 0 18px -6px ${color}`,
          }}
        >
          霊
        </span>
        {/* Tier wordmark on the foil */}
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-7 text-center font-display text-[10px] font-black uppercase tracking-[0.35em]"
          style={{ color: `${color}` }}
        >
          {tier}
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
        {count > 0 && (
        <span
          className="absolute -end-2 -top-2 flex h-8 min-w-8 items-center justify-center rounded-full border px-1.5 font-display text-sm font-black shadow-lg"
          style={{ borderColor: `${color}aa`, background: `${color}dd`, color: "#0a0806" }}
        >
          ×{count}
        </span>
        )}
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

      {onBuy && (
        <button
          onClick={() => { play("tap"); onBuy(); }}
          disabled={disabled || !canAfford}
          className="mt-2 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {L.buy[locale]} — {PACK_PRICE[tier]} ✦
        </button>
      )}
    </div>
  );
}
