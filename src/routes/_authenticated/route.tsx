import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UsernamePrompt } from "@/components/UsernamePrompt";
import { isGuestUser } from "@/lib/guest";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    // `getSession()` reads the persisted session and refreshes it only when
    // needed. Using `getUser()` here meant every navigation and every
    // `router.invalidate()` hit the network — a slow or offline request threw
    // the user back to /auth even though the session was perfectly valid.
    let session = null;
    try {
      const { data } = await supabase.auth.getSession();
      session = data.session;
    } catch {
      // Network hiccup: never sign the player out because of it.
      return {};
    }
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: session.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [needsUsername, setNeedsUsername] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user || isGuestUser(user)) return; // guests get an auto name
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .maybeSingle();
      // A failed fetch must not look like "you have no username".
      if (cancelled || error) return;
      const name = (data?.username ?? "").trim();
      if (name.length < 2) setNeedsUsername(true);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <Outlet />
      {needsUsername && (
        <UsernamePrompt
          open
          dismissible={false}
          onClose={() => {}}
          onSaved={() => setNeedsUsername(false)}
        />
      )}
    </>
  );
}
