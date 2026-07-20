import type { Character } from "@/types/character";

export type TeamRank = "B" | "A" | "A+" | "S" | "SS" | "SS+";

export interface TeamScore {
  attack: number;
  defense: number;
  speed: number;
  reiatsu: number;
  intelligence: number;
  technique: number;
  potential: number;
  overall: number;
  rank: TeamRank;
}

const STAT_KEYS = [
  "attack", "defense", "speed", "reiatsu", "intelligence", "technique", "potential",
] as const;

export function scoreTeam(team: (Character | null)[]): TeamScore {
  const present = team.filter((c): c is Character => !!c);
  const n = Math.max(present.length, 1);
  const avg = (k: (typeof STAT_KEYS)[number]) =>
    Math.round(present.reduce((s, c) => s + c.stats[k], 0) / n);

  const stats = {
    attack: avg("attack"),
    defense: avg("defense"),
    speed: avg("speed"),
    reiatsu: avg("reiatsu"),
    intelligence: avg("intelligence"),
    technique: avg("technique"),
    potential: avg("potential"),
  };
  const overall = Math.round(
    (stats.attack + stats.defense + stats.speed + stats.reiatsu +
      stats.intelligence + stats.technique + stats.potential) / 7,
  );

  const rank: TeamRank =
    overall >= 95 ? "SS+" :
    overall >= 90 ? "SS" :
    overall >= 85 ? "S" :
    overall >= 80 ? "A+" :
    overall >= 72 ? "A" : "B";

  return { ...stats, overall, rank };
}