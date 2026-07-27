import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import { fetchStore, purchaseItem, type StoreItem, type StoreKind } from "@/lib/store";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Store — Bleach Arena" },
      { name: "description", content: "Spend Souls on titles, username colors and extra packs." },
      { property: "og:title", content: "Bleach Arena — Store" },
      { property: "og:description", content: "Cosmetics and packs for Souls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorePage,
});

const KIND_ORDER: StoreKind[] = ["pack", "title", "username_color"];

function StorePage() {
  const { t, locale } = useI18n();
  const { souls, refresh } = useSouls();
  const [items, setItems] = useState<StoreItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; kind: "ok" | "err"; msg: string } | null>(null);

  const load = async () => setItems(await fetchStore());
  useEffect(() => { load(); }, []);

  const grouped = useMemo(() => {
    const g: Record<StoreKind, StoreItem[]> = { pack: [], title: [], username_color: [] };
    (items ?? []).forEach((i) => g[i.kind].push(i));
    return g;
  }, [items]);

  const buy = async (item: StoreItem) => {
    if (busy) return;
    if (souls !== null && souls < item.cost) {
      setFlash({ id: item.id, kind: "err", msg: t("insufficientSouls") });
      play("skip");
      return;
    }
    setBusy(item.id);
    const res = await purchaseItem(item.id);
    setBusy(null);
    if (res.ok) {
      play("success");
      setFlash({ id: item.id, kind: "ok", msg: t("purchased") });
      await Promise.all([load(), refresh()]);
    } else {
      play("skip");
      const map: Record<string, string> = {
        insufficient_souls: t("insufficientSouls"),
        already_owned: t("alreadyOwned"),
        not_found: t("notFound"),
      };
      setFlash({ id: item.id, kind: "err", msg: map[res.error ?? ""] ?? t("packOpenError") });
    }
    setTimeout(() => setFlash(null), 1800);
  };

  return (
    <>
      <ReiatsuBackground count={16} />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("store")}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">{t("storeTitle")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("storeDesc")}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-display text-sm font-black text-accent">
            <span aria-hidden>✦</span>
            {souls ?? 0} {t("souls")}
          </div>
        </div>

        {items === null && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
        )}

        {items && KIND_ORDER.map((kind) => {
          const list = grouped[kind];
          if (!list.length) return null;
          const heading =
            kind === "pack" ? t("packs") : kind === "title" ? t("titles") : t("usernameColors");
          return (
            <section key={kind} className="mb-8">
              <h2 className="mb-3 font-display text-lg font-black uppercase tracking-widest text-muted-foreground">
                {heading}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((it) => {
                  const canAfford = souls === null || souls >= it.cost;
                  const disabled = it.owned || !canAfford || busy === it.id;
                  const isFlashing = flash?.id === it.id;
                  const color = kind === "username_color" ? String(it.meta.hex ?? "#888") : undefined;
                  return (
                    <div
                      key={it.id}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md transition-colors hover:border-white/25"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className="font-display text-lg font-black uppercase tracking-wide"
                            style={color ? { color } : undefined}
                          >
                            {it.name[locale]}
                          </div>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                            {kind === "pack" ? t("openable") : kind === "title" ? t("cosmeticTitle") : t("cosmeticColor")}
                          </p>
                        </div>
                        {kind === "username_color" && (
                          <span
                            aria-hidden
                            className="h-8 w-8 flex-none rounded-full border border-white/20"
                            style={{ background: color }}
                          />
                        )}
                        {kind === "title" && (
                          <span
                            className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 font-display text-[10px] font-black uppercase tracking-widest text-primary"
                          >
                            {it.name[locale]}
                          </span>
                        )}
                        {kind === "pack" && (
                          <span aria-hidden className="font-display text-2xl text-primary">卍</span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 font-display text-sm font-black text-accent">
                          <span aria-hidden>✦</span>
                          {it.cost}
                        </span>
                        <button
                          onClick={() => buy(it)}
                          disabled={disabled}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-black uppercase tracking-widest text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {it.owned
                            ? t("owned")
                            : busy === it.id
                              ? "…"
                              : t("buy")}
                        </button>
                      </div>
                      {isFlashing && (
                        <p
                          className={`mt-2 text-center text-xs ${flash.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {flash.msg}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}