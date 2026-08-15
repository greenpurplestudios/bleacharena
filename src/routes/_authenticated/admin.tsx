import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import {
  amIAdmin, searchPlayers, getPlayer, fetchAuditLog,
  adminGrantSouls, adminGrantXp, adminGrantPack, adminGrantCharacter,
  adminGrantItem, adminUnlockAchievement, adminSetStreak, adminTransferProgress,
  adminSetUsername,
  type AdminPlayer, type AdminPlayerDetail, type AuditRow,
} from "@/lib/admin";
import { CardStudio } from "@/components/admin/CardStudio";
import { AnnouncementBoard } from "@/components/admin/AnnouncementBoard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Console — Bleach Arena" },
      { name: "description", content: "Developer tools for managing players, currency, collections and progression." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Bleach Arena — Admin Console" },
      { property: "og:description", content: "Restricted developer tooling." },
    ],
  }),
  component: AdminPage,
});

const L = {
  title: { en: "Admin Console", ar: "لوحة المطوّر" },
  eyebrow: { en: "Restricted", ar: "مقيّد" },
  denied: { en: "You don't have access to this page.", ar: "ليس لديك صلاحية لهذه الصفحة." },
  search: { en: "Search players", ar: "ابحث عن لاعبين" },
  souls: { en: "Souls", ar: "أرواح" },
  xp: { en: "XP", ar: "خبرة" },
  pack: { en: "Pack", ar: "عبوة" },
  character: { en: "Character ID", ar: "معرّف الشخصية" },
  item: { en: "Store item ID", ar: "معرّف عنصر المتجر" },
  achievement: { en: "Achievement ID", ar: "معرّف الإنجاز" },
  streak: { en: "Daily streak", ar: "سلسلة يومية" },
  username: { en: "Change username", ar: "تغيير اسم اللاعب" },
  transfer: { en: "Transfer progress from (user id)", ar: "نقل التقدّم من (معرّف)" },
  apply: { en: "Apply", ar: "تطبيق" },
  audit: { en: "Recent admin actions", ar: "إجراءات المشرف الأخيرة" },
  loading: { en: "Loading…", ar: "جارٍ التحميل…" },
  selectPlayer: { en: "Select a player to manage.", ar: "اختر لاعبًا لإدارته." },
  tabPlayers: { en: "Players", ar: "اللاعبون" },
  tabCards: { en: "Cards", ar: "البطاقات" },
  tabNews: { en: "Announcements", ar: "الإعلانات" },
} as const;

type Tab = "players" | "cards" | "news";

