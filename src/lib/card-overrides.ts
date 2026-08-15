import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { characters } from "@/data/characters";
import { setFramingOverride } from "@/lib/portrait";
import type { Rarity } from "@/types/character";

/**
 * Admin card overrides (artwork, framing, ratings, text). Loaded once at app
 * start and applied in place onto the static roster so every surface picks
 * them up without rewiring. Writes happen only through admin RPCs.
 */
export interface CardOverride {
  character_id: string;
  image_url: string | null;
  focus_x: number | null;
  focus_y: number | null;
  zoom: number | null;
  name_en: string | null;
  name_ar: string | null;
  overall: number | null;
  rarity: Rarity | null;
  faction: string | null;
  element: string | null;
  lore_en: string | null;
  lore_ar: string | null;
}

export interface CardExtras {
  element?: string | null;
  lore?: { en: string | null; ar: string | null };
}

const overrides = new Map<string, CardOverride>();
const extras = new Map<string, CardExtras>();
const listeners = new Set<() => void>();
let version = 0;
let loading: Promise<void> | null = null;

function emit() {
  version += 1;
  listeners.forEach((l) => l());
}

function apply(row: CardOverride) {
  const c = characters.find((ch) => ch.id === row.character_id);
  if (!c) return;
  if (row.image_url) c.image = row.image_url;
  if (row.name_en) c.name = { ...c.name, en: row.name_en };
  if (row.name_ar) c.name = { ...c.name, ar: row.name_ar };
  if (typeof row.overall === "number") c.overall = row.overall;
  if (row.rarity) c.rarity = row.rarity;
  if (row.faction) c.faction = row.faction;
  if (row.focus_x != null || row.focus_y != null || row.zoom != null) {
    setFramingOverride(c.slug, {
      ...(row.focus_x != null ? { x: Number(row.focus_x) } : {}),
      ...(row.focus_y != null ? { y: Number(row.focus_y) } : {}),
      ...(row.zoom != null ? { scale: Number(row.zoom) } : {}),
    });
  }
  extras.set(c.id, { element: row.element, lore: { en: row.lore_en, ar: row.lore_ar } });
}

function normalize(r: Record<string, unknown>): CardOverride {
  const num = (v: unknown) => (v == null ? null : Number(v));
  return {
    character_id: String(r["character_id"]),
    image_url: (r["image_url"] as string) ?? null,
    focus_x: num(r["focus_x"]),
    focus_y: num(r["focus_y"]),
    zoom: num(r["zoom"]),
    name_en: (r["name_en"] as string) ?? null,
    name_ar: (r["name_ar"] as string) ?? null,
    overall: r["overall"] == null ? null : Number(r["overall"]),
    rarity: (r["rarity"] as Rarity) ?? null,
    faction: (r["faction"] as string) ?? null,
    element: (r["element"] as string) ?? null,
    lore_en: (r["lore_en"] as string) ?? null,
    lore_ar: (r["lore_ar"] as string) ?? null,
  };
}

export async function loadCardOverrides(force = false): Promise<void> {
  if (loading && !force) return loading;
  loading = (async () => {
    const { data, error } = await (supabase.rpc as unknown as (
      n: string,
    ) => Promise<{ data: unknown; error: unknown }>)("get_card_overrides");
    if (error || !Array.isArray(data)) return;
    overrides.clear();
    for (const raw of data as Record<string, unknown>[]) {
      const row = normalize(raw);
      overrides.set(row.character_id, row);
      apply(row);
    }
    emit();
  })();
  return loading;
}

export const getCardOverride = (id: string): CardOverride | null => overrides.get(id) ?? null;
export const getCardExtras = (id: string): CardExtras => extras.get(id) ?? {};

/** Re-render hook so surfaces refresh once overrides land. */
export function useCardOverridesVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => 0,
  );
}