import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onProgression, type AchievementUnlock } from "@/lib/progression";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { AchievementToast } from "@/components/AchievementToast";

interface Ctx { /* reserved for future */ }
const ProgressionCtx = createContext<Ctx>({});

export function ProgressionProvider({ children }: { children: ReactNode }) {
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; ach: AchievementUnlock }>>([]);

  useEffect(() => {
    return onProgression((e) => {
      if (e.leveledUp && e.level) setLevelUp(e.level);
      if (e.achievements && e.achievements.length) {
        setToasts((prev) => [
          ...prev,
          ...e.achievements!.map((a) => ({ id: a.id + "-" + Date.now() + Math.random(), ach: a })),
        ]);
      }
    });
  }, []);

  const value = useMemo(() => ({}), []);
  return (
    <ProgressionCtx.Provider value={value}>
      {children}
      {levelUp !== null && (
        <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />
      )}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed bottom-24 right-4 z-[90] flex flex-col gap-2 sm:bottom-6">
          {toasts.map((tt) => (
            <AchievementToast
              key={tt.id}
              ach={tt.ach}
              onClose={() => setToasts((prev) => prev.filter((p) => p.id !== tt.id))}
            />
          ))}
        </div>
      )}
    </ProgressionCtx.Provider>
  );
}

export function useProgression() { return useContext(ProgressionCtx); }