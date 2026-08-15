import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { adminCreateNews, adminDeleteNews, adminListNews, adminUpdateNews, type AdminNews } from "@/lib/admin";

const L = {
  heading: { en: "Announcements", ar: "الإعلانات" },
  titleEn: { en: "Title (EN)", ar: "العنوان (إنجليزي)" },
  titleAr: { en: "Title (AR)", ar: "العنوان (عربي)" },
  bodyEn: { en: "Body (EN)", ar: "النص (إنجليزي)" },
  bodyAr: { en: "Body (AR)", ar: "النص (عربي)" },
  pinned: { en: "Pinned", ar: "مثبّت" },
  publish: { en: "Publish", ar: "نشر" },
  update: { en: "Update", ar: "تحديث" },
  edit: { en: "Edit", ar: "تعديل" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  remove: { en: "Delete", ar: "حذف" },
  empty: { en: "No announcements yet.", ar: "لا توجد إعلانات بعد." },
} as const;

const EMPTY = { title_en: "", title_ar: "", body_en: "", body_ar: "", pinned: false };

export function AnnouncementBoard({ onChanged }: { onChanged?: () => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [rows, setRows] = useState<AdminNews[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = async () => setRows(await adminListNews());
  useEffect(() => { void refresh(); }, []);

  const submit = async () => {
    if (!form.title_en.trim()) return;
    setBusy(true);
    const res = editing ? await adminUpdateNews(editing, form) : await adminCreateNews(form);
    setBusy(false);
    setMsg(res.ok ? "✓" : res.error ?? "failed");
    if (res.ok) { setForm(EMPTY); setEditing(null); await refresh(); onChanged?.(); }
  };

  const remove = async (id: string) => {
    setBusy(true);
    const res = await adminDeleteNews(id);
    setBusy(false);
    setMsg(res.ok ? "✓" : res.error ?? "failed");
    if (res.ok) { await refresh(); onChanged?.(); }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label={tx("titleEn")} value={form.title_en} onChange={(v) => setForm((f) => ({ ...f, title_en: v }))} />
          <Input label={tx("titleAr")} value={form.title_ar} onChange={(v) => setForm((f) => ({ ...f, title_ar: v }))} />
        </div>
        <Textarea label={tx("bodyEn")} value={form.body_en} onChange={(v) => setForm((f) => ({ ...f, body_en: v }))} />
        <Textarea label={tx("bodyAr")} value={form.body_ar} onChange={(v) => setForm((f) => ({ ...f, body_ar: v }))} />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} />
          {tx("pinned")}
        </label>
        <div className="flex items-center gap-2">
          <button onClick={submit} disabled={busy || !form.title_en.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground disabled:opacity-40">
            {editing ? tx("update") : tx("publish")}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(EMPTY); }}
              className="rounded-lg border border-white/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {tx("cancel")}
            </button>
          )}
          {msg && <span className="text-xs text-accent">{msg}</span>}
        </div>
      </div>

      <ul className="space-y-2">
        {rows.map((n) => (
          <li key={n.id} className="rounded-xl border border-white/10 bg-card/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{n.pinned ? "📌 " : ""}{locale === "ar" ? n.title_ar : n.title_en}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{locale === "ar" ? n.body_ar : n.body_en}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => { setEditing(n.id); setForm({ title_en: n.title_en, title_ar: n.title_ar, body_en: n.body_en, body_ar: n.body_ar, pinned: n.pinned }); }}
                  className="rounded-md border border-white/15 px-2 py-1 text-[9px] uppercase tracking-widest text-muted-foreground">{tx("edit")}</button>
                <button onClick={() => remove(n.id)}
                  className="rounded-md border border-red-500/40 px-2 py-1 text-[9px] uppercase tracking-widest text-red-400">{tx("remove")}</button>
              </div>
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">{tx("empty")}</p>}
      </ul>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</span>
      <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </label>
  );
}