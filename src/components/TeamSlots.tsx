import type { Character } from "@/types/character";
import { RARITY_COLOR } from "@/lib/rarity";
import { useI18n } from "@/lib/i18n";

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
            <li
              key={i}
              className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2 text-center transition-all"
              style={{
                boxShadow: c ? `0 0 0 1px ${color} inset, 0 10px 30px -12px ${color}` : undefined,
                animation: c ? "card-in 0.4s ease-out both" : undefined,
              }}
            >
              <span className="absolute top-1 left-1 rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground">
                {t("slot")} {i + 1}
              </span>
              {c ? (
                <>
                  <span
                    className="mt-2 font-display text-2xl font-black"
                    style={{ color, textShadow: `0 0 16px ${color}` }}
                  >
                    {c.name.en.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[10px] leading-tight font-medium">
                    {c.name[locale]}
                  </span>
                </>
              ) : (
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  {t("empty")}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}