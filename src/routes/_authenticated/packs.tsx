import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { haptic, hapticRarity } from "@/lib/haptics";
import { useI18n } from "@/lib/i18n";
import {
  PACK_TIERS,
  PACK_COLOR,
  fetchMyPacks,
  openPack,
  openAllPacks,
  type PackTier,
  type OpenPackResult,
  type PackInventoryRow,
} from "@/lib/packs";
import { characters } from "@/data/characters";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/rarity";
import { CharacterCard } from "@/components/CharacterCard";
import { ElementIcon } from "@/components/ElementIcon";
import { elementOf } from "@/lib/elements";
import { play, playReveal } from "@/lib/sound";
import { loadPrefs } from "@/lib/sound";
import { useSouls } from "@/hooks/use-souls";
import { trackMission } from "@/lib/missions";
import { addXp, bumpProfileStats, trackAchievement, XP } from "@/lib/progression";
import { fetchMyCollection } from "@/lib/packs";
import { PackObject } from "@/components/packs/PackObject";
import { PackTear } from "@/components/packs/PackTear";
import { PackKeyframes } from "@/components/packs/PackKeyframes";
import { KonHero } from "@/components/packs/KonHero";

const L = {
  eyebrow: { en: "Kon's Kiosk", ar: "كشك كون" },
  title: { en: "Kon's Kiosk", ar: "كشك كون" },
  empty: { en: "No packs yet — go earn some in a draft!", ar: "لا توجد حزم بعد — اربح بعضها من مسودة!" },
  ready: { en: "pack(s) ready to tear open", ar: "حزمة جاهزة للتمزيق" },
};

export const Route = createFileRoute("/_authenticated/packs")({
  head: () => ({
    meta: [
      { title: "Kon's Kiosk — Bleach Arena" },
      { name: "description", content: "Kon's Kiosk: tear open packs earned from drafts to grow your permanent collection." },
      { property: "og:title", content: "Bleach Arena — Kon's Kiosk" },
      { property: "og:description", content: "Rip open packs to collect Shinigami, Quincy and Espada." },
    ],
  }),
  component: PacksPage,
});

