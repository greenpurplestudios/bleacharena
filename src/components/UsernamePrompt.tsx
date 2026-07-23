import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { setUsername } from "@/lib/leaderboard";

interface Props {
  open: boolean;
  initial?: string;
  onClose: () => void;
  onSaved: (username: string) => void;
  dismissible?: boolean;
}

export function UsernamePrompt({ open, initial = "", onClose, onSaved, dismissible = true }: Props) {
  const { t } = useI18n();
  const [value, setValue] = useState(initial);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setValue(initial); setErr(null); }
  }, [open, initial]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    const res = await setUsername(value);
    setSaving(false);
    if (res.ok) { onSaved(res.username); return; }
    const map: Record<string, string> = {
      taken: t("usernameTaken"),
      invalid_chars: t("usernameInvalidChars"),
      invalid_length: t("usernameInvalidLength"),
    };
    setErr(map[res.error] ?? t("usernameInvalidChars"));
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={() => dismissible && onClose()}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 shadow-2xl"
        style={{ animation: "card-in 0.3s ease-out both" }}
      >
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t("username")}</p>
        <h2 className="mt-2 font-display text-2xl font-black text-glow-orange">{t("chooseUsername")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("chooseUsernameDesc")}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base outline-none transition-colors focus:border-primary/60 focus:bg-white/[0.08]"
          maxLength={20}
          autoFocus
          required
        />
        {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
        <div className="mt-6 flex gap-3">
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium hover:bg-white/10"
            >
              {t("close")}
            </button>
          )}
          <button
            type="submit"
            disabled={saving || value.trim().length < 2}
            className="glow-orange flex-1 rounded-xl bg-primary px-5 py-3 font-display text-sm font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-50"
          >
            {saving ? "…" : t("saveUsername")}
          </button>
        </div>
      </form>
    </div>
  );
}