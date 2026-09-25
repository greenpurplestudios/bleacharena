import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { adminCreateCard, adminGrantCharacter, type NewCardPatch } from "@/lib/admin";
import { loadCardOverrides } from "@/lib/card-overrides";
import { uploadCardArt } from "@/lib/card-art.functions";
import type { Rarity } from "@/types/character";

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "founder"];
const GENDERS = ["male", "female", "other"] as const;

const L = {
  heading: { en: "Create new card", ar: "إنشاء بطاقة جديدة" },
  intro: {
    en: "Adds a brand-new card to the live game — packs, collection, market and duels pick it up instantly.",
    ar: "يضيف بطاقة جديدة للعبة مباشرة — تظهر فورًا في العبوات والمجموعة والسوق والمبارزات.",
  },
  open: { en: "New card", ar: "بطاقة جديدة" },
  close: { en: "Close", ar: "إغلاق" },
  nameEn: { en: "Name (EN)", ar: "الاسم (إنجليزي)" },
  nameAr: { en: "Name (AR)", ar: "الاسم (عربي)" },
  cardId: { en: "Card ID", ar: "معرّف البطاقة" },
  overall: { en: "Overall (1–100)", ar: "التقييم (1–100)" },
  rarity: { en: "Rarity", ar: "الندرة" },
  gender: { en: "Gender", ar: "الجنس" },
  faction: { en: "Faction", ar: "الانتماء" },
  element: { en: "Element", ar: "العنصر" },
  loreEn: { en: "Description (EN)", ar: "الوصف (إنجليزي)" },
  loreAr: { en: "Description (AR)", ar: "الوصف (عربي)" },
  upload: { en: "Upload artwork", ar: "رفع الرسم" },
  url: { en: "Or paste image URL", ar: "أو الصق رابط صورة" },
  create: { en: "Create card", ar: "إنشاء البطاقة" },
  grant: { en: "Grant a copy to me", ar: "امنحني نسخة" },
  created: { en: "Card created.", ar: "تم إنشاء البطاقة." },
  granted: { en: "Copy added to your collection.", ar: "تمت إضافة نسخة لمجموعتك." },
  needName: { en: "Name (EN) is required.", ar: "الاسم بالإنجليزية مطلوب." },
  badOverall: { en: "Overall must be 1–100.", ar: "التقييم يجب أن يكون بين 1 و100." },
  exists: { en: "That card ID is already taken.", ar: "هذا المعرّف مستخدم بالفعل." },
} as const;

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

export function CardCreator({ onCreated }: { onCreated?: () => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const upload = useServerFn(uploadCardArt);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  const [idTouched, setIdTouched] = useState(false);

  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [cardId, setCardId] = useState("");
  const [overall, setOverall] = useState(85);
  const [rarity, setRarity] = useState<Rarity>("epic");
  const [gender, setGender] = useState<string>("male");
  const [faction, setFaction] = useState("");
  const [element, setElement] = useState("");
  const [loreEn, setLoreEn] = useState("");
  const [loreAr, setLoreAr] = useState("");
  const [image, setImage] = useState("");

  const effectiveId = idTouched ? slugify(cardId) : slugify(nameEn);

  const reset = () => {
    setNameEn(""); setNameAr(""); setCardId(""); setIdTouched(false);
    setOverall(85); setRarity("epic"); setGender("male");
    setFaction(""); setElement(""); setLoreEn(""); setLoreAr(""); setImage("");
  };

  const onFile = async (file: File) => {
    setBusy(true);
    setMsg(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const res = await upload({
        data: { characterId: effectiveId || `new-${Date.now()}`, contentType: file.type, dataBase64: btoa(binary) },
      });
      setImage(res.url);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "upload failed");
    }
    setBusy(false);
  };

  const create = async () => {
    if (!nameEn.trim()) { setMsg(tx("needName")); return; }
    if (overall < 1 || overall > 100) { setMsg(tx("badOverall")); return; }
    setBusy(true);
    setMsg(null);
    const patch: NewCardPatch = {
      name_en: nameEn.trim(),
      name_ar: nameAr.trim() || nameEn.trim(),
      overall,
      rarity,
      gender,
      ...(faction.trim() ? { faction: faction.trim() } : {}),
      ...(element.trim() ? { element: element.trim() } : {}),
      ...(loreEn.trim() ? { lore_en: loreEn.trim() } : {}),
      ...(loreAr.trim() ? { lore_ar: loreAr.trim() } : {}),
      ...(image.trim() ? { image_url: image.trim() } : {}),
    };
    const res = await adminCreateCard(effectiveId, patch);
    if (res.ok) {
      await loadCardOverrides(true);
      setLastId(effectiveId);
      setMsg(tx("created"));
      reset();
      onCreated?.();
    } else {
      setMsg(res.error === "card_exists" ? tx("exists") : res.error ?? "failed");
    }
    setBusy(false);
  };

  const grantToMe = async () => {
    if (!lastId) return;
    setBusy(true);
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const res = await adminGrantCharacter(data.user.id, lastId, 1);
      setMsg(res.ok ? tx("granted") : res.error ?? "failed");
    }
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-sm font-black uppercase tracking-widest text-primary">{tx("heading")}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">{tx("intro")}</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground"
        >
          {open ? tx("close") : tx("open")}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[180px_1fr]">
          <div>
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/15 bg-black/40">
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-4xl text-white/15">刀</div>
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
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder={tx("url")}
              className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label={tx("nameEn")} value={nameEn} onChange={setNameEn} />
              <Field label={tx("nameAr")} value={nameAr} onChange={setNameAr} />
              <Field
                label={tx("cardId")}
                value={idTouched ? cardId : effectiveId}
                onChange={(v) => { setIdTouched(true); setCardId(v); }}
              />
              <Field label={tx("overall")} type="number" value={String(overall)} onChange={(v) => setOverall(Number(v))} />
              <Select label={tx("rarity")} value={rarity} options={RARITIES} onChange={(v) => setRarity(v as Rarity)} />
              <Select label={tx("gender")} value={gender} options={[...GENDERS]} onChange={setGender} />
              <Field label={tx("faction")} value={faction} onChange={setFaction} />
              <Field label={tx("element")} value={element} onChange={setElement} />
            </div>
            <Field label={tx("loreEn")} value={loreEn} onChange={setLoreEn} />
            <Field label={tx("loreAr")} value={loreAr} onChange={setLoreAr} />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={create}
                disabled={busy || !nameEn.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40"
              >
                {tx("create")}
              </button>
              {lastId && (
                <button
                  onClick={grantToMe}
                  disabled={busy}
                  className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground disabled:opacity-40"
                >
                  {tx("grant")}
                </button>
              )}
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
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none"
      >
        {options.map((o) => <option key={o} value={o} className="bg-background">{o}</option>)}
      </select>
    </label>
  );
}
