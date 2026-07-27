import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { useI18n } from "@/lib/i18n";
import {
  PACK_TIERS,
  PACK_LABEL,
  PACK_COLOR,
  PACK_DESCRIPTION,
  fetchMyPacks,
  openPack,
  type PackTier,
  type OpenPackResult,
  type PackInventoryRow,
} from "@/lib/packs";
import { characters } from "@/data/characters";
import { RARITY_COLOR, RARITY_LABEL } from "@/lib/rarity";
import { play } from "@/lib/sound";
import { useSouls } from "@/hooks/use-souls";
import { trackMission } from "@/lib/missions";
import { addXp, bumpProfileStats, trackAchievement, XP } from "@/lib/progression";
import { fetchMyCollection } from "@/lib/packs";

export const Route = createFileRoute("/_authenticated/packs")({
  head: () => ({
    meta: [
      { title: "Packs — Bleach Arena" },
      { name: "description", content: "Open packs earned from drafts to grow your permanent collection." },
      { property: "og:title", content: "Bleach Arena — Packs" },
      { property: "og:description", content: "Rip open packs to collect Shinigami, Quincy and Espada." },
    ],
  }),
  component: PacksPage,
});

function PacksPage() {
  const { t, locale } = useI18n();
  const [inventory, setInventory] = useState<PackInventoryRow[] | null>(null);
  const [opening, setOpening] = useState<PackTier | null>(null);
  const [result, setResult] = useState<OpenPackResult | null>(null);
  const { refresh: refreshSouls } = useSouls();

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

  const doOpen = async (tier: PackTier) => {
    if (opening) return;
    if (countFor(tier) < 1) return;
    setOpening(tier);
    setResult(null);
    play("reveal");
    // brief suspense
    await new Promise((r) => setTimeout(r, 900));
    const res = await openPack(tier);
    if (res.ok) {
      if (res.rarity === "mythic" || res.rarity === "legendary") play("rare");
      else play("success");
      trackMission("pack_open", 1);
      // Progression
      await Promise.all([
        addXp(XP.packOpen, "pack"),
        bumpProfileStats({ packs_opened: 1 }),
        trackAchievement("pack_10", 1),
        trackAchievement("pack_100", 1),
        trackAchievement("pack_500", 1),
        res.rarity === "mythic" ? trackAchievement("pack_first_mythic", 1) : Promise.resolve(),
        res.rarity === "mythic" ? trackAchievement("pack_25_mythic", 1) : Promise.resolve(),
      ]);
      // Collection milestones (absolute count)
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
    } else {
      play("skip");
    }
    setResult(res);
    setOpening(null);
    load();
    refreshSouls();
  };

  const closeResult = () => setResult(null);

  return (
    <>
      <ReiatsuBackground count={18} />
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{t("packs")}</p>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
            {t("packsTitle")}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {inventory === null
              ? t("loading")
              : totalPacks === 0
                ? t("packsEmpty")
                : `${totalPacks} ${t("packsAvailable")}`}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PACK_TIERS.map((tier) => {
            const count = countFor(tier);
            const color = PACK_COLOR[tier];
            const disabled = count < 1 || !!opening;
            return (
              <button
                key={tier}
                onClick={() => doOpen(tier)}
                disabled={disabled}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-card/70 p-5 text-start backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ boxShadow: count > 0 ? `0 0 30px -12px ${color}` : undefined }}
              >
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: color }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div
                      className="font-display text-lg font-black uppercase tracking-widest"
                      style={{ color }}
                    >
                      {PACK_LABEL[tier][locale]}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PACK_DESCRIPTION[tier][locale]}
                    </p>
                  </div>
                  <span
                    className="flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 font-display text-base font-black"
                    style={{ borderColor: `${color}66`, background: `${color}1a`, color }}
                  >
                    ×{count}
                  </span>
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {count > 0 ? t("tapToOpen") : t("noPacks")}
                  </span>
                  {count > 0 && (
                    <span aria-hidden className="font-display text-lg text-primary">卍</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {(opening || result) && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          onClick={result ? closeResult : undefined}
        >
          {opening && !result && <PackOpeningAnim tier={opening} />}
          {result && <PackResultCard result={result} onClose={closeResult} />}
        </div>
      )}
    </>
  );
}

function PackOpeningAnim({ tier }: { tier: PackTier }) {
  const color = PACK_COLOR[tier];
  return (
    <div
      className="flex h-56 w-40 items-center justify-center rounded-2xl border"
      style={{
        borderColor: `${color}88`,
        background: `radial-gradient(circle at 50% 40%, ${color}66, transparent 70%)`,
        boxShadow: `0 0 60px -10px ${color}`,
        animation: "pulse-glow 0.9s ease-in-out infinite",
      }}
    >
      <span className="font-display text-5xl" style={{ color }}>卍</span>
    </div>
  );
}

function PackResultCard({ result, onClose }: { result: OpenPackResult; onClose: () => void }) {
  const { t, locale } = useI18n();
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
  const rarityColor = RARITY_COLOR[result.rarity];
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm overflow-hidden rounded-3xl border bg-card text-center"
      style={{
        borderColor: `${rarityColor}66`,
        boxShadow: `0 0 80px -10px ${rarityColor}`,
        animation: "card-in 0.45s ease-out both",
      }}
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: `radial-gradient(circle at 50% 30%, ${rarityColor}55, transparent 70%)` }}
      >
        {char.image ? (
          <img
            src={char.image}
            alt={char.name[locale]}
            className="h-full w-full object-cover"
            style={{ animation: "card-in 0.6s 0.05s ease-out both" }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-6xl text-primary">
            {char.name.en.split(" ").slice(0, 2).map((s) => s[0]).join("")}
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest backdrop-blur-md"
          style={{ borderColor: rarityColor, color: rarityColor, background: `${rarityColor}22` }}
        >
          {RARITY_LABEL[result.rarity][locale]}
        </span>
        <span className="absolute right-3 top-3 rounded-lg bg-black/60 px-2 py-1 font-display text-xs font-black text-white backdrop-blur-md">
          #{result.overall}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-xl font-black">{char.name[locale]}</h3>
        {result.duplicate ? (
          <p className="mt-2 text-sm text-accent">
            {t("duplicate")} — +{result.soulsAwarded} {t("souls")}
          </p>
        ) : (
          <p className="mt-2 text-sm text-emerald-400">{t("newCharacter")}</p>
        )}
        <button
          onClick={onClose}
          className="glow-orange mt-5 w-full rounded-xl bg-primary px-5 py-3 font-display text-sm font-black uppercase tracking-widest text-primary-foreground"
        >
          {t("keepOpening")}
        </button>
      </div>
    </div>
  );
}