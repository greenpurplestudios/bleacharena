import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { characters } from "@/data/characters";
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER } from "@/lib/rarity";
import { useI18n } from "@/lib/i18n";
import type { Rarity } from "@/types/character";

export const Route = createFileRoute("/_authenticated/characters")({
  head: () => ({
    meta: [
      { title: "Characters — Bleach Arena" },
      { name: "description", content: "Browse every Bleach Arena character. Search, filter by rarity, sort by rating or name." },
      { property: "og:title", content: "Bleach Arena — Character Roster" },
      { property: "og:description", content: "Every fighter in the roster with rarity and rating." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CharactersPage,
});

type SortKey = "rating" | "name";

function CharactersPage() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [sort, setSort] = useState<SortKey>("rating");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = characters.slice();
    if (rarity !== "all") list = list.filter((c) => c.rarity === rarity);
    if (q) list = list.filter(
      (c) => c.name.en.toLowerCase().includes(q) || c.name.ar.includes(q),
    );
    if (sort === "rating") list.sort((a, b) => b.overall - a.overall);
    else list.sort((a, b) => a.name.en.localeCompare(b.name.en));
    return list;
  }, [query, rarity, sort]);

  return (
    <>
      <ReiatsuBackground count={18} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div style={{ animation: "card-in 0.5s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {t("charactersDesc")}
          </span>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
            {t("characters")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("totalCount")}: {characters.length}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm outline-none focus:border-primary/60"
          />
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip active={rarity === "all"} onClick={() => setRarity("all")}>
              {t("all")}
            </FilterChip>
            {RARITY_ORDER.slice().reverse().map((r) => (
              <FilterChip
                key={r}
                active={rarity === r}
                onClick={() => setRarity(r)}
                color={RARITY_COLOR[r]}
              >
                {RARITY_LABEL[r][locale]}
              </FilterChip>
            ))}
            <span className="mx-1 h-5 w-px bg-white/10" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {t("sortBy")}
            </span>
            <FilterChip active={sort === "rating"} onClick={() => setSort("rating")}>
              {t("sortRating")}
            </FilterChip>
            <FilterChip active={sort === "name"} onClick={() => setSort("name")}>
              {t("sortName")}
            </FilterChip>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((c, i) => {
              const color = RARITY_COLOR[c.rarity];
              return (
                <li
                  key={c.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md transition-transform hover:-translate-y-0.5"
                  style={{
                    boxShadow: `0 0 0 1px ${color.replace(")", " / 0.35)")} inset`,
                    animation: `card-in 0.35s ${Math.min(i, 12) * 0.02}s ease-out both`,
                  }}
                >
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden"
                    style={{
                      background:
                        `radial-gradient(circle at 30% 20%, ${color.replace(")", " / 0.35)")}, transparent 60%),` +
                        "linear-gradient(160deg, oklch(0.2 0.02 260), oklch(0.12 0.02 260))",
                    }}
                  >
                    {c.image ? (
                      <img src={c.image} alt={c.name[locale]} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center font-display text-5xl font-black"
                        style={{ color, textShadow: `0 0 20px ${color}` }}
                      >
                        {c.name.en.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                      </span>
                    )}
                    <span
                      className="absolute right-2 top-2 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                      style={{ color, background: color.replace(")", " / 0.15)"), border: `1px solid ${color.replace(")", " / 0.5)")}` }}
                    >
                      {RARITY_LABEL[c.rarity][locale]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <p className="min-w-0 truncate text-sm font-semibold">{c.name[locale]}</p>
                    <span className="font-display text-lg font-black text-primary">{c.overall}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}

function FilterChip({
  active, onClick, children, color,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
      }`}
      style={active && color ? { borderColor: color, color } : undefined}
    >
      {children}
    </button>
  );
}