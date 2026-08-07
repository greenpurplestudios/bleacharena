import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Atmosphere } from "@/components/Atmosphere";
import { SiteHeader } from "@/components/SiteHeader";
import { ForgeCinematic } from "@/components/soulduel/ForgeCinematic";
import { useI18n } from "@/lib/i18n";
import { play, playKiss } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { equipWeapon, fetchForge, forgeWeapon, type ForgeState } from "@/lib/forge";
import { ULTIMATE_EFFECT_TEXT, ultimateOf } from "@/lib/soul-duel/ultimates";
import nimaiya from "@/assets/soulduel/nimaiya.jpeg.asset.json";

/** Ōetsu Nimaiya greets the player with one of his lines on every visit. */
const NIMAIYA_LINES = ["nimaiyaLine1", "nimaiyaLine2", "nimaiyaLine3", "nimaiyaLine4"] as const;

/** Easter egg: tap the M in "Nimaiya" five times. */
const NIMAIYA_NAME = "Ōetsu Nimaiya";
const SECRET_TAPS = 5;

export const Route = createFileRoute("/_authenticated/forge")({
  head: () => ({
    meta: [
      { title: "Nimaiya's Forge — Ultimate Weapons | Bleach Arena" },
      {
        name: "description",
        content:
          "Forge Ultimate Weapons from Broken Sword Fragments in Nimaiya's Forge and equip one for every Soul Duel.",
      },
      { property: "og:title", content: "Nimaiya's Forge — Ultimate Weapons" },
      { property: "og:description", content: "Fragments in, Ultimate Weapons out." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgePage,
});

function ForgePage() {
  const { t, locale } = useI18n();
  const [forge, setForge] = useState<ForgeState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cinematic, setCinematic] = useState<string | null>(null);
  const [line] = useState(() => NIMAIYA_LINES[Math.floor(Math.random() * NIMAIYA_LINES.length)]);
  /* Easter egg: tap the "M" in Nimaiya's name five times. */
  const [secret, setSecret] = useState(0);
  const [kiss, setKiss] = useState(false);
  const tapSecret = () => {
    const next = secret + 1;
    if (next >= SECRET_TAPS) {
      setSecret(0);
      setKiss(true);
      playKiss();
      haptic("reward");
      window.setTimeout(() => setKiss(false), 2200);
      return;
    }
    setSecret(next);
    play("tap");
  };

  const refresh = useCallback(async () => setForge(await fetchForge()), []);

  useEffect(() => { void refresh(); }, [refresh]);

  const onForge = async (weaponId: string, fragmentCost: number, soulCost: number) => {
    if (!forge || busy) return;
    if (forge.fragments < fragmentCost) { play("error"); toast.error(t("forgeNeedFragments")); return; }
    if (forge.souls < soulCost) { play("error"); toast.error(t("forgeNeedSouls")); return; }
    setBusy(weaponId);
    const res = await forgeWeapon(weaponId);
    setBusy(null);
    if (!res.ok) { play("error"); toast.error(t("forgeNeedFragments")); return; }
    setCinematic(weaponId);
    await refresh();
  };

  const onEquip = async (weaponId: string) => {
    if (!forge || busy) return;
    setBusy(weaponId);
    const res = await equipWeapon(weaponId);
    setBusy(null);
    if (!res.ok) { play("error"); return; }
    play("reveal");
    haptic("press");
    setForge({ ...forge, equipped: weaponId });
  };

  return (
    <>
      <Atmosphere variant="sparks" count={26} />
      <SiteHeader />

      <main className="page-enter mx-auto max-w-4xl px-4 pb-24 pt-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/60 px-6 py-10 text-center backdrop-blur-md">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(600px 240px at 50% 110%, oklch(0.8 0.16 220 / 0.28), transparent 70%), radial-gradient(500px 200px at 50% 0%, oklch(0.75 0.18 55 / 0.2), transparent 70%)",
            }}
          />
          <div className="relative">
            <span className="text-[10px] uppercase tracking-[0.45em] text-accent rtl:tracking-normal">
              {t("forgeKicker")}
            </span>
            <h1 className="mt-3 font-display text-3xl font-black text-glow-orange sm:text-5xl">
              {t("forge")}
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground">
              {t("forgeIntro")}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 text-xs font-bold">
              <span className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-1.5 text-accent">
                {forge?.fragments ?? 0} {t("sdFragmentsShort")}
              </span>
              <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                {forge?.souls ?? 0} {t("souls")}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">{t("forgeEarnHint")}</p>

            <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-accent/25 bg-black/30 p-3 text-start">
              <img
                src={nimaiya.url}
                alt="Ōetsu Nimaiya"
                className="h-16 w-16 shrink-0 rounded-full border-2 border-accent/50 object-cover"
                style={{ objectPosition: "50% 25%", boxShadow: "0 0 24px -8px oklch(0.75 0.18 55)" }}
              />
              <div className="min-w-0">
                <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-accent rtl:tracking-normal">
                  {NIMAIYA_NAME.split("").map((ch, i) =>
                    ch.toLowerCase() === "m" ? (
                      <button
                        key={i}
                        type="button"
                        onClick={tapSecret}
                        className="cursor-pointer align-baseline"
                      >
                        {ch}
                      </button>
                    ) : (
                      <span key={i}>{ch === " " ? "\u00A0" : ch}</span>
                    ),
                  )}
                </p>
                <p className="mt-1 text-sm font-bold leading-snug">{t(line)}</p>
              </div>
            </div>
          </div>
        </section>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {(forge?.catalog ?? []).map((entry, i) => {
            const w = ultimateOf(entry.weaponId);
            const owned = forge?.weapons.includes(entry.weaponId);
            const equipped = forge?.equipped === entry.weaponId;
            return (
              <li
                key={entry.weaponId}
                className="flex gap-3 rounded-2xl border p-3 backdrop-blur-md"
                style={{
                  animation: `card-in 0.4s ${0.04 * i}s ease-out both`,
                  borderColor: equipped ? `${w.visual.glow}66` : "oklch(1 0 0 / 0.1)",
                  background: equipped ? `${w.visual.glow}14` : "oklch(1 0 0 / 0.02)",
                }}
              >
                <img
                  src={w.art}
                  alt={w.name[locale]}
                  className="w-20 shrink-0 self-start rounded-xl border border-white/12"
                  style={{
                    boxShadow: owned ? `0 0 24px -10px ${w.visual.glow}` : undefined,
                    filter: owned ? undefined : "grayscale(0.7) brightness(0.7)",
                  }}
                  loading="lazy"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-display text-sm font-black" style={{ color: w.visual.glow }}>
                    {w.name[locale]}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {ULTIMATE_EFFECT_TEXT[w.id]?.[locale]}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {owned ? (
                      <button
                        type="button"
                        onClick={() => void onEquip(entry.weaponId)}
                        disabled={equipped || busy === entry.weaponId}
                        className="tactile rounded-xl border border-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 rtl:tracking-normal"
                        style={equipped ? { color: w.visual.glow, borderColor: `${w.visual.glow}66` } : undefined}
                      >
                        {equipped ? t("sdEquipped") : t("sdEquip")}
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void onForge(entry.weaponId, entry.fragmentCost, entry.soulCost)}
                          disabled={busy === entry.weaponId}
                          className="tactile rounded-xl bg-primary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-60 rtl:tracking-normal"
                        >
                          {t("forgeAction")}
                        </button>
                        <span className="text-[10px] text-muted-foreground">
                          {entry.fragmentCost} {t("sdFragmentsShort")}
                          {entry.soulCost ? ` · ${entry.soulCost} ${t("souls")}` : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {kiss ? (
        <div
          className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center"
          style={{ animation: "fade-in 0.25s ease-out both" }}
        >
          <span className="text-[28vw]" style={{ animation: "scale-in 0.5s ease-out both" }}>💋</span>
        </div>
      ) : null}

      {cinematic ? (
        <ForgeCinematic weaponId={cinematic} onDone={() => setCinematic(null)} />
      ) : null}
    </>
  );
}