import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useI18n } from "@/lib/i18n";
import {
  listFriends, listFriendRequests, respondFriendRequest, removeFriend,
  searchUsers, sendFriendRequest,
  type FriendRow, type FriendRequestRow,
} from "@/lib/friends";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends — Bleach Arena" },
      { name: "description", content: "Connect and battle with friends on Bleach Arena." },
      { property: "og:title", content: "Bleach Arena — Friends" },
    ],
  }),
  component: FriendsPage,
});

function FriendsPage() {
  const { t, locale } = useI18n();
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [requests, setRequests] = useState<FriendRequestRow[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [f, r] = await Promise.all([listFriends(), listFriendRequests()]);
    setFriends(f); setRequests(r);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const q = query.trim();
    if (!q) { setResults([]); return; }
    let cancelled = false;
    const h = setTimeout(async () => {
      const rows = await searchUsers(q);
      if (!cancelled) setResults(rows);
    }, 250);
    return () => { cancelled = true; clearTimeout(h); };
  }, [query]);

  const notify = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const onSend = async (uid: string) => {
    setBusy(uid);
    const res = await sendFriendRequest(uid);
    setBusy(null);
    if (res.ok) {
      notify(res.status === "accepted" ? t("friendAdded") : t("requestSent"));
      refresh();
    } else {
      notify(res.error === "already_friends" ? t("alreadyFriends") : res.error === "already_requested" ? t("requestPending") : (res.error ?? "Error"));
    }
  };
  const onRespond = async (id: string, accept: boolean) => {
    setBusy(id);
    await respondFriendRequest(id, accept);
    setBusy(null); refresh();
  };
  const onRemove = async (uid: string) => {
    setBusy(uid);
    await removeFriend(uid);
    setBusy(null); refresh();
  };

  const incoming = requests.filter(r => r.direction === "incoming");
  const outgoing = requests.filter(r => r.direction === "outgoing");

  return (
    <>
      <SceneBackground scene="social" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-black">{t("friends")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("friendsDesc")}</p>
        </header>

        <section className="mb-6 rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlayers")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {results.length > 0 && (
            <ul className="mt-3 space-y-2">
              {results.map((u) => (
                <PlayerRow key={u.user_id} row={u} locale={locale}
                  actions={
                    <button
                      disabled={busy === u.user_id}
                      onClick={() => onSend(u.user_id)}
                      className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary disabled:opacity-50"
                    >{t("addFriend")}</button>
                  }
                />
              ))}
            </ul>
          )}
        </section>

        {incoming.length > 0 && (
          <Section title={t("incomingRequests")}>
            {incoming.map((r) => (
              <PlayerRow key={r.id} row={{ ...r, level: 1 } as FriendRow} locale={locale}
                actions={
                  <div className="flex gap-2">
                    <button disabled={busy === r.id} onClick={() => onRespond(r.id, true)}
                      className="rounded-md bg-primary/90 px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary disabled:opacity-50">{t("acceptRequest")}</button>
                    <button disabled={busy === r.id} onClick={() => onRespond(r.id, false)}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10 disabled:opacity-50">{t("rejectRequest")}</button>
                  </div>
                }
              />
            ))}
          </Section>
        )}

        {outgoing.length > 0 && (
          <Section title={t("outgoingRequests")}>
            {outgoing.map((r) => (
              <PlayerRow key={r.id} row={{ ...r, level: 1 } as FriendRow} locale={locale}
                actions={
                  <button disabled={busy === r.id} onClick={() => onRemove(r.user_id)}
                    className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10 disabled:opacity-50">{t("cancelRequest")}</button>
                }
              />
            ))}
          </Section>
        )}

        <Section title={`${t("yourFriends")} (${friends.length})`}>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noFriends")}</p>
          ) : (
            friends.map((f) => (
              <PlayerRow key={f.user_id} row={f} locale={locale}
                actions={
                  <div className="flex gap-2">
                    <Link to="/profile/$userId" params={{ userId: f.user_id }}
                      className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold hover:bg-white/10">{t("viewProfile")}</Link>
                    <button disabled={busy === f.user_id} onClick={() => onRemove(f.user_id)}
                      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:opacity-50">{t("removeFriend")}</button>
                  </div>
                }
              />
            ))
          )}
        </Section>

        {toast && (
          <div className="fixed inset-x-0 bottom-6 mx-auto w-fit rounded-full border border-white/10 bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur">
      <h2 className="mb-3 font-display text-lg font-black">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function PlayerRow({ row, actions }: { row: FriendRow; locale: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-2">
      <PlayerAvatar characterId={row.avatar_character_id} frame={row.profile_frame} size={44}
        fallback={(row.username ?? "?")[0]?.toUpperCase()} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold"
          style={row.username_color ? { color: row.username_color } : undefined}>
          {row.username ?? "—"}
        </div>
        {row.title && <div className="truncate text-[10px] uppercase tracking-widest text-accent">{row.title}</div>}
      </div>
      {actions}
    </div>
  );
}