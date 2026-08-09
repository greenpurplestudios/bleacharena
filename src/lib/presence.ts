import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live player count via a Realtime presence channel — every open Arena tab
 * tracks itself, so the number is the real concurrent audience.
 */
export function useOnlineCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const key = `p-${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase.channel("arena-presence", { config: { presence: { key } } });

    const sync = () => {
      if (!alive) return;
      setCount(Object.keys(channel.presenceState()).length);
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void channel.track({ at: Date.now() });
      });

    return () => {
      alive = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return count;
}