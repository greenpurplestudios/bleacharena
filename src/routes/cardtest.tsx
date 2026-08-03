import { createFileRoute } from "@tanstack/react-router";
import { CharacterCard } from "@/components/CharacterCard";
import { characters } from "@/data/characters";

export const Route = createFileRoute("/cardtest")({ component: () => (
  <div className="grid grid-cols-3 gap-6 bg-background p-6">
    {["ichigo-kurosaki","yhwach","kon","tite-kubo","rukia-kuchiki","qais"].map((s) => {
      const c = characters.find((x) => x.slug === s)!;
      return <CharacterCard key={s} character={c} />;
    })}
  </div>
) });
