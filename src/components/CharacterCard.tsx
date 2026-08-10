import { useEffect, useState } from "react";
import type { Character, Rarity } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { elementOf } from "@/lib/elements";
import { ELEMENT_PATH } from "@/components/ElementIcon";
import { RARITY_MATERIAL } from "@/lib/card-backs";
import { framingOf } from "@/lib/portrait";
import { RARITY_LABEL } from "@/lib/rarity";
import { loadPrefs, play, playReveal } from "@/lib/sound";
import { haptic, hapticRarity } from "@/lib/haptics";
import { preloadCardArt } from "@/lib/card-preload";
import { CARD_LABEL, localizeFaction, localizeRank, localizeDivision } from "@/lib/card-i18n";
import { CardChrome } from "@/components/card/CardChrome";
import { CardSigil } from "@/components/card/CardSigil";

/** Per-language typography: Latin uses Cinzel small-caps with wide tracking;
 *  Arabic uses Amiri, larger optical size, no tracking (breaks joining). */
const TYPO = {
  en: {
    family: "'Cinzel', serif",
    upper: "uppercase" as const,
    rarityPill: { size: 2.1, ls: "0.24em" },
    lore: { size: 1.85, ls: "0.06em" },
    ovr: { size: 6.2 },
    nameLh: 1.05,
    nameSize: (n: number) => (n > 26 ? 3.4 : n > 20 ? 3.9 : n > 14 ? 4.5 : 5.2),
    nameLs: "0.04em",
  },
  ar: {
    family: "'Amiri', 'Cairo', serif",
    upper: "none" as const,
    rarityPill: { size: 2.4, ls: "0" },
    lore: { size: 2.1, ls: "0" },
    ovr: { size: 6.6 },
    nameLh: 1.25,
    nameSize: (n: number) => (n > 26 ? 3.6 : n > 20 ? 4.1 : n > 14 ? 4.7 : 5.4),
    nameLs: "0",
  },
} as const;

