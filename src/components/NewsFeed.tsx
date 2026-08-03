import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n, type TKey } from "@/lib/i18n";
import { fetchNews, lastSeenNewsId, markNewsSeen, type NewsCategory, type NewsItem } from "@/lib/news";

const CAT_LABEL: Record<NewsCategory, TKey> = {
  update: "newsCatUpdate",
  characters: "newsCatCharacters",
  balance: "newsCatBalance",
  event: "newsCatEvent",
  cosmetics: "newsCatCosmetics",
  soon: "newsCatSoon",
  soulduel: "newsCatSoulduel",
  leaderboard: "newsCatLeaderboard",
};

const CAT_TONE: Record<NewsCategory, string> = {
  update: "border-white/20 bg-white/10 text-foreground",
  characters: "border-accent/40 bg-accent/10 text-accent",
  balance: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  event: "border-primary/40 bg-primary/10 text-primary",
  cosmetics: "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-200",
  soon: "border-accent/40 bg-accent/10 text-accent",
  soulduel: "border-[oklch(0.7_0.15_300)]/40 bg-[oklch(0.7_0.15_300)]/10 text-[oklch(0.82_0.13_300)]",
  leaderboard: "border-primary/50 bg-primary/15 text-primary",
};

function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: () => fetchNews(20),
    staleTime: 5 * 60_000,
  });
}

function fmt(iso: string, locale: "en" | "ar") {
  try {
    return new Date(iso).toLocaleDateString(locale === "ar" ? "ar" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/** Small dismissible notification for the newest announcement. */
export function NewsNotification({ className = "" }: { className?: string }) {
  const { t, locale } = useI18n();
  const { data } = useNews();
  const [seen, setSeen] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSeen(lastSeenNewsId());
    setReady(true);
  }, []);

  const latest = useMemo<NewsItem | null>(() => {
    if (!data?.length) return null;
    const sorted = [...data].sort(
      (a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt),
    );
    return sorted[0] ?? null;
  }, [data]);

  if (!ready || !latest || seen === latest.id) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary/40 bg-primary/10 p-4 backdrop-blur-md ${className}`}
      style={{ animation: "card-in 0.5s ease-out both" }}
      role="status"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="font-display text-2xl text-primary">✦</span>
        <div className="min-w-0 flex-1">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
            {t("newsNew")} · {t(CAT_LABEL[latest.category] ?? "newsCatUpdate")}
          </span>
          <p className="mt-1 font-display text-sm font-bold">{latest.title[locale]}</p>
          <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
            {latest.body[locale]}
          </p>
        </div>
        <button
          onClick={() => { markNewsSeen(latest.id); setSeen(latest.id); }}
          className="tactile shrink-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
        >
          {t("newsDismiss")}
        </button>
      </div>
    </div>
  );
}

/** Full news list — newest first, pinned on top. */
export function NewsFeed({ className = "", limit = 6 }: { className?: string; limit?: number }) {
  const { t, locale } = useI18n();
  const { data, isLoading } = useNews();
  const [expanded, setExpanded] = useState(false);

  const items = useMemo(() => {
    const rows = [...(data ?? [])].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.publishedAt) - +new Date(a.publishedAt);
    });
    return expanded ? rows : rows.slice(0, limit);
  }, [data, expanded, limit]);

  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-start font-display text-lg font-bold">{t("news")}</h2>
          <p className="text-xs text-muted-foreground">{t("newsSubtitle")}</p>
        </div>
        <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          {t("serverTime")}
        </span>
      </div>

      <div className="mt-3 space-y-3">
        {isLoading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-muted-foreground">
            {t("newsEmpty")}
          </div>
        )}
        {items.map((n, i) => (
          <article
            key={n.id}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-4 text-start backdrop-blur-md"
            style={{ animation: `card-in 0.45s ${Math.min(i, 6) * 0.04}s ease-out both` }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] ${CAT_TONE[n.category] ?? CAT_TONE.update}`}
              >
                {t(CAT_LABEL[n.category] ?? "newsCatUpdate")}
              </span>
              {n.pinned && (
                <span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-primary">★</span>
              )}
              <span className="ms-auto text-[10px] uppercase tracking-widest text-muted-foreground">
                {fmt(n.publishedAt, locale)}
              </span>
            </div>
            <h3 className="mt-2 font-display text-base font-bold">{n.title[locale]}</h3>
            <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
              {n.body[locale]}
            </p>
          </article>
        ))}
      </div>

      {!expanded && (data?.length ?? 0) > limit && (
        <button
          onClick={() => setExpanded(true)}
          className="tactile mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
        >
          {t("viewAll")}
        </button>
      )}
    </section>
  );
}
