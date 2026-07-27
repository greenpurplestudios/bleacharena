import { supabase } from "@/integrations/supabase/client";
import type { PackTier } from "@/lib/packs";

export type StoreKind = "title" | "username_color" | "pack";

export interface StoreItem {
  id: string;
  kind: StoreKind;
  name: { en: string; ar: string };
  cost: number;
  meta: Record<string, unknown>;
  sortOrder: number;
  owned: boolean;
}

export interface InventoryItem {
  itemId: string;
  kind: StoreKind;
  name: { en: string; ar: string };
  meta: Record<string, unknown>;
  acquiredAt: string;
}

type StoreRow = {
  id: string;
  kind: StoreKind;
  name_en: string;
  name_ar: string;
  cost: number;
  meta: Record<string, unknown> | null;
  sort_order: number;
  owned: boolean;
};

type InventoryRow = {
  item_id: string;
  kind: StoreKind;
  name_en: string;
  name_ar: string;
  meta: Record<string, unknown> | null;
  acquired_at: string;
};

export async function fetchStore(): Promise<StoreItem[]> {
  const { data, error } = await supabase.rpc("get_store");
  if (error || !data) return [];
  return (data as StoreRow[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    name: { en: r.name_en, ar: r.name_ar },
    cost: Number(r.cost),
    meta: r.meta ?? {},
    sortOrder: Number(r.sort_order),
    owned: !!r.owned,
  }));
}

export async function fetchMyInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.rpc("get_my_inventory");
  if (error || !data) return [];
  return (data as InventoryRow[]).map((r) => ({
    itemId: r.item_id,
    kind: r.kind,
    name: { en: r.name_en, ar: r.name_ar },
    meta: r.meta ?? {},
    acquiredAt: r.acquired_at,
  }));
}

export interface PurchaseResult {
  ok: boolean;
  error?: "unauthenticated" | "not_found" | "insufficient_souls" | "already_owned" | string;
  souls?: number;
  cost?: number;
  itemId?: string;
  kind?: StoreKind;
}

export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc("purchase_item", { p_item_id: itemId });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as PurchaseResult & { ok: boolean };
  return p;
}

export async function equipItem(
  kind: "title" | "username_color",
  itemId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("equip_item", {
    p_kind: kind,
    p_item_id: itemId,
  });
  if (error) return { ok: false, error: error.message };
  const p = (data ?? {}) as { ok: boolean; error?: string };
  return p;
}

export function packTierFromItem(item: StoreItem): PackTier | null {
  if (item.kind !== "pack") return null;
  const t = (item.meta as { tier?: string }).tier;
  return (t as PackTier) ?? null;
}