function PacksPage() {
  const { t, locale } = useI18n();
  const [inventory, setInventory] = useState<PackInventoryRow[] | null>(null);
  const [tearing, setTearing] = useState<PackTier | null>(null);
  const [bulkTearing, setBulkTearing] = useState<PackTier | null>(null);
  const [opening, setOpening] = useState<PackTier | null>(null);
  const [result, setResult] = useState<OpenPackResult | null>(null);
  const [lastTier, setLastTier] = useState<PackTier | null>(null);
  const [bulk, setBulk] = useState<{ tier: PackTier; opened: number; souls: number; results: OpenPackResult[] } | null>(null);
  const { refresh: refreshSouls } = useSouls();
  const pendingRef = useRef<Promise<unknown> | null>(null);

  const load = async () => {
    const list = await fetchMyPacks();
    setInventory(list);
  };

  useEffect(() => { load(); }, []);

  const countFor = (tier: PackTier) =>
    inventory?.find((r) => r.tier === tier)?.count ?? 0;

  const totalPacks = useMemo(
    () => (inventory ?? []).reduce((a, b) => a + b.count, 0),
    [inventory],
  );

  const applySingleSideEffects = async (res: OpenPackResult) => {
    trackMission("pack_open", 1);
    if (res.rarity === "mythic" || res.rarity === "legendary") trackMission("pack_legendary", 1);
    if (res.duplicate === false) trackMission("collect_new", 1);
    await Promise.all([
      addXp(XP.packOpen, "pack"),
      bumpProfileStats({ packs_opened: 1 }),
      trackAchievement("pack_10", 1),
      trackAchievement("pack_100", 1),
      trackAchievement("pack_500", 1),
      res.rarity === "mythic" ? trackAchievement("pack_first_mythic", 1) : Promise.resolve(),
      res.rarity === "mythic" ? trackAchievement("pack_25_mythic", 1) : Promise.resolve(),
    ]);
    try {
      const coll = await fetchMyCollection();
      const owned = coll.length;
      await Promise.all([
        trackAchievement("col_10", owned, true),
        trackAchievement("col_25", owned, true),
        trackAchievement("col_50", owned, true),
        trackAchievement("col_complete", owned >= characters.length ? 1 : 0, true),
      ]);
    } catch { /* silent */ }
  };

  const startOpen = (tier: PackTier) => {
    if (opening || tearing || bulkTearing) return;
    if (countFor(tier) < 1) return;
    setOpening(tier);
    setResult(null);
    setLastTier(tier);
    setTearing(tier);
    // Fire the RPC immediately so the tear gesture doesn't add latency.
    pendingRef.current = openPack(tier);
  };

  const onTornThrough = async () => {
    const tier = tearing;
    setTearing(null);
    if (!tier) return;
    const res = (await pendingRef.current) as OpenPackResult;
    pendingRef.current = null;
    if (res.ok) {
      haptic("pack");
      if (res.rarity) hapticRarity(res.rarity);
      if (res.rarity) playReveal(res.rarity);
      else play("success");
      await applySingleSideEffects(res);
    } else {
      play("skip");
    }
    setResult(res);
    setOpening(null);
    load();
    refreshSouls();
  };

  const closeResult = () => setResult(null);

  const startOpenAll = (tier: PackTier) => {
    if (opening || tearing || bulkTearing) return;
    if (countFor(tier) < 1) return;
    setOpening(tier);
    setResult(null);
    setBulk(null);
    setBulkTearing(tier);
    play("reveal");
    haptic("pack");
    pendingRef.current = openAllPacks(tier);
  };

  useEffect(() => {
    if (!bulkTearing) return;
    const id = window.setTimeout(async () => {
      const tier = bulkTearing;
      setBulkTearing(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (pendingRef.current as any);
      pendingRef.current = null;
      if (res.ok && res.opened > 0) {
        const gotRare = res.results.some((r: OpenPackResult) => r.rarity === "mythic" || r.rarity === "legendary");
        play(gotRare ? "rare" : "success");
        const mythics = res.results.filter((r: OpenPackResult) => r.rarity === "mythic").length;
        trackMission("pack_open", res.opened);
        const rares = res.results.filter((r: OpenPackResult) => r.rarity === "mythic" || r.rarity === "legendary").length;
        if (rares > 0) trackMission("pack_legendary", rares);
        const fresh = res.results.filter((r: OpenPackResult) => r.duplicate === false).length;
        if (fresh > 0) trackMission("collect_new", fresh);
        await Promise.all([
          addXp(XP.packOpen * res.opened, "pack"),
          bumpProfileStats({ packs_opened: res.opened }),
          trackAchievement("pack_10", res.opened),
          trackAchievement("pack_100", res.opened),
          trackAchievement("pack_500", res.opened),
          mythics > 0 ? trackAchievement("pack_first_mythic", 1) : Promise.resolve(),
          mythics > 0 ? trackAchievement("pack_25_mythic", mythics) : Promise.resolve(),
        ]);
        try {
          const coll = await fetchMyCollection();
          const owned = coll.length;
          await Promise.all([
            trackAchievement("col_10", owned, true),
            trackAchievement("col_25", owned, true),
            trackAchievement("col_50", owned, true),
            trackAchievement("col_complete", owned >= characters.length ? 1 : 0, true),
          ]);
        } catch { /* silent */ }
        setBulk({ tier, opened: res.opened, souls: res.soulsAwarded, results: res.results });
      } else {
        play("skip");
      }
      setOpening(null);
      load();
      refreshSouls();
    }, 620);
    return () => window.clearTimeout(id);
  }, [bulkTearing]);

  return (
    <>
      <PackKeyframes />
      <SceneBackground scene="draft" />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <KonHero>
          <p className="mt-4 text-xs text-muted-foreground">
            {inventory === null
              ? t("loading")
              : totalPacks === 0
                ? L.empty[locale]
                : `${totalPacks} ${L.ready[locale]}`}
          </p>
        </KonHero>

        <div className="mt-8 flex flex-wrap items-start justify-center gap-6 sm:gap-8">
          {PACK_TIERS.map((tier, i) => (
            <PackObject
              key={tier}
              tier={tier}
              index={i}
              count={countFor(tier)}
              disabled={!!opening}
              onOpen={() => startOpen(tier)}
              onOpenAll={() => startOpenAll(tier)}
            />
          ))}
        </div>
      </main>

      {(tearing || bulkTearing) && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 px-4 backdrop-blur-md">
          {tearing && <PackTear tier={tearing} onTorn={onTornThrough} />}
          {bulkTearing && <BulkTearAnim tier={bulkTearing} />}
        </div>
      )}

      {(result || bulk) && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          onClick={result ? closeResult : () => setBulk(null)}
        >
          {result && <PackResultCard result={result} tier={lastTier ?? "bronze"} onClose={closeResult} />}
          {bulk && <BulkResultCard bulk={bulk} onClose={() => setBulk(null)} />}
        </div>
      )}
    </>
  );
}

