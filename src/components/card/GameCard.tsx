import { useMemo, useState } from "react";
import { Sun, Moon, Leaf, Flame, Droplet, Zap } from "lucide-react";
import type { Character, ElementKey } from "@/types/character";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/rarity";
import { ELEMENT_META } from "@/lib/elements";
import { useI18n } from "@/lib/i18n";
import { CARD_FRONT, CARD_BACK, RARITY_STARS } from "./frames";

const ICONS = { sun: Sun, moon: Moon, leaf: Leaf, flame: Flame, drop: Droplet, bolt: Zap };

function ElementIcon({ element, className }: { element: ElementKey; className?: string }) {
  const Icon = ICONS[ELEMENT_META[element].icon as keyof typeof ICONS];
  return <Icon className={className} strokeWidth={2.2} />;
}

const LABELS = {
  rank: { en: "Rank", ar: "المرتبة" },
  division: { en: "Division", ar: "الفرقة" },
  affiliation: { en: "Affiliation", ar: "انتماء" },
  arc: { en: "Arc", ar: "القصة" },
  element: { en: "Element", ar: "العنصر" },
  zanpakuto: { en: "Zanpakutō", ar: "الزنباكتو" },
};

export interface GameCardProps {
  character: Character;
  /** Renders the official card back until flipped. */
  faceDown?: boolean;
  onFlip?: () => void;
  /** Zoom-in highlight when a card is opened. */
  opening?: boolean;
  className?: string;
}

export function GameCard({ character: c, faceDown = false, onFlip, opening, className }: GameCardProps) {
  const { locale } = useI18n();
  const [pressed, setPressed] = useState(false);
  const rarityColor = RARITY_COLOR[c.rarity];
  const element = c.element ?? "shadow";
  const el = ELEMENT_META[element];
  const stars = RARITY_STARS[c.rarity];

  const particles = useMemo(
    () =>
      Array.from({ length: c.rarity === "mythic" ? 16 : c.rarity === "legendary" ? 12 : 8 }, (_, i) => ({
        left: (i * 37) % 92 + 4,
        delay: (i * 0.53) % 4,
        dur: 4 + ((i * 7) % 5),
        size: 2 + (i % 3),
      })),
    [c.rarity],
  );

  const meta: [string, string | null | undefined][] = [
    [LABELS.rank[locale], c.rank],
    [LABELS.division[locale], c.division],
    [LABELS.affiliation[locale], c.faction],
    [LABELS.arc[locale], c.arc],
    [LABELS.element[locale], el[locale]],
    [LABELS.zanpakuto[locale], c.shikai],
  ];

  return (
    <div
      className={"ba-card " + (className ?? "")}
      data-rarity={c.rarity}
      data-open={opening ? "true" : undefined}
      style={
        {
          "--rc": rarityColor,
          "--ec": el.color,
          "--eg": el.glow,
        } as React.CSSProperties
      }
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={faceDown ? onFlip : undefined}
      role={faceDown ? "button" : undefined}
      tabIndex={faceDown ? 0 : undefined}
      onKeyDown={faceDown ? (e) => { if (e.key === "Enter" || e.key === " ") onFlip?.(); } : undefined}
    >
      <div className={"ba-card-inner" + (faceDown ? " is-down" : "") + (pressed ? " is-pressed" : "")}>
        {/* BACK */}
        <div className="ba-face ba-back">
          <img src={CARD_BACK[c.rarity]} alt="" className="ba-frame" draggable={false} />
        </div>

        {/* FRONT */}
        <div className="ba-face ba-front">
          <div className="ba-art">
            {c.image ? (
              <img src={c.image} alt={c.name[locale]} loading="lazy" draggable={false} />
            ) : (
              <span className="ba-initials">
                {c.name.en.split(" ").slice(0, 2).map((n) => n[0]).join("")}
              </span>
            )}
            <span className="ba-art-veil" />
          </div>

          <img src={CARD_FRONT[c.rarity]} alt="" className="ba-frame" draggable={false} />

          {/* element badge — top left */}
          <span className="ba-element" aria-label={el[locale]}>
            <ElementIcon element={element} className="ba-element-icon" />
          </span>

          {/* stars — right rail */}
          <span className="ba-stars">
            {Array.from({ length: 6 }).map((_, i) => (
              <i key={i} className={"ba-star" + (i < stars ? " on" : "")} />
            ))}
          </span>

          {/* OVR — left notch */}
          <span className="ba-ovr">{c.overall}</span>

          {/* rarity — right notch */}
          <span className="ba-rarity">{RARITY_LABEL[c.rarity][locale]}</span>

          {/* name plate */}
          <div className="ba-plate">
            <h3 className="ba-name">{c.name[locale]}</h3>
            <p className="ba-sub">
              {c.race ?? "—"} · {c.faction ?? "—"}
            </p>
            <dl className="ba-meta">
              {meta.map(([k, v], i) => (
                <div key={i} className="ba-meta-cell">
                  <dt>{k}</dt>
                  <dd>{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* reiatsu particles */}
          <span className="ba-particles" aria-hidden>
            {particles.map((p, i) => (
              <i
                key={i}
                style={{
                  left: `${p.left}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.dur}s`,
                  width: p.size,
                  height: p.size,
                }}
              />
            ))}
          </span>

          <span className="ba-sheen" aria-hidden />
          <span className="ba-aura" aria-hidden />
        </div>
      </div>
    </div>
  );
}
