import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SceneBackground } from "@/components/SceneBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { useI18n } from "@/lib/i18n";
import { getMyProfile } from "@/lib/leaderboard";
import { loadPrefs, savePrefs, play, syncAmbientToPrefs, type SoundPrefs } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { equipItem, fetchMyInventory, type InventoryItem } from "@/lib/store";
import {
  SettingsSection,
  SettingRow,
  SettingToggle,
  SettingSlider,
} from "@/components/settings/SettingsRow";
import { InstallAppRow } from "@/components/InstallAppRow";
import { loadNavPrefs, saveNavPrefs, type NavPrefs } from "@/lib/nav-prefs";
import { loadPerf, savePerf, type PerfPrefs } from "@/lib/perf";
import { useSession } from "@/hooks/use-session";
import { amIAdmin } from "@/lib/admin";
import {
  notificationPermission, notificationsEnabled, notificationsSupported,
  setNotificationsEnabled,
} from "@/lib/notifications";

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
  const [notifOn, setNotifOn] = useState(false);
  const [notifBlocked, setNotifBlocked] = useState(false);
  const [notifSupported, setNotifSupported] = useState(false);
  const [navPrefs, setNavPrefs] = useState<NavPrefs>(() => loadNavPrefs());
  const [perf, setPerf] = useState<PerfPrefs>(() => loadPerf());
  const { isGuest } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);

  const NAV_L = {
    section: { en: "Navigation", ar: "التنقل" },
    bottom: { en: "Bottom tab bar", ar: "شريط التبويب السفلي" },
    bottomDesc: {
      en: "Mobile-game style bar pinned to the bottom of the screen (Play, Store, Collection, Profile). Turn it off to use the drawer menu only.",
      ar: "شريط بأسلوب ألعاب الجوال مثبّت أسفل الشاشة (العب، المتجر، المجموعة، الملف). أوقفه لاستخدام قائمة السحب فقط.",
    },
    floating: { en: "Floating menu button", ar: "زر القائمة العائم" },
    floatingDesc: {
      en: "Drag it anywhere — it snaps to the nearest edge. When off, use the menu button in the header.",
      ar: "اسحبه لأي مكان — يلتصق بأقرب حافة. عند إيقافه استخدم زر القائمة في الأعلى.",
    },
  } as const;

  const PERF_L = {
    section: { en: "Performance", ar: "الأداء" },
    lag: { en: "Lag Reducer", ar: "تقليل التقطيع" },
    lagDesc: {
      en: "Disables heavy visual effects such as the Legendary card shine, Mythic lightning and animated backgrounds.",
      ar: "يعطّل التأثيرات البصرية الثقيلة مثل لمعان البطاقات الأسطورية وبرق الأسطورية والخلفيات المتحركة.",
    },
    warn: {
      en: "The game may not look as good with this option enabled.",
      ar: "قد لا تبدو اللعبة بنفس الجمال عند تفعيل هذا الخيار.",
    },
  } as const;

  const GUEST_L = {
    section: { en: "Guest account", ar: "حساب الضيف" },
    label: { en: "You're playing as a guest", ar: "أنت تلعب كضيف" },
    desc: {
      en: "Progress lives on this device only. Add an email and password to keep it forever.",
      ar: "تقدّمك محفوظ على هذا الجهاز فقط. أضف بريدًا وكلمة مرور للاحتفاظ به للأبد.",
    },
    cta: { en: "Save account", ar: "حفظ الحساب" },
    admin: { en: "Admin console", ar: "لوحة المطوّر" },
  } as const;

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
    setNotifSupported(notificationsSupported());
    setNotifOn(notificationsEnabled());
    setNotifBlocked(notificationPermission() === "denied");
    amIAdmin().then(setIsAdmin);
  }, []);

  const update = (patch: Partial<SoundPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    if (patch.sfx) play("tap");
    syncAmbientToPrefs();
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
      <SceneBackground scene="profile" />
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

        <div className="mt-8 space-y-6">
        <SettingsSection title={t("audio")}>
          <SettingToggle label={t("soundEffects")} value={prefs.sfx} onChange={(v) => update({ sfx: v })} />
          <SettingToggle label={t("music")} value={prefs.music} onChange={(v) => update({ music: v })} />
          <SettingToggle
            label={t("ambientSounds")}
            description={t("ambientSoundsDesc")}
            value={prefs.ambient !== false}
            onChange={(v) => update({ ambient: v })}
          />
          <SettingSlider
            label={t("volume")}
            value={Math.round(prefs.volume * 100)}
            formatValue={(v) => `${v}%`}
            onChange={(v) => update({ volume: v / 100 })}
            onCommit={() => play("reveal")}
          />
        </SettingsSection>

        <SettingsSection title={t("animations")}>
          <SettingToggle
            label={t("flipReveal")}
            description={t("flipRevealDesc")}
            value={prefs.flipReveal !== false}
            onChange={(v) => update({ flipReveal: v })}
          />
          <SettingToggle
            label={t("haptics")}
            description={t("hapticsDesc")}
            value={prefs.haptics !== false}
            onChange={(v) => { update({ haptics: v }); if (v) haptic("press"); }}
          />
        </SettingsSection>

        <SettingsSection title={NAV_L.section[locale]}>
          <SettingToggle
            label={NAV_L.bottom[locale]}
            description={NAV_L.bottomDesc[locale]}
            value={navPrefs.mode === "bottom"}
            onChange={(v) => {
              const next: NavPrefs = { ...navPrefs, mode: v ? "bottom" : "drawer" };
              setNavPrefs(next);
              saveNavPrefs(next);
              play("tap");
            }}
          />
          <SettingToggle
            label={NAV_L.floating[locale]}
            description={NAV_L.floatingDesc[locale]}
            value={navPrefs.floating}
            onChange={(v) => {
              const next = { ...navPrefs, floating: v };
              setNavPrefs(next);
              saveNavPrefs(next);
              play("tap");
            }}
          />
        </SettingsSection>

        {isGuest && (
          <SettingsSection title={GUEST_L.section[locale]}>
            <SettingRow
              label={<span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{GUEST_L.label[locale]}</span>}
              description={<span className="mt-0.5 block text-xs text-muted-foreground">{GUEST_L.desc[locale]}</span>}
            >
              <Link
                to="/auth"
                className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-accent hover:bg-accent/20"
              >
                {GUEST_L.cta[locale]}
              </Link>
            </SettingRow>
          </SettingsSection>
        )}

        {isAdmin && (
          <SettingsSection title={GUEST_L.admin[locale]}>
            <SettingRow
              label={<span className="text-[10px] uppercase tracking-[0.3em] text-red-400">{GUEST_L.admin[locale]}</span>}
            >
              <Link
                to="/admin"
                className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-red-300 hover:bg-red-500/20"
              >
                →
              </Link>
            </SettingRow>
          </SettingsSection>
        )}

        {notifSupported ? (
          <SettingsSection title={t("notifications")}>
            <SettingToggle
              label={t("notifications")}
              description={notifBlocked ? t("notificationsBlocked") : t("notificationsDesc")}
              value={notifOn}
              onChange={async (v) => {
                const on = await setNotificationsEnabled(v);
                setNotifOn(on);
                setNotifBlocked(notificationPermission() === "denied");
                if (on) play("success");
              }}
            />
          </SettingsSection>
        ) : null}

        <SettingsSection title={t("profile")}>
          <SettingRow
            label={<span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("username")}</span>}
            description={
              <span className="mt-0.5 block truncate font-semibold text-foreground" style={equippedColor ? { color: equippedColor } : undefined}>
                {username ?? "—"}
              </span>
            }
          >
            <button
              onClick={() => { setEditing(true); play("tap"); }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10"
            >
              {t("changeUsername")}
            </button>
          </SettingRow>
        </SettingsSection>

        <SettingsSection title={t("installSection")}>
          <InstallAppRow />
        </SettingsSection>

        <SettingsSection
          title={
            <span className="block">
              {t("cosmetics")}
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{t("cosmeticsDesc")}</span>
            </span>
          }
          action={
            <Link
              to="/store"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/20"
            >
              {t("goToStore")}
            </Link>
          }
        >
          <div className="pt-3">
            <p className="text-start text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("titles")}</p>
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

          <div className="mt-6 pt-3">
            <p className="text-start text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("usernameColors")}</p>
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
        </SettingsSection>
        </div>
      </main>
    </>
  );
}
