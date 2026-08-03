import { useEffect, useState } from "react";
import type { Character } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { elementOf } from "@/lib/elements";
import { ELEMENT_PATH } from "@/components/ElementIcon";
import { CARD_BACK } from "@/lib/card-backs";
import { framingOf } from "@/lib/portrait";
import { RARITY_LABEL } from "@/lib/rarity";
import {
  CARD_LABEL, localizeArc, localizeBlade, localizeDivision,
  localizeFaction, localizeRank,
} from "@/lib/card-i18n";
import commonTpl from "@/assets/cards/common.jpeg.asset.json";
import uncommonTpl from "@/assets/cards/uncommon.jpeg.asset.json";
import rareTpl from "@/assets/cards/rare.jpeg.asset.json";
import epicTpl from "@/assets/cards/epic.jpeg.asset.json";
import legendaryTpl from "@/assets/cards/legendary.jpeg.asset.json";
import mythicTpl from "@/assets/cards/mythic.jpeg.asset.json";
import type { Rarity } from "@/types/character";

const TEMPLATE: Record<Rarity, string> = {
  common: commonTpl.url,
  uncommon: uncommonTpl.url,
  rare: rareTpl.url,
  epic: epicTpl.url,
  legendary: legendaryTpl.url,
  mythic: mythicTpl.url,
};

/** Ink colour used for the engraved typography, per rarity. */
const INK: Record<Rarity, string> = {
  common: "#e4e9f0",
  uncommon: "#a8f0bd",
  rare: "#a9d4ff",
  epic: "#dcb0ff",
  legendary: "#ffdf9b",
  mythic: "#ffb0a2",
};
const GLOW: Record<Rarity, string> = {
  common: "rgba(190,205,225,0.55)",
  uncommon: "rgba(64,220,120,0.6)",
  rare: "rgba(70,150,255,0.6)",
  epic: "rgba(170,90,255,0.6)",
  legendary: "rgba(255,190,70,0.6)",
  mythic: "rgba(255,60,45,0.6)",
};

/**
 * Per-language typography. Latin uses Cinzel small-caps with wide tracking;
 * Arabic uses Amiri at a larger optical size with no tracking (tracking breaks
 * Arabic joining) and roomier line-height. Never one layout for both.
 */
