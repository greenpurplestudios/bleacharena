import { useMemo, useState } from "react";
import type { Character } from "@/types/character";
import { useI18n } from "@/lib/i18n";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { RARITY_COLOR } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import { DUEL_ROSTER } from "@/data/soul-duel-roster";
import { costOf } from "@/lib/soul-duel/engine";
import { abilityOf } from "@/lib/soul-duel/abilities";
import { DECK_CARDS, autoDeck, averageReiatsu, deckCharacters, saveDeck } from "@/lib/soul-duel/deck";

function CostBadge({ cost }: { cost: number }) {
  return (
    <span
      aria-hidden
      className="absolute -top-1 start-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary font-display text-[10px] font-black text-primary-foreground shadow-lg"
    >
      {cost}
    </span>
  );
}

/** Twelve slots in two rows of six, plus the full Soul Duel roster below. */
export function DeckBuilder({
  deck,
  onChange,
}: {
  deck: string[];
  onChange: (slugs: string[]) => void;
}) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const chosen = useMemo(() => deckCharacters(deck), [deck]);
  const avg = averageReiatsu(chosen);
  const full = chosen.length === DECK_CARDS;

  const commit = (slugs: string[]) => {
    onChange(slugs);
    saveDeck(slugs);
    setSaved(slugs.length === DECK_CARDS);
  };

  const toggle = (c: Character) => {
    haptic("tap");
    if (deck.includes(c.slug)) {
      play("tap");
      commit(deck.filter((s) => s !== c.slug));
      return;
    }
    if (deck.length >= DECK_CARDS) { play("error"); return; }
    play("pick");
    commit([...deck, c.slug]);
  };

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
            {t("sdDeckBuilder")}
          </h2>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{t("sdDeckBuilderDesc")}</p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen((o) => !o); play("tap"); }}
          aria-expanded={open}
          className="tactile shrink-0 rounded-xl border border-accent/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-accent rtl:tracking-normal"
        >
          {open ? t("sdDeckDone") : t("sdDeckEdit")}
        </button>
      </div>

      {/* stats */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 font-display text-[11px] font-black">
          {chosen.length}/{DECK_CARDS}
        </span>
        <span className="rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 font-display text-[11px] font-black text-accent">
          {t("sdAvgReiatsu")}: {avg || "—"}
        </span>
        {saved && full ? (
          <span className="text-[11px] font-bold text-primary">{t("sdDeckSaved")}</span>
        ) : !full ? (
          <span className="text-[11px] text-muted-foreground">{t("sdDeckIncomplete")}</span>
        ) : null}
      </div>

      {/* 2 rows of 6 */}
      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {Array.from({ length: DECK_CARDS }).map((_, i) => {
          const c = chosen[i];
          if (!c) {
            return (
              <div
                key={`slot-${i}`}
                className="w-full rounded-lg border border-dashed border-white/10 bg-white/[0.02]"
                style={{ aspectRatio: "1128 / 1394" }}
              />
            );
          }
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => toggle(c)}
              className="tactile relative"
              aria-label={c.name[locale]}
            >
              <CharacterCard character={c} interactive={false} className="w-full" />
              <CostBadge cost={costOf(c)} />
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => { commit(autoDeck()); play("reveal"); haptic("draft"); }}
          className="tactile flex-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 font-display text-[10px] font-black uppercase tracking-widest text-primary rtl:tracking-normal"
        >
          {t("sdDeckAuto")}
        </button>
        <button
          type="button"
          onClick={() => { commit([]); setSaved(false); play("skip"); }}
          className="tactile flex-1 rounded-xl border border-white/12 bg-white/5 px-3 py-2 font-display text-[10px] font-black uppercase tracking-widest text-muted-foreground rtl:tracking-normal"
        >
          {t("sdDeckClear")}
        </button>
      </div>

      {open ? (
        <div className="mt-5" style={{ animation: "card-in 0.35s ease-out both" }}>
          <p className="font-display text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground rtl:tracking-normal">
            {t("sdDeckRoster")}
          </p>
          <ul className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {DUEL_ROSTER.map((c) => {
              const on = deck.includes(c.slug);
              const ability = abilityOf(c.slug);
              return (
                <li key={c.slug}>
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    aria-pressed={on}
                    className="tactile w-full rounded-xl border p-1 text-start transition-transform"
                    style={{
                      borderColor: on ? RARITY_COLOR[c.rarity] : "oklch(1 0 0 / 0.1)",
                      boxShadow: on ? `0 0 16px -6px ${RARITY_COLOR[c.rarity]}` : undefined,
                      opacity: !on && deck.length >= DECK_CARDS ? 0.45 : 1,
                    }}
                  >
                    <span className="relative block">
                      <CharacterCard character={c} interactive={false} className="w-full" />
                      <CostBadge cost={costOf(c)} />
                    </span>
                    <span className="mt-1 block truncate text-center text-[9px] leading-tight text-muted-foreground">
                      {ability ? ability.name[locale] : c.name[locale]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}