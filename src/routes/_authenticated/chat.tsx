import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ReiatsuBackground } from "@/components/ReiatsuBackground";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { NameFrame } from "@/components/NameFrame";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { searchUsers, listFriends, type FriendRow } from "@/lib/friends";
import {
  getGlobalMessages, sendGlobalMessage, deleteGlobalMessage,
  getConversations, getDirectMessages, sendDirectMessage, markConversationRead,
  type GlobalMessage, type DirectMessage, type Conversation,
} from "@/lib/chat";

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (s: Record<string, unknown>) => ({ to: typeof s.to === "string" ? s.to : undefined }),
  head: () => ({
    meta: [
      { title: "Chat — Bleach Arena" },
      { name: "description", content: "Talk to the whole arena in global chat or message players privately." },
      { property: "og:title", content: "Bleach Arena — Chat" },
      { property: "og:description", content: "Global chat and private messages for Bleach Arena players." },
    ],
  }),
  component: ChatPage,
});

function timeOf(iso: string) {
  try { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

function ChatPage() {
  const { t } = useI18n();
  const { to } = Route.useSearch();
  const [tab, setTab] = useState<"global" | "dm">(to ? "dm" : "global");

  return (
    <>
      <ReiatsuBackground count={14} />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <h1 className="font-display text-3xl font-black">{t("chat")}</h1>
        <div className="mt-4 flex gap-2">
          {(["global", "dm"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)}
              className={`rounded-lg border px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                tab === k ? "border-primary/50 bg-primary/15 text-primary" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}>
              {k === "global" ? t("globalChat") : t("directMessages")}
            </button>
          ))}
        </div>
        <div className="mt-5">
          {tab === "global" ? <GlobalChat /> : <DirectView initialTo={to} />}
        </div>
      </main>
    </>
  );
}

function GlobalChat() {
  const { t } = useI18n();
  const { user } = useSession();
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => setMessages(await getGlobalMessages(100)), []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("global-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_messages" }, () => { refresh(); })
      .subscribe();
    const id = setInterval(refresh, 6000);
    return () => { clearInterval(id); supabase.removeChannel(channel); };
  }, [refresh]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const v = text.trim();
    if (!v) return;
    setSending(true); setError(null); setText("");
    const res = await sendGlobalMessage(v);
    setSending(false);
    if (res.ok) refresh();
    else {
      setText(v);
      setError(res.error === "rate_limited" ? t("chatRateLimited") : res.error === "no_username" ? t("chatNoUsername") : (res.error ?? "error"));
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-black">
        {t("globalChat")}
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />{t("liveChat")}
        </span>
      </h2>
      <div ref={listRef} className="mb-3 h-[55vh] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">—</p>
        ) : messages.map((m) => {
          const mine = user?.id === m.user_id;
          return (
            <div key={m.id} className={`group flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              <Link to="/profile/$userId" params={{ userId: m.user_id }}>
                <PlayerAvatar characterId={m.avatar_character_id} frame={null} size={28} fallback={(m.username ?? "?")[0]?.toUpperCase()} />
              </Link>
              <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-primary/20" : "bg-white/5"}`}>
                <div className="mb-0.5 flex items-center gap-2">
                  <Link to="/profile/$userId" params={{ userId: m.user_id }} className="min-w-0">
                    <NameFrame frame={m.name_frame}>
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80"
                        style={m.username_color ? { color: m.username_color } : undefined}>
                        {m.username ?? "—"}
                      </span>
                    </NameFrame>
                  </Link>
                  <span className="text-[9px] text-muted-foreground">{timeOf(m.created_at)}</span>
                  {mine && (
                    <button onClick={async () => { await deleteGlobalMessage(m.id); refresh(); }}
                      className="text-[9px] uppercase tracking-widest text-destructive opacity-0 transition-opacity group-hover:opacity-100">
                      {t("deleteMessage")}
                    </button>
                  )}
                </div>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Composer value={text} onChange={setText} onSend={send} disabled={sending} maxLength={300} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </section>
  );
}

function Composer({ value, onChange, onSend, disabled, maxLength }: {
  value: string; onChange: (v: string) => void; onSend: () => void; disabled: boolean; maxLength: number;
}) {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      <input value={value} onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        maxLength={maxLength} placeholder={t("messagePlaceholder")}
        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
      <button disabled={disabled || !value.trim()} onClick={onSend}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
        {t("sendMessage")}
      </button>
    </div>
  );
}

function DirectView({ initialTo }: { initialTo?: string }) {
  const { t } = useI18n();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(initialTo ?? null);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendRow[]>([]);

  const loadConvos = useCallback(async () => setConvos(await getConversations()), []);

  useEffect(() => {
    loadConvos();
    listFriends().then(setFriends);
    const id = setInterval(loadConvos, 8000);
    return () => clearInterval(id);
  }, [loadConvos]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const id = setTimeout(async () => setResults(await searchUsers(q)), 250);
    return () => clearTimeout(id);
  }, [query]);

  const activeInfo = useMemo(
    () => convos.find((c) => c.user_id === active) ?? results.find((r) => r.user_id === active) ?? friends.find((f) => f.user_id === active) ?? null,
    [convos, results, friends, active],
  );

  if (active) {
    return (
      <Thread
        other={active}
        name={activeInfo?.username ?? "—"}
        avatar={activeInfo?.avatar_character_id ?? null}
        onBack={() => { setActive(null); loadConvos(); }}
      />
    );
  }

  const pickList = results.length > 0 ? results : friends;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
        <h2 className="mb-3 font-display text-lg font-black">{t("directMessages")}</h2>
        {convos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noConversations")}</p>
        ) : (
          <ul className="space-y-2">
            {convos.map((c) => (
              <li key={c.user_id}>
                <button onClick={() => setActive(c.user_id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 text-start transition-colors hover:bg-white/10">
                  <PlayerAvatar characterId={c.avatar_character_id} frame={null} size={36} fallback={(c.username ?? "?")[0]?.toUpperCase()} />
                  <div className="min-w-0 flex-1">
                    <NameFrame frame={c.name_frame}>
                      <span className="font-display text-sm font-bold" style={c.username_color ? { color: c.username_color } : undefined}>
                        {c.username ?? "—"}
                      </span>
                    </NameFrame>
                    <div className="truncate text-xs text-muted-foreground">{c.last_message}</div>
                  </div>
                  {c.unread > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">{c.unread}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
        <h2 className="mb-3 font-display text-lg font-black">{t("newConversation")}</h2>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlayers")}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary" />
        <ul className="mt-3 space-y-2">
          {pickList.map((u) => (
            <li key={u.user_id}>
              <button onClick={() => setActive(u.user_id)}
                className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2 text-start transition-colors hover:bg-white/10">
                <PlayerAvatar characterId={u.avatar_character_id} frame={u.profile_frame} size={32} fallback={(u.username ?? "?")[0]?.toUpperCase()} />
                <span className="min-w-0 flex-1 truncate font-display text-sm font-bold"
                  style={u.username_color ? { color: u.username_color } : undefined}>{u.username ?? "—"}</span>
                <span className="text-[10px] uppercase tracking-widest text-primary">{t("message")}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Thread({ other, name, avatar, onBack }: {
  other: string; name: string; avatar: string | null; onBack: () => void;
}) {
  const { t } = useI18n();
  const { user } = useSession();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setMessages(await getDirectMessages(other, 200));
    await markConversationRead(other);
  }, [other]);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel(`dm:${other}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, () => { refresh(); })
      .subscribe();
    const id = setInterval(refresh, 6000);
    return () => { clearInterval(id); supabase.removeChannel(channel); };
  }, [refresh, other]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const v = text.trim();
    if (!v) return;
    setSending(true); setError(null); setText("");
    const res = await sendDirectMessage(other, v);
    setSending(false);
    if (res.ok) refresh();
    else { setText(v); setError(res.error === "rate_limited" ? t("chatRateLimited") : (res.error ?? "error")); }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
          {t("backToList")}
        </button>
        <PlayerAvatar characterId={avatar} frame={null} size={32} fallback={(name ?? "?")[0]?.toUpperCase()} />
        <Link to="/profile/$userId" params={{ userId: other }} className="font-display text-lg font-black hover:underline">{name}</Link>
      </div>
      <div ref={listRef} className="mb-3 h-[50vh] space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground">—</p>
        ) : messages.map((m) => {
          const mine = user?.id === m.sender_id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-1.5 text-sm ${mine ? "bg-primary/20" : "bg-white/5"}`}>
                <div className="whitespace-pre-wrap break-words">{m.content}</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground">{timeOf(m.created_at)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <Composer value={text} onChange={setText} onSend={send} disabled={sending} maxLength={500} />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </section>
  );
}
