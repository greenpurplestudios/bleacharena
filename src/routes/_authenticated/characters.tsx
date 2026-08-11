import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { characters } from "@/data/characters";
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER } from "@/lib/rarity";
import { useI18n } from "@/lib/i18n";
import { CharacterCard } from "@/components/CharacterCard";
import { ElementGuide } from "@/components/ElementGuide";
import { ElementIcon, ELEMENT_COLOR } from "@/components/ElementIcon";
import { elementOf, ELEMENT_LABEL, type ElementKey } from "@/lib/elements";
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

const ELEMENTS: ElementKey[] = ["fire", "water", "nature", "lightning", "shadow", "light"];

function CharactersPage() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [element, setElement] = useState<ElementKey | "all">("all");
  const [guideOpen, setGuideOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("rating");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = characters.slice();
    if (rarity !== "all") list = list.filter((c) => c.rarity === rarity);
    if (element !== "all") list = list.filter((c) => elementOf(c.slug) === element);
    if (q) list = list.filter(
      (c) => c.name.en.toLowerCase().includes(q) || c.name.ar.includes(q),
    );
    if (sort === "rating") list.sort((a, b) => b.overall - a.overall);
    else list.sort((a, b) => a.name.en.localeCompare(b.name.en));
    return list;
  }, [query, rarity, element, sort]);

  return (
    <>
      <SceneBackground scene="collection" />
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              {locale === "ar" ? "العنصر" : "Element"}
            </span>
            <FilterChip active={element === "all"} onClick={() => setElement("all")}>
              {t("all")}
            </FilterChip>
            {ELEMENTS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setElement(e)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  element === e
                    ? "bg-white/10"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
                style={element === e ? { borderColor: ELEMENT_COLOR[e], color: ELEMENT_COLOR[e] } : undefined}
              >
                <ElementIcon element={e} className="h-3.5 w-3.5" />
                {ELEMENT_LABEL[e][locale]}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGuideOpen((v) => !v)}
              className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
            >
              {locale === "ar" ? "دليل العناصر" : "Element Guide"}
            </button>
          </div>
        </div>

        {guideOpen && (
          <div className="mt-4" style={{ animation: "card-in 0.35s ease-out both" }}>
            <ElementGuide />
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="mt-10 rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((c, i) => {
              const color = RARITY_COLOR[c.rarity];
              return (
                <li
                  key={c.id}
                  style={{ animation: `card-in 0.35s ${Math.min(i, 12) * 0.02}s ease-out both` }}
                >
                  <CharacterCard character={c} className="w-full" />
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-xs font-semibold">{c.name[locale]}</p>
                    <span className="font-display text-sm font-black" style={{ color }}>
                      {c.overall}
                    </span>
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