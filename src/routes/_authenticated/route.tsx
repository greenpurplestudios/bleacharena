import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyProfile } from "@/lib/leaderboard";
import { UsernamePrompt } from "@/components/UsernamePrompt";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [needsUsername, setNeedsUsername] = useState<boolean | null>(null);

  const check = async () => {
    const p = await getMyProfile();
    const name = (p?.username ?? "").trim();
    setNeedsUsername(name.length < 2);
  };

  useEffect(() => { check(); }, []);

  return (
    <>
      <Outlet />
      {needsUsername === true && (
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