import { supabase } from "@/integrations/supabase/client";
import type { Rarity } from "@/types/character";

/**
 * Marketplace + trading client. Every mutation is a server-side RPC that
 * validates ownership, souls and copy counts; nothing here is trusted.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rpc = (name: string, args?: Record<string, unknown>) => (supabase.rpc as any)(name, args);

export const MARKET_TAX = 0.05;

export interface Listing {
  id: string;
  character_id: string;
  price: number;
  rarity: Rarity;
  overall: number;
  seller_id: string;
  seller_name: string | null;
  created_at: string;
  mine: boolean;
}

export type MarketSort = "newest" | "cheapest" | "expensive" | "rating";

export interface BrowseFilters {
  q?: string;
  min?: number | null;
  max?: number | null;
  rarity?: Rarity | null;
  sort?: MarketSort;
  limit?: number;
}

export async function browseMarket(f: BrowseFilters = {}): Promise<Listing[]> {
  const { data, error } = await rpc("market_browse", {
    p_q: f.q?.trim() || null,
    p_min: f.min ?? null,
    p_max: f.max ?? null,
    p_rarity: f.rarity ?? null,
    p_sort: f.sort ?? "newest",
    p_limit: f.limit ?? 60,
  });
  if (error || !data) return [];
  return (data as Listing[]).map((l) => ({ ...l, price: Number(l.price), overall: Number(l.overall) }));
}

export interface MyListing { id: string; character_id: string; price: number; status: string; created_at: string }

export async function myListings(): Promise<MyListing[]> {
  const { data, error } = await rpc("market_my_listings");
  if (error || !data) return [];
  return (data as MyListing[]).map((l) => ({ ...l, price: Number(l.price) }));
}

export interface SaleRow {
  id: string; character_id: string; price: number; net: number; tax: number;
  sold: boolean; other_name: string | null; created_at: string;
}

export async function myMarketHistory(): Promise<SaleRow[]> {
  const { data, error } = await rpc("market_my_history");
  if (error || !data) return [];
  return (data as SaleRow[]).map((s) => ({ ...s, price: Number(s.price), net: Number(s.net), tax: Number(s.tax) }));
}

type Ok = { ok: boolean; error?: string };

async function call(fn: string, args: Record<string, unknown>): Promise<Ok> {
  const { data, error } = await rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as Ok;
  return p.ok ? { ok: true } : { ok: false, error: p.error ?? "failed" };
}

export const listCard = (characterId: string, price: number) =>
  call("market_list_card", { p_character: characterId, p_price: Math.round(price) });
export const cancelListing = (id: string) => call("market_cancel_listing", { p_listing: id });
export const buyListing = (id: string) => call("market_buy", { p_listing: id });

/* --------------------------------------------------------------- trading */

export interface TradeRow {
  id: string;
  from_user: string;
  to_user: string;
  from_name: string | null;
  to_name: string | null;
  offer: string[];
  request: string[];
  status: "pending" | "accepted" | "declined" | "cancelled";
  incoming: boolean;
  created_at: string;
}

export async function myTrades(): Promise<TradeRow[]> {
  const { data, error } = await rpc("trade_my_trades");
  if (error || !data) return [];
  return (data as TradeRow[]).map((t) => ({
    ...t,
    offer: Array.isArray(t.offer) ? t.offer : [],
    request: Array.isArray(t.request) ? t.request : [],
  }));
}

export const createTrade = (toUser: string, offer: string[], request: string[]) =>
  call("trade_create", { p_to: toUser, p_offer: offer, p_request: request });
export const respondTrade = (id: string, accept: boolean) =>
  call("trade_respond", { p_trade: id, p_accept: accept });

export interface UserHit { user_id: string; username: string | null; level: number }

export async function searchTradePartners(q: string): Promise<UserHit[]> {
  if (!q.trim()) return [];
  const { data, error } = await rpc("search_users", { p_query: q.trim(), p_limit: 10 });
  if (error || !data) return [];
  return data as UserHit[];
}

/** Cards a specific player owns, for building a trade request. */
export async function playerCollection(userId: string): Promise<{ character_id: string; count: number }[]> {
  const { data, error } = await rpc("get_public_collection", { p_user: userId });
  if (error || !data) return [];
  return (data as { character_id: string; count: number }[]).map((r) => ({ ...r, count: Number(r.count) }));
}
