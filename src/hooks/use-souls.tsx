import { useCallback, useEffect, useState } from "react";
import { fetchMySouls } from "@/lib/packs";
import { supabase } from "@/integrations/supabase/client";

export function useSouls() {
  const [souls, setSouls] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const n = await fetchMySouls();
    setSouls(n);
  }, []);

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  return { souls, refresh };
}