function AdminPage() {
  const { locale, dir } = useI18n();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [selected, setSelected] = useState<AdminPlayer | null>(null);
  const [detail, setDetail] = useState<AdminPlayerDetail | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("players");

  useEffect(() => {
    amIAdmin().then(async (ok) => {
      setAllowed(ok);
      if (!ok) return;
      setPlayers(await searchPlayers(""));
      setAudit(await fetchAuditLog());
    });
  }, []);

  const runSearch = async () => setPlayers(await searchPlayers(q.trim()));

  const pick = async (p: AdminPlayer) => {
    setSelected(p);
    setDetail(null);
    setDetail(await getPlayer(p.user_id));
  };

  const run = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    if (busy || !selected) return;
    setBusy(true);
    const res = await fn();
    setBusy(false);
    setFlash(res.ok ? "✓" : (res.error ?? "failed"));
    setTimeout(() => setFlash(null), 2500);
    if (res.ok) {
      setDetail(await getPlayer(selected.user_id));
      setAudit(await fetchAuditLog());
    }
  };

  if (allowed === null) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">{L.loading[locale]}</main>
      </>
    );
  }
  if (!allowed) {
    return (
      <>
        <SceneBackground scene="profile" />
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl font-black">403</h1>
          <p className="mt-2 text-sm text-muted-foreground">{L.denied[locale]}</p>
        </main>
      </>
    );
  }

  return (
    <>
      <SceneBackground scene="profile" />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10" dir={dir}>
        <p className="text-[10px] uppercase tracking-[0.4em] text-red-400">{L.eyebrow[locale]}</p>
        <h1 className="mt-1 font-display text-3xl font-black text-glow-orange sm:text-4xl">{L.title[locale]}</h1>

        <div className="mt-5 flex gap-2">
          {(["players", "cards", "news"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${
                tab === t ? "border-primary/60 bg-primary/15 text-primary" : "border-white/10 text-muted-foreground"
              }`}
            >
              {t === "players" ? L.tabPlayers[locale] : t === "cards" ? L.tabCards[locale] : L.tabNews[locale]}
            </button>
          ))}
        </div>

        {tab === "cards" && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-4">
            <CardStudio onDone={async () => setAudit(await fetchAuditLog())} />
          </section>
        )}
        {tab === "news" && (
          <section className="mt-6">
            <AnnouncementBoard onChanged={async () => setAudit(await fetchAuditLog())} />
          </section>
        )}

        {tab === "players" && (
        <>
        <div className="mt-6 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            placeholder={L.search[locale]}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm focus:border-primary focus:outline-none"
          />
          <button onClick={runSearch} className="rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground">
            →
          </button>
        </div>

        <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-card/60">
          {players.map((p) => (
            <button
              key={p.user_id}
              onClick={() => pick(p)}
              className={`flex w-full items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5 text-start text-sm last:border-b-0 hover:bg-white/5 ${
                selected?.user_id === p.user_id ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <span className="min-w-0 truncate font-semibold">
                {p.username ?? "—"} {p.is_admin && <span className="text-[10px] text-red-400">ADMIN</span>}
              </span>
              <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                Lv{p.level} · ✦{p.souls}
              </span>
            </button>
          ))}
          {players.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-muted-foreground">—</p>
          )}
        </div>

        {!selected ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{L.selectPlayer[locale]}</p>
        ) : (
          <section className="mt-6 rounded-2xl border border-white/10 bg-card/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-xl font-black">{selected.username ?? selected.user_id}</h2>
              {flash && <span className="text-xs text-accent">{flash}</span>}
            </div>
            {detail && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lv{detail.level?.level ?? 1} · ✦{String(detail.profile?.souls ?? 0)} · {detail.cards} cards ·{" "}
                {detail.items} items · {detail.achievements} achievements · streak {detail.daily?.streak ?? 0}
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <NumberAction label={L.souls[locale]} placeholder="500" disabled={busy}
                onRun={(v) => run(() => adminGrantSouls(selected.user_id, v))} />
              <NumberAction label={L.xp[locale]} placeholder="1000" disabled={busy}
                onRun={(v) => run(() => adminGrantXp(selected.user_id, v))} />
              <NumberAction label={L.streak[locale]} placeholder="7" disabled={busy}
                onRun={(v) => run(() => adminSetStreak(selected.user_id, v))} />
              <TextAction label={L.username[locale]} placeholder={selected.username ?? "NewName"} disabled={busy}
                onRun={(v) => run(async () => {
                  const res = await adminSetUsername(selected.user_id, v);
                  if (res.ok) {
                    setSelected((s) => (s ? { ...s, username: v } : s));
                    setPlayers((ps) => ps.map((p) => (p.user_id === selected.user_id ? { ...p, username: v } : p)));
                  }
                  return res;
                })} />
              <TextAction label={L.pack[locale]} placeholder="bronze | silver | gold | legend" disabled={busy}
                onRun={(v) => run(() => adminGrantPack(selected.user_id, v, 1))} />
              <TextAction label={L.character[locale]} placeholder="ichigo" disabled={busy}
                onRun={(v) => run(() => adminGrantCharacter(selected.user_id, v, 1))} />
              <TextAction label={L.item[locale]} placeholder="title_captain" disabled={busy}
                onRun={(v) => run(() => adminGrantItem(selected.user_id, v))} />
              <TextAction label={L.achievement[locale]} placeholder="first_draft" disabled={busy}
                onRun={(v) => run(() => adminUnlockAchievement(selected.user_id, v))} />
              <TextAction label={L.transfer[locale]} placeholder="uuid" disabled={busy}
                onRun={(v) => run(() => adminTransferProgress(v, selected.user_id))} />
            </div>
          </section>
        )}
        </>
        )}

        <section className="mt-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{L.audit[locale]}</h2>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {audit.map((a) => (
              <li key={a.id} className="truncate rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5">
                <span className="text-foreground/80">{a.action}</span> · {new Date(a.created_at).toLocaleString()} ·{" "}
                {JSON.stringify(a.details)}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

function NumberAction({ label, placeholder, disabled, onRun }: {
  label: string; placeholder: string; disabled: boolean; onRun: (v: number) => void;
}) {
  const [v, setV] = useState("");
  return (
    <ActionShell label={label} disabled={disabled || !v} onRun={() => { onRun(Number(v)); setV(""); }}>
      <input type="number" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </ActionShell>
  );
}

function TextAction({ label, placeholder, disabled, onRun }: {
  label: string; placeholder: string; disabled: boolean; onRun: (v: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <ActionShell label={label} disabled={disabled || !v.trim()} onRun={() => { onRun(v.trim()); setV(""); }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
    </ActionShell>
  );
}

function ActionShell({ label, disabled, onRun, children }: {
  label: string; disabled: boolean; onRun: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex gap-2">
        {children}
        <button
          onClick={onRun}
          disabled={disabled}
          className="shrink-0 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary disabled:opacity-40"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
