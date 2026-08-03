import type { Character } from "@/types/character";
import { RARITY_COLOR } from "@/lib/rarity";
import { useI18n } from "@/lib/i18n";
import { CharacterCard } from "@/components/CharacterCard";

export function TeamSlots({ team }: { team: (Character | null)[] }) {
  const { t, locale } = useI18n();
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
          {t("team")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {team.filter(Boolean).length} / {team.length}
        </span>
      </div>
      <ol className="grid grid-cols-5 gap-2 sm:gap-3">
        {team.map((c, i) => {
          const color = c ? RARITY_COLOR[c.rarity] : "oklch(1 0 0 / 0.15)";
          return (
            <li key={i} className="relative">
              {c ? (
                <>
                  <CharacterCard character={c} interactive={false} className="w-full" />
                  <p className="mt-1 line-clamp-1 text-center text-[10px] font-semibold leading-tight">
                    {c.name[locale]}
                  </p>
                </>
              ) : (
                <div
                  className="flex aspect-[1128/1394] w-full items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] text-center"
                  style={{ boxShadow: `0 0 0 1px ${color} inset` }}
                >
                  <span className="px-1 text-[9px] uppercase tracking-widest text-muted-foreground/60">
                    {t("slot")} {i + 1}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}