import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { haptic } from "@/lib/haptics";
import { playAnnounce } from "@/lib/sound";
import { RARITY_COLOR } from "@/lib/rarity";
import { ElementIcon, ELEMENT_COLOR } from "@/components/ElementIcon";
import { elementOf } from "@/lib/elements";
import type { Character } from "@/types/character";
import type { AbilityDef } from "@/lib/soul-duel/abilities";

export interface Announcement {
  id: string;
  character: Character;
  ability: AbilityDef;
}

/**
 * Two-second banner the first time each unique ability fires in a match, so a
 * new player learns what just happened without losing the board.
 */
export function AbilityAnnounce({
  item,
  onDone,
}: {
  item: Announcement;
  onDone: () => void;
}) {
  const { t, locale } = useI18n();
  const done = useRef(false);
  const color = RARITY_COLOR[item.character.rarity];
  const el = elementOf(item.character.slug);

  useEffect(() => {
    done.current = false;
    playAnnounce();
    haptic("tap");
    const timer = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDone();
    }, 2100);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-2 z-[65] flex justify-center px-3"
      role="status"
      aria-live="polite"
    >
      <div
        className="flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-background/92 p-2.5 backdrop-blur-md"
        style={{
          animation: "announce-in 2.1s ease-out both",
          borderColor: `${color}66`,
          boxShadow: `0 0 34px -12px ${color}`,
        }}
      >
        {item.character.image ? (
          <img
            src={item.character.image}
            alt=""
            aria-hidden
            className="h-11 w-11 shrink-0 rounded-xl border object-cover"
            style={{ borderColor: `${color}55`, objectPosition: "50% 22%" }}
          />
        ) : null}
        <div className="min-w-0 flex-1 text-start">
          <p className="text-[8px] font-black uppercase tracking-[0.28em] text-accent rtl:tracking-normal">
            {t("sdAbilityActivated")}
          </p>
          <p className="truncate font-display text-sm font-black" style={{ color }}>
            {item.ability.name[locale]}
          </p>
          <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
            {item.ability.description[locale]}
          </p>
        </div>
        <ElementIcon element={el} className="h-5 w-5 shrink-0" color={ELEMENT_COLOR[el]} />
      </div>
    </div>
  );
}
