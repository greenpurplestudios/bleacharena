import { supabase } from "@/integrations/supabase/client";

export type NewsCategory =
  | "update" | "characters" | "balance" | "event"
  | "cosmetics" | "soon" | "soulduel" | "leaderboard";

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: { en: string; ar: string };
  body: { en: string; ar: string };
  pinned: boolean;
  publishedAt: string;
}

type NewsRow = {
  id: string;
  category: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  pinned: boolean;
  published_at: string;
};

export async function fetchNews(limit = 20): Promise<NewsItem[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_news", { p_limit: limit });
  if (error || !data) return [];
  return (data as NewsRow[]).map((r) => ({
    id: r.id,
    category: (r.category as NewsCategory) ?? "update",
    title: { en: r.title_en, ar: r.title_ar },
    body: { en: r.body_en, ar: r.body_ar },
    pinned: !!r.pinned,
    publishedAt: r.published_at,
  }));
}

const SEEN_KEY = "ba_news_seen_id";

export function lastSeenNewsId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(SEEN_KEY);
}

export function markNewsSeen(id: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(SEEN_KEY, id);
}
