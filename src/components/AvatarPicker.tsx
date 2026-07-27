import { useMemo, useState } from "react";
import { characters } from "@/data/characters";
import { RARITY_LABEL, RARITY_COLOR } from "@/lib/rarity";
import type { Rarity } from "@/types/character";
import { useI18n } from "@/lib/i18n";

interface Props {
  ownedIds: Set<string>;
  currentId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

const RARITIES: Array<Rarity | "all"> = ["all", "mythic", "legendary", "epic", "rare", "uncommon", "common"];

export function AvatarPicker({ ownedIds, currentId, onSelect, onClose }: Props) {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [preview, setPreview] = useState<string | null>(currentId);

  const list = useMemo(() => {
    return characters
      .filter((c) => ownedIds.has(c.id))
      .filter((c) => rarity === "all" || c.rarity === rarity)
      .filter((c) => {
        const s = q.trim().toLowerCase();
        if (!s) return true;
        return c.name.en.toLowerCase().includes(s) || c.name.ar.includes(q.trim());
      })
      .sort((a, b) => b.overall - a.overall);
  }, [ownedIds, q, rarity]);

  const previewChar = preview ? characters.find((c) => c.id === preview) : null;

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-3xl border border-white/10 bg-card/95 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "card-in 0.3s ease-out both" }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h3 className="font-display text-lg font-black">{t("chooseAvatar")}</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground">✕</button>
        </div>

        {/* Preview */}
        {previewChar && (
          <div className="flex items-center gap-4 border-b border-white/10 px-5 py-4">
            <div
              className="h-16 w-16 overflow-hidden rounded-full border-2"
              style={{ borderColor: RARITY_COLOR[previewChar.rarity] }}
            >
              {previewChar.image ? <img src={previewChar.image} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-lg font-black">{previewChar.name[locale]}</div>
              <div className="text-xs" style={{ color: RARITY_COLOR[previewChar.rarity] }}>
                {RARITY_LABEL[previewChar.rarity][locale]} · #{previewChar.overall}
              </div>
            </div>
            <button
              onClick={() => onSelect(previewChar.id)}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-primary-foreground"
            >
              {t("useAvatar")}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity | "all")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none"
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? t("all") : RARITY_LABEL[r][locale]}
              </option>
            ))}
          </select>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 pb-5">
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("noResults")}</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {list.map((c) => {
                const active = preview === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setPreview(c.id)}
                    onDoubleClick={() => onSelect(c.id)}
                    className={
                      "relative aspect-square overflow-hidden rounded-lg border transition-all " +
                      (active ? "border-primary ring-2 ring-primary/50" : "border-white/10 hover:border-white/30")
                    }
                    style={{ boxShadow: `0 0 12px -10px ${RARITY_COLOR[c.rarity]}` }}
                  >
                    {c.image ? (
                      <img src={c.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-primary">
                        {c.name.en[0]}
                      </div>
                    )}
                    <span className="absolute right-0.5 top-0.5 rounded bg-black/70 px-1 font-display text-[9px] font-black text-white">
                      #{c.overall}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-5 py-3">
          <button
            onClick={() => onSelect(null)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("removeAvatar")}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}