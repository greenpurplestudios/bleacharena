import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  createClan, disbandClan, getClanMessages, getMyClan, kickClanMember, leaveClan,
  listClans, requestJoinClan, cancelJoinRequest, respondJoinRequest,
  sendClanMessage, setClanMemberRole, transferClanLeadership, updateClanDescription,
  getClanWeeklyLeaderboard, getMyClanWeeklyReward, claimClanWeeklyReward,
  type ClanWeeklyRow, type ClanWeeklyRewardStatus,
  type ClanListRow, type ClanMember, type ClanMessage, type MyClanState,
} from "@/lib/clans";

export const Route = createFileRoute("/_authenticated/clans")({
  head: () => ({
    meta: [
      { title: "Clans — Bleach Arena" },
      { name: "description", content: "Form a clan, chat with members, and climb the rankings on Bleach Arena." },
      { property: "og:title", content: "Bleach Arena — Clans" },
    ],
  }),
  component: ClansPage,
});

function ClansPage() {
  const { t } = useI18n();
  const [state, setState] = useState<MyClanState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [tab, setTab] = useState<"clan" | "weekly">("clan");

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2400); };

  const refresh = useCallback(async () => {
    const s = await getMyClan();
    setState(s);
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <>
      <ReiatsuBackground count={10} />
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-black">{t("clans")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clansDesc")}</p>
        </header>
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-card/50 p-8 text-center text-sm text-muted-foreground">…</div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {(["clan", "weekly"] as const).map((k) => (
                <button key={k} onClick={() => setTab(k)}
                  className={`rounded-lg px-4 py-2 text-sm font-bold ${
                    tab === k ? "bg-primary text-primary-foreground" : "border border-white/10 bg-white/5 hover:bg-white/10"
                  }`}>
                  {t(k === "clan" ? "myClan" : "clanWeekly")}
                </button>
              ))}
            </div>
            {tab === "weekly" ? (
              <ClanWeeklyView notify={notify} />
            ) : state?.in_clan ? (
          <MyClanView state={state} onChange={refresh} notify={notify} />
        ) : (
          <BrowseView onJoined={refresh} notify={notify} />
            )}
          </>
        )}
        {toast && (
          <div className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}

function BrowseView({ onJoined, notify }: { onJoined: () => void; notify: (m: string) => void }) {
  const { t } = useI18n();
  const [rows, setRows] = useState<ClanListRow[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async (q = "") => setRows(await listClans(q)), []);
  useEffect(() => { refresh(""); }, [refresh]);
  useEffect(() => { const h = setTimeout(() => refresh(query.trim()), 250); return () => clearTimeout(h); }, [query, refresh]);

  const onRequest = async (id: string, cancel: boolean) => {
    setBusy(id);
    const res = cancel ? await cancelJoinRequest(id) : await requestJoinClan(id);
    setBusy(null);
    if (!res.ok) notify(mapError(res.error, t));
    else { notify(cancel ? t("cancelRequest") : t("requestSent")); refresh(query.trim()); onJoined(); }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchClans")}
          className="flex-1 min-w-[12rem] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={() => setCreating((v) => !v)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >{t("createClan")}</button>
      </div>

      {creating && <CreateClanForm onCreated={() => { setCreating(false); onJoined(); }} notify={notify} />}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-card/50 p-8 text-center text-sm text-muted-foreground">
          {t("noClans")}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-card/50 p-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 font-display text-sm font-black text-primary">
                [{c.tag}]
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-base font-bold">{c.name}</div>
                {c.description && <div className="truncate text-xs text-muted-foreground">{c.description}</div>}
                <div className="mt-1 flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>{c.member_count} {t("members")}</span>
                  <span>Lv {c.total_level}</span>
                </div>
              </div>
              <button
                disabled={busy === c.id}
                onClick={() => onRequest(c.id, c.my_request)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
                  c.my_request
                    ? "border border-white/10 bg-white/5 hover:bg-white/10"
                    : "bg-primary/90 text-primary-foreground hover:bg-primary"
                }`}
              >
                {c.my_request ? t("cancelRequestClan") : t("requestToJoin")}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function CreateClanForm({ onCreated, notify }: { onCreated: () => void; notify: (m: string) => void }) {
  const { t } = useI18n();
  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const res = await createClan(tag, name, desc);
    setBusy(false);
    if (!res.ok) return notify(mapError(res.error, t));
    notify(t("clanCreated"));
    onCreated();
  };

  return (
    <div className="mb-4 space-y-2 rounded-2xl border border-white/10 bg-card/50 p-4">
      <div className="flex flex-wrap gap-2">
        <input value={tag} onChange={(e) => setTag(e.target.value)} maxLength={5}
          placeholder={t("clanTag")}
          className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24}
          placeholder={t("clanName")}
          className="flex-1 min-w-[10rem] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
      </div>
      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={240}
        placeholder={t("clanDescription")}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" rows={2} />
      <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>{t("clanTagHint")}</span><span>{desc.length}/240</span>
      </div>
      <button disabled={busy || tag.length < 2 || name.length < 3}
        onClick={submit}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {t("createClan")}
      </button>
    </div>
  );
}

function MyClanView({ state, onChange, notify }: { state: MyClanState; onChange: () => void; notify: (m: string) => void }) {
  const { t } = useI18n();
  const clan = state.clan!;
  const members = state.members ?? [];
  const requests = state.requests ?? [];
  const myRole = state.my_role!;
  const isLeader = myRole === "leader";
  const isStaff = myRole === "leader" || myRole === "officer";
  const [busy, setBusy] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState(clan.description);
  useEffect(() => { setDescDraft(clan.description); }, [clan.description]);

  const withBusy = async (k: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(k);
    const res = await fn();
    setBusy(null);
    if (!res.ok) notify(mapError(res.error, t));
    else onChange();
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-card/50 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 font-display text-lg font-black text-primary">
            [{clan.tag}]
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-2xl font-black">{clan.name}</div>
            <div className="mt-1 flex gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>{clan.member_count} {t("members")}</span>
              <span>{t(myRole === "leader" ? "clanLeader" : myRole === "officer" ? "clanOfficer" : "clanMember")}</span>
            </div>
          </div>
          {isLeader ? (
            <button
              onClick={() => { if (confirm(t("confirmDisband"))) withBusy("disband", disbandClan); }}
              className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20">
              {t("disband")}
            </button>
          ) : (
            <button
              onClick={() => { if (confirm(t("confirmLeave"))) withBusy("leave", leaveClan); }}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10">
              {t("leaveClan")}
            </button>
          )}
        </div>
        {isStaff ? (
          <div className="mt-3">
            <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} maxLength={240}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" rows={2}
              placeholder={t("clanDescription")} />
            <div className="mt-2 flex justify-between">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{descDraft.length}/240</span>
              <button
                disabled={descDraft === clan.description}
                onClick={() => withBusy("desc", () => updateClanDescription(descDraft))}
                className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary disabled:opacity-50">
                {t("saveDescription")}
              </button>
            </div>
          </div>
        ) : clan.description ? (
          <p className="mt-3 text-sm text-muted-foreground">{clan.description}</p>
        ) : null}
      </section>

      {isStaff && requests.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-card/50 p-4">
          <h2 className="mb-3 font-display text-lg font-black">{t("joinRequests")} ({requests.length})</h2>
          <ul className="space-y-2">
            {requests.map((r) => (
              <li key={r.user_id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
                <PlayerAvatar characterId={r.avatar_character_id} frame={r.profile_frame} size={40}
                  fallback={(r.username ?? "?")[0]?.toUpperCase()} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-bold" style={r.username_color ? { color: r.username_color } : undefined}>
                    {r.username ?? "—"}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lv {r.level}</div>
                </div>
                <button disabled={busy === "req:" + r.user_id}
                  onClick={() => withBusy("req:" + r.user_id, () => respondJoinRequest(r.user_id, true))}
                  className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary disabled:opacity-50">
                  {t("approve")}
                </button>
                <button disabled={busy === "req:" + r.user_id}
                  onClick={() => withBusy("req:" + r.user_id, () => respondJoinRequest(r.user_id, false))}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10 disabled:opacity-50">
                  {t("reject")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-card/50 p-4">
        <h2 className="mb-3 font-display text-lg font-black">{t("members")} ({members.length})</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <MemberRow key={m.user_id} m={m} myRole={myRole}
              onKick={() => { if (confirm(t("confirmKick"))) withBusy("k:" + m.user_id, () => kickClanMember(m.user_id)); }}
              onPromote={() => withBusy("p:" + m.user_id, () => setClanMemberRole(m.user_id, "officer"))}
              onDemote={() => withBusy("d:" + m.user_id, () => setClanMemberRole(m.user_id, "member"))}
              onTransfer={() => { if (confirm(t("confirmTransfer"))) withBusy("t:" + m.user_id, () => transferClanLeadership(m.user_id)); }}
              busy={busy}
            />
          ))}
        </ul>
      </section>

      <ClanChat />
    </div>
  );
}

function MemberRow({ m, myRole, onKick, onPromote, onDemote, onTransfer, busy }: {
  m: ClanMember; myRole: "leader" | "officer" | "member";
  onKick: () => void; onPromote: () => void; onDemote: () => void; onTransfer: () => void;
  busy: string | null;
}) {
  const { t } = useI18n();
  const { user } = useSession();
  const isMe = user?.id === m.user_id;
  const roleBadge = m.role === "leader" ? t("clanLeader") : m.role === "officer" ? t("clanOfficer") : t("clanMember");
  const roleColor = m.role === "leader" ? "text-amber-400 border-amber-400/40 bg-amber-500/10"
    : m.role === "officer" ? "text-sky-300 border-sky-300/40 bg-sky-500/10"
    : "text-muted-foreground border-white/10 bg-white/5";

  const canKick = !isMe && m.role !== "leader" && (myRole === "leader" || (myRole === "officer" && m.role === "member"));
  const canPromote = myRole === "leader" && m.role === "member";
  const canDemote = myRole === "leader" && m.role === "officer";
  const canTransfer = myRole === "leader" && !isMe && m.role !== "leader";

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
      <PlayerAvatar characterId={m.avatar_character_id} frame={m.profile_frame} size={40}
        fallback={(m.username ?? "?")[0]?.toUpperCase()} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold" style={m.username_color ? { color: m.username_color } : undefined}>
          {m.username ?? "—"}
        </div>
        <div className="flex gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>Lv {m.level}</span>
          <span>{m.rival_rating}</span>
        </div>
      </div>
      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${roleColor}`}>{roleBadge}</span>
      <div className="flex flex-wrap gap-1">
        {canPromote && <button disabled={!!busy} onClick={onPromote} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold hover:bg-white/10 disabled:opacity-50">{t("promoteOfficer")}</button>}
        {canDemote && <button disabled={!!busy} onClick={onDemote} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold hover:bg-white/10 disabled:opacity-50">{t("demoteMember")}</button>}
        {canTransfer && <button disabled={!!busy} onClick={onTransfer} className="rounded-md border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50">{t("transferLeader")}</button>}
        {canKick && <button disabled={!!busy} onClick={onKick} className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50">{t("kick")}</button>}
      </div>
    </li>
  );
}

function ClanChat() {
  const { t } = useI18n();
  const { user } = useSession();
  const [messages, setMessages] = useState<ClanMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => setMessages(await getClanMessages(100)), []);
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh]);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const v = text.trim();
    if (!v) return;
    setSending(true);
    const res = await sendClanMessage(v);
    setSending(false);
    if (res.ok) { setText(""); refresh(); }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-card/50 p-4">
      <h2 className="mb-3 font-display text-lg font-black">{t("clanChat")}</h2>
      <div ref={listRef} className="mb-3 max-h-80 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">—</p>
        ) : messages.map((m) => {
          const mine = user?.id === m.user_id;
          return (
            <div key={m.id} className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <PlayerAvatar characterId={m.avatar_character_id} frame={null} size={28}
                fallback={(m.username ?? "?")[0]?.toUpperCase()} />
              <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-primary/20" : "bg-white/5"}`}>
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest opacity-70"
                  style={m.username_color ? { color: m.username_color } : undefined}>
                  {m.username ?? "—"}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          maxLength={500} placeholder={t("messagePlaceholder")}
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
        <button disabled={sending || !text.trim()} onClick={send}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {t("sendMessage")}
        </button>
      </div>
    </section>
  );
}

function mapError(err: string | undefined, t: (k: import("@/lib/i18n").TKey) => string): string {
  switch (err) {
    case "tag_taken": return t("clanTagTaken");
    case "name_taken": return t("clanNameTaken");
    case "already_in_clan": return t("alreadyInClan");
    case "leader_must_transfer_or_disband": return t("leaderMustTransfer");
    default: return err ?? "Error";
  }
}