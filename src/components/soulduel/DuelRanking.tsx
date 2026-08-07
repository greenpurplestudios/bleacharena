import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { NameFrame } from "@/components/NameFrame";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { fetchDuelLeaderboard } from "@/lib/soul-duel/pvp";

/** Weekly online Soul Duel standings. */
export function DuelRanking() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["duel-ranks"],
    queryFn: () => fetchDuelLeaderboard(50),
    staleTime: 30_000,
  });

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-card/50 p-5 backdrop-blur-md">
      <h2 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground rtl:tracking-normal">
        {t("sdDuelRanking")}
      </h2>
      <p className="mt-1 text-[11px] text-muted-foreground">{t("sdRankingDesc")}</p>
      <ol className="mt-4 space-y-2">
        {isLoading ? (
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-xs text-muted-foreground">
            {t("loadingBoard")}
          </li>
        ) : null}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <li className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-xs text-muted-foreground">
            {t("sdNoRanks")}
          </li>
        ) : null}
        {data?.map((r, i) => (
          <li
            key={r.user_id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 font-display text-xs font-black text-muted-foreground">
              {i + 1}
            </span>
            <PlayerAvatar
              characterId={r.avatar_character_id}
              size={30}
              fallback={(r.username ?? "?")[0]?.toUpperCase()}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              <Link to="/profile/$userId" params={{ userId: r.user_id }} className="hover:opacity-90">
                <NameFrame frame={r.name_frame}>
                  <span
                    className="truncate"
                    style={r.username_color ? { color: r.username_color } : undefined}
                  >
                    {r.username ?? "—"}
                  </span>
                </NameFrame>
              </Link>
              <span className="block text-[10px] text-muted-foreground">
                {t("sdRecord")}: {r.wins}/{r.losses}/{r.draws}
              </span>
            </span>
            <span className="font-display text-base font-black text-glow-orange tabular-nums">
              {r.rating}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}