const TYPO = {
  en: {
    family: "'Cinzel', serif",
    upper: "uppercase" as const,
    rarity: { size: 3.3, ls: "0.18em" },
    caption: { size: 1.55, ls: "0.38em" },
    label: { size: 1.5, ls: "0.24em" },
    value: { size: 2.05, ls: "0.03em", lh: 1.15 },
    nameLh: 1.08,
    nameSize: (n: number) => (n > 26 ? 2.7 : n > 20 ? 3.1 : n > 14 ? 3.6 : 4.3),
    nameLs: "0.05em",
  },
  ar: {
    family: "'Amiri', 'Cairo', serif",
    upper: "none" as const,
    rarity: { size: 3.9, ls: "0" },
    caption: { size: 1.95, ls: "0" },
    label: { size: 1.8, ls: "0" },
    value: { size: 2.25, ls: "0", lh: 1.45 },
    nameLh: 1.3,
    nameSize: (n: number) => (n > 26 ? 2.9 : n > 20 ? 3.4 : n > 14 ? 3.9 : 4.5),
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
  const [showBack, setShowBack] = useState(faceDown);
  const [flipping, setFlipping] = useState(false);
  useEffect(() => { setShowBack(faceDown); }, [faceDown, character.id]);
  const c = character;
  const ink = INK[c.rarity];
  const glow = GLOW[c.rarity];
  const tpl = TEMPLATE[c.rarity];
  const back = CARD_BACK[c.rarity];
  const el = elementOf(c.slug);
  const f = framingOf(c.slug);
  const ty = TYPO[locale];
  const rtl = locale === "ar";

  const name = c.name[locale];
  const nameSize = ty.nameSize(name.length);

  const dash = rtl ? "—" : "—";
  const rows: { label: string; value: string }[] = [
    {
      label: CARD_LABEL.affiliation[locale],
      value: c.faction ? localizeFaction(c.faction, locale) : dash,
    },
    {
      label: CARD_LABEL.rank[locale],
      value: c.rank
        ? localizeRank(c.rank, locale)
        : c.division
          ? localizeDivision(c.division, locale)
          : dash,
    },
    {
      label: CARD_LABEL.zanpakuto[locale],
      value: c.bankai
        ? localizeBlade(c.bankai, locale)
        : c.shikai
          ? localizeBlade(c.shikai, locale)
          : dash,
    },
    {
      label: CARD_LABEL.arc[locale],
      value: c.arc ? localizeArc(c.arc, locale) : dash,
    },
  ];

  const engrave = {
    color: ink,
    textShadow: `0 0.08cqw 0.1cqw rgba(0,0,0,0.9), 0 0 0.9cqw ${glow}, 0 0 2.2cqw ${glow}`,
    fontFamily: ty.family,
    textTransform: ty.upper,
  } as const;

  /** label rows sit above the divider, values just beneath the label. */
  const LABEL_Y = [27.6, 39.2, 50.8, 62.4];
  const VALUE_Y = [30.9, 42.5, 54.1, 65.7];

  const toggle = () => {
    if (!interactive) return;
    setFlipping(true);
    window.setTimeout(() => setFlipping(false), 850);
    setShowBack((v) => {
      if (v && onReveal) onReveal();
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
      <button
        type="button"
        aria-label={name}
        onClick={toggle}
        className="group relative block w-full cursor-pointer hover:-translate-y-1"
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
            background: `radial-gradient(ellipse at center, ${glow}, transparent 70%)`,
            opacity: flipping ? 1 : 0.7,
          }}
        />

        {/* FRONT */}
        <div
          className="relative w-full overflow-hidden rounded-[3.5%] bg-black"
          style={{
            aspectRatio: "1128 / 1394",
            backfaceVisibility: "hidden",
            opacity: showBack ? 0 : 1,
            transition: "opacity 0.35s ease-out 0.3s",
          }}
        >
          {/* portrait, framed inside the art window */}
          {c.image ? (
            <div
              className="absolute overflow-hidden"
              style={{
                left: "8.7%",
                top: "22.4%",
                width: "44.4%",
                height: "52.6%",
                borderRadius: "9% / 7%",
                WebkitMaskImage:
                  "radial-gradient(120% 110% at 50% 45%, #000 62%, rgba(0,0,0,0.55) 84%, transparent 100%)",
                maskImage:
                  "radial-gradient(120% 110% at 50% 45%, #000 62%, rgba(0,0,0,0.55) 84%, transparent 100%)",
              }}
            >
              <img
                src={c.image}
                alt={name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                style={{ objectPosition: `${f.x}% ${f.y}%`, transform: `scale(${f.scale})` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(120% 90% at 50% 100%, ${glow}, transparent 55%)`,
                  mixBlendMode: "screen",
                  opacity: 0.35,
                }}
              />
            </div>
          ) : null}

          {/* the official template sits above the art, so the frame stays intact */}
          <img
            src={tpl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ mixBlendMode: "lighten" }}
          />

          {/* rarity name + caption */}
          <span
            className="absolute flex items-center justify-center text-center font-bold leading-none"
            style={{
              left: "50%", top: "8.8%", width: "27%", height: "4.6%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.rarity.size}cqw`,
              letterSpacing: ty.rarity.ls,
              ...engrave,
            }}
          >
            {RARITY_LABEL[c.rarity][locale]}
          </span>
          <span
            className="absolute flex items-center justify-center text-center leading-none opacity-90"
            style={{
              left: "50%", top: "14.2%", width: "26%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.caption.size}cqw`,
              letterSpacing: ty.caption.ls,
              ...engrave,
            }}
          >
            {CARD_LABEL.rarity[locale]}
          </span>

          {/* element icon, engraved into its medallion */}
          <span
            className="absolute"
            style={{
              left: "13.05%",
              top: "9.2%",
              width: "8.6%",
              transform: "translate(-50%, -50%)",
              filter: `drop-shadow(0 0 0.8cqw ${glow}) drop-shadow(0 0.1cqw 0.1cqw rgba(0,0,0,0.9))`,
            }}
          >
            <svg viewBox="0 0 64 64" className="h-auto w-full">
              <defs>
                <linearGradient id={`el-${c.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff8e6" />
                  <stop offset="45%" stopColor={ink} />
                  <stop offset="100%" stopColor={ink} stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <path d={ELEMENT_PATH[el]} fill={`url(#el-${c.id})`} />
            </svg>
          </span>
          <span
            className="absolute flex items-center justify-center text-center leading-none opacity-90"
            style={{
              left: "13.5%", top: "17.6%", width: "20%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.caption.size}cqw`,
              letterSpacing: ty.caption.ls,
              ...engrave,
            }}
          >
            {CARD_LABEL.element[locale]}
          </span>

          {/* name */}
          <span
            className="absolute flex items-center justify-center px-[1cqw] text-center font-bold leading-none"
            style={{
              left: "59.4%",
              top: "15.6%",
              width: "30.4%",
              height: "7.2%",
              fontSize: `${nameSize}cqw`,
              lineHeight: ty.nameLh,
              letterSpacing: ty.nameLs,
              ...engrave,
            }}
          >
            <span className="line-clamp-2">{name}</span>
          </span>

          {/* stat rows — label above, value beneath, always aligned to the
              inner edge of the plaque in both writing directions */}
          {rows.map((r, i) => (
            <span key={r.label} aria-hidden={false}>
              <span
                className="absolute flex items-center justify-end leading-none opacity-80"
                style={{
                  left: "69%", top: `${LABEL_Y[i]}%`, width: "25.5%", height: "3.4%",
                  transform: "translateY(-50%)",
                  fontSize: `${ty.label.size}cqw`,
                  letterSpacing: ty.label.ls,
                  ...engrave,
                }}
              >
                {r.label}
              </span>
              <span
                className="absolute flex items-center justify-end text-end leading-none"
                style={{
                  left: "69%", top: `${VALUE_Y[i]}%`, width: "25.5%", height: "4.2%",
                  transform: "translateY(-50%)",
                  fontSize: `${ty.value.size}cqw`,
                  letterSpacing: ty.value.ls,
                  lineHeight: ty.value.lh,
                  ...engrave,
                  textTransform: "none",
                }}
              >
                <span className="line-clamp-2 w-full overflow-hidden">{r.value}</span>
              </span>
            </span>
          ))}

          {/* rating + stars captions */}
          <span
            className="absolute flex items-center justify-center text-center leading-none opacity-90"
            style={{
              left: "30.4%", top: "82.6%", width: "22%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.caption.size}cqw`,
              letterSpacing: ty.caption.ls,
              ...engrave,
            }}
          >
            {CARD_LABEL.rating[locale]}
          </span>
          <span
            className="absolute flex items-center justify-center text-center leading-none opacity-90"
            style={{
              left: "70%", top: "82.6%", width: "22%",
              transform: "translate(-50%, -50%)",
              fontSize: `${ty.caption.size}cqw`,
              letterSpacing: ty.caption.ls,
              ...engrave,
            }}
          >
            {CARD_LABEL.stars[locale]}
          </span>

          {/* rating */}
          <span
            className="absolute flex items-center justify-center font-black leading-none"
            style={{
              left: "30.4%",
              top: "89.4%",
              width: "19%",
              transform: "translate(-50%, -50%)",
              fontSize: "9.2cqw",
              ...engrave,
              fontFamily: "'Cinzel', serif",
            }}
          >
            {c.overall}
          </span>

          {/* rarity motes */}
          {[14, 38, 62, 86].map((x, i) => (
            <span
              key={x}
              aria-hidden
              className="pointer-events-none absolute rounded-full"
              style={{
                left: `${x}%`,
                bottom: "-4%",
                width: "0.9cqw",
                height: "0.9cqw",
                background: `radial-gradient(circle, ${ink}, transparent 70%)`,
                animation: `reiatsu-float ${13 + i * 3}s linear ${i * 2.5}s infinite`,
                ["--drift" as string]: `${(i % 2 ? -1 : 1) * 30}px`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* BACK — official card back for this rarity */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[3.5%] bg-black"
          style={{
            aspectRatio: "1128 / 1394",
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <img src={back} alt="" aria-hidden className="h-full w-full object-cover" />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${glow}, transparent 65%)`,
              mixBlendMode: "screen",
              opacity: flipping ? 0.5 : 0,
            }}
          />
        </div>
      </button>
    </div>
  );
}
