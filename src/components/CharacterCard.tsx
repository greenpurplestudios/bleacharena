import type { Character } from "@/types/character";
import { GameCard } from "@/components/card/GameCard";

/** Back-compat wrapper around the official card template renderer. */
export function CharacterCard(props: {
  character: Character;
  faceDown?: boolean;
  onFlip?: () => void;
  opening?: boolean;
  className?: string;
}) {
  return <GameCard {...props} />;
}
