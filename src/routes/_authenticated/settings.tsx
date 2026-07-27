import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { useI18n } from "@/lib/i18n";
import { getMyProfile } from "@/lib/leaderboard";
import { loadPrefs, savePrefs, play, type SoundPrefs } from "@/lib/sound";
import { supabase } from "@/integrations/supabase/client";
import { equipItem, fetchMyInventory, type InventoryItem } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Bleach Arena" },
      { name: "description", content: "Manage audio, profile, and app preferences for Bleach Arena." },
      { property: "og:title", content: "Bleach Arena — Settings" },
      { property: "og:description", content: "Audio, profile, and preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useI18n();
  const { locale } = useI18n();
  const [prefs, setPrefs] = useState<SoundPrefs>(() => loadPrefs());
  const [username, setUsername] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [equippedColor, setEquippedColor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadProfile = async () => {
    const p = (await getMyProfile()) as { username: string | null; title?: string | null; username_color?: string | null } | null;
    setUsername(p?.username ?? null);
    setEquippedTitle(p?.title ?? null);
    setEquippedColor(p?.username_color ?? null);
  };
  const loadInventory = async () => setInventory(await fetchMyInventory());

  useEffect(() => {
    loadProfile();
    loadInventory();
  }, []);

  const update = (patch: Partial<SoundPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    if (patch.sfx) play("tap");
  };

  const doEquip = async (kind: "title" | "username_color", itemId: string | null) => {
    if (busy) return;
    setBusy(true);
    const res = await equipItem(kind, itemId);
    setBusy(false);
    if (res.ok) {
      play("pick");
      await loadProfile();
    } else {
      play("skip");
    }
  };

  const titles = (inventory ?? []).filter((i) => i.kind === "title");
  const colors = (inventory ?? []).filter((i) => i.kind === "username_color");

  return (
    <>
      <ReiatsuBackground count={18} />
      <SiteHeader />
      <UsernamePrompt
        open={editing}
        initial={username ?? ""}
        onClose={() => setEditing(false)}
        onSaved={(u) => { setUsername(u); setEditing(false); play("success"); }}
      />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div style={{ animation: "card-in 0.5s ease-out both" }}>
          <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {t("settingsDesc")}
          </span>
          <h1 className="mt-2 font-display text-4xl font-black text-glow-orange sm:text-5xl">
            {t("settings")}
          </h1>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-lg font-bold">{t("audio")}</h2>
          <div className="mt-4 space-y-4">
            <Toggle label={t("soundEffects")} value={prefs.sfx} onChange={(v) => update({ sfx: v })} />
            <Toggle label={t("music")} value={prefs.music} onChange={(v) => update({ music: v })} />
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("volume")}</span>
                <span className="font-mono text-xs text-foreground">{Math.round(prefs.volume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(prefs.volume * 100)}
                onChange={(e) => update({ volume: Number(e.target.value) / 100 })}
                onMouseUp={() => play("reveal")}
                onTouchEnd={() => play("reveal")}
                className="w-full accent-[oklch(0.75_0.18_55)]"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="font-display text-lg font-bold">{t("profile")}</h2>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("username")}</p>
              <p className="mt-0.5 truncate font-semibold" style={equippedColor ? { color: equippedColor } : undefined}>
                {username ?? "—"}
              </p>
            </div>
            <button
              onClick={() => { setEditing(true); play("tap"); }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
            >
              {t("changeUsername")}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold">{t("cosmetics")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("cosmeticsDesc")}</p>
            </div>
            <Link
              to="/store"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/20"
            >
              {t("goToStore")}
            </Link>
          </div>

          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("titles")}</p>
            {titles.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("noCosmetics")}</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  disabled={busy || !equippedTitle}
                  onClick={() => doEquip("title", null)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                    !equippedTitle ? "border-primary/60 bg-primary/20 text-primary" : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {t("none")}
                </button>
                {titles.map((it) => {
                  const eq = equippedTitle === it.itemId;
                  return (
                    <button
                      key={it.itemId}
                      disabled={busy}
                      onClick={() => doEquip("title", eq ? null : it.itemId)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                        eq ? "border-primary/60 bg-primary/20 text-primary" : "border-white/15 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {it.name[locale]} {eq && `· ${t("equipped")}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("usernameColors")}</p>
            {colors.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("noCosmetics")}</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  disabled={busy || !equippedColor}
                  onClick={() => doEquip("username_color", null)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                    !equippedColor ? "border-primary/60 bg-primary/20 text-primary" : "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {t("none")}
                </button>
                {colors.map((it) => {
                  const hex = String(it.meta.hex ?? "#888");
                  const eq = equippedColor === hex;
                  return (
                    <button
                      key={it.itemId}
                      disabled={busy}
                      onClick={() => doEquip("username_color", eq ? null : it.itemId)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors ${
                        eq ? "border-primary/60 bg-primary/20" : "border-white/15 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <span aria-hidden className="h-3 w-3 rounded-full border border-white/20" style={{ background: hex }} />
                      <span style={{ color: hex }}>{it.name[locale]}</span>
                      {eq && <span className="text-primary">· {t("equipped")}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-colors ${
          value ? "border-primary/60 bg-primary/30" : "border-white/15 bg-white/5"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-8" : "translate-x-1"
          }`}
        />
        <span className="sr-only">{value ? t("on") : t("off")}</span>
      </button>
    </div>
  );
}