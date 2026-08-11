import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { characters } from "@/data/characters";
import { fetchMyCollection, type CollectionRow } from "@/lib/packs";
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import type { Rarity } from "@/types/character";

export const Route = createFileRoute("/_authenticated/collection")({
  head: () => ({
    meta: [
      { title: "Collection — Bleach Arena" },
      { name: "description", content: "Your permanent Bleach Arena collection: every character you've unlocked." },
      { property: "og:title", content: "Bleach Arena — Collection" },
      { property: "og:description", content: "Track owned and missing Shinigami, Quincy and Espada." },
    ],
  }),
  component: CollectionPage,
});

type Filter = "all" | "owned" | "missing" | Rarity;

function CollectionPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<CollectionRow[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { fetchMyCollection().then(setRows); }, []);

  const owned = useMemo(
    () => new Map((rows ?? []).map((r) => [r.characterId, r])),
    [rows],
  );

  const total = characters.length;
  const ownedCount = owned.size;
  const pct = total ? Math.round((ownedCount / total) * 100) : 0;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return characters
      .filter((c) => {
        if (needle) {
          const hit =
            c.name.en.toLowerCase().includes(needle) ||
            c.name.ar.includes(needle);
          if (!hit) return false;
        }
        if (filter === "owned") return owned.has(c.id);
        if (filter === "missing") return !owned.has(c.id);
        if (filter !== "all") return c.rarity === filter;
        return true;
      })
      .sort((a, b) => b.overall - a.overall);
  }, [q, filter, owned]);

  return (
    <>
      <SceneBackground scene="collection" />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("collection")}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
            {t("collectionTitle")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {ownedCount} / {total} ({pct}%)
          </p>
          <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full bg-primary"
              style={{ width: `${pct}%`, boxShadow: "0 0 12px -1px oklch(0.75 0.18 55)" }}
            />
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm outline-none focus:border-primary/60"
          />
          <div className="flex flex-wrap gap-2">
            {(["all", "owned", "missing", ...RARITY_ORDER] as Filter[]).map((f) => {
              const active = filter === f;
              const label =
                f === "all"
                  ? t("all")
                  : f === "owned"
                    ? t("owned")
                    : f === "missing"
                      ? t("missing")
                      : RARITY_LABEL[f as Rarity][locale];
              const color = (["all", "owned", "missing"] as string[]).includes(f)
                ? undefined
                : RARITY_COLOR[f as Rarity];
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={
                    "rounded-lg border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all " +
                    (active
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground")
                  }
                  style={color && active ? { borderColor: color, color, background: `${color}1a` } : undefined}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {rows === null ? (
          <p className="text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {visible.map((c) => {
              const own = owned.get(c.id);
              const isOwned = !!own;
              const rarityColor = RARITY_COLOR[c.rarity];
              return (
                <div key={c.id} className="relative">
                  <div className={isOwned ? "" : "opacity-40 grayscale"}>
                    <CharacterCard character={c} className="w-full" />
                  </div>
                  {isOwned && own.count > 1 && (
                    <span className="pointer-events-none absolute -right-1 -top-1 z-10 rounded-md bg-primary px-1.5 py-0.5 font-display text-[10px] font-black text-primary-foreground">
                      ×{own.count}
                    </span>
                  )}
                  <div className="mt-1.5 text-center">
                    <div className="truncate text-xs font-semibold">{c.name[locale]}</div>
                    <div
                      className="text-[9px] font-black uppercase tracking-widest"
                      style={{ color: rarityColor }}
                    >
                      {RARITY_LABEL[c.rarity][locale]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}