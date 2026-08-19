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
  };

  useEffect(() => {
    loadProfile();
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

        <SettingsSection title={PERF_L.section[locale]}>
          <SettingToggle
            label={PERF_L.lag[locale]}
            description={PERF_L.lagDesc[locale]}
            value={perf.lagReducer}
            onChange={(v) => {
              const next = { ...perf, lagReducer: v };
              setPerf(next);
              savePerf(next);
              play("tap");
            }}
          />
          <p className="px-1 pb-1 text-[11px] text-accent">{PERF_L.warn[locale]}</p>
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

        </div>
      </main>
    </>
  );
}
