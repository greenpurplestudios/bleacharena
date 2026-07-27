import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { useI18n } from "@/lib/i18n";
import { getMyProfile } from "@/lib/leaderboard";
import { loadPrefs, savePrefs, play, type SoundPrefs } from "@/lib/sound";

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
  const [prefs, setPrefs] = useState<SoundPrefs>(() => loadPrefs());
  const [username, setUsername] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getMyProfile();
      setUsername(p?.username ?? null);
    })();
  }, []);

  const update = (patch: Partial<SoundPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    if (patch.sfx) play("tap");
  };

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
              <p className="mt-0.5 truncate font-semibold">{username ?? "—"}</p>
            </div>
            <button
              onClick={() => { setEditing(true); play("tap"); }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
            >
              {t("changeUsername")}
            </button>
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