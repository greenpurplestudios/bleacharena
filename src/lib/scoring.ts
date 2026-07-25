import type { Character } from "@/types/character";

export type TeamRank = "B" | "A" | "A+" | "S" | "SS" | "SS+";

export interface TeamScore {
  overall: number;
  rank: TeamRank;
}

export function scoreTeam(team: (Character | null)[]): TeamScore {
  const present = team.filter((c): c is Character => !!c);
  const n = Math.max(present.length, 1);
  const overall = Math.round(
    present.reduce((s, c) => s + c.overall, 0) / n,
  );

  const rank: TeamRank =
    overall >= 95 ? "SS+" :
    overall >= 90 ? "SS" :
    overall >= 85 ? "S" :
    overall >= 80 ? "A+" :
    overall >= 72 ? "A" : "B";

  return { overall, rank };
}