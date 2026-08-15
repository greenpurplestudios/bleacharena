import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { characters } from "@/data/characters";
import { framingOf } from "@/lib/portrait";
import { useI18n } from "@/lib/i18n";
import { adminClearCardOverride, adminSetCardOverride, type CardOverridePatch } from "@/lib/admin";
import { getCardExtras, getCardOverride, loadCardOverrides, useCardOverridesVersion } from "@/lib/card-overrides";
import { uploadCardArt } from "@/lib/card-art.functions";
import type { Rarity } from "@/types/character";

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "founder"];

const L = {
  search: { en: "Search cards", ar: "ابحث عن بطاقة" },
  artwork: { en: "Artwork", ar: "الرسم" },
  upload: { en: "Upload image", ar: "رفع صورة" },
  url: { en: "Or paste image URL", ar: "أو الصق رابط صورة" },
  zoom: { en: "Zoom", ar: "تكبير" },
  x: { en: "Position X", ar: "الموضع أفقيًا" },
  y: { en: "Position Y", ar: "الموضع رأسيًا" },
  content: { en: "Content", ar: "المحتوى" },
  nameEn: { en: "Name (EN)", ar: "الاسم (إنجليزي)" },
  nameAr: { en: "Name (AR)", ar: "الاسم (عربي)" },
  overall: { en: "Overall", ar: "التقييم" },
  rarity: { en: "Rarity", ar: "الندرة" },
  faction: { en: "Faction", ar: "الانتماء" },
  element: { en: "Element", ar: "العنصر" },
  loreEn: { en: "Description (EN)", ar: "الوصف (إنجليزي)" },
  loreAr: { en: "Description (AR)", ar: "الوصف (عربي)" },
  save: { en: "Save changes", ar: "حفظ التغييرات" },
  revert: { en: "Revert to original", ar: "استعادة الأصل" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  overridden: { en: "Custom", ar: "مُعدّلة" },
  pick: { en: "Pick a card to edit.", ar: "اختر بطاقة للتعديل." },
  invalid: { en: "Overall must be 1–99.", ar: "التقييم يجب أن يكون بين 1 و99." },
} as const;

interface Draft extends CardOverridePatch { }

export function CardStudio({ onDone }: { onDone?: () => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const version = useCardOverridesVersion();
  const [q, setQ] = useState("");
  const [id, setId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const upload = useServerFn(uploadCardArt);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return characters
      .filter((c) => !needle || c.name.en.toLowerCase().includes(needle) || c.name.ar.includes(needle) || c.id.includes(needle))
      .slice(0, 30);
  }, [q, version]);

  const card = id ? characters.find((c) => c.id === id) ?? null : null;
  const extras = id ? getCardExtras(id) : {};
  const base = card ? framingOf(card.slug) : { x: 50, y: 26, scale: 1.06 };

  const select = (cardId: string) => {
    setId(cardId);
    setDraft({});
    setMsg(null);
  };

  const val = <K extends keyof Draft>(key: K, fallback: NonNullable<Draft[K]>) =>
    (draft[key] ?? fallback) as NonNullable<Draft[K]>;

  const preview = {
    image: draft.image_url ?? card?.image ?? "",
    x: Number(draft.focus_x ?? base.x),
    y: Number(draft.focus_y ?? base.y),
    scale: Number(draft.zoom ?? base.scale),
  };

  const onFile = async (file: File) => {
    if (!card) return;
    setBusy(true);
    setMsg(null);
    try {
      const buf = await file.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      const res = await upload({
        data: { characterId: card.id, contentType: file.type, dataBase64: btoa(binary) },
      });
      setDraft((d) => ({ ...d, image_url: res.url }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "upload failed");
    }
    setBusy(false);
  };

  const save = async () => {
    if (!card) return;
    if (draft.overall != null && (draft.overall < 1 || draft.overall > 99)) { setMsg(tx("invalid")); return; }
    setBusy(true);
    const res = await adminSetCardOverride(card.id, draft);
    if (res.ok) { await loadCardOverrides(true); setDraft({}); }
    setMsg(res.ok ? "✓" : res.error ?? "failed");
    setBusy(false);
    onDone?.();
  };

  const revert = async () => {
    if (!card) return;
    setBusy(true);
    const res = await adminClearCardOverride(card.id);
    setMsg(res.ok ? "✓" : res.error ?? "failed");
    setBusy(false);
    setDraft({});
    if (res.ok) window.location.reload();
    onDone?.();
  };

  return (
    <div className="space-y-4">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tx("search")}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none"
      />
      <div className="max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-card/60">
        {results.map((c) => (
          <button
            key={c.id}
            onClick={() => select(c.id)}
            className={`flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-2 text-start text-sm last:border-b-0 hover:bg-white/5 ${
              id === c.id ? "bg-primary/10 text-primary" : ""
            }`}
          >
            <span className="min-w-0 truncate">
              {c.name[locale]}{" "}
              {getCardOverride(c.id) && <span className="text-[9px] uppercase tracking-widest text-accent">{tx("overridden")}</span>}
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{c.overall} · {c.rarity}</span>
          </button>
        ))}
      </div>

      {!card ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{tx("pick")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/15 bg-black/40">
              {preview.image && (
                <img
                  src={preview.image}
                  alt={card.name.en}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: `${preview.x}% ${preview.y}%`, transform: `scale(${preview.scale})` }}
                />
              )}
            </div>
            <label className="mt-2 block cursor-pointer rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-center text-[10px] font-black uppercase tracking-widest text-primary">
              {busy ? "…" : tx("upload")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); }}
              />
            </label>
            <input
              value={draft.image_url ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, image_url: e.target.value }))}
              placeholder={tx("url")}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{tx("artwork")}</p>
            <Slider label={tx("zoom")} min={0.8} max={2} step={0.02} value={preview.scale}
              onChange={(v) => setDraft((d) => ({ ...d, zoom: v }))} />
            <Slider label={tx("x")} min={0} max={100} step={1} value={preview.x}
              onChange={(v) => setDraft((d) => ({ ...d, focus_x: v }))} />
            <Slider label={tx("y")} min={0} max={100} step={1} value={preview.y}
              onChange={(v) => setDraft((d) => ({ ...d, focus_y: v }))} />

            <p className="pt-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{tx("content")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label={tx("nameEn")} value={val("name_en", card.name.en)}
                onChange={(v) => setDraft((d) => ({ ...d, name_en: v }))} />
              <Field label={tx("nameAr")} value={val("name_ar", card.name.ar)}
                onChange={(v) => setDraft((d) => ({ ...d, name_ar: v }))} />
              <Field label={tx("overall")} type="number" value={String(draft.overall ?? card.overall)}
                onChange={(v) => setDraft((d) => ({ ...d, overall: Number(v) }))} />
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{tx("rarity")}</span>
                <select
                  value={draft.rarity ?? card.rarity}
                  onChange={(e) => setDraft((d) => ({ ...d, rarity: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {RARITIES.map((r) => <option key={r} value={r} className="bg-background">{r}</option>)}
                </select>
              </label>
              <Field label={tx("faction")} value={val("faction", card.faction ?? "")}
                onChange={(v) => setDraft((d) => ({ ...d, faction: v }))} />
              <Field label={tx("element")} value={val("element", extras.element ?? "")}
                onChange={(v) => setDraft((d) => ({ ...d, element: v }))} />
            </div>
            <Field label={tx("loreEn")} value={val("lore_en", extras.lore?.en ?? "")}
              onChange={(v) => setDraft((d) => ({ ...d, lore_en: v }))} />
            <Field label={tx("loreAr")} value={val("lore_ar", extras.lore?.ar ?? "")}
              onChange={(v) => setDraft((d) => ({ ...d, lore_ar: v }))} />

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button onClick={save} disabled={busy || Object.keys(draft).length === 0}
                className="rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40">
                {tx("save")}
              </button>
              <button onClick={() => setDraft({})} disabled={busy || Object.keys(draft).length === 0}
                className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-40">
                {tx("cancel")}
              </button>
              <button onClick={revert} disabled={busy || !getCardOverride(card.id)}
                className="rounded-lg border border-red-500/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-400 disabled:opacity-40">
                {tx("revert")}
              </button>
              {msg && <span className="text-xs text-accent">{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </label>
  );
}

function Slider({ label, min, max, step, value, onChange }: {
  label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>{label}</span><span className="tabular-nums">{value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[var(--color-primary)]" />
    </label>
  );
}