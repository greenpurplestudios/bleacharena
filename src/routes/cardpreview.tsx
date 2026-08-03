import { createFileRoute } from "@tanstack/react-router";
import { characters } from "@/data/characters";
import { GameCard } from "@/components/card/GameCard";

export const Route = createFileRoute("/cardpreview")({ component: () => (
  <div className="grid grid-cols-3 gap-6 p-8">
    {["c-001","c-033","c-017","c-013","c-029","c-050"].map((id) => {
      const c = characters.find((x) => x.id === id)!;
      return <GameCard key={id} character={c} />;
    })}
  </div>
) });
