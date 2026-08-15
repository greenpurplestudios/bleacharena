import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SceneBackground } from "@/components/SceneBackground";
import { useI18n } from "@/lib/i18n";
import { useSouls } from "@/hooks/use-souls";
import { play } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { characters } from "@/data/characters";
import { RARITY_COLOR, RARITY_LABEL, RARITY_ORDER } from "@/lib/rarity";
import { fetchMyCollection, type CollectionRow } from "@/lib/packs";
import {
  browseMarket, buyListing, cancelListing, createTrade, listCard, myListings,
  myMarketHistory, myTrades, playerCollection, respondTrade, searchTradePartners,
  type Listing, type MarketSort, type MyListing, type SaleRow, type TradeRow, type UserHit,
} from "@/lib/market";
import type { Rarity } from "@/types/character";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({
    meta: [
      { title: "Market — Bleach Arena" },
      { name: "description", content: "Buy and sell Bleach Arena cards for Souls, or trade directly with other players." },
      { property: "og:title", content: "Bleach Arena — Market" },
      { property: "og:description", content: "Player marketplace and card trading." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MarketPage,
});

const L = {
  title: { en: "Market", ar: "السوق" },
  kicker: { en: "Trade souls for souls", ar: "تجارة بين اللاعبين" },
  browse: { en: "Browse", ar: "تصفح" },
  sell: { en: "Sell", ar: "بيع" },
  mine: { en: "My Listings", ar: "إعلاناتي" },
  trades: { en: "Trades", ar: "المقايضات" },
  history: { en: "History", ar: "السجل" },
  search: { en: "Search a card…", ar: "ابحث عن بطاقة…" },
  minPrice: { en: "Min", ar: "الأدنى" },
  maxPrice: { en: "Max", ar: "الأعلى" },
  all: { en: "All", ar: "الكل" },
  founderOnly: { en: "Founders", ar: "المؤسسون" },
  newest: { en: "Newest", ar: "الأحدث" },
  cheapest: { en: "Cheapest", ar: "الأرخص" },
  expensive: { en: "Highest price", ar: "الأغلى" },
  rating: { en: "Top rated", ar: "الأعلى تقييماً" },
  buy: { en: "Buy", ar: "شراء" },
  seller: { en: "Seller", ar: "البائع" },
  empty: { en: "Nothing listed yet.", ar: "لا توجد إعلانات بعد." },
  price: { en: "Price in Souls", ar: "السعر بالأرواح" },
  listIt: { en: "List for sale", ar: "اعرض للبيع" },
  youReceive: { en: "You receive after 5% tax", ar: "ستستلم بعد ضريبة 5%" },
  copies: { en: "copies", ar: "نسخ" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  active: { en: "Active", ar: "نشط" },
  sold: { en: "Sold", ar: "مُباع" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
  bought: { en: "Bought", ar: "اشتريت" },
  noSouls: { en: "Not enough Souls.", ar: "أرواح غير كافية." },
  gone: { en: "That listing is gone.", ar: "هذا الإعلان لم يعد متاحاً." },
  done: { en: "Done.", ar: "تم." },
  pickCard: { en: "Pick one of your cards", ar: "اختر إحدى بطاقاتك" },
  noDupes: { en: "You own no cards to sell yet.", ar: "لا تملك بطاقات للبيع بعد." },
  findPlayer: { en: "Find a player…", ar: "ابحث عن لاعب…" },
  youGive: { en: "You give", ar: "تعطي" },
  youGet: { en: "You get", ar: "تأخذ" },
  sendTrade: { en: "Send trade offer", ar: "أرسل عرض المقايضة" },
  accept: { en: "Accept", ar: "قبول" },
  decline: { en: "Decline", ar: "رفض" },
  withdraw: { en: "Withdraw", ar: "سحب" },
  incoming: { en: "Incoming", ar: "وارد" },
  outgoing: { en: "Sent", ar: "مُرسل" },
  noTrades: { en: "No trades yet.", ar: "لا توجد مقايضات بعد." },
  noHistory: { en: "No transactions yet.", ar: "لا توجد معاملات بعد." },
  tax: { en: "tax", ar: "ضريبة" },
  clear: { en: "Clear", ar: "مسح" },
};

const byId = new Map(characters.map((c) => [c.id, c]));

function cardName(id: string, locale: "en" | "ar") {
  return byId.get(id)?.name[locale] ?? id;
}

function CardTile({ id, size = 44 }: { id: string; size?: number }) {
  const c = byId.get(id);
  const color = c ? RARITY_COLOR[c.rarity] : "oklch(0.6 0 0)";
  return (
    <div
      className="shrink-0 overflow-hidden rounded-lg border"
      style={{ width: size, height: size, borderColor: `color-mix(in oklab, ${color} 60%, transparent)` }}
    >
      {c?.image ? (
        <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover" style={{ objectPosition: "50% 22%" }} />
      ) : null}
    </div>
  );
}

type Tab = "browse" | "sell" | "mine" | "trades" | "history";

function MarketPage() {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const { souls, refresh: refreshSouls } = useSouls();
  const [tab, setTab] = useState<Tab>("browse");
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 2200);
  }, []);

  return (
    <div className="relative min-h-dvh">
      <SceneBackground />
      <SiteHeader />
      <main className="relative mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        <header className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary/80">{tx("kicker")}</p>
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-3xl font-black tracking-tight">{tx("title")}</h1>
            <span className="text-sm font-bold text-primary">✦ {souls ?? "—"}</span>
          </div>
        </header>

        <nav className="mb-4 flex gap-1 overflow-x-auto rounded-xl border border-border/60 bg-card/60 p-1">
          {(["browse", "sell", "mine", "trades", "history"] as Tab[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { play("tap"); setTab(k); }}
              className={`min-w-max flex-1 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                tab === k ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              {tx(k === "mine" ? "mine" : k)}
            </button>
          ))}
        </nav>

        {tab === "browse" && <Browse onDone={(m) => { notify(m); refreshSouls(); }} souls={souls} />}
        {tab === "sell" && <Sell onDone={notify} />}
        {tab === "mine" && <MyListingsTab onDone={notify} />}
        {tab === "trades" && <Trades onDone={notify} />}
        {tab === "history" && <History />}
      </main>

      {toast ? (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-max max-w-[90vw] rounded-full border border-primary/40 bg-card/95 px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- browse */

function Browse({ souls, onDone }: { souls: number | null; onDone: (m: string) => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [q, setQ] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rarity, setRarity] = useState<Rarity | null>(null);
  const [sort, setSort] = useState<MarketSort>("newest");
  const [rows, setRows] = useState<Listing[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    // Search matches names client-side, so pull a wide page and filter here.
    browseMarket({ min: min ? Number(min) : null, max: max ? Number(max) : null, rarity, sort, limit: 200 })
      .then(setRows);
  }, [min, max, rarity, sort]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return rows ?? [];
    return (rows ?? []).filter((l) => {
      const c = byId.get(l.character_id);
      return !!c && (c.name.en.toLowerCase().includes(n) || c.name.ar.includes(q.trim()));
    });
  }, [rows, q]);

  async function buy(l: Listing) {
    setBusy(l.id);
    const r = await buyListing(l.id);
    setBusy(null);
    if (!r.ok) {
      onDone(r.error === "not_enough_souls" ? tx("noSouls") : tx("gone"));
      load();
      return;
    }
    haptic("pack");
    play("tap");
    onDone(`${tx("bought")} ${cardName(l.character_id, locale)}`);
    load();
  }

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tx("search")}
        className="w-full rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-base outline-none focus:border-primary/60"
      />
      <div className="flex flex-wrap gap-2">
        <input value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
          placeholder={tx("minPrice")} className="w-20 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-sm outline-none" />
        <input value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric"
          placeholder={tx("maxPrice")} className="w-20 rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-sm outline-none" />
        <select value={sort} onChange={(e) => setSort(e.target.value as MarketSort)}
          className="rounded-lg border border-border/70 bg-card/70 px-3 py-2 text-sm outline-none">
          <option value="newest">{tx("newest")}</option>
          <option value="cheapest">{tx("cheapest")}</option>
          <option value="expensive">{tx("expensive")}</option>
          <option value="rating">{tx("rating")}</option>
        </select>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        <Chip active={rarity === null} onClick={() => setRarity(null)} label={tx("all")} />
        {RARITY_ORDER.map((r) => (
          <Chip key={r} active={rarity === r} onClick={() => setRarity(r)} label={RARITY_LABEL[r][locale]} color={RARITY_COLOR[r]} />
        ))}
      </div>

      {rows === null ? (
        <p className="py-8 text-center text-sm text-muted-foreground">…</p>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{tx("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((l) => {
            const c = byId.get(l.character_id);
            const color = c ? RARITY_COLOR[c.rarity] : "oklch(0.6 0 0)";
            const afford = (souls ?? 0) >= l.price;
            return (
              <li key={l.id}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-2.5"
                style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
                <CardTile id={l.character_id} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{cardName(l.character_id, locale)}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {c ? `${RARITY_LABEL[c.rarity][locale]} · ${c.overall}` : ""} · {tx("seller")}: {l.seller_name ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">✦ {l.price.toLocaleString()}</p>
                  {l.mine ? (
                    <span className="text-[10px] uppercase text-muted-foreground">{tx("mine")}</span>
                  ) : (
                    <button type="button" disabled={!afford || busy === l.id} onClick={() => buy(l)}
                      className="mt-1 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground disabled:opacity-40">
                      {tx("buy")}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color?: string }) {
  return (
    <button type="button" onClick={onClick}
      className={`min-w-max rounded-full border px-3 py-1 text-xs font-bold transition-colors ${
        active ? "border-primary/70 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground"
      }`}
      style={active && color ? { borderColor: color, color } : undefined}>
      {label}
    </button>
  );
}

/* --------------------------------------------------------------- sell */

function Sell({ onDone }: { onDone: (m: string) => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [rows, setRows] = useState<CollectionRow[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => { fetchMyCollection().then(setRows); }, []);
  useEffect(() => { load(); }, [load]);

  const net = price ? Math.round(Number(price) * 0.95) : 0;

  async function submit() {
    if (!pick || !price) return;
    setBusy(true);
    const r = await listCard(pick, Number(price));
    setBusy(false);
    if (!r.ok) { onDone(r.error ?? "failed"); return; }
    play("tap");
    setPick(null); setPrice("");
    onDone(tx("done"));
    load();
  }

  if (rows === null) return <p className="py-8 text-center text-sm text-muted-foreground">…</p>;
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{tx("noDupes")}</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tx("pickCard")}</p>
      <ul className="grid grid-cols-2 gap-2">
        {rows.slice().sort((a, b) => b.overall - a.overall).map((r) => (
          <li key={r.characterId}>
            <button type="button" onClick={() => { play("tap"); setPick(r.characterId); }}
              className={`flex w-full items-center gap-2 rounded-xl border p-2 text-left transition-colors ${
                pick === r.characterId ? "border-primary bg-primary/10" : "border-border/60 bg-card/70"
              }`}>
              <CardTile id={r.characterId} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold">{cardName(r.characterId, locale)}</span>
                <span className="block text-[10px] text-muted-foreground">×{r.count} {tx("copies")} · {r.overall}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {pick ? (
        <div className="rounded-xl border border-primary/40 bg-card/80 p-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">{tx("price")}</label>
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 8))}
            inputMode="numeric" placeholder="1000"
            className="mt-1 w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-base outline-none focus:border-primary/60" />
          <p className="mt-1 text-[11px] text-muted-foreground">{tx("youReceive")}: ✦ {net.toLocaleString()}</p>
          <button type="button" disabled={busy || !price || Number(price) < 10} onClick={submit}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">
            {tx("listIt")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------- my listings */

function MyListingsTab({ onDone }: { onDone: (m: string) => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [rows, setRows] = useState<MyListing[] | null>(null);
  const load = useCallback(() => { myListings().then(setRows); }, []);
  useEffect(() => { load(); }, [load]);

  async function cancel(id: string) {
    const r = await cancelListing(id);
    onDone(r.ok ? tx("done") : (r.error ?? "failed"));
    load();
  }

  if (rows === null) return <p className="py-8 text-center text-sm text-muted-foreground">…</p>;
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{tx("empty")}</p>;

  return (
    <ul className="space-y-2">
      {rows.map((l) => (
        <li key={l.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-2.5">
          <CardTile id={l.character_id} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{cardName(l.character_id, locale)}</p>
            <p className="text-[11px] text-muted-foreground">
              ✦ {l.price.toLocaleString()} · {l.status === "active" ? tx("active") : l.status === "sold" ? tx("sold") : tx("cancelled")}
            </p>
          </div>
          {l.status === "active" ? (
            <button type="button" onClick={() => cancel(l.id)}
              className="rounded-lg border border-border/70 px-3 py-1 text-xs font-bold text-muted-foreground">
              {tx("cancel")}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------- trades */

function Trades({ onDone }: { onDone: (m: string) => void }) {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [rows, setRows] = useState<TradeRow[] | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<UserHit[]>([]);
  const [partner, setPartner] = useState<UserHit | null>(null);
  const [mineCards, setMineCards] = useState<CollectionRow[]>([]);
  const [theirCards, setTheirCards] = useState<{ character_id: string; count: number }[]>([]);
  const [give, setGive] = useState<string[]>([]);
  const [get, setGet] = useState<string[]>([]);

  const load = useCallback(() => { myTrades().then(setRows); }, []);
  useEffect(() => { load(); fetchMyCollection().then(setMineCards); }, [load]);

  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    let alive = true;
    const id = window.setTimeout(() => {
      searchTradePartners(q).then((h) => { if (alive) setHits(h); });
    }, 250);
    return () => { alive = false; window.clearTimeout(id); };
  }, [q]);

  async function choose(u: UserHit) {
    setPartner(u); setHits([]); setQ(""); setGive([]); setGet([]);
    setTheirCards(await playerCollection(u.user_id));
  }

  function toggle(list: string[], set: (v: string[]) => void, id: string) {
    set(list.includes(id) ? list.filter((x) => x !== id) : list.length >= 5 ? list : [...list, id]);
  }

  async function send() {
    if (!partner) return;
    const r = await createTrade(partner.user_id, give, get);
    if (!r.ok) { onDone(r.error ?? "failed"); return; }
    setPartner(null); setGive([]); setGet([]);
    onDone(tx("done"));
    load();
  }

  async function respond(id: string, accept: boolean) {
    const r = await respondTrade(id, accept);
    onDone(r.ok ? tx("done") : (r.error ?? "failed"));
    load();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/70 p-3">
        {partner ? (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-bold">{partner.username ?? "—"}</p>
              <button type="button" onClick={() => setPartner(null)} className="text-xs text-muted-foreground">{tx("clear")}</button>
            </div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tx("youGive")}</p>
            <PickRow ids={mineCards.map((c) => c.characterId)} selected={give} onToggle={(id) => toggle(give, setGive, id)} />
            <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{tx("youGet")}</p>
            <PickRow ids={theirCards.map((c) => c.character_id)} selected={get} onToggle={(id) => toggle(get, setGet, id)} />
            <button type="button" disabled={give.length === 0 && get.length === 0} onClick={send}
              className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-bold text-primary-foreground disabled:opacity-40">
              {tx("sendTrade")}
            </button>
          </>
        ) : (
          <>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tx("findPlayer")}
              className="w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-base outline-none focus:border-primary/60" />
            {hits.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {hits.map((u) => (
                  <li key={u.user_id}>
                    <button type="button" onClick={() => choose(u)}
                      className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-sm font-semibold">
                      {u.username ?? "—"}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </div>

      {rows === null ? null : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{tx("noTrades")}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <li key={t.id} className="rounded-xl border border-border/60 bg-card/70 p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>{t.incoming ? `${tx("incoming")} · ${t.from_name ?? "—"}` : `${tx("outgoing")} · ${t.to_name ?? "—"}`}</span>
                <span>{t.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <TradeSide ids={t.incoming ? t.request : t.offer} label={tx("youGive")} />
                <span className="text-primary">⇄</span>
                <TradeSide ids={t.incoming ? t.offer : t.request} label={tx("youGet")} />
              </div>
              {t.status === "pending" ? (
                <div className="mt-2 flex gap-2">
                  {t.incoming ? (
                    <>
                      <button type="button" onClick={() => respond(t.id, true)}
                        className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground">{tx("accept")}</button>
                      <button type="button" onClick={() => respond(t.id, false)}
                        className="flex-1 rounded-lg border border-border/70 py-1.5 text-xs font-bold text-muted-foreground">{tx("decline")}</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => respond(t.id, false)}
                      className="flex-1 rounded-lg border border-border/70 py-1.5 text-xs font-bold text-muted-foreground">{tx("withdraw")}</button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PickRow({ ids, selected, onToggle }: { ids: string[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {ids.map((id) => (
        <button key={id} type="button" onClick={() => onToggle(id)}
          className={`shrink-0 rounded-lg border p-0.5 transition-colors ${selected.includes(id) ? "border-primary" : "border-transparent"}`}>
          <CardTile id={id} size={40} />
        </button>
      ))}
    </div>
  );
}

function TradeSide({ ids, label }: { ids: string[]; label: string }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-[10px] uppercase text-muted-foreground">{label}</p>
      <div className="flex gap-1 overflow-hidden">
        {ids.length === 0 ? <span className="text-xs text-muted-foreground">—</span>
          : ids.map((id) => <CardTile key={id} id={id} size={32} />)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- history */

function History() {
  const { locale } = useI18n();
  const tx = (k: keyof typeof L) => L[k][locale];
  const [rows, setRows] = useState<SaleRow[] | null>(null);
  useEffect(() => { myMarketHistory().then(setRows); }, []);

  if (rows === null) return <p className="py-8 text-center text-sm text-muted-foreground">…</p>;
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{tx("noHistory")}</p>;

  return (
    <ul className="space-y-2">
      {rows.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-2.5">
          <CardTile id={s.character_id} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{cardName(s.character_id, locale)}</p>
            <p className="text-[11px] text-muted-foreground">
              {s.sold ? tx("sold") : tx("bought")} · {s.other_name ?? "—"} · {new Date(s.created_at).toLocaleDateString()}
            </p>
          </div>
          <p className={`text-sm font-black ${s.sold ? "text-emerald-400" : "text-primary"}`}>
            {s.sold ? `+✦ ${s.net.toLocaleString()}` : `−✦ ${s.price.toLocaleString()}`}
          </p>
        </li>
      ))}
    </ul>
  );
}
