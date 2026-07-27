import { supabase } from "@/integrations/supabase/client";
import { characters } from "@/data/characters";
import type { Character } from "@/types/character";

export const MAX_GUESSES = 6;

export interface DailyPuzzle {
  day_key: string;
  puzzle_number: number;
  character_id: string;
  already_solved: boolean;
  previous_guesses: number;
  previous_won: boolean;
}

export interface BleachdleStats {
  games_played: number;
  games_won: number;
  current_streak: number;
  best_streak: number;
  avg_guesses: number | null;
  fastest_solve: number | null;
  last_played_day: string | null;
}

export async function fetchDailyPuzzle(): Promise<DailyPuzzle | null> {
  const ids = characters.map((c) => c.id);
  const { data, error } = await supabase.rpc("get_bleachdle_today", { p_candidates: ids });
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  if (!d.ok) return null;
  return {
    day_key: String(d.day_key),
    puzzle_number: Number(d.puzzle_number),
    character_id: String(d.character_id),
    already_solved: Boolean(d.already_solved),
    previous_guesses: Number(d.previous_guesses ?? 0),
    previous_won: Boolean(d.previous_won),
  };
}

export async function submitBleachdle(
  day: string,
  guesses: number,
  won: boolean,
): Promise<{ ok: boolean; already_solved?: boolean; souls?: number; current_streak?: number }> {
  const { data, error } = await supabase.rpc("submit_bleachdle", {
    p_day: day,
    p_guesses: guesses,
    p_won: won,
  });
  if (error || !data) return { ok: false };
  const d = data as Record<string, unknown>;
  return {
    ok: Boolean(d.ok),
    already_solved: Boolean(d.already_solved),
    souls: Number(d.souls_awarded ?? 0),
    current_streak: Number(d.current_streak ?? 0),
  };
}

export async function fetchMyBleachdleStats(): Promise<BleachdleStats | null> {
  const { data, error } = await supabase.rpc("get_my_bleachdle_stats");
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  if (!d.ok) return null;
  return {
    games_played: Number(d.games_played ?? 0),
    games_won: Number(d.games_won ?? 0),
    current_streak: Number(d.current_streak ?? 0),
    best_streak: Number(d.best_streak ?? 0),
    avg_guesses: d.avg_guesses == null ? null : Number(d.avg_guesses),
    fastest_solve: d.fastest_solve == null ? null : Number(d.fastest_solve),
    last_played_day: (d.last_played_day as string | null) ?? null,
  };
}

export type HintCell =
  | { kind: "name"; state: "correct" | "wrong" }
  | { kind: "ovr"; state: "correct" | "higher" | "lower"; value: number }
  | { kind: "rarity"; state: "correct" | "wrong"; value: string }
  | { kind: "affiliation"; state: "correct" | "partial" | "wrong"; value: string };

export interface GuessRow {
  guess: Character;
  cells: HintCell[];
}

function affiliationOf(c: Character): string {
  return (c.faction || c.race || "—").trim();
}

export function compareGuess(guess: Character, answer: Character): GuessRow {
  const cells: HintCell[] = [];
  cells.push({ kind: "name", state: guess.id === answer.id ? "correct" : "wrong" });
  cells.push({
    kind: "ovr",
    state:
      guess.overall === answer.overall
        ? "correct"
        : guess.overall < answer.overall
          ? "higher"
          : "lower",
    value: guess.overall,
  });
  cells.push({
    kind: "rarity",
    state: guess.rarity === answer.rarity ? "correct" : "wrong",
    value: guess.rarity,
  });
  const ga = affiliationOf(guess);
  const aa = affiliationOf(answer);
  let affState: HintCell["state"] = "wrong";
  if (ga === aa) affState = "correct";
  else {
    // partial: share a race or faction word token
    const gTokens = ga.toLowerCase().split(/[\s/]+/).filter(Boolean);
    const aTokens = aa.toLowerCase().split(/[\s/]+/).filter(Boolean);
    if (gTokens.some((t) => aTokens.includes(t))) affState = "partial";
  }
  cells.push({ kind: "affiliation", state: affState, value: ga });
  return { guess, cells };
}

export function shareEmojis(rows: GuessRow[], won: boolean): string {
  // 4 columns matching hint cells: name, ovr, rarity, affiliation
  const lines = rows.map((r) =>
    r.cells
      .map((c) => {
        if (c.kind === "ovr") {
          if (c.state === "correct") return "🟩";
          return c.state === "higher" ? "⬆️" : "⬇️";
        }
        if (c.state === "correct") return "🟩";
        if (c.state === "partial") return "🟨";
        return "⬜";
      })
      .join(""),
  );
  if (won) lines[lines.length - 1] = lines[lines.length - 1] + "✅";
  return lines.join("\n");
}