function BulkTearAnim({ tier }: { tier: PackTier }) {
  const color = PACK_COLOR[tier];
  return (
    <div
      className="flex h-56 w-40 items-center justify-center rounded-2xl border"
      style={{
        borderColor: `${color}88`,
        background: `radial-gradient(circle at 50% 40%, ${color}66, transparent 70%)`,
        boxShadow: `0 0 60px -10px ${color}`,
        animation: "pulse-glow 0.5s ease-in-out infinite",
      }}
    >
      <span className="font-display text-5xl" style={{ color, animation: "pack-burst 0.6s ease-out infinite" }}>霊</span>
    </div>
  );
}

function BulkResultCard({ bulk, onClose }: {
  bulk: { tier: PackTier; opened: number; souls: number; results: OpenPackResult[] };
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const news = bulk.results.filter((r) => !r.duplicate);
  const dupes = bulk.results.length - news.length;
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-card p-5"
      style={{ animation: "card-in 0.35s ease-out both" }}
    >
      <h3 className="text-center font-display text-xl font-black" style={{ color: PACK_COLOR[bulk.tier] }}>
        {bulk.opened} {t("openedPacks")}
      </h3>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {t("newCharacters")}: {news.length} · {t("duplicates")}: {dupes} · +{bulk.souls} {t("souls")}
      </p>
      <ul className="mt-4 space-y-1.5">
        {bulk.results.map((r, i) => {
          const char = characters.find((c) => c.id === r.characterId);
          const rc = r.rarity ? RARITY_COLOR[r.rarity] : "#888";
          return (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
              {char?.image ? (
                <img src={char.image} alt={char.name[locale]} className="h-9 w-9 flex-none rounded-md object-cover" />
              ) : (
                <span className="h-9 w-9 flex-none rounded-md bg-white/10" />
              )}
              {char && <ElementIcon element={elementOf(char.slug)} className="h-4 w-4 flex-none" />}
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{char?.name[locale] ?? r.characterId}</span>
              <span className="rounded-md border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest"
                style={{ borderColor: `${rc}66`, color: rc, background: `${rc}1a` }}>
                {r.rarity ? RARITY_LABEL[r.rarity][locale] : "—"}
              </span>
              <span className={`w-16 text-end text-[11px] ${r.duplicate ? "text-accent" : "text-emerald-400"}`}>
                {r.duplicate ? `+${r.soulsAwarded}✦` : t("newCharacter")}
              </span>
            </li>
          );
        })}
      </ul>
      <button
        onClick={onClose}
        className="glow-orange mt-5 w-full rounded-xl bg-primary px-5 py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground"
      >
        {t("close")}
      </button>
    </div>
  );
}

function PackResultCard({ result, tier, onClose }: { result: OpenPackResult; tier: PackTier; onClose: () => void }) {
  const { t } = useI18n();
  const color = PACK_COLOR[tier];
  const char = useMemo(
    () => characters.find((c) => c.id === result.characterId) ?? null,
    [result.characterId],
  );
  if (!result.ok || !char || !result.rarity) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-card p-6 text-center"
        style={{ animation: "card-in 0.3s ease-out both" }}
      >
        <p className="text-sm text-muted-foreground">{result.error ?? t("packOpenError")}</p>
        <button
          onClick={onClose}
          className="mt-4 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-primary-foreground"
        >
          {t("close")}
        </button>
      </div>
    );
  }
  const rc = RARITY_COLOR[result.rarity];
  return (
    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs text-center">
      {/* The card physically rises out of the torn pack shell. */}
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 bottom-[-6%] h-24 rounded-b-[1.1rem] border-x border-b"
          style={{
            borderColor: `${color}88`,
            background: `linear-gradient(180deg, #1c1712 0%, #0d0a08 100%)`,
            boxShadow: `0 18px 40px -14px ${color}`,
            animation: "pack-shell-open 0.7s ease-out 0.25s both",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 70%, ${rc}88 0%, transparent 65%)`,
            animation: "pack-burst 0.7s ease-out both",
          }}
        />
        <div style={{ animation: "pack-card-rise 0.75s cubic-bezier(0.2,0.8,0.25,1) both" }}>
          <CharacterCard character={char} className="w-full" />
        </div>
      </div>
      {result.duplicate ? (
        <p className="mt-4 text-sm text-accent">
          {t("duplicate")} — +{result.soulsAwarded} {t("souls")}
        </p>
      ) : (
        <p className="mt-4 text-sm text-emerald-400">{t("newCharacter")}</p>
      )}
      <button
        onClick={onClose}
        className="glow-orange mt-3 w-full rounded-xl bg-primary px-5 py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground"
      >
        {t("keepOpening")}
      </button>
    </div>
  );
}
