import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { fetchStore, purchaseItem, type StoreItem, type StoreKind } from "@/lib/store";
import { NameFrame } from "@/components/NameFrame";
import {
  activatePotion, fetchActivePotion, fetchMyPotions, formatRemaining, POTION_COLOR,
  type ActivePotion, type PotionRow,
} from "@/lib/potions";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";
import uraharaArt from "@/assets/brand/urahara_shop.jpeg.asset.json";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Urahara's Shop — Bleach Arena" },
      { name: "description", content: "Spend Souls on titles, username colors, name frames and potions." },
      { property: "og:title", content: "Bleach Arena — Urahara's Shop" },
      { property: "og:description", content: "Cosmetics and potions for Souls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StorePage,
});

const KIND_ORDER: StoreKind[] = ["potion", "name_frame", "title", "username_color"];
const KIND_ICON: Record<StoreKind, string> = {
  title: "❖", username_color: "✧", name_frame: "▩", potion: "⚗",
};

function StorePage() {
  const { t, locale } = useI18n();
  const { souls, refresh } = useSouls();
  const [items, setItems] = useState<StoreItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; kind: "ok" | "err"; msg: string } | null>(null);
  const [active, setActive] = useState<Exclude<StoreKind, "pack"> | null>(null);
  const [potions, setPotions] = useState<PotionRow[]>([]);
  const [activePotion, setActivePotion] = useState<ActivePotion>({ active: false, luck: 0 });
  const [now, setNow] = useState(() => Date.now());

  const load = async () => {
    const [s, p, a] = await Promise.all([fetchStore(), fetchMyPotions(), fetchActivePotion()]);
    setItems(s);
    setPotions(p);
    setActivePotion(a);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!activePotion.active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activePotion.active]);

  const grouped = useMemo(() => {
    const g: Record<Exclude<StoreKind, "pack">, StoreItem[]> = {
      title: [], username_color: [], name_frame: [], potion: [],
    };
    (items ?? []).forEach((i) => {
      if (i.kind === "pack") return;
      g[i.kind].push(i);
    });
    return g;
  }, [items]);

  const potionCount = (id: string) => potions.find((p) => p.itemId === id)?.count ?? 0;
  const kindLabel = (k: Exclude<StoreKind, "pack">) =>
    k === "title" ? t("titles")
    : k === "username_color" ? t("usernameColors")
    : k === "name_frame" ? t("nameFrames")
    : t("potions");
  const remaining = activePotion.endsAt ? activePotion.endsAt - now : 0;
  const potionRunning = activePotion.active && remaining > 0;

  const drink = async (itemId: string) => {
    if (busy) return;
    setBusy(itemId);
    const res = await activatePotion(itemId);
    setBusy(null);
    if (res.ok) {
      play("success");
      setFlash({ id: itemId, kind: "ok", msg: t("potionActive") });
      await load();
    } else {
      play("skip");
      setFlash({
        id: itemId,
        kind: "err",
        msg: res.error === "potion_active" ? t("potionAlreadyActive") : t("noPotions"),
      });
    }
    setTimeout(() => setFlash(null), 1800);
  };

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
      <SceneBackground scene="store" />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {/* Shopkeeper counter */}
        <section
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#12100e] via-card/80 to-[#1b1512] p-5 shadow-2xl backdrop-blur-md sm:p-7"
          style={{ animation: "card-in 0.45s ease-out both" }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_80%_at_80%_0%,color-mix(in_oklab,var(--color-primary)_25%,transparent),transparent_70%)]" />
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-6">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">{t("shopkeeperRole")}</p>
              <h1 className="mt-1 font-display text-3xl font-black text-glow-orange sm:text-5xl">{t("storeTitle")}</h1>
              <p className="mt-3 max-w-md rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                “{t("shopkeeperGreeting")}”
                <span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-primary/80">
                  — {t("shopkeeperName")}
                </span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 font-display text-sm font-black text-accent">
                <span aria-hidden>✦</span>
                {souls ?? 0} {t("souls")}
              </div>
            </div>
            <img
              src={uraharaArt.url}
              alt={t("shopkeeperName")}
              loading="lazy"
              className="h-40 w-24 shrink-0 self-end object-cover object-top opacity-95 mix-blend-lighten drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] sm:h-64 sm:w-40"
              style={{ maskImage: "linear-gradient(to bottom, black 78%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, black 78%, transparent)" }}
            />
          </div>
        </section>

        {items === null && (
          <p className="py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
        )}

        {potionRunning && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-300">
              {t("potionActive")} · +{Math.round(activePotion.luck * 100)}% {t("luckBoost")}
            </span>
            <span className="font-display text-lg font-black text-emerald-300 tabular-nums">
              {formatRemaining(remaining)}
            </span>
          </div>
        )}

        {items && active === null && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {KIND_ORDER.map((kind, i) => {
              const list = grouped[kind];
              const heading = kindLabel(kind);
              return (
                <button
                  key={kind}
                  onClick={() => { play("tap"); setActive(kind); }}
                  disabled={!list.length}
                  style={{ animation: `card-in 0.45s ease-out ${0.08 * i}s both` }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/60 p-5 text-start backdrop-blur-md transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_12px_40px_-12px_var(--color-primary)] disabled:opacity-40"
                >
                  <span aria-hidden className="block font-display text-4xl text-primary transition-transform group-hover:scale-110">
                    {KIND_ICON[kind]}
                  </span>
                  <span className="mt-3 block font-display text-xl font-black uppercase tracking-wide">{heading}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    {list.length} {t("shopItemsCount")}
                  </span>
                  <span className="mt-4 inline-block rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                    {t("shopBrowse")}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {items && active !== null && (() => {
          const kind = active;
          const list = grouped[kind];
          const heading = kindLabel(kind);
          return (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-black uppercase tracking-widest">{heading}</h2>
                <button
                  onClick={() => { play("tap"); setActive(null); }}
                  className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/10"
                >
                  {t("shopBack")}
                </button>
              </div>
              {list.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">{t("shopEmpty")}</p>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((it, idx) => {
                  const canAfford = souls === null || souls >= it.cost;
                  const disabled = it.owned || !canAfford || busy === it.id;
                  const isFlashing = flash?.id === it.id;
                  const color = kind === "username_color" ? String(it.meta.hex ?? "#888") : undefined;
                  const animated = kind === "name_frame" && !!(it.meta as { animated?: boolean }).animated;
                  const luck = kind === "potion" ? Number((it.meta as { luck?: number }).luck ?? 0) : 0;
                  const owned = kind === "potion" ? potionCount(it.id) : 0;
                  return (
                    <div
                      key={it.id}
                      style={{ animation: `card-in 0.35s ease-out ${Math.min(idx, 8) * 0.04}s both` }}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/40"
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
                            {kind === "title" ? t("cosmeticTitle")
                              : kind === "username_color" ? t("cosmeticColor")
                              : kind === "name_frame" ? `${t("cosmeticNameFrame")} · ${animated ? t("animatedLabel") : t("staticLabel")}`
                              : `${t("cosmeticPotion")} · ${t("fiveMinutes")}`}
                          </p>
                          {kind === "name_frame" && (
                            <div className="mt-3">
                              <NameFrame frame={it.id}>
                                <span className="font-display text-sm font-black">{t("username")}</span>
                              </NameFrame>
                            </div>
                          )}
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
                        {kind === "potion" && (
                          <span
                            className="rounded-md border px-2 py-0.5 font-display text-[11px] font-black uppercase tracking-widest"
                            style={{ color: POTION_COLOR[it.id], borderColor: POTION_COLOR[it.id] }}
                          >
                            +{Math.round(luck * 100)}%
                          </span>
                        )}
                      </div>
                      {kind === "potion" && (
                        <div className="mt-3 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                          <span>{t("myPotions")}: {owned}</span>
                          <button
                            onClick={() => drink(it.id)}
                            disabled={owned <= 0 || potionRunning || busy === it.id}
                            className="rounded-md border border-emerald-400/50 bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300 disabled:opacity-40"
                          >
                            {t("drinkPotion")}
                          </button>
                        </div>
                      )}
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
        })()}
      </main>
    </>
  );
}