import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { registerPWA, applyPendingUpdate } from "@/lib/pwa";

export function PWAUpdateToast() {
  const { t, dir } = useI18n();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    registerPWA(() => setReady(true));
  }, []);

  if (!ready) return null;

  const side = dir === "rtl" ? "right-4" : "left-4";
  return (
    <div
      role="status"
      className={`fixed bottom-5 ${side} z-[60] flex max-w-[92vw] items-center gap-3 rounded-2xl border border-white/10 bg-card/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-xl`}
      style={{ animation: "card-in 0.25s ease-out both" }}
    >
      <span className="text-foreground">{t("pwaUpdateMessage")}</span>
      <button
        type="button"
        onClick={applyPendingUpdate}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
      >
        {t("pwaUpdateAction")}
      </button>
    </div>
  );
}