export function CharacterCard({
  character,
  faceDown = false,
  onReveal,
  className,
  interactive = true,
}: {
  character: Character;
  /** Start face-down; the player flips to reveal. */
  faceDown?: boolean;
  onReveal?: () => void;
  className?: string;
  interactive?: boolean;
}) {
  const { locale } = useI18n();
  const flipEnabled = () => loadPrefs().flipReveal !== false;
  const [showBack, setShowBack] = useState(faceDown);
  const [flipping, setFlipping] = useState(false);
  useEffect(() => { preloadCardArt(); }, []);
  useEffect(() => {
    setShowBack(faceDown && flipEnabled());
  }, [faceDown, character.id]);

  const c = character;
  const m = RARITY_MATERIAL[c.rarity];
  const el = elementOf(c.slug);
  const f = framingOf(c.slug);
  const ty = TYPO[locale];
  const rtl = locale === "ar";
  const uid = c.id;

  const Shell = (interactive ? "button" : "div") as "button";
  const name = c.name[locale];
  const nameSize = ty.nameSize(name.length);

  const dash = "—";
  const faction = c.faction ? localizeFaction(c.faction, locale) : "";
  const rank = c.rank
    ? localizeRank(c.rank, locale)
    : c.division
      ? localizeDivision(c.division, locale)
      : "";
  const lore = [faction, rank].filter(Boolean).join("  •  ") || dash;

  const ink = m.ink;
  const engrave = {
    color: ink,
    textShadow: `0 0.08cqw 0.12cqw rgba(0,0,0,0.9), 0 0 0.8cqw ${m.glow}`,
    fontFamily: ty.family,
    textTransform: ty.upper,
  } as const;

  const toggle = () => {
    if (!interactive) return;
    setFlipping(true);
    window.setTimeout(() => setFlipping(false), 850);
    play("flip");
    haptic("flip");
    setShowBack((v) => {
      if (v) {
        window.setTimeout(() => { playReveal(c.rarity); hapticRarity(c.rarity); }, 320);
        onReveal?.();
      }
      return !v;
    });
  };

  return (
    <div
      className={`w-full select-none [container-type:inline-size] ${className ?? "max-w-sm"}`}
      style={{ perspective: "1400px", animation: "card-in 0.5s ease-out both" }}
      dir={rtl ? "rtl" : "ltr"}
      lang={locale}
    >
      <Shell
        {...(interactive
          ? { type: "button" as const, onClick: toggle }
          : { role: "img" as const })}
        aria-label={name}
        className={`group relative block w-full ${interactive ? "cursor-pointer hover:-translate-y-1" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 0.75s cubic-bezier(0.2,0.85,0.25,1), translate 0.4s ease-out",
          willChange: "transform",
        }}
      >
        {/* rarity aura */}
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[6%] blur-2xl transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(ellipse at center, ${m.glow}, transparent 70%)`,
            opacity: flipping ? 1 : 0.7,
            animation: "rarity-glow 3.6s ease-in-out infinite",
          }}
        />

        {/* ============================================================ FRONT */}
        <div
          className="relative w-full overflow-hidden rounded-[6.5%]"
          style={{
            aspectRatio: "1128 / 1394",
            backfaceVisibility: "hidden",
            opacity: showBack ? 0 : 1,
            transition: "opacity 0.35s ease-out 0.3s",
            background: `linear-gradient(180deg, ${m.deep} 0%, #0b0d12 45%, ${m.deep} 100%)`,
          }}
        >
          {/* hero portrait, full-bleed, fading into the frame at the base */}
          {c.image && (
            <div
              className="absolute overflow-hidden"
              style={{
                left: "5%", top: "4.5%", width: "90%", height: "56%",
                borderRadius: "3% / 4%",
                WebkitMaskImage: "linear-gradient(180deg, #000 72%, transparent 100%)",
                maskImage: "linear-gradient(180deg, #000 72%, transparent 100%)",
              }}
            >
              <img
                src={c.image}
                alt={name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                style={{ objectPosition: `${f.x}% ${f.y}%`, transform: `scale(${f.scale})` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 22%, transparent 68%, ${m.deep} 100%)` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ boxShadow: `inset 0 0 4cqw rgba(0,0,0,0.55)` }}
              />
            </div>
          )}

          <CardChrome rarity={c.rarity} uid={uid} />

          {/* rarity pill, top-center */}
          <div
            className="absolute flex items-center gap-[0.6cqw] rounded-full px-[2.2cqw] py-[0.6cqw]"
            style={{
              left: "50%", top: "5.4%", transform: "translate(-50%, -50%)",
              background: `linear-gradient(180deg, ${m.base}, ${m.deep})`,
              border: `0.14cqw solid ${m.bright}`,
              boxShadow: `0 0 1.4cqw ${m.glow}`,
            }}
          >
            <svg viewBox="0 0 20 20" style={{ width: "1.8cqw", height: "1.8cqw" }} aria-hidden>
              <path d="M10 1 L13 7 L19 8 L14.5 12.5 L15.7 19 L10 15.8 L4.3 19 L5.5 12.5 L1 8 L7 7 Z" fill={m.bright} />
            </svg>
            <span
              className="whitespace-nowrap font-bold leading-none"
              style={{ fontSize: `${ty.rarityPill.size}cqw`, letterSpacing: ty.rarityPill.ls, ...engrave }}
            >
              {RARITY_LABEL[c.rarity][locale]}
            </span>
          </div>

          {/* element medallion, top-left */}
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              left: "13%", top: "13%", width: "16%", aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle at 35% 30%, ${m.bright}, ${m.base} 55%, ${m.deep} 100%)`,
              border: `0.16cqw solid ${m.bright}`,
              boxShadow: `0 0.3cqw 0.6cqw rgba(0,0,0,0.6), 0 0 1.2cqw ${m.glow}`,
            }}
          >
            <svg viewBox="0 0 64 64" style={{ width: "58%", height: "58%" }}>
              <path d={ELEMENT_PATH[el]} fill="#0b0d12" opacity="0.88" />
            </svg>
          </div>

          {/* rating medallion, top-right */}
          <div
            className="absolute flex flex-col items-center justify-center rounded-full"
            style={{
              left: "87%", top: "13%", width: "16%", aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
              background: `radial-gradient(circle at 35% 30%, ${m.bright}, ${m.base} 55%, ${m.deep} 100%)`,
              border: `0.16cqw solid ${m.bright}`,
              boxShadow: `0 0.3cqw 0.6cqw rgba(0,0,0,0.6), 0 0 1.2cqw ${m.glow}`,
            }}
          >
            <span className="font-black leading-none" style={{ fontSize: `${ty.ovr.size * 0.62}cqw`, color: "#0b0d12", fontFamily: "'Cinzel', serif" }}>
              {c.overall}
            </span>
          </div>

          {/* name banner */}
          <div
            className="absolute left-1/2 flex items-center justify-center px-[4%] text-center font-bold leading-none"
            style={{
              top: "63%", width: "88%", height: "10%",
              transform: "translate(-50%, -50%)",
              fontSize: `${nameSize}cqw`,
              lineHeight: ty.nameLh,
              letterSpacing: ty.nameLs,
              ...engrave,
            }}
          >
            <span className="line-clamp-2">{name}</span>
          </div>

          {/* divider flourish */}
          <svg viewBox="0 0 200 12" className="absolute left-1/2" style={{ top: "71%", width: "70%", transform: "translate(-50%, -50%)" }} aria-hidden>
            <line x1="0" y1="6" x2="86" y2="6" stroke={m.bright} strokeWidth="1" opacity="0.7" />
            <line x1="114" y1="6" x2="200" y2="6" stroke={m.bright} strokeWidth="1" opacity="0.7" />
            <path d="M92 2 L100 10 L108 2" fill="none" stroke={m.bright} strokeWidth="1.4" opacity="0.9" />
          </svg>

          {/* lore line */}
          <div
            className="absolute left-1/2 flex items-center justify-center px-[6%] text-center opacity-90"
            style={{
              top: "77.5%", width: "92%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.lore.size}cqw`,
              letterSpacing: ty.lore.ls,
              ...engrave,
              textTransform: "none",
            }}
          >
            <span className="line-clamp-1">{lore}</span>
          </div>

          {/* footer caption */}
          <div
            className="absolute flex w-full items-center justify-center gap-[1.2cqw] opacity-70"
            style={{ top: "92%", transform: "translateY(-50%)" }}
          >
            <span style={{ width: "5cqw", height: "0.09cqw", background: m.bright, opacity: 0.6 }} />
            <span
              className="whitespace-nowrap"
              style={{ fontSize: `${ty.lore.size * 0.8}cqw`, letterSpacing: "0.3em", ...engrave, opacity: 0.75 }}
            >
              {CARD_LABEL.rating[locale]} · {c.overall}
            </span>
            <span style={{ width: "5cqw", height: "0.09cqw", background: m.bright, opacity: 0.6 }} />
          </div>
        </div>

        {/* ============================================================= BACK */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[6.5%]"
          style={{
            aspectRatio: "1128 / 1394",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: `radial-gradient(120% 90% at 50% 42%, ${m.base} 0%, ${m.deep} 60%, #08090c 100%)`,
          }}
        >
          <CardChrome rarity={c.rarity} uid={`${uid}-b`} />
          <div className="relative flex h-full w-full flex-col items-center justify-center">
            <CardSigil rarity={c.rarity} uid={uid} />
            <span
              className="mt-[3cqw] font-bold leading-none opacity-90"
              style={{ fontSize: `${ty.rarityPill.size * 1.1}cqw`, letterSpacing: ty.rarityPill.ls, ...engrave }}
            >
              {RARITY_LABEL[c.rarity][locale]}
            </span>
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${m.glow}, transparent 65%)`,
              mixBlendMode: "screen",
              opacity: flipping ? 0.5 : 0,
            }}
          />
        </div>
      </Shell>
    </div>
  );
}
