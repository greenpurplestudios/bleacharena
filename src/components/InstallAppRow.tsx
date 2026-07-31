import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { SettingRow } from "@/components/settings/SettingsRow";
import { play } from "@/lib/sound";
import { canInstall, isIosSafari, isStandalone, promptInstall, subscribeInstall } from "@/lib/install";

export function InstallAppRow() {
  const { t } = useI18n();
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAvailable(canInstall());
      setInstalled(isStandalone());
      setIos(isIosSafari());
    };
    sync();
    return subscribeInstall(sync);
  }, []);

  const label = installed ? t("installed") : available || ios ? t("installApp") : t("installUnavailable");

  return (
    <SettingRow
      label={t("installApp")}
      description={
        <>
          <span className="block">{t("installDesc")}</span>
          {!installed && ios && !available ? (
            <span className="mt-1 block text-[11px] text-muted-foreground">
              1. {t("iosInstallStep1")} · 2. {t("iosInstallStep2")}
            </span>
          ) : null}
        </>
      }
    >
      <button
        disabled={installed || !available}
        onClick={async () => {
          play("tap");
          await promptInstall();
        }}
        className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-muted-foreground"
      >
        {label}
      </button>
    </SettingRow>
  );
}