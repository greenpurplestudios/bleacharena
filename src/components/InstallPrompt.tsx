import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ba:install-dismissed-at";
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && safari;
}

export function InstallPrompt() {
  const { t, dir } = useI18n();
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;
    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    if (isIosSafari()) {
      const timer = window.setTimeout(() => setShowIos(true), 4000);
      return () => {
        window.removeEventListener("beforeinstallprompt", onBip);
        window.clearTimeout(timer);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setBip(null);
    setShowIos(false);
  };

  const install = async () => {
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice;
    dismiss();
  };

  if (!bip && !showIos) return null;

  const side = dir === "rtl" ? "left-4" : "right-4";
  return (
    <div
      className={`fixed bottom-24 ${side} z-[55] w-72 max-w-[92vw] rounded-2xl border border-white/10 bg-card/95 p-4 shadow-2xl backdrop-blur-xl`}
      style={{ animation: "card-in 0.25s ease-out both" }}
    >
      <div className="text-sm font-semibold text-foreground">{t("iosInstallTitle")}</div>
      {bip ? (
        <div className="mt-3 flex gap-2">
          <button
            onClick={install}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("installApp")}
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/5"
          >
            {t("dismiss")}
          </button>
        </div>
      ) : (
        <>
          <ol className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>1. {t("iosInstallStep1")}</li>
            <li>2. {t("iosInstallStep2")}</li>
          </ol>
          <button
            onClick={dismiss}
            className="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-xs text-muted-foreground hover:bg-white/5"
          >
            {t("dismiss")}
          </button>
        </>
      )}
    </div>